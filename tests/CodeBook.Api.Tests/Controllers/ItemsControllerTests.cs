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

public class ItemsControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<Item> _items;
    private readonly List<ItemTag> _itemTags;
    private readonly List<Tag> _tags;
    private readonly List<ItemType> _itemTypes;
    private readonly List<Collection> _collections;
    private readonly List<ItemCollection> _itemCollections;
    private const string TestUserId = "test-user";

    public ItemsControllerTests()
    {
        _itemTypes =
        [
            new() { Id = "type-snippet", Name = "snippet", Icon = "Code", Color = "#3b82f6", IsSystem = true },
            new() { Id = "type-prompt", Name = "prompt", Icon = "Sparkles", Color = "#8b5cf6", IsSystem = true },
            new() { Id = "type-link", Name = "link", Icon = "Link", Color = "#10b981", IsSystem = true }
        ];

        _collections =
        [
            new() { Id = "col-1", Name = "React Snippets", UserId = TestUserId, IsFavorite = true }
        ];

        _tags =
        [
            new() { Id = "tag-1", Name = "typescript" },
            new() { Id = "tag-2", Name = "react" },
            new() { Id = "tag-3", Name = "" },
            new() { Id = "tag-4", Name = "hooks" }
        ];

        _items =
        [
            new()
            {
                Id = "item-1", Title = "Map function", Description = "Array map pattern",
                Content = "export function useDebounce...", ContentType = "text",
                Language = "typescript",
                UserId = TestUserId,
                TypeId = "type-snippet", Type = _itemTypes[0],
                IsFavorite = true, IsPinned = true,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 6, 1)
            },
            new()
            {
                Id = "item-2", Title = "Git log", Description = null,
                Content = null, ContentType = "text",
                UserId = TestUserId,
                TypeId = "type-snippet", Type = _itemTypes[0],
                IsFavorite = false, IsPinned = false,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 6, 3)
            },
            new()
            {
                Id = "item-3", Title = "API docs", Description = "Link to docs",
                Content = null, ContentType = "text",
                Url = "https://example.com",
                UserId = TestUserId,
                TypeId = "type-link", Type = _itemTypes[2],
                IsFavorite = false, IsPinned = false,
                CreatedAt = new DateTime(2026, 1, 1),
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

        var mockItemTagsDbSet = MockDbSetHelper.CreateDbSetMock(_itemTags);
        mockItemTagsDbSet.Setup(m => m.Remove(It.IsAny<ItemTag>()))
            .Callback<ItemTag>(e =>
            {
                _itemTags.Remove(e);
                _items[0].Tags = _itemTags.Where(it => it.ItemId == "item-1").ToList();
            });
        mockItemTagsDbSet.Setup(m => m.RemoveRange(It.IsAny<IEnumerable<ItemTag>>()))
            .Callback<IEnumerable<ItemTag>>(entities =>
            {
                foreach (var e in entities)
                {
                    _itemTags.Remove(e);
                }
                _items[0].Tags = _itemTags.Where(it => it.ItemId == "item-1").ToList();
            });
        mockItemTagsDbSet.Setup(m => m.Add(It.IsAny<ItemTag>()))
            .Callback<ItemTag>(e =>
            {
                e.Tag = _tags.FirstOrDefault(t => t.Id == e.TagId)!;
                e.Item = _items.FirstOrDefault(i => i.Id == e.ItemId)!;
                _itemTags.Add(e);
                for (var i = 0; i < _items.Count; i++)
                {
                    var idx = i;
                    _items[i].Tags = _itemTags.Where(it => it.ItemId == _items[idx].Id).ToList();
                }
            });

        var mockItemsDbSet = MockDbSetHelper.CreateDbSetMock(_items);
        mockItemsDbSet.Setup(m => m.Remove(It.IsAny<Item>()))
            .Callback<Item>(e => _items.Remove(e));

        _itemCollections = [];

        var mockItemCollectionsDbSet = MockDbSetHelper.CreateDbSetMock(_itemCollections);
        mockItemCollectionsDbSet.Setup(m => m.RemoveRange(It.IsAny<IEnumerable<ItemCollection>>()))
            .Callback<IEnumerable<ItemCollection>>(entities =>
            {
                foreach (var e in entities)
                {
                    _itemCollections.Remove(e);
                }
            });

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Items).Returns(mockItemsDbSet.Object);
        mockDbContext.Setup(db => db.ItemTypes).Returns(MockDbSetHelper.CreateDbSetMock(_itemTypes).Object);
        mockDbContext.Setup(db => db.Tags).Returns(MockDbSetHelper.CreateDbSetMock(_tags).Object);
        mockDbContext.Setup(db => db.ItemTags).Returns(mockItemTagsDbSet.Object);
        mockDbContext.Setup(db => db.Collections).Returns(MockDbSetHelper.CreateDbSetMock(_collections).Object);
        mockDbContext.Setup(db => db.ItemCollections).Returns(mockItemCollectionsDbSet.Object);
        mockDbContext.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _dbContext = mockDbContext.Object;
    }

    private ItemsController CreateController(string? userId = null)
    {
        return new ItemsController(_dbContext)
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

    // ── Dashboard / GET tests ──

    [Fact]
    public async Task GetRecentItems_ReturnsPinnedFirstThenByUpdatedAtDesc()
    {
        var controller = CreateController();

        var result = await controller.GetRecentItems(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(3, items.Count());
        Assert.Equal("Map function", items.First().Title);
    }

    [Fact]
    public async Task GetRecentItems_RespectsLimit()
    {
        var controller = CreateController();

        var result = await controller.GetRecentItems(1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task GetRecentItems_MapsFavoriteAndPinned()
    {
        var controller = CreateController();

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
        var controller = CreateController();

        var result = await controller.GetRecentItems(100);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        var item2 = items.First(i => i.Id == "item-2");
        Assert.Empty(item2.Tags);
    }

    [Fact]
    public async Task GetItemsByType_ReturnsOnlyMatchingType()
    {
        var controller = CreateController();

        var result = await controller.GetItemsByType("snippet");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Equal(2, items.Count);
        Assert.All(items, i => Assert.Equal("type-snippet", i.TypeId));
    }

    [Fact]
    public async Task GetItemsByType_UnknownTypeReturnsEmpty()
    {
        var controller = CreateController();

        var result = await controller.GetItemsByType("nonexistent");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Empty(items);
    }

    [Fact]
    public async Task GetItemsByType_RespectsLimit()
    {
        var controller = CreateController();

        var result = await controller.GetItemsByType("snippet", pageSize: 1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Single(items);
    }

    // ── Item detail GET tests ──

    [Fact]
    public async Task GetItem_ReturnsFullDetail()
    {
        var controller = CreateController();

        var result = await controller.GetItem("item-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("item-1", item.Id);
        Assert.Equal("Map function", item.Title);
        Assert.Equal("Array map pattern", item.Description);
        Assert.Equal("typescript", item.Language);
        Assert.Equal("text", item.ContentType);
        Assert.Equal("snippet", item.TypeName);
        Assert.Equal("Code", item.TypeIcon);
        Assert.Empty(item.CollectionIds);
        Assert.Empty(item.CollectionNames);
        Assert.Equal(2, item.Tags.Count);
        Assert.Contains("typescript", item.Tags);
        Assert.Contains("react", item.Tags);
    }

    [Fact]
    public async Task GetItem_ReturnsNotFoundForMissingItem()
    {
        var controller = CreateController();

        var result = await controller.GetItem("non-existent");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetItem_ReturnsNotFoundForOtherUsersItem()
    {
        var otherController = CreateController("different-user");

        var result = await otherController.GetItem("item-1");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── Edit / PUT tests ──

    [Fact]
    public async Task UpdateItem_UpdatesTitleAndDescription()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList()
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("Updated Title", updated.Title);
        Assert.Equal("Updated Description", updated.Description);
        Assert.Equal("text", updated.ContentType);
    }

    [Fact]
    public async Task UpdateItem_UpdatesContent()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Content = "new content for snippet",
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList()
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("new content for snippet", updated.Content);
    }

    [Fact]
    public async Task UpdateItem_UpdatesUrl()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-3", new UpdateItemRequest
        {
            Title = _items[2].Title,
            Url = "https://updated-link.com",
            Tags = []
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("https://updated-link.com", updated.Url);
    }

    [Fact]
    public async Task UpdateItem_UpdatesLanguage()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Language = "python",
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList()
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("python", updated.Language);
    }

    [Fact]
    public async Task UpdateItem_ReplacesTags()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = ["hooks"]
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Single(_items[0].Tags);
        Assert.Equal("tag-4", _items[0].Tags.First().TagId);
    }

    [Fact]
    public async Task UpdateItem_CreatesNewTagsWhenMissing()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = ["brand-new-tag"]
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Single(_items[0].Tags);
        Assert.Contains(_tags, t => t.Name == "brand-new-tag");
        var newTag = _tags.First(t => t.Name == "brand-new-tag");
        Assert.Equal(newTag.Id, _items[0].Tags.First().TagId);
    }

    [Fact]
    public async Task UpdateItem_RemovesAllTags()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = []
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Empty(_items[0].Tags);
    }

    [Fact]
    public async Task UpdateItem_FiltersEmptyTagNames()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = ["valid", "", "  ", "also-valid"]
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(2, _items[0].Tags.Count);
        Assert.Contains("valid", _tags.Select(t => t.Name));
        Assert.Contains("also-valid", _tags.Select(t => t.Name));
    }

    [Fact]
    public async Task UpdateItem_ReturnsNotFoundForMissingItem()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("non-existent-id", new UpdateItemRequest
        {
            Title = "Does not matter",
            Tags = []
        });

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task UpdateItem_ReturnsNotFoundForOtherUsersItem()
    {
        var otherController = CreateController("different-user");

        var result = await otherController.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = "Should not work",
            Tags = []
        });

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task UpdateItem_IncludesTypeAndCollectionInfo()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList()
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("type-snippet", updated.TypeId);
        Assert.Equal("snippet", updated.TypeName);
        Assert.Equal("Code", updated.TypeIcon);
        Assert.Equal("#3b82f6", updated.TypeColor);
        Assert.Empty(updated.CollectionIds);
        Assert.Empty(updated.CollectionNames);
    }

    [Fact]
    public async Task UpdateItem_PreservesTimestamps()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList()
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal(new DateTime(2026, 1, 1), updated.CreatedAt);
    }

    // ── System item types tests ──

    [Fact]
    public async Task GetSystemItemTypes_ReturnsOnlySystemTypes()
    {
        var controller = CreateController();

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var types = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value);
        Assert.Equal(3, types.Count());
        Assert.All(types, t => Assert.True(t.IsSystem));
    }

    [Fact]
    public async Task GetSystemItemTypes_ReturnsOrderedByName()
    {
        var controller = CreateController();

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var types = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value).ToList();
        Assert.Equal("link", types[0].Name);
        Assert.Equal("prompt", types[1].Name);
        Assert.Equal("snippet", types[2].Name);
    }

    [Fact]
    public async Task GetSystemItemTypes_MapsAllFields()
    {
        var controller = CreateController();

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

        var controller = new ItemsController(mockDbContext.Object);

        var result = await controller.GetSystemItemTypes();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var types = Assert.IsAssignableFrom<IEnumerable<DashboardItemTypeDto>>(okResult.Value);
        Assert.Empty(types);
    }

    // ── Delete tests ──

    [Fact]
    public async Task DeleteItem_RemovesItemAndTags()
    {
        var controller = CreateController();

        var result = await controller.DeleteItem("item-1");

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(2, _items.Count);
        Assert.DoesNotContain(_items, i => i.Id == "item-1");
        Assert.DoesNotContain(_itemTags, it => it.ItemId == "item-1");
    }

    [Fact]
    public async Task DeleteItem_ReturnsNotFoundForMissingItem()
    {
        var controller = CreateController();

        var result = await controller.DeleteItem("non-existent");

        Assert.IsType<NotFoundResult>(result);
        Assert.Equal(3, _items.Count);
    }

    [Fact]
    public async Task DeleteItem_ReturnsNotFoundForOtherUsersItem()
    {
        var otherController = CreateController("different-user");

        var result = await otherController.DeleteItem("item-1");

        Assert.IsType<NotFoundResult>(result);
        Assert.Equal(3, _items.Count);
    }

    // ── Create tests ──

    [Fact]
    public async Task CreateItem_ReturnsCreatedWithDetails()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "New Hook",
            TypeName = "snippet",
            Description = "A new hook",
            Content = "export function useStuff() {}",
            Language = "typescript",
            Tags = ["react", "hooks"]
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Equal("New Hook", item.Title);
        Assert.Equal("A new hook", item.Description);
        Assert.Equal("snippet", item.TypeName);
        Assert.Equal("typescript", item.Language);
        Assert.Equal(TestUserId, _items.Last().UserId);
        Assert.Equal(4, _items.Count);
    }

    [Fact]
    public async Task CreateItem_WithTags()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "Tagged Item",
            TypeName = "snippet",
            Tags = ["react", "typescript"]
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Equal(2, item.Tags.Count);
        Assert.Contains("react", item.Tags);
        Assert.Contains("typescript", item.Tags);
    }

    [Fact]
    public async Task CreateItem_WithNewTag()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "New Tag Item",
            TypeName = "snippet",
            Tags = ["brand-new"]
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Single(item.Tags);
        Assert.Contains("brand-new", item.Tags);
    }

    [Fact]
    public async Task CreateItem_FiltersEmptyTags()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "Filtered",
            TypeName = "snippet",
            Tags = ["valid", "", "  "]
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Single(item.Tags);
        Assert.Contains("valid", item.Tags);
    }

    [Fact]
    public async Task CreateItem_ReturnsBadRequestForUnknownType()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "Bad Type",
            TypeName = "unknown"
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateItem_WithFileUrl()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "File Item",
            TypeName = "snippet",
            FileUrl = "https://r2.example.com/uploads/file.json",
            FileName = "config.json",
            FileSize = 2048,
            ContentType = "file"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Equal("https://r2.example.com/uploads/file.json", item.FileUrl);
        Assert.Equal("config.json", item.FileName);
        Assert.Equal(2048, item.FileSize);
        Assert.Equal("file", item.ContentType);
    }

    [Fact]
    public async Task UpdateItem_UpdatesFileFields()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            FileUrl = "https://r2.example.com/uploads/image.png",
            FileName = "screenshot.png",
            FileSize = 512000,
            ContentType = "image",
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList()
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Equal("https://r2.example.com/uploads/image.png", updated.FileUrl);
        Assert.Equal("screenshot.png", updated.FileName);
        Assert.Equal(512000, updated.FileSize);
        Assert.Equal("image", updated.ContentType);
    }

    [Fact]
    public async Task DeleteItem_WithFileUrl_Succeeds()
    {
        var itemWithFile = new Item
        {
            Id = "item-file",
            Title = "File Item",
            ContentType = "file",
            FileUrl = "https://not-matching-url.com/file.txt",
            UserId = TestUserId,
            TypeId = "type-snippet",
            Type = _itemTypes[0],
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _items.Add(itemWithFile);

        var controller = CreateController();

        var result = await controller.DeleteItem("item-file");

        Assert.IsType<NoContentResult>(result);
        Assert.DoesNotContain(_items, i => i.Id == "item-file");
    }

    // ── Collection assignment tests ──

    [Fact]
    public async Task CreateItem_WithCollectionIds()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "Collection Item",
            TypeName = "snippet",
            CollectionIds = ["col-1"]
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Single(item.CollectionIds);
        Assert.Equal("col-1", item.CollectionIds[0]);
        Assert.Contains("React Snippets", item.CollectionNames);
        Assert.Single(_items.Last().ItemCollections);
    }

    [Fact]
    public async Task CreateItem_IgnoresNonExistentCollectionIds()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "Bad Collections",
            TypeName = "snippet",
            CollectionIds = ["non-existent"]
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Empty(item.CollectionIds);
        Assert.Empty(_items.Last().ItemCollections);
    }

    [Fact]
    public async Task CreateItem_WithEmptyCollectionIds()
    {
        var controller = CreateController();

        var result = await controller.CreateItem(new CreateItemRequest
        {
            Title = "No Collections",
            TypeName = "snippet",
            CollectionIds = []
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(createdResult.Value);
        Assert.Empty(item.CollectionIds);
    }

    [Fact]
    public async Task UpdateItem_AddsCollectionIds()
    {
        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList(),
            CollectionIds = ["col-1"]
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Single(updated.CollectionIds);
        Assert.Equal("col-1", updated.CollectionIds[0]);
        Assert.Contains("React Snippets", updated.CollectionNames);
    }

    [Fact]
    public async Task UpdateItem_ReplacesCollectionIds()
    {
        // Seed an item-collection link first
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();

        var controller = CreateController();

        // Update with empty list should remove
        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = _items[0].Tags.Select(t => t.Tag.Name).ToList(),
            CollectionIds = []
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Empty(updated.CollectionIds);
        Assert.Empty(_items[0].ItemCollections);
    }

    [Fact]
    public async Task UpdateItem_RemovesAllCollectionsWithEmptyList()
    {
        // Seed item with a collection
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();

        var controller = CreateController();

        var result = await controller.UpdateItem("item-1", new UpdateItemRequest
        {
            Title = _items[0].Title,
            Tags = [],
            CollectionIds = []
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Empty(updated.CollectionIds);
        Assert.Empty(_items[0].ItemCollections);
    }

    [Fact]
    public async Task GetItem_ReturnsCollectionIdsAndNames()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();

        var controller = CreateController();

        var result = await controller.GetItem("item-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Single(item.CollectionIds);
        Assert.Equal("col-1", item.CollectionIds[0]);
        Assert.Contains("React Snippets", item.CollectionNames);
    }

    [Fact]
    public async Task GetItem_ReturnsEmptyCollectionsWhenNone()
    {
        var controller = CreateController();

        var result = await controller.GetItem("item-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var item = Assert.IsType<ItemDetailDto>(okResult.Value);
        Assert.Empty(item.CollectionIds);
        Assert.Empty(item.CollectionNames);
    }

    [Fact]
    public async Task DeleteItem_RemovesItemCollections()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-3", CollectionId = "col-1", Item = _items[2], Collection = _collections[0] });
        _items[2].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-3").ToList();

        var controller = CreateController();

        var result = await controller.DeleteItem("item-3");

        Assert.IsType<NoContentResult>(result);
        Assert.DoesNotContain(_itemCollections, ic => ic.ItemId == "item-3");
    }

    // ── Get by collection tests ──

    [Fact]
    public async Task GetItemsByCollection_ReturnsItemsInCollection()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _itemCollections.Add(new ItemCollection { ItemId = "item-2", CollectionId = "col-1", Item = _items[1], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();
        _items[1].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-2").ToList();

        var controller = CreateController();

        var result = await controller.GetItemsByCollection("col-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Equal(2, items.Count);
        Assert.Contains(items, i => i.Id == "item-1");
        Assert.Contains(items, i => i.Id == "item-2");
    }

    [Fact]
    public async Task GetItemsByCollection_ReturnsEmptyForCollectionWithNoItems()
    {
        var controller = CreateController();

        var result = await controller.GetItemsByCollection("col-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Empty(items);
    }

    [Fact]
    public async Task GetItemsByCollection_RespectsLimit()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _itemCollections.Add(new ItemCollection { ItemId = "item-2", CollectionId = "col-1", Item = _items[1], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();
        _items[1].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-2").ToList();

        var controller = CreateController();

        var result = await controller.GetItemsByCollection("col-1", pageSize: 1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Single(items);
    }

    [Fact]
    public async Task GetItemsByCollection_OrdersPinnedFirst()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _itemCollections.Add(new ItemCollection { ItemId = "item-2", CollectionId = "col-1", Item = _items[1], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();
        _items[1].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-2").ToList();

        var controller = CreateController();

        var result = await controller.GetItemsByCollection("col-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        var items = paged.Items;
        Assert.Equal(2, items.Count);
        Assert.Equal("Map function", items[0].Title);
    }

    // ── Pagination metadata tests ──

    [Fact]
    public async Task GetItemsByType_PagedReturnsTotalCount()
    {
        var controller = CreateController();

        var result = await controller.GetItemsByType("snippet");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(2, paged.TotalCount);
        Assert.Equal(1, paged.Page);
        Assert.Equal(5, paged.PageSize);
    }

    [Fact]
    public async Task GetItemsByType_Page2ReturnsSecondPage()
    {
        var controller = CreateController();

        var result = await controller.GetItemsByType("snippet", page: 2, pageSize: 1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(2, paged.Page);
        Assert.Single(paged.Items);
    }

    [Fact]
    public async Task GetItemsByCollection_PagedReturnsTotalCount()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _itemCollections.Add(new ItemCollection { ItemId = "item-2", CollectionId = "col-1", Item = _items[1], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();
        _items[1].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-2").ToList();

        var controller = CreateController();

        var result = await controller.GetItemsByCollection("col-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(2, paged.TotalCount);
        Assert.Equal(1, paged.Page);
        Assert.Equal(5, paged.PageSize);
    }

    [Fact]
    public async Task GetItemsByCollection_Page2ReturnsSecondPage()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _itemCollections.Add(new ItemCollection { ItemId = "item-2", CollectionId = "col-1", Item = _items[1], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();
        _items[1].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-2").ToList();

        var controller = CreateController();

        var result = await controller.GetItemsByCollection("col-1", page: 2, pageSize: 1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(2, paged.Page);
        Assert.Single(paged.Items);
    }

    [Fact]
    public async Task GetRecentItems_DefaultLimitIs10()
    {
        var controller = CreateController();

        var result = await controller.GetRecentItems();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<RecentDashboardItemDto>>(okResult.Value);
        Assert.Equal(3, items.Count());
    }

    // ── ToggleFavorite tests ──

    [Fact]
    public async Task ToggleFavorite_TogglesIsFavoriteOnItem()
    {
        var controller = CreateController();

        var result = await controller.ToggleFavorite("item-1");

        Assert.IsType<OkObjectResult>(result);

        var updated = _items.First(i => i.Id == "item-1");
        Assert.False(updated.IsFavorite);
    }

    [Fact]
    public async Task ToggleFavorite_ReturnsNotFoundForMissingItem()
    {
        var controller = CreateController();

        var result = await controller.ToggleFavorite("nonexistent");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task ToggleFavorite_ReturnsNotFoundForOtherUsersItem()
    {
        var controller = new ItemsController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", "other-user")
                    ]))
                }
            }
        };

        var result = await controller.ToggleFavorite("item-1");

        Assert.IsType<NotFoundResult>(result);
        Assert.True(_items.First(i => i.Id == "item-1").IsFavorite);
    }

    [Fact]
    public async Task ToggleFavorite_TogglesBackToTrue()
    {
        var controller = CreateController();

        await controller.ToggleFavorite("item-1");
        var result = await controller.ToggleFavorite("item-1");

        Assert.IsType<OkObjectResult>(result);
        Assert.True(_items.First(i => i.Id == "item-1").IsFavorite);
    }

    // ── TogglePin tests ──

    [Fact]
    public async Task TogglePin_TogglesIsPinnedOnItem()
    {
        var controller = CreateController();

        var result = await controller.TogglePin("item-1");

        Assert.IsType<OkObjectResult>(result);

        var updated = _items.First(i => i.Id == "item-1");
        Assert.False(updated.IsPinned);
    }

    [Fact]
    public async Task TogglePin_ReturnsNotFoundForMissingItem()
    {
        var controller = CreateController();

        var result = await controller.TogglePin("nonexistent");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task TogglePin_ReturnsNotFoundForOtherUsersItem()
    {
        var controller = new ItemsController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", "other-user")
                    ]))
                }
            }
        };

        var result = await controller.TogglePin("item-1");

        Assert.IsType<NotFoundResult>(result);
        Assert.True(_items.First(i => i.Id == "item-1").IsPinned);
    }

    [Fact]
    public async Task TogglePin_TogglesBackToTrue()
    {
        var controller = CreateController();

        await controller.TogglePin("item-1");
        var result = await controller.TogglePin("item-1");

        Assert.IsType<OkObjectResult>(result);
        Assert.True(_items.First(i => i.Id == "item-1").IsPinned);
    }

    // ── GetFavorites tests ──

    [Fact]
    public async Task GetFavorites_ReturnsFavoritedItemsAndCollections()
    {
        _itemCollections.Add(new ItemCollection { ItemId = "item-1", CollectionId = "col-1", Item = _items[0], Collection = _collections[0] });
        _items[0].ItemCollections = _itemCollections.Where(ic => ic.ItemId == "item-1").ToList();

        var controller = CreateController();

        var result = await controller.GetFavorites();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<FavoritesResponseDto>(okResult.Value);
        Assert.Single(dto.Items);
        Assert.Single(dto.Collections);
        Assert.Equal("item-1", dto.Items[0].Id);
        Assert.Contains(dto.Items[0].Tags, t => t == "typescript");
        Assert.Equal("col-1", dto.Collections[0].Id);
    }

    [Fact]
    public async Task GetFavorites_ReturnsOnlyUserFavorites()
    {
        _items.Add(new Item
        {
            Id = "item-other", Title = "Other user item",
            ContentType = "text", UserId = "other-user",
            TypeId = "type-snippet", Type = _itemTypes[0],
            IsFavorite = true, IsPinned = false,
            UpdatedAt = new DateTime(2026, 6, 10)
        });

        var controller = CreateController();

        var result = await controller.GetFavorites();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<FavoritesResponseDto>(okResult.Value);
        Assert.Single(dto.Items);
        Assert.Equal("item-1", dto.Items[0].Id);
    }

    [Fact]
    public async Task GetFavorites_ReturnsEmptyWhenNothingFavorited()
    {
        var item1 = _items.First(i => i.Id == "item-1");
        item1.IsFavorite = false;
        var col1 = _collections.First(c => c.Id == "col-1");
        col1.IsFavorite = false;

        var controller = CreateController();

        var result = await controller.GetFavorites();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<FavoritesResponseDto>(okResult.Value);
        Assert.Empty(dto.Items);
        Assert.Empty(dto.Collections);
    }
}
