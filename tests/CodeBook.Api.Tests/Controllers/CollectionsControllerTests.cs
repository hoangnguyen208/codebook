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

public class CollectionsControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Collection> _collections;
    private const string TestUserId = "test-user";

    public CollectionsControllerTests()
    {
        _collections =
        [
            new()
            {
                Id = "col-1", Name = "Frontend", Description = "Frontend resources",
                IsFavorite = true, UserId = TestUserId, CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 6, 1)
            },
            new()
            {
                Id = "col-2", Name = "Backend", Description = null,
                IsFavorite = false, UserId = TestUserId, CreatedAt = new DateTime(2026, 2, 1),
                UpdatedAt = new DateTime(2026, 6, 2)
            }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(_collections).Object);
        mockDbContext.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _dbContext = mockDbContext.Object;
    }

    private CollectionsController CreateController(string? userId = null)
    {
        return new CollectionsController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", userId ?? TestUserId)
                    ]))
                }
            }
        };
    }

    // ── Create tests ──

    [Fact]
    public async Task Create_ReturnsCreatedWithDetails()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "DevOps",
            Description = "CI/CD and infrastructure"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(createdResult.Value);
        Assert.Equal("DevOps", collection.Name);
        Assert.Equal("CI/CD and infrastructure", collection.Description);
        Assert.False(collection.IsFavorite);
        Assert.Equal(3, _collections.Count);
        Assert.Equal(TestUserId, _collections.Last().UserId);
    }

    [Fact]
    public async Task Create_StoresTimestamps()
    {
        var controller = CreateController();
        var before = DateTime.UtcNow;

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "Timestamps"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var dto = Assert.IsType<CollectionDto>(createdResult.Value);
        var created = _collections.Last();
        Assert.True(created.CreatedAt >= before);
        Assert.True(created.UpdatedAt >= before);
        Assert.Equal(created.CreatedAt, dto.CreatedAt);
    }

    [Fact]
    public async Task Create_WithIsFavoriteTrue()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "Favorites",
            IsFavorite = true
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(createdResult.Value);
        Assert.True(collection.IsFavorite);
        Assert.True(_collections.Last().IsFavorite);
    }

    [Fact]
    public async Task Create_GeneratesUniqueId()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "Unique"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(createdResult.Value);
        Assert.False(string.IsNullOrWhiteSpace(collection.Id));
        Assert.NotEqual(_collections[0].Id, collection.Id);
        Assert.NotEqual(_collections[1].Id, collection.Id);
    }

    [Fact]
    public async Task Create_TrimsNameAndDescription()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "  Trimmed Name  ",
            Description = "  Trimmed Description  "
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(createdResult.Value);
        Assert.Equal("Trimmed Name", collection.Name);
        Assert.Equal("Trimmed Description", collection.Description);
    }

    [Fact]
    public async Task Create_ReturnsBadRequestForEmptyName()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = ""
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(2, _collections.Count);
    }

    [Fact]
    public async Task Create_ReturnsBadRequestForWhitespaceOnlyName()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "   "
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(2, _collections.Count);
    }

    [Fact]
    public async Task Create_ReturnsBadRequestForNameTooLong()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = new string('x', 201)
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(2, _collections.Count);
    }

    [Fact]
    public async Task Create_AllowsMaxLengthName()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = new string('x', 200)
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(createdResult.Value);
        Assert.Equal(200, collection.Name.Length);
    }

    [Fact]
    public async Task Create_ReturnsUnauthorizedWhenNoUser()
    {
        var controller = new CollectionsController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "No Auth"
        });

        Assert.IsType<UnauthorizedResult>(result.Result);
        Assert.Equal(2, _collections.Count);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "Route Test"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal("Create", createdResult.ActionName);
    }

    [Fact]
    public async Task Create_ScopesToAuthenticatedUser()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "User Scoped"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var created = _collections.Last();
        Assert.Equal(TestUserId, created.UserId);
    }

    [Fact]
    public async Task Create_WithNullDescription()
    {
        var controller = CreateController();

        var result = await controller.Create(new CreateCollectionRequest
        {
            Name = "No Description",
            Description = null
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(createdResult.Value);
        Assert.Null(collection.Description);
    }
}
