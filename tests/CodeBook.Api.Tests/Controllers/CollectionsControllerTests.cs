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
    private readonly List<ItemCollection> _itemCollections;
    private readonly List<Item> _items;
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

        _items =
        [
            new()
            {
                Id = "item-1", Title = "Item 1", ContentType = "text",
                UserId = TestUserId, UpdatedAt = new DateTime(2026, 6, 1)
            }
        ];

        _itemCollections =
        [
            new() { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] }
        ];

        _collections[0].ItemCollections = [_itemCollections[0]];
        _items[0].ItemCollections = [_itemCollections[0]];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        var mockCollectionsDbSet = MockDbSetHelper.CreateDbSetMock(_collections);
        mockCollectionsDbSet.Setup(m => m.Remove(It.IsAny<Collection>()))
            .Callback<Collection>(c => _collections.Remove(c));
        mockDbContext.Setup(db => db.Collections).Returns(mockCollectionsDbSet.Object);
        mockDbContext.Setup(db => db.Items).Returns(MockDbSetHelper.CreateDbSetMock(_items).Object);
        var mockItemCollectionsDbSet = MockDbSetHelper.CreateDbSetMock(_itemCollections);
        mockItemCollectionsDbSet.Setup(m => m.RemoveRange(It.IsAny<IEnumerable<ItemCollection>>()))
            .Callback<IEnumerable<ItemCollection>>(entities =>
            {
                foreach (var e in entities) _itemCollections.Remove(e);
            });
        mockDbContext.Setup(db => db.ItemCollections).Returns(mockItemCollectionsDbSet.Object);
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
        Assert.Equal("Get", createdResult.ActionName);
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

    // ── Get tests ──

    [Fact]
    public async Task Get_ReturnsCollectionById()
    {
        var controller = CreateController();

        var result = await controller.Get("col-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(okResult.Value);
        Assert.Equal("col-1", collection.Id);
        Assert.Equal("Frontend", collection.Name);
        Assert.Equal("Frontend resources", collection.Description);
        Assert.True(collection.IsFavorite);
    }

    [Fact]
    public async Task Get_ReturnsNotFoundForMissingCollection()
    {
        var controller = CreateController();

        var result = await controller.Get("non-existent");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Get_ReturnsNotFoundForOtherUsersCollection()
    {
        var otherController = CreateController("different-user");

        var result = await otherController.Get("col-1");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── Update tests ──

    [Fact]
    public async Task Update_Succeeds()
    {
        var controller = CreateController();

        var result = await controller.Update("col-1", new UpdateCollectionRequest
        {
            Name = "Updated Frontend",
            Description = "Updated description"
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var collection = Assert.IsType<CollectionDto>(okResult.Value);
        Assert.Equal("Updated Frontend", collection.Name);
        Assert.Equal("Updated description", collection.Description);
        Assert.Equal("col-1", collection.Id);
    }

    [Fact]
    public async Task Update_ReturnsNotFoundForMissingCollection()
    {
        var controller = CreateController();

        var result = await controller.Update("non-existent", new UpdateCollectionRequest
        {
            Name = "Test"
        });

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_ReturnsBadRequestForEmptyName()
    {
        var controller = CreateController();

        var result = await controller.Update("col-1", new UpdateCollectionRequest
        {
            Name = ""
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Update_ReturnsBadRequestForNameTooLong()
    {
        var controller = CreateController();

        var result = await controller.Update("col-1", new UpdateCollectionRequest
        {
            Name = new string('x', 201)
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Update_ReturnsUnauthorizedWhenNoUser()
    {
        var controller = new CollectionsController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.Update("col-1", new UpdateCollectionRequest
        {
            Name = "Test"
        });

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── Delete tests ──

    [Fact]
    public async Task Delete_SucceedsAndRemovesItemCollections()
    {
        var controller = CreateController();

        var result = await controller.Delete("col-1");

        Assert.IsType<NoContentResult>(result);
        Assert.DoesNotContain(_collections, c => c.Id == "col-1");
        Assert.DoesNotContain(_itemCollections, ic => ic.CollectionId == "col-1");
    }

    [Fact]
    public async Task Delete_PreservesItems()
    {
        var controller = CreateController();

        var result = await controller.Delete("col-1");

        Assert.IsType<NoContentResult>(result);
        Assert.Contains(_items, i => i.Id == "item-1");
    }

    [Fact]
    public async Task Delete_ReturnsNotFoundForMissingCollection()
    {
        var controller = CreateController();

        var result = await controller.Delete("non-existent");

        Assert.IsType<NotFoundResult>(result);
        Assert.Equal(2, _collections.Count);
    }

    [Fact]
    public async Task Delete_ReturnsNotFoundForOtherUsersCollection()
    {
        var otherController = CreateController("different-user");

        var result = await otherController.Delete("col-1");

        Assert.IsType<NotFoundResult>(result);
        Assert.Equal(2, _collections.Count);
    }
}
