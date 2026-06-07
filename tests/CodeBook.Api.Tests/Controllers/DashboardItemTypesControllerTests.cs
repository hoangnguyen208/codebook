using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Controllers;

public class DashboardItemTypesControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<ItemType> _itemTypes;

    public DashboardItemTypesControllerTests()
    {
        _itemTypes =
        [
            new() { Id = "type-snippet", Name = "snippet", Icon = "Code", Color = "#3b82f6", IsSystem = true },
            new() { Id = "type-prompt", Name = "prompt", Icon = "Sparkles", Color = "#8b5cf6", IsSystem = true },
            new() { Id = "type-custom", Name = "custom", Icon = "File", Color = "#6b7280", IsSystem = false }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.ItemTypes).Returns(MockDbSetHelper.CreateDbSetMock(_itemTypes).Object);
        _dbContext = mockDbContext.Object;
    }

    [Fact]
    public async Task GetSystemItemTypes_ReturnsOnlySystemTypes()
    {
        var controller = new DashboardItemTypesController(_dbContext);

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var types = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value);
        Assert.Equal(2, types.Count());
        Assert.All(types, t => Assert.True(t.IsSystem));
    }

    [Fact]
    public async Task GetSystemItemTypes_ReturnsOrderedByName()
    {
        var controller = new DashboardItemTypesController(_dbContext);

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var types = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value).ToList();
        Assert.Equal("prompt", types[0].Name);
        Assert.Equal("snippet", types[1].Name);
    }

    [Fact]
    public async Task GetSystemItemTypes_MapsAllFields()
    {
        var controller = new DashboardItemTypesController(_dbContext);

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var type = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value).First(t => t.Name == "snippet");
        Assert.Equal("type-snippet", type.Id);
        Assert.Equal("snippet", type.Name);
        Assert.Equal("Code", type.Icon);
        Assert.Equal("#3b82f6", type.Color);
    }

    [Fact]
    public async Task GetSystemItemTypes_NoSystemTypes_ReturnsEmpty()
    {
        var emptyTypes = new List<ItemType>
        {
            new() { Id = "type-custom", Name = "custom", IsSystem = false }
        };
        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.ItemTypes).Returns(MockDbSetHelper.CreateDbSetMock(emptyTypes).Object);

        var controller = new DashboardItemTypesController(mockDbContext.Object);

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var types = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value);
        Assert.Empty(types);
    }
}
