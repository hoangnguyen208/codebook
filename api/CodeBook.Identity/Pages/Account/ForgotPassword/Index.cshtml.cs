using System.Text;
using CodeBook.Identity.Models;
using CodeBook.Identity.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;

namespace CodeBook.Identity.Pages.Account.ForgotPassword;

[SecurityHeaders]
[AllowAnonymous]
public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailSender _emailSender;
    private readonly AuthRateLimiter _rateLimiter;

    [BindProperty]
    public InputModel Input { get; set; } = default!;

    public Index(UserManager<ApplicationUser> userManager, IEmailSender emailSender, AuthRateLimiter rateLimiter)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _rateLimiter = rateLimiter;
    }

    public IActionResult OnGet(string? returnUrl)
    {
        Input = new InputModel { ReturnUrl = returnUrl };
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (isAllowed, retryAfter) = _rateLimiter.TryAcquireFixed($"forgot-password:{ip}", permitLimit: 3, TimeSpan.FromHours(1));

        if (!isAllowed)
        {
            Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
            ModelState.AddModelError(string.Empty, $"Too many attempts. Please try again in {RateLimitFormat.FormatRetryAfter(retryAfter)}.");
            return Page();
        }

        var usernameOrEmail = Input.UsernameOrEmail!.Trim();

        // Attempt lookup by email first, then by username.
        var user = await _userManager.FindByEmailAsync(usernameOrEmail)
                   ?? await _userManager.FindByNameAsync(usernameOrEmail);

        var returnUrl = Input.ReturnUrl;

        // Always redirect to EmailSent to avoid user enumeration.
        if (user is not null && await _userManager.IsEmailConfirmedAsync(user))
        {
            await SendPasswordResetEmailAsync(user, returnUrl);
        }

        return RedirectToPage("/Account/ForgotPassword/EmailSent", new { usernameOrEmail, returnUrl });
    }

    private async Task SendPasswordResetEmailAsync(ApplicationUser user, string? returnUrl)
    {
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(resetToken));

        var callbackUrl = Url.Page(
            "/Account/ResetPassword/Index",
            null,
            new { userId = user.Id, code = encodedToken, returnUrl },
            Request.Scheme);

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            throw new InvalidOperationException("Unable to generate password reset callback URL.");
        }

        var username = user.UserName ?? user.Email ?? "there";
        var message = $"""
                       <p>Hello {username},</p>
                       <p>We received a request to reset your CodeBook password. Click the link below to choose a new password:</p>
                       <p><a href="{callbackUrl}">Create new password</a></p>
                       <p>If you did not request a password reset, you can safely ignore this email.</p>
                       <p>This link expires after 24 hours.</p>
                       """;

        await _emailSender.SendEmailAsync(user.Email!, "Reset your CodeBook password", message);
    }
}
