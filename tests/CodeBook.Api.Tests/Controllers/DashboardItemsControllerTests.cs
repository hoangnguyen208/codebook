using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Controllers;

public class DashboardItemsControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Item> _items;
    private readonly List<ItemTag> _itemTags;
    private readonly List<Tag> _tags;
    private readonly List<ItemType> _itemTypes;

    public DashboardItemsControllerTests()
    {
        _itemTypes =
        [
            new() { Id = "type-snippet", Name = "snippet", IsSystem = true, Color = "#3b82f6" },
            new() { Id = "type-prompt", Name = "prompt", IsSystem = true, Color = "#8b5cf6" },
            new() { Id = "type-link", Name = "link", IsSystem = true, Color = "#10b981" }
        ];

        _tags =
        [
            new() { Id = "tag-1", Name = "typescript" },
            new() { Id = "tag-2", Name = "react" },
            new() { Id = "tag-3", Name = "" }
        ];

        _items =
        [
            new()
            {
                Id = "item-1", Title = "Map function", Description = "Array map pattern",
                TypeId = "type-snippet", Type = _itemTypes[0], IsFavorite = true, IsPinned = true,
                UpdatedAt = new DateTime(2026, 6, 1)
            },
            new()
            {
                Id = "item-2", Title = "Git log", Description = null,
                TypeId = "type-snippet", Type = _itemTypes[0], IsFavorite = false, IsPinned = false,
                UpdatedAt = new DateTime(2026, 6, 3)
            },
            new()
            {
                Id = "item-3", Title = "API docs", Description = "Link to docs",
                TypeId = "type-link", Type = _itemTypes[2], IsFavorite = false, IsPinned = false,
                UpdatedAt = new DateTime(2026, 6, 2)
            }
        ];

        _itemTags =
        [
            new() { ItemId = "item-1", TagId = "tag-1", Item = _items[0], Tag = _tags[0] },
            new() { ItemId = "item-1", TagId = "tag-2", Item = _items[0], Tag = _tags[1] },
            new() { ItemId = "item-2", TagId = "tag-3", Item = _items[1], Tag = _tags[2] }
        ];

        _items[0].Tags = _itemTags.Where(it => it.ItemId == "item-1").ToList();
        _items[1].Tags = _itemTags.Where(it => it.ItemId == "item-2").ToList();

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(_items).Object);
        mockDbContext.Setup(db => db.ItemTypes).Returns(MockDbSetHelper.CreateDbSetMock(_itemTypes).Object);
        mockDbContext.Setup(db => db.Tags).Returns(MockDbSetHelper.CreateDbSetMock(_tags).Object);
        mockDbContext.Setup(db => db.ItemTags).Returns(MockDbSetHelper.CreateDbSetMock(_itemTags).Object);

        _dbContext = mockDbContext.Object;
    }

    [Fact]
    public async Task GetRecentItems_ReturnsOrderedByUpdatedAtDesc()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetRecentItems(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(3, items.Count());
        Assert.Equal("Git log", items.First().Title);
    }

    [Fact]
    public async Task GetRecentItems_RespectsLimit()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetRecentItems(1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task GetRecentItems_MapsFavoriteAndPinned()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetRecentItems(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        var pinned = items.First(i => i.Id == "item-1");
        Assert.True(pinned.IsFavorite);
        Assert.True(pinned.IsPinned);
    }

    [Fact]
    public async Task GetRecentItems_FiltersEmptyTags()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetRecentItems(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        var item2 = items.First(i => i.Id == "item-2");
        Assert.Empty(item2.Tags);
    }

    [Fact]
    public async Task GetItemsByType_ReturnsOnlyMatchingType()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetItemsByType("snippet");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(2, items.Count());
        Assert.All(items, i => Assert.Equal("type-snippet", i.TypeId));
    }

    [Fact]
    public async Task GetItemsByType_UnknownTypeReturnsEmpty()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetItemsByType("nonexistent");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Empty(items);
    }

    [Fact]
    public async Task GetItemsByType_RespectsLimit()
    {
        var controller = new DashboardItemsController(_dbContext);

        var result = await controller.GetItemsByType("snippet", 1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Single(items);
    }
}
