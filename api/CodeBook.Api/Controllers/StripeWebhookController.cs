using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;

namespace CodeBook.Api.Controllers;

[ApiController]
[Route("api/webhooks")]
public class StripeWebhookController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public StripeWebhookController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("stripe")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleStripeWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

        var webhookSecret = _configuration["STRIPE_WEBHOOK_SECRET"];
        if (string.IsNullOrEmpty(webhookSecret))
        {
            return BadRequest(new { error = "Webhook secret not configured" });
        }

        Event stripeEvent;
        try
        {
            var signatureHeader = Request.Headers["Stripe-Signature"].ToString();
            stripeEvent = EventUtility.ConstructEvent(
                json,
                signatureHeader,
                webhookSecret
            );
        }
        catch (StripeException)
        {
            return BadRequest(new { error = "Invalid Stripe signature" });
        }

        try
        {
            var identityBaseUrl = _configuration["Identity:BaseUrl"] ?? "http://id.codebook.local:5001";

            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                    await HandleCheckoutCompleted(stripeEvent, identityBaseUrl);
                    break;
                case "invoice.paid":
                    await HandleInvoicePaid(stripeEvent, identityBaseUrl);
                    break;
                case "invoice.payment_failed":
                    await HandlePaymentFailed(stripeEvent);
                    break;
                case "customer.subscription.updated":
                    await HandleSubscriptionUpdated(stripeEvent, identityBaseUrl);
                    break;
                case "customer.subscription.deleted":
                    await HandleSubscriptionDeleted(stripeEvent, identityBaseUrl);
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Webhook handler error for {stripeEvent.Type}: {ex.Message}");
            return StatusCode(500, new { error = "Webhook processing failed" });
        }

        return Ok(new { received = true });
    }

    private async Task HandleCheckoutCompleted(Event stripeEvent, string identityBaseUrl)
    {
        var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
        if (session == null) return;

        var userId = session.Metadata?.GetValueOrDefault("userId");
        if (string.IsNullOrEmpty(userId)) return;

        var subscriptionId = typeof(Stripe.Checkout.Session).GetProperty("Subscription")?.GetValue(session) as string
            ?? (session.GetType().GetProperty("subscription")?.GetValue(session) as string);
        var customerId = typeof(Stripe.Checkout.Session).GetProperty("CustomerId")?.GetValue(session) as string
            ?? (session.GetType().GetProperty("customer")?.GetValue(session) as string);

        if (string.IsNullOrEmpty(customerId)) return;

        await UpdateUserSubscription(identityBaseUrl, userId, isPro: true, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId);
    }

    private async Task HandleInvoicePaid(Event stripeEvent, string identityBaseUrl)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice == null) return;

        var customerId = GetStringProperty(invoice, "CustomerId") ?? GetStringProperty(invoice, "customer");
        if (string.IsNullOrEmpty(customerId)) return;

        var user = await FindUserByStripeCustomer(identityBaseUrl, customerId);
        if (user == null) return;

        await UpdateUserSubscription(identityBaseUrl, user.UserId, isPro: true);
    }

    private async Task HandlePaymentFailed(Event stripeEvent)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        var customerId = GetStringProperty(invoice, "CustomerId") ?? GetStringProperty(invoice, "customer");
        Console.Error.WriteLine($"Payment failed for Stripe customer: {customerId ?? "unknown"}");
    }

    private async Task HandleSubscriptionUpdated(Event stripeEvent, string identityBaseUrl)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var customerId = GetStringProperty(subscription, "CustomerId") ?? GetStringProperty(subscription, "customer");
        if (string.IsNullOrEmpty(customerId)) return;

        var user = await FindUserByStripeCustomer(identityBaseUrl, customerId);
        if (user == null) return;

        var status = GetStringProperty(subscription, "Status") ?? GetStringProperty(subscription, "status");
        var isPro = status == "active" || status == "trialing";

        await UpdateUserSubscription(identityBaseUrl, user.UserId, isPro: isPro);
    }

    private async Task HandleSubscriptionDeleted(Event stripeEvent, string identityBaseUrl)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var customerId = GetStringProperty(subscription, "CustomerId") ?? GetStringProperty(subscription, "customer");
        if (string.IsNullOrEmpty(customerId)) return;

        var user = await FindUserByStripeCustomer(identityBaseUrl, customerId);
        if (user == null) return;

        await UpdateUserSubscription(identityBaseUrl, user.UserId, isPro: false, stripeSubscriptionId: "");
    }

    private async Task UpdateUserSubscription(
        string identityBaseUrl,
        string userId,
        bool? isPro = null,
        string? stripeCustomerId = null,
        string? stripeSubscriptionId = null)
    {
        var client = _httpClientFactory.CreateClient();
        var payload = new Dictionary<string, object?>();
        if (isPro.HasValue) payload["isPro"] = isPro.Value;
        if (stripeCustomerId != null) payload["stripeCustomerId"] = stripeCustomerId;
        if (stripeSubscriptionId != null) payload["stripeSubscriptionId"] = stripeSubscriptionId;

        var response = await client.PutAsJsonAsync(
            $"{identityBaseUrl}/api/subscription/{userId}",
            payload);

        response.EnsureSuccessStatusCode();
    }

    private async Task<StripeUserInfo?> FindUserByStripeCustomer(string identityBaseUrl, string stripeCustomerId)
    {
        var client = _httpClientFactory.CreateClient();
        var response = await client.GetAsync(
            $"{identityBaseUrl}/api/subscription/by-stripe-customer/{stripeCustomerId}");

        if (!response.IsSuccessStatusCode) return null;

        return await response.Content.ReadFromJsonAsync<StripeUserInfo>();
    }

    private static string? GetStringProperty(object? obj, string propertyName)
    {
        if (obj == null) return null;
        var prop = obj.GetType().GetProperty(propertyName,
            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.IgnoreCase);
        return prop?.GetValue(obj) as string;
    }
}

public class StripeUserInfo
{
    public string UserId { get; set; } = string.Empty;
    public bool IsPro { get; set; }
}
