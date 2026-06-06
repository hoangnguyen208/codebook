using CodeBook.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CodeBook.Identity.Pages.Account.Manage;

[SecurityHeaders]
public class ChangePassword : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    [BindProperty]
    public ChangePasswordInputModel Input { get; set; } = default!;

    public bool Succeeded { get; private set; }

    public ChangePassword(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    public IActionResult OnGet()
    {
        Input = new ChangePasswordInputModel();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return RedirectToPage("/Account/Login/Index");
        }

        var result = await _userManager.ChangePasswordAsync(user, Input.CurrentPassword!, Input.NewPassword!);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
            return Page();
        }

        await _signInManager.RefreshSignInAsync(user);
        Succeeded = true;
        return Page();
    }

    public string GetReturnUrl()
    {
        var baseUrl = _configuration["AuthClient:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:3000";
        return $"{baseUrl}/profile";
    }
}
