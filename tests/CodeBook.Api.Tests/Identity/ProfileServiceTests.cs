using System.Security.Claims;
using CodeBook.Identity.Models;
using CodeBook.Identity.Services;
using Duende.IdentityServer.Models;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Identity;

public class ProfileServiceTests
{
    private static Mock<UserManager<ApplicationUser>> CreateUserManager(ApplicationUser? user = null)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManager = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        userManager.Setup(m => m.GetUserAsync(It.IsAny<ClaimsPrincipal>()))
            .ReturnsAsync(user);

        return userManager;
    }

    [Fact]
    public async Task GetProfileDataAsync_AddsIsProClaim()
    {
        var user = new ApplicationUser { Id = "user-1", IsPro = true };
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        claimsFactory.Setup(f => f.CreateAsync(user))
            .ReturnsAsync(new ClaimsPrincipal(new ClaimsIdentity([
                new Claim("sub", "user-1"), new Claim("email", "test@example.com")
            ])));

        var service = new ProfileService(CreateUserManager(user).Object, claimsFactory.Object);
        var context = new ProfileDataRequestContext
        {
            Subject = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])),
            IssuedClaims = []
        };

        await service.GetProfileDataAsync(context);

        var isProClaim = context.IssuedClaims.FirstOrDefault(c => c.Type == "isPro");
        Assert.NotNull(isProClaim);
        Assert.Equal("true", isProClaim.Value);

        // Standard claims are preserved
        Assert.Contains(context.IssuedClaims, c => c.Type == "email");
    }

    [Fact]
    public async Task GetProfileDataAsync_FreeUser_HasIsProFalse()
    {
        var user = new ApplicationUser { Id = "user-1", IsPro = false };
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        claimsFactory.Setup(f => f.CreateAsync(user))
            .ReturnsAsync(new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])));

        var service = new ProfileService(CreateUserManager(user).Object, claimsFactory.Object);
        var context = new ProfileDataRequestContext
        {
            Subject = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])),
            IssuedClaims = []
        };

        await service.GetProfileDataAsync(context);

        var isProClaim = context.IssuedClaims.FirstOrDefault(c => c.Type == "isPro");
        Assert.NotNull(isProClaim);
        Assert.Equal("false", isProClaim.Value);
    }

    [Fact]
    public async Task GetProfileDataAsync_AddsStripeCustomerId_WhenPresent()
    {
        var user = new ApplicationUser { Id = "user-1", IsPro = true, StripeCustomerId = "cus_abc123" };
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        claimsFactory.Setup(f => f.CreateAsync(user))
            .ReturnsAsync(new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])));

        var service = new ProfileService(CreateUserManager(user).Object, claimsFactory.Object);
        var context = new ProfileDataRequestContext
        {
            Subject = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])),
            IssuedClaims = []
        };

        await service.GetProfileDataAsync(context);

        var custClaim = context.IssuedClaims.FirstOrDefault(c => c.Type == "stripeCustomerId");
        Assert.NotNull(custClaim);
        Assert.Equal("cus_abc123", custClaim.Value);
    }

    [Fact]
    public async Task GetProfileDataAsync_NoStripeCustomerId_OmitsClaim()
    {
        var user = new ApplicationUser { Id = "user-1", IsPro = true, StripeCustomerId = null };
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        claimsFactory.Setup(f => f.CreateAsync(user))
            .ReturnsAsync(new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])));

        var service = new ProfileService(CreateUserManager(user).Object, claimsFactory.Object);
        var context = new ProfileDataRequestContext
        {
            Subject = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])),
            IssuedClaims = []
        };

        await service.GetProfileDataAsync(context);

        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == "stripeCustomerId");
    }

    [Fact]
    public async Task GetProfileDataAsync_NullUser_DoesNotThrow()
    {
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        var service = new ProfileService(CreateUserManager(null).Object, claimsFactory.Object);
        var context = new ProfileDataRequestContext
        {
            Subject = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "nonexistent")])),
            IssuedClaims = []
        };

        await service.GetProfileDataAsync(context);

        Assert.Empty(context.IssuedClaims);
    }

    [Fact]
    public async Task IsActiveAsync_ReturnsTrue_ForExistingUser()
    {
        var user = new ApplicationUser { Id = "user-1" };
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        var service = new ProfileService(CreateUserManager(user).Object, claimsFactory.Object);
        var context = new IsActiveContext(
            new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-1")])),
            new Mock<Duende.IdentityServer.Models.Client>().Object,
            "test");

        await service.IsActiveAsync(context);

        Assert.True(context.IsActive);
    }

    [Fact]
    public async Task IsActiveAsync_ReturnsFalse_ForMissingUser()
    {
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        var service = new ProfileService(CreateUserManager(null).Object, claimsFactory.Object);
        var context = new IsActiveContext(
            new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "nonexistent")])),
            new Mock<Duende.IdentityServer.Models.Client>().Object,
            "test");

        await service.IsActiveAsync(context);

        Assert.False(context.IsActive);
    }
}
