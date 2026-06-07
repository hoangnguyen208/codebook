using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Controllers;

public class ProfileControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Item> _items;
    private readonly List<Collection> _collections;
    private readonly List<ItemType> _itemTypes;

    public ProfileControllerTests()
    {
        _itemTypes =
        [
            new() { Id = "type-snippet", Name = "snippet", Icon = "Code", Color = "#3b82f6", IsSystem = true },
            new() { Id = "type-prompt", Name = "prompt", Icon = "Sparkles", Color = "#8b5cf6", IsSystem = true },
            new() { Id = "type-link", Name = "link", Icon = "Link", Color = "#10b981", IsSystem = true }
        ];

        _items =
        [
            new()
            {
                Id = "item-1", Title = "Snippet 1", TypeId = "type-snippet",
                Type = _itemTypes[0]
            },
            new()
            {
                Id = "item-2", Title = "Snippet 2", TypeId = "type-snippet",
                Type = _itemTypes[0]
            },
            new()
            {
                Id = "item-3", Title = "Prompt 1", TypeId = "type-prompt",
                Type = _itemTypes[1]
            },
            new()
            {
                Id = "item-4", Title = "Link 1", TypeId = "type-link",
                Type = _itemTypes[2]
            }
        ];

        _collections =
        [
            new() { Id = "col-1", Name = "Collection 1" },
            new() { Id = "col-2", Name = "Collection 2" }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(_items).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(_collections).Object);
        mockDbContext.Setup(db => db.ItemTypes).Returns(MockDbSetHelper.CreateDbSetMock(_itemTypes).Object);
        _dbContext = mockDbContext.Object;
    }

    [Fact]
    public async Task GetStats_ReturnsTotalCounts()
    {
        var controller = new ProfileController(_dbContext);

        var result = await controller.GetStats();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<ProfileStatsDto>(okResult.Value);
        Assert.Equal(4, stats.TotalItems);
        Assert.Equal(2, stats.TotalCollections);
    }

    [Fact]
    public async Task GetStats_ReturnsTypeBreakdown()
    {
        var controller = new ProfileController(_dbContext);

        var result = await controller.GetStats();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<ProfileStatsDto>(okResult.Value);
        Assert.Equal(3, stats.TypeBreakdown.Count);
    }

    [Fact]
    public async Task GetStats_BreakdownOrderedByCountDesc()
    {
        var controller = new ProfileController(_dbContext);

        var result = await controller.GetStats();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<ProfileStatsDto>(okResult.Value);
        Assert.Equal(2, stats.TypeBreakdown[0].Count);
        Assert.Equal("snippet", stats.TypeBreakdown[0].TypeName);
    }

    [Fact]
    public async Task GetStats_MapsTypeFields()
    {
        var controller = new ProfileController(_dbContext);

        var result = await controller.GetStats();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<ProfileStatsDto>(okResult.Value);
        var snippetStat = stats.TypeBreakdown.First(s => s.TypeName == "snippet");
        Assert.Equal("type-snippet", snippetStat.TypeId);
        Assert.Equal("Code", snippetStat.Icon);
        Assert.Equal("#3b82f6", snippetStat.Color);
    }

    [Fact]
    public async Task GetStats_EmptyDatabase_ReturnsZeros()
    {
        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(new List<Item>()).Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(new List<Collection>()).Object);

        var controller = new ProfileController(mockDbContext.Object);

        var result = await controller.GetStats();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<ProfileStatsDto>(okResult.Value);
        Assert.Equal(0, stats.TotalItems);
        Assert.Equal(0, stats.TotalCollections);
        Assert.Empty(stats.TypeBreakdown);
    }
}
