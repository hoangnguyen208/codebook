using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CodeBook.Identity.Pages.Account.ForgotPassword;

[SecurityHeaders]
[AllowAnonymous]
public class EmailSent : PageModel
{
    public string UsernameOrEmail { get; private set; } = string.Empty;

    public string? ReturnUrl { get; private set; }

    public IActionResult OnGet(string? usernameOrEmail, string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(usernameOrEmail))
        {
            return RedirectToPage("/Account/ForgotPassword/Index", new { returnUrl });
        }

        UsernameOrEmail = usernameOrEmail;
        ReturnUrl = returnUrl;
        return Page();
    }
}
