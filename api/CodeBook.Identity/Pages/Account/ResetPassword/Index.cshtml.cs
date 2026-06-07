using System.Text;
using CodeBook.Identity.Models;
using CodeBook.Identity.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;

namespace CodeBook.Identity.Pages.Account.ResetPassword;

[SecurityHeaders]
[AllowAnonymous]
public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AuthRateLimiter _rateLimiter;

    [BindProperty]
    public InputModel Input { get; set; } = default!;

    public bool IsInvalidLink { get; private set; }

    public Index(UserManager<ApplicationUser> userManager, AuthRateLimiter rateLimiter)
    {
        _userManager = userManager;
        _rateLimiter = rateLimiter;
    }

    public IActionResult OnGet(string? userId, string? code, string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(code))
        {
            IsInvalidLink = true;
            return Page();
        }

        Input = new InputModel { UserId = userId, Code = code, ReturnUrl = returnUrl };
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        if (string.IsNullOrWhiteSpace(Input.UserId) || string.IsNullOrWhiteSpace(Input.Code))
        {
            IsInvalidLink = true;
            return Page();
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (isAllowed, retryAfter) = _rateLimiter.TryAcquireFixed($"reset-password:{ip}", permitLimit: 5, TimeSpan.FromMinutes(15));

        if (!isAllowed)
        {
            Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
            ModelState.AddModelError(string.Empty, $"Too many attempts. Please try again in {RateLimitFormat.FormatRetryAfter(retryAfter)}.");
            return Page();
        }

        var user = await _userManager.FindByIdAsync(Input.UserId);
        if (user is null)
        {
            // Avoid user enumeration — redirect to login as if it succeeded.
            return RedirectToPage("/Account/Login/Index");
        }

        var decodedCode = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(Input.Code));
        var result = await _userManager.ResetPasswordAsync(user, decodedCode, Input.Password!);

        if (result.Succeeded)
        {
            return RedirectToPage("/Account/ResetPassword/Confirmation");
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        return Page();
    }
}
