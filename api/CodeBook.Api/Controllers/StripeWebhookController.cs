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
        Console.WriteLine($"[StripeWebhook] Received event, body length: {json.Length}");

        var webhookSecret = _configuration["STRIPE_WEBHOOK_SECRET"];
        if (string.IsNullOrEmpty(webhookSecret))
        {
            Console.Error.WriteLine("[StripeWebhook] Webhook secret not configured");
            return BadRequest(new { error = "Webhook secret not configured" });
        }

        Event stripeEvent;
        try
        {
            var signatureHeader = Request.Headers["Stripe-Signature"].ToString();
            stripeEvent = EventUtility.ConstructEvent(
                json,
                signatureHeader,
                webhookSecret,
                throwOnApiVersionMismatch: false
            );
            Console.WriteLine($"[StripeWebhook] Verified event: {stripeEvent.Type}");
        }
        catch (StripeException ex)
        {
            Console.Error.WriteLine($"[StripeWebhook] Signature verification failed: {ex.Message}");
            return BadRequest(new { error = "Invalid Stripe signature" });
        }

        try
        {
            var identityBaseUrl = _configuration["Identity:BaseUrl"] ?? "http://id.codebook.local:5001";
            Console.WriteLine($"[StripeWebhook] Processing event: {stripeEvent.Type}");

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

        Console.WriteLine($"[StripeWebhook] Event {stripeEvent.Type} processed successfully");
        return Ok(new { received = true });
    }

    private async Task HandleCheckoutCompleted(Event stripeEvent, string identityBaseUrl)
    {
        var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
        if (session == null) return;

        var userId = session.Metadata?.GetValueOrDefault("userId");
        var customerId = session.CustomerId;
        var subscriptionId = session.SubscriptionId;

        if (string.IsNullOrEmpty(customerId)) return;

        // Try user ID first, then fall back to email
        if (!string.IsNullOrEmpty(userId))
        {
            try
            {
                await UpdateUserSubscription(identityBaseUrl, userId, isPro: true, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId);
                return;
            }
            catch (HttpRequestException)
            {
                Console.WriteLine($"[StripeWebhook] User ID {userId} not found in Identity, trying email fallback");
            }
        }

        var email = session.CustomerDetails?.Email ?? session.CustomerEmail;
        if (!string.IsNullOrEmpty(email))
        {
            await UpdateUserSubscriptionByEmail(identityBaseUrl, email, isPro: true, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId);
            Console.WriteLine($"[StripeWebhook] Updated user by email: {email}");
        }
        else
        {
            Console.Error.WriteLine("[StripeWebhook] No userId or email available for checkout.session.completed");
        }
    }

    private async Task HandleInvoicePaid(Event stripeEvent, string identityBaseUrl)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice == null) return;

        var customerId = invoice.CustomerId;
        if (string.IsNullOrEmpty(customerId)) return;

        var user = await FindUserByStripeCustomer(identityBaseUrl, customerId);
        if (user == null) return;

        await UpdateUserSubscription(identityBaseUrl, user.UserId, isPro: true);
    }

    private async Task HandlePaymentFailed(Event stripeEvent)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        var customerId = invoice?.CustomerId;
        Console.Error.WriteLine($"Payment failed for Stripe customer: {customerId ?? "unknown"}");
    }

    private async Task HandleSubscriptionUpdated(Event stripeEvent, string identityBaseUrl)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var customerId = subscription.CustomerId;
        if (string.IsNullOrEmpty(customerId)) return;

        var user = await FindUserByStripeCustomer(identityBaseUrl, customerId);
        if (user == null) return;

        var status = subscription.Status;
        var isPro = status == "active" || status == "trialing";

        await UpdateUserSubscription(identityBaseUrl, user.UserId, isPro: isPro);
    }

    private async Task HandleSubscriptionDeleted(Event stripeEvent, string identityBaseUrl)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var customerId = subscription.CustomerId;
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

        var url = $"{identityBaseUrl}/api/subscription/{userId}";
        Console.WriteLine($"[StripeWebhook] Calling Identity PUT {url} with isPro={isPro}, customerId={stripeCustomerId}");

        var response = await client.PutAsJsonAsync(url, payload);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            Console.Error.WriteLine($"[StripeWebhook] Identity update failed: {response.StatusCode} {body}");
        }

        response.EnsureSuccessStatusCode();
    }

    private async Task UpdateUserSubscriptionByEmail(
        string identityBaseUrl,
        string email,
        bool? isPro = null,
        string? stripeCustomerId = null,
        string? stripeSubscriptionId = null)
    {
        var client = _httpClientFactory.CreateClient();
        var payload = new Dictionary<string, object?>();
        if (isPro.HasValue) payload["isPro"] = isPro.Value;
        if (stripeCustomerId != null) payload["stripeCustomerId"] = stripeCustomerId;
        if (stripeSubscriptionId != null) payload["stripeSubscriptionId"] = stripeSubscriptionId;

        var url = $"{identityBaseUrl}/api/subscription/by-email/{Uri.EscapeDataString(email)}";
        Console.WriteLine($"[StripeWebhook] Calling Identity PUT {url} with isPro={isPro}, customerId={stripeCustomerId}");

        var response = await client.PutAsJsonAsync(url, payload);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            Console.Error.WriteLine($"[StripeWebhook] Identity update by email failed: {response.StatusCode} {body}");
        }

        response.EnsureSuccessStatusCode();
    }

    private async Task<StripeUserInfo?> FindUserByStripeCustomer(string identityBaseUrl, string stripeCustomerId)
    {
        var client = _httpClientFactory.CreateClient();
        var url = $"{identityBaseUrl}/api/subscription/by-stripe-customer/{stripeCustomerId}";
        Console.WriteLine($"[StripeWebhook] Looking up user by Stripe customer: {stripeCustomerId}");

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            Console.Error.WriteLine($"[StripeWebhook] Customer lookup failed: {response.StatusCode}");
            return null;
        }

        return await response.Content.ReadFromJsonAsync<StripeUserInfo>();
    }
}

public class StripeUserInfo
{
    public string UserId { get; set; } = string.Empty;
    public bool IsPro { get; set; }
}
