using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CodeBook.Identity.Pages.Account.ResetPassword;

[SecurityHeaders]
[AllowAnonymous]
public class Confirmation : PageModel
{
    public string SignInUrl { get; private set; } = string.Empty;

    public IActionResult OnGet([FromServices] IConfiguration configuration)
    {
        var baseUrl = configuration["AuthClient:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:3000";
        SignInUrl = $"{baseUrl}/api/auth/signin-duende";
        return Page();
    }
}
