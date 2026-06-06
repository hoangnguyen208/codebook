using System.Text;
using CodeBook.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;

namespace CodeBook.Identity.Pages.Account.Register;

[SecurityHeaders]
[AllowAnonymous]
public class ConfirmEmail : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ConfirmEmail(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public string StatusMessage { get; private set; } = string.Empty;

    public string? ReturnUrl { get; private set; }

    public bool IsSuccess { get; private set; }

    public async Task<IActionResult> OnGet(string? userId, string? code, string? returnUrl)
    {
        ReturnUrl = ReturnUrlHelper.StripSignupScreenHint(returnUrl);

        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(code))
        {
            StatusMessage = "Invalid email confirmation link.";
            IsSuccess = false;
            return Page();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound($"Unable to load user with ID '{userId}'.");
        }

        var decodedCode = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
        var result = await _userManager.ConfirmEmailAsync(user, decodedCode);

        if (result.Succeeded)
        {
            IsSuccess = true;
            StatusMessage = "Your email has been verified successfully. You can now sign in.";
            return Page();
        }

        IsSuccess = false;
        StatusMessage = "Email confirmation failed. The link may be invalid or expired.";

        return Page();
    }
}
