using System.Security.Claims;
using CodeBook.Api.Tests.Helpers;
using CodeBook.Identity.Controllers;
using CodeBook.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Identity;

public class SubscriptionControllerTests
{
    private static Mock<UserManager<ApplicationUser>> CreateUserManager(List<ApplicationUser> users)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManager = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        userManager.Setup(m => m.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((string id) => users.FirstOrDefault(u => u.Id == id));

        userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((string email) => users.FirstOrDefault(u => u.Email == email));

        userManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        var mockDbSet = MockDbSetHelper.CreateDbSetMock(users);
        userManager.Setup(m => m.Users).Returns(mockDbSet.Object);

        return userManager;
    }

    [Fact]
    public async Task UpdateSubscription_UpdatesIsPro()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@example.com", IsPro = false };
        var controller = new SubscriptionController(CreateUserManager([user]).Object);

        var result = await controller.UpdateSubscription("user-1", new UpdateSubscriptionRequest { IsPro = true });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True(user.IsPro);
    }

    [Fact]
    public async Task UpdateSubscription_SetsStripeCustomerId()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@example.com" };
        var controller = new SubscriptionController(CreateUserManager([user]).Object);

        var result = await controller.UpdateSubscription("user-1", new UpdateSubscriptionRequest
        {
            IsPro = true,
            StripeCustomerId = "cus_123",
            StripeSubscriptionId = "sub_456"
        });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("cus_123", user.StripeCustomerId);
        Assert.Equal("sub_456", user.StripeSubscriptionId);
        Assert.True(user.IsPro);
    }

    [Fact]
    public async Task UpdateSubscription_ClearsStripeCustomerId_WhenEmpty()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@example.com", StripeCustomerId = "cus_old" };
        var controller = new SubscriptionController(CreateUserManager([user]).Object);

        await controller.UpdateSubscription("user-1", new UpdateSubscriptionRequest { StripeCustomerId = "" });

        Assert.Null(user.StripeCustomerId);
    }

    [Fact]
    public async Task UpdateSubscription_ReturnsNotFound_WhenUserMissing()
    {
        var controller = new SubscriptionController(CreateUserManager([]).Object);

        var result = await controller.UpdateSubscription("nonexistent", new UpdateSubscriptionRequest { IsPro = true });

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Contains("User not found", notFound.Value!.ToString());
    }

    [Fact]
    public async Task UpdateSubscription_Returns500_WhenUpdateFails()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@example.com" };
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManager = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        userManager.Setup(m => m.FindByIdAsync("user-1")).ReturnsAsync(user);
        userManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "DB error" }));

        var controller = new SubscriptionController(userManager.Object);

        var result = await controller.UpdateSubscription("user-1", new UpdateSubscriptionRequest { IsPro = true });

        var status = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, status.StatusCode);
    }

    [Fact]
    public async Task UpdateSubscriptionByEmail_UpdatesUser()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@example.com", IsPro = false };
        var controller = new SubscriptionController(CreateUserManager([user]).Object);

        var result = await controller.UpdateSubscriptionByEmail("test@example.com", new UpdateSubscriptionRequest { IsPro = true });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True(user.IsPro);
    }

    [Fact]
    public async Task UpdateSubscriptionByEmail_ReturnsNotFound()
    {
        var controller = new SubscriptionController(CreateUserManager([]).Object);

        var result = await controller.UpdateSubscriptionByEmail("missing@example.com", new UpdateSubscriptionRequest { IsPro = true });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetByStripeCustomerId_ReturnsUser()
    {
        var user = new ApplicationUser
        {
            Id = "user-1", Email = "test@example.com", IsPro = true, StripeCustomerId = "cus_abc"
        };
        var controller = new SubscriptionController(CreateUserManager([user]).Object);

        var result = await controller.GetByStripeCustomerId("cus_abc");

        var ok = Assert.IsType<OkObjectResult>(result);
        var props = ok.Value!.GetType().GetProperties().ToDictionary(p => p.Name, p => p.GetValue(ok.Value));
        Assert.Equal("user-1", props["userId"]);
        Assert.True((bool)props["isPro"]!);
        Assert.Equal("cus_abc", props["stripeCustomerId"]);
    }

    [Fact]
    public async Task GetByStripeCustomerId_ReturnsNotFound()
    {
        var controller = new SubscriptionController(CreateUserManager([]).Object);

        var result = await controller.GetByStripeCustomerId("cus_none");

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdateSubscription_PartialUpdate_OnlyChangesSpecifiedFields()
    {
        var user = new ApplicationUser { Id = "user-1", Email = "test@example.com", IsPro = true, StripeCustomerId = "cus_keep" };
        var controller = new SubscriptionController(CreateUserManager([user]).Object);

        await controller.UpdateSubscription("user-1", new UpdateSubscriptionRequest { StripeSubscriptionId = "sub_new" });

        Assert.True(user.IsPro);
        Assert.Equal("cus_keep", user.StripeCustomerId);
        Assert.Equal("sub_new", user.StripeSubscriptionId);
    }
}
