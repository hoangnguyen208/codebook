using System.Security.Claims;
using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Controllers;

public class DashboardCollectionsControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Collection> _collections;
    private readonly List<Item> _items;
    private readonly List<ItemType> _itemTypes;
    private const string TestUserId = "test-user";

    public DashboardCollectionsControllerTests()
    {
        _itemTypes =
        [
            new() { Id = "type-snippet", Name = "snippet", Icon = "Code", Color = "#3b82f6", IsSystem = true },
            new() { Id = "type-prompt", Name = "prompt", Icon = "Sparkles", Color = "#8b5cf6", IsSystem = true }
        ];

        _collections =
        [
            new()
            {
                Id = "col-1", Name = "Frontend", Description = "Frontend resources",
                IsFavorite = true, UserId = TestUserId, UpdatedAt = new DateTime(2026, 6, 1)
            },
            new()
            {
                Id = "col-2", Name = "Backend", Description = null,
                IsFavorite = false, UserId = TestUserId, UpdatedAt = new DateTime(2026, 6, 2)
            },
            new()
            {
                Id = "col-3", Name = "Empty", Description = "No items",
                IsFavorite = false, UserId = TestUserId, UpdatedAt = new DateTime(2026, 5, 1)
            }
        ];

        _items =
        [
            new()
            {
                Id = "item-1", Title = "Item 1", CollectionId = "col-1",
                TypeId = "type-snippet", Type = _itemTypes[0],
                UpdatedAt = new DateTime(2026, 6, 1)
            },
            new()
            {
                Id = "item-2", Title = "Item 2", CollectionId = "col-1",
                TypeId = "type-prompt", Type = _itemTypes[1],
                UpdatedAt = new DateTime(2026, 5, 15)
            },
            new()
            {
                Id = "item-3", Title = "Item 3", CollectionId = "col-2",
                TypeId = "type-snippet", Type = _itemTypes[0],
                UpdatedAt = new DateTime(2026, 6, 2)
            }
        ];

        _collections[0].Items = _items.Where(i => i.CollectionId == "col-1").ToList();
        _collections[1].Items = _items.Where(i => i.CollectionId == "col-2").ToList();
        _collections[2].Items = [];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(_collections).Object);
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(_items).Object);
        mockDbContext.Setup(db => db.ItemTypes).Returns(MockDbSetHelper.CreateDbSetMock(_itemTypes).Object);
        _dbContext = mockDbContext.Object;
    }

    private DashboardCollectionsController CreateController()
    {
        return new DashboardCollectionsController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", TestUserId)
                    ]))
                }
            }
        };
    }

    [Fact]
    public async Task GetCollections_ReturnsOrderedByLastUpdatedAtDesc()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value).ToList();
        Assert.Equal(3, collections.Count);
        Assert.Equal("Backend", collections[0].Name);
    }

    [Fact]
    public async Task GetCollections_RespectsLimit()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(2);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value);
        Assert.Equal(2, collections.Count());
    }

    [Fact]
    public async Task GetCollections_MapsItemCount()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value).ToList();
        var col1 = collections.First(c => c.Id == "col-1");
        Assert.Equal(2, col1.ItemCount);
    }

    [Fact]
    public async Task GetCollections_EmptyCollection_ReturnsZeroCount()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value).ToList();
        var col3 = collections.First(c => c.Id == "col-3");
        Assert.Equal(0, col3.ItemCount);
    }

    [Fact]
    public async Task GetCollections_MapsDominantColor()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value).ToList();
        var col1 = collections.First(c => c.Id == "col-1");
        Assert.Equal("purple", col1.DominantColor);
    }

    [Fact]
    public async Task GetCollections_MapsTypeIcons()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value).ToList();
        var col1 = collections.First(c => c.Id == "col-1");
        Assert.Equal(2, col1.TypeIcons.Count);
        Assert.Contains("Code", col1.TypeIcons);
        Assert.Contains("Sparkles", col1.TypeIcons);
    }

    [Fact]
    public async Task GetCollection_MapsIsFavorite()
    {
        var controller = CreateController();

        var result = await controller.GetCollections(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value).ToList();
        var col1 = collections.First(c => c.Id == "col-1");
        Assert.True(col1.IsFavorite);
    }

    [Fact]
    public async Task GetRecentCollections_DefaultLimitIs6()
    {
        var manyCollections = Enumerable.Range(1, 10).Select(i => new Collection
        {
            Id = $"col-{i}", Name = $"Collection {i}",
            UserId = TestUserId,
            UpdatedAt = new DateTime(2026, 6, i)
        }).ToList();

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(manyCollections).Object);
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(new List<Item>()).Object);

        var controller = new DashboardCollectionsController(mockDbContext.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", TestUserId)
                    ]))
                }
            }
        };

        var result = await controller.GetRecentCollections();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collections = Assert.IsAssignableFrom<IEnumerable<RecentDashboardCollectionDto>>(okResult.Value);
        Assert.Equal(6, collections.Count());
    }
}
