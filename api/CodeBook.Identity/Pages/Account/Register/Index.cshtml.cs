using System.Security.Claims;
using System.Text;
using Duende.IdentityModel;
using Duende.IdentityServer.Services;
using CodeBook.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;

namespace CodeBook.Identity.Pages.Account.Register;

[SecurityHeaders]
[AllowAnonymous]
public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailSender _emailSender;
    private readonly IIdentityServerInteractionService _interaction;

    [BindProperty]
    public InputModel Input { get; set; } = default!;

    public string? LoginReturnUrl => ReturnUrlHelper.StripSignupScreenHint(Input.ReturnUrl);

    public Index(
        UserManager<ApplicationUser> userManager,
        IEmailSender emailSender,
        IIdentityServerInteractionService interaction)
    {
        _userManager = userManager;
        _emailSender = emailSender;
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
        await SendEmailConfirmationLinkAsync(user, Input.ReturnUrl);

        return RedirectToPage("/Account/Register/CheckEmail", new
        {
            email = user.Email,
            returnUrl = Input.ReturnUrl
        });
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

    private async Task SendEmailConfirmationLinkAsync(ApplicationUser user, string? returnUrl)
    {
        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedConfirmationToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(confirmationToken));
        var callbackUrl = Url.Page(
            "/Account/Register/ConfirmEmail",
            null,
            new
            {
                userId = user.Id,
                code = encodedConfirmationToken,
                returnUrl
            },
            Request.Scheme);

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            throw new InvalidOperationException("Unable to generate confirmation email callback URL.");
        }

        var username = user.UserName ?? user.Email ?? "there";
        var message = $"""
                       <p>Hello {username},</p>
                       <p>Please confirm your email address by clicking the link below:</p>
                       <p><a href="{callbackUrl}">Confirm your email</a></p>
                       <p>If you did not create this account, you can safely ignore this email.</p>
                       """;

        await _emailSender.SendEmailAsync(user.Email!, "Confirm your CodeBook account", message);
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
