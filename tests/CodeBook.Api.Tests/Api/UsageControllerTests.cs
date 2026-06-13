using System.Security.Claims;
using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Services;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Api;

public class UsageControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Item> _items;
    private readonly List<Collection> _collections;
    private const string TestUserId = "test-user";

    public UsageControllerTests()
    {
        _items =
        [
            new() { Id = "item-1", Title = "Item 1", TypeId = "type-snippet", UserId = TestUserId },
            new() { Id = "item-2", Title = "Item 2", TypeId = "type-snippet", UserId = TestUserId },
            new() { Id = "item-other", Title = "Other", TypeId = "type-snippet", UserId = "other" }
        ];

        _collections =
        [
            new() { Id = "col-1", Name = "Col 1", UserId = TestUserId },
            new() { Id = "col-2", Name = "Col 2", UserId = TestUserId },
            new() { Id = "col-other", Name = "Other", UserId = "other" }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(_items).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(_collections).Object);
        _dbContext = mockDbContext.Object;
    }

    private UsageController CreateController(string? userId = null, bool isPro = false)
    {
        var claims = new List<Claim> { new("sub", userId ?? TestUserId) };
        if (isPro) claims.Add(new Claim("isPro", "true"));

        return new UsageController(new UsageLimitsService(_dbContext))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims))
                }
            }
        };
    }

    [Fact]
    public async Task GetLimits_ReturnsCorrectCounts()
    {
        var controller = CreateController();

        var result = await controller.GetLimits();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var limits = Assert.IsType<UsageLimits>(ok.Value);
        Assert.Equal(2, limits.ItemCount);
        Assert.Equal(2, limits.CollectionCount);
        Assert.Equal(UsageLimitsService.FreeItemLimit, limits.ItemLimit);
        Assert.Equal(UsageLimitsService.FreeCollectionLimit, limits.CollectionLimit);
    }

    [Fact]
    public async Task GetLimits_ProUser_HasNullRemaining()
    {
        var controller = CreateController(isPro: true);

        var result = await controller.GetLimits();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var limits = Assert.IsType<UsageLimits>(ok.Value);
        Assert.True(limits.IsPro);
        Assert.Null(limits.ItemsRemaining);
        Assert.Null(limits.CollectionsRemaining);
    }

    [Fact]
    public async Task GetLimits_FreeUser_HasRemaining()
    {
        var controller = CreateController();

        var result = await controller.GetLimits();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var limits = Assert.IsType<UsageLimits>(ok.Value);
        Assert.Equal(UsageLimitsService.FreeItemLimit - 2, limits.ItemsRemaining);
        Assert.Equal(UsageLimitsService.FreeCollectionLimit - 2, limits.CollectionsRemaining);
    }

    [Fact]
    public async Task GetLimits_ProUser_CanAlwaysCreate()
    {
        var controller = CreateController(isPro: true);

        var result = await controller.GetLimits();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var limits = Assert.IsType<UsageLimits>(ok.Value);
        Assert.True(limits.CanCreateItem);
        Assert.True(limits.CanCreateCollection);
    }

    [Fact]
    public async Task GetLimits_FreeUserAtLimit_CannotCreate()
    {
        var items = new List<Item>();
        for (int i = 0; i < UsageLimitsService.FreeItemLimit; i++)
            items.Add(new Item { Id = $"item-{i}", Title = $"Item {i}", TypeId = "type-snippet", UserId = TestUserId });

        var collections = new List<Collection>();
        for (int i = 0; i < UsageLimitsService.FreeCollectionLimit; i++)
            collections.Add(new Collection { Id = $"col-{i}", Name = $"Col {i}", UserId = TestUserId });

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(items).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(collections).Object);

        var controller = new UsageController(new UsageLimitsService(mockDbContext.Object))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", TestUserId)]))
                }
            }
        };

        var result = await controller.GetLimits();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var limits = Assert.IsType<UsageLimits>(ok.Value);
        Assert.False(limits.CanCreateItem);
        Assert.False(limits.CanCreateCollection);
    }

    [Fact]
    public async Task GetLimits_NoUserId_ReturnsUnauthorized()
    {
        var controller = new UsageController(new UsageLimitsService(_dbContext))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity())
                }
            }
        };

        var result = await controller.GetLimits();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}
