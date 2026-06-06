using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;

namespace CodeBook.Identity.Services;

public sealed class ResendEmailSender : IEmailSender
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly ResendEmailOptions _options;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(
        HttpClient httpClient,
        IOptions<ResendEmailOptions> options,
        ILogger<ResendEmailSender> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException("Resend API key is not configured. Set RESEND_API_KEY.");
        }

        var fromAddress = $"{_options.FromName} <{_options.FromEmail}>";
        var payload = new
        {
            from = fromAddress,
            to = new[] { email },
            subject,
            html = htmlMessage
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, SerializerOptions), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        using var response = await _httpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        _logger.LogError("Failed to send email using Resend. StatusCode: {StatusCode}, Response: {ResponseBody}", response.StatusCode, responseBody);
        throw new InvalidOperationException($"Resend email request failed with status code {(int)response.StatusCode}.");
    }
}
