using System.Security.Claims;
using CodeBook.Identity.Models;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Identity;

namespace CodeBook.Identity.Services;

public class ProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUserClaimsPrincipalFactory<ApplicationUser> _claimsFactory;

    public ProfileService(UserManager<ApplicationUser> userManager, IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory)
    {
        _userManager = userManager;
        _claimsFactory = claimsFactory;
    }

    public async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        if (user == null) return;

        var principal = await _claimsFactory.CreateAsync(user);
        context.IssuedClaims.AddRange(principal.Claims);

        context.IssuedClaims.Add(new Claim("isPro", user.IsPro.ToString().ToLowerInvariant()));
        if (!string.IsNullOrEmpty(user.StripeCustomerId))
        {
            context.IssuedClaims.Add(new Claim("stripeCustomerId", user.StripeCustomerId));
        }
    }

    public async Task IsActiveAsync(IsActiveContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        context.IsActive = user != null;
    }
}
