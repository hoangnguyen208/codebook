using System.Security.Claims;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Services;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Services;

public class UsageLimitsServiceTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Item> _items;
    private readonly List<Collection> _collections;
    private const string TestUserId = "test-user";

    public UsageLimitsServiceTests()
    {
        _items =
        [
            new() { Id = "item-1", Title = "Snippet 1", TypeId = "type-snippet", UserId = TestUserId },
            new() { Id = "item-2", Title = "Snippet 2", TypeId = "type-snippet", UserId = TestUserId },
            new() { Id = "item-other", Title = "Other User Item", TypeId = "type-snippet", UserId = "other-user" }
        ];

        _collections =
        [
            new() { Id = "col-1", Name = "Collection 1", UserId = TestUserId },
            new() { Id = "col-2", Name = "Collection 2", UserId = TestUserId },
            new() { Id = "col-other", Name = "Other User Collection", UserId = "other-user" }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(_items).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(_collections).Object);
        _dbContext = mockDbContext.Object;
    }

    [Fact]
    public async Task GetUsageLimits_ReturnsCorrectCounts()
    {
        var service = new UsageLimitsService(_dbContext);

        var limits = await service.GetUsageLimitsAsync(TestUserId, false);

        Assert.Equal(2, limits.ItemCount);
        Assert.Equal(2, limits.CollectionCount);
        Assert.Equal(UsageLimitsService.FreeItemLimit, limits.ItemLimit);
        Assert.Equal(UsageLimitsService.FreeCollectionLimit, limits.CollectionLimit);
        Assert.False(limits.IsPro);
    }

    [Fact]
    public async Task GetUsageLimits_IsPro()
    {
        var service = new UsageLimitsService(_dbContext);

        var limits = await service.GetUsageLimitsAsync(TestUserId, true);

        Assert.True(limits.IsPro);
    }

    [Fact]
    public async Task CanCreateItem_ReturnsTrue_WhenUnderLimit()
    {
        var service = new UsageLimitsService(_dbContext);

        var result = await service.CanCreateItemAsync(TestUserId, false);

        Assert.True(result);
    }

    [Fact]
    public async Task CanCreateItem_ReturnsTrue_ForProUser()
    {
        var service = new UsageLimitsService(_dbContext);

        var result = await service.CanCreateItemAsync(TestUserId, true);

        Assert.True(result);
    }

    [Fact]
    public async Task CanCreateItem_ReturnsFalse_AtLimit()
    {
        var items = new List<Item>();
        for (int i = 0; i < UsageLimitsService.FreeItemLimit; i++)
        {
            items.Add(new Item { Id = $"item-{i}", Title = $"Item {i}", TypeId = "type-snippet", UserId = TestUserId });
        }
        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(items).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(new List<Collection>()).Object);
        var service = new UsageLimitsService(mockDbContext.Object);

        var result = await service.CanCreateItemAsync(TestUserId, false);

        Assert.False(result);
    }

    [Fact]
    public async Task CanCreateItem_ReturnsTrue_ForProUserAtLimit()
    {
        var items = new List<Item>();
        for (int i = 0; i < UsageLimitsService.FreeItemLimit; i++)
        {
            items.Add(new Item { Id = $"item-{i}", Title = $"Item {i}", TypeId = "type-snippet", UserId = TestUserId });
        }
        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(items).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(new List<Collection>()).Object);
        var service = new UsageLimitsService(mockDbContext.Object);

        var result = await service.CanCreateItemAsync(TestUserId, true);

        Assert.True(result);
    }

    [Fact]
    public async Task CanCreateCollection_ReturnsTrue_WhenUnderLimit()
    {
        var service = new UsageLimitsService(_dbContext);

        var result = await service.CanCreateCollectionAsync(TestUserId, false);

        Assert.True(result);
    }

    [Fact]
    public async Task CanCreateCollection_ReturnsTrue_ForProUser()
    {
        var service = new UsageLimitsService(_dbContext);

        var result = await service.CanCreateCollectionAsync(TestUserId, true);

        Assert.True(result);
    }

    [Fact]
    public async Task CanCreateCollection_ReturnsFalse_AtLimit()
    {
        var collections = new List<Collection>();
        for (int i = 0; i < UsageLimitsService.FreeCollectionLimit; i++)
        {
            collections.Add(new Collection { Id = $"col-{i}", Name = $"Collection {i}", UserId = TestUserId });
        }
        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(new List<Item>()).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(collections).Object);
        var service = new UsageLimitsService(mockDbContext.Object);

        var result = await service.CanCreateCollectionAsync(TestUserId, false);

        Assert.False(result);
    }

    [Fact]
    public async Task CanCreateCollection_ReturnsTrue_ForProUserAtLimit()
    {
        var collections = new List<Collection>();
        for (int i = 0; i < UsageLimitsService.FreeCollectionLimit; i++)
        {
            collections.Add(new Collection { Id = $"col-{i}", Name = $"Collection {i}", UserId = TestUserId });
        }
        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(new List<Item>()).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(collections).Object);
        var service = new UsageLimitsService(mockDbContext.Object);

        var result = await service.CanCreateCollectionAsync(TestUserId, true);

        Assert.True(result);
    }

    [Fact]
    public async Task GetItemCount_ReturnsCorrectCount()
    {
        var service = new UsageLimitsService(_dbContext);

        var count = await service.GetItemCountAsync(TestUserId);

        Assert.Equal(2, count);
    }

    [Fact]
    public async Task GetCollectionCount_ReturnsCorrectCount()
    {
        var service = new UsageLimitsService(_dbContext);

        var count = await service.GetCollectionCountAsync(TestUserId);

        Assert.Equal(2, count);
    }

    [Fact]
    public async Task GetUsageLimits_ItemsRemaining_CorrectForFreeUser()
    {
        var service = new UsageLimitsService(_dbContext);

        var limits = await service.GetUsageLimitsAsync(TestUserId, false);

        Assert.Equal(UsageLimitsService.FreeItemLimit - 2, limits.ItemsRemaining);
        Assert.Equal(UsageLimitsService.FreeCollectionLimit - 2, limits.CollectionsRemaining);
    }

    [Fact]
    public async Task GetUsageLimits_ItemsRemaining_NullForProUser()
    {
        var service = new UsageLimitsService(_dbContext);

        var limits = await service.GetUsageLimitsAsync(TestUserId, true);

        Assert.Null(limits.ItemsRemaining);
        Assert.Null(limits.CollectionsRemaining);
    }

    [Fact]
    public async Task GetUsageLimits_CanCreateItem_TrueForPro()
    {
        var service = new UsageLimitsService(_dbContext);

        var limits = await service.GetUsageLimitsAsync(TestUserId, true);

        Assert.True(limits.CanCreateItem);
        Assert.True(limits.CanCreateCollection);
    }
}
