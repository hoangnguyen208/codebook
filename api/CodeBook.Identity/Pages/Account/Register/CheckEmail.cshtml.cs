using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CodeBook.Identity.Pages.Account.Register;

[SecurityHeaders]
[AllowAnonymous]
public class CheckEmail : PageModel
{
    public string Email { get; private set; } = string.Empty;

    public string? LoginReturnUrl { get; private set; }

    public IActionResult OnGet(string? email, string? returnUrl)
    {
        var loginReturnUrl = ReturnUrlHelper.StripSignupScreenHint(returnUrl);

        if (string.IsNullOrWhiteSpace(email))
        {
            return RedirectToPage("/Account/Login/Index", new { returnUrl = loginReturnUrl });
        }

        Email = email;
        LoginReturnUrl = loginReturnUrl;

        return Page();
    }
}
