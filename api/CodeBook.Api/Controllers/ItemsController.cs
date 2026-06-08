using System.Security.Claims;
using CodeBook.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public ItemsController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
    }

    [HttpGet("api/items/{id}")]
    public async Task<ActionResult<ItemDetailDto>> GetItem(string id)
    {
        var userId = GetUserId();
        var item = await _dbContext.Items
            .AsNoTracking()
            .Include(i => i.Type)
            .Include(i => i.Tags)
                .ThenInclude(it => it.Tag)
            .Include(i => i.Collection)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            return NotFound();
        }

        return Ok(new ItemDetailDto
        {
            Id = item.Id,
            Title = item.Title,
            Description = item.Description,
            Content = item.Content,
            ContentType = item.ContentType,
            Language = item.Language,
            FileUrl = item.FileUrl,
            FileName = item.FileName,
            FileSize = item.FileSize,
            Url = item.Url,
            IsFavorite = item.IsFavorite,
            IsPinned = item.IsPinned,
            TypeId = item.TypeId,
            TypeName = item.Type.Name,
            TypeIcon = item.Type.Icon,
            TypeColor = item.Type.Color,
            CollectionId = item.CollectionId,
            CollectionName = item.Collection?.Name,
            Tags = item.Tags
                .Select(it => it.Tag.Name)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList(),
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        });
    }

    [HttpGet("api/dashboard/items/recent")]
    public async Task<ActionResult<IEnumerable<RecentDashboardItemDto>>> GetRecentItems(
        [FromQuery] int limit = 100)
    {
        var userId = GetUserId();
        var safeLimit = Math.Clamp(limit, 1, 200);

        var items = await _dbContext.Items
            .AsNoTracking()
            .Include(item => item.Tags)
                .ThenInclude(itemTag => itemTag.Tag)
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.UpdatedAt)
            .Take(safeLimit)
            .ToListAsync();

        var response = items.Select(item => new RecentDashboardItemDto
        {
            Id = item.Id,
            Title = item.Title,
            Description = item.Description,
            TypeId = item.TypeId,
            CollectionId = item.CollectionId,
            Tags = item.Tags
                .Select(itemTag => itemTag.Tag.Name)
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList(),
            IsFavorite = item.IsFavorite,
            IsPinned = item.IsPinned,
            UpdatedAt = item.UpdatedAt
        });

        return Ok(response);
    }

    [HttpGet("api/dashboard/items/by-type/{typeName}")]
    public async Task<ActionResult<IEnumerable<RecentDashboardItemDto>>> GetItemsByType(
        [FromRoute] string typeName,
        [FromQuery] int limit = 200)
    {
        var userId = GetUserId();
        var safeLimit = Math.Clamp(limit, 1, 200);

        var items = await _dbContext.Items
            .AsNoTracking()
            .Include(item => item.Tags)
                .ThenInclude(itemTag => itemTag.Tag)
            .Include(item => item.Type)
            .Where(item => item.UserId == userId && item.Type.IsSystem && item.Type.Name == typeName)
            .OrderByDescending(item => item.UpdatedAt)
            .Take(safeLimit)
            .ToListAsync();

        var response = items.Select(item => new RecentDashboardItemDto
        {
            Id = item.Id,
            Title = item.Title,
            Description = item.Description,
            TypeId = item.TypeId,
            CollectionId = item.CollectionId,
            Tags = item.Tags
                .Select(itemTag => itemTag.Tag.Name)
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList(),
            IsFavorite = item.IsFavorite,
            IsPinned = item.IsPinned,
            UpdatedAt = item.UpdatedAt
        });

        return Ok(response);
    }

    [HttpGet("api/dashboard/item-types/system")]
    public async Task<ActionResult<IEnumerable<DashboardItemTypeDto>>> GetSystemItemTypes()
    {
        var itemTypes = await _dbContext.ItemTypes
            .AsNoTracking()
            .Where(itemType => itemType.IsSystem)
            .OrderBy(itemType => itemType.Name)
            .Select(itemType => new DashboardItemTypeDto
            {
                Id = itemType.Id,
                Name = itemType.Name,
                Icon = itemType.Icon,
                Color = itemType.Color,
                IsSystem = itemType.IsSystem
            })
            .ToListAsync();

        return Ok(itemTypes);
    }
}

public class RecentDashboardItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TypeId { get; set; } = string.Empty;
    public string? CollectionId { get; set; }
    public List<string> Tags { get; set; } = [];
    public bool IsFavorite { get; set; }
    public bool IsPinned { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DashboardItemTypeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool IsSystem { get; set; }
}

public class ItemDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string? Language { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public int? FileSize { get; set; }
    public string? Url { get; set; }
    public bool IsFavorite { get; set; }
    public bool IsPinned { get; set; }
    public string TypeId { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public string? TypeIcon { get; set; }
    public string? TypeColor { get; set; }
    public string? CollectionId { get; set; }
    public string? CollectionName { get; set; }
    public List<string> Tags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
