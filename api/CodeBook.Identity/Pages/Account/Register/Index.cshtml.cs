using System.Security.Claims;
using Duende.IdentityModel;
using Duende.IdentityServer.Services;
using CodeBook.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CodeBook.Identity.Pages.Account.Register;

[SecurityHeaders]
[AllowAnonymous]
public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IIdentityServerInteractionService _interaction;

    [BindProperty]
    public InputModel Input { get; set; } = default!;

    public Index(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IIdentityServerInteractionService interaction)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _interaction = interaction;
    }

    public IActionResult OnGet(string? returnUrl)
    {
        if (IsInvalidReturnUrl(returnUrl))
        {
            throw new ArgumentException("invalid return URL");
        }

        Input = new InputModel
        {
            ReturnUrl = returnUrl
        };

        return Page();
    }

    public async Task<IActionResult> OnPost()
    {
        if (IsInvalidReturnUrl(Input.ReturnUrl))
        {
            throw new ArgumentException("invalid return URL");
        }

        if (!ModelState.IsValid)
        {
            return Page();
        }

        var user = new ApplicationUser
        {
            UserName = Input.Username,
            Email = Input.Email
        };

        var result = await _userManager.CreateAsync(user, Input.Password!);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return Page();
        }

        await EnsureUserProfileClaimsAsync(user);
        await _signInManager.SignInAsync(user, isPersistent: false);

        var context = await _interaction.GetAuthorizationContextAsync(Input.ReturnUrl);
        if (context != null)
        {
            ArgumentNullException.ThrowIfNull(Input.ReturnUrl, nameof(Input.ReturnUrl));

            if (context.IsNativeClient())
            {
                return this.LoadingPage(Input.ReturnUrl);
            }

            return Redirect(Input.ReturnUrl);
        }

        if (Url.IsLocalUrl(Input.ReturnUrl))
        {
            return Redirect(Input.ReturnUrl);
        }

        if (string.IsNullOrEmpty(Input.ReturnUrl))
        {
            return Redirect("~/");
        }

        throw new ArgumentException("invalid return URL");
    }

    private async Task EnsureUserProfileClaimsAsync(ApplicationUser user)
    {
        var existingClaims = await _userManager.GetClaimsAsync(user);

        var nameValue = user.UserName?.Trim();
        var emailValue = user.Email?.Trim();
        var claimsToAdd = new List<Claim>();

        if (!string.IsNullOrWhiteSpace(nameValue))
        {
            if (!existingClaims.Any(claim => claim.Type == JwtClaimTypes.Name))
            {
                claimsToAdd.Add(new Claim(JwtClaimTypes.Name, nameValue));
            }

            if (!existingClaims.Any(claim => claim.Type == JwtClaimTypes.PreferredUserName))
            {
                claimsToAdd.Add(new Claim(JwtClaimTypes.PreferredUserName, nameValue));
            }
        }

        if (!string.IsNullOrWhiteSpace(emailValue) &&
            !existingClaims.Any(claim => claim.Type == JwtClaimTypes.Email))
        {
            claimsToAdd.Add(new Claim(JwtClaimTypes.Email, emailValue));
        }

        if (claimsToAdd.Count == 0)
        {
            return;
        }

        var addClaimsResult = await _userManager.AddClaimsAsync(user, claimsToAdd);
        if (!addClaimsResult.Succeeded)
        {
            var errors = string.Join("; ", addClaimsResult.Errors.Select(error => error.Description));
            throw new InvalidOperationException($"Failed to add profile claims for user '{user.Id}': {errors}");
        }
    }

    private bool IsInvalidReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrEmpty(returnUrl))
        {
            return false;
        }

        return !Url.IsLocalUrl(returnUrl) && !_interaction.IsValidReturnUrl(returnUrl);
    }
}
