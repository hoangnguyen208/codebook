namespace CodeBook.Identity.Services;

public sealed class ResendEmailOptions
{
    public const string SectionName = "Resend";

    public string ApiKey { get; set; } = string.Empty;

    public string FromEmail { get; set; } = "onboarding@resend.dev";

    public string FromName { get; set; } = "CodeBook";
}
