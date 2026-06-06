using CodeBook.Identity.Models;
using Duende.IdentityServer.Extensions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CodeBook.Identity.Pages.Account.Manage;

[SecurityHeaders]
public class DeleteAccount : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public DeleteAccount(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public IActionResult OnGet()
    {
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        var subjectId = User.GetSubjectId();
        if (string.IsNullOrWhiteSpace(subjectId))
        {
            return RedirectToPage("/Account/Login/Index");
        }

        var user = await _userManager.FindByIdAsync(subjectId);
        if (user is null)
        {
            return RedirectToPage("/Account/Login/Index");
        }

        await _userManager.DeleteAsync(user);
        await HttpContext.SignOutAsync();

        var baseUrl = _configuration["AuthClient:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:3000";
        return Redirect($"{baseUrl}/api/auth/signout-all");
    }
}
