using CodeBook.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Route("api/dashboard/items")]
public class DashboardItemsController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public DashboardItemsController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<RecentDashboardItemDto>>> GetRecentItems(
        [FromQuery] int limit = 100)
    {
        var safeLimit = Math.Clamp(limit, 1, 200);

        var items = await _dbContext.Items
            .AsNoTracking()
            .Include(item => item.Tags)
                .ThenInclude(itemTag => itemTag.Tag)
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

    [HttpGet("by-type/{typeName}")]
    public async Task<ActionResult<IEnumerable<RecentDashboardItemDto>>> GetItemsByType(
        [FromRoute] string typeName,
        [FromQuery] int limit = 200)
    {
        var safeLimit = Math.Clamp(limit, 1, 200);

        var items = await _dbContext.Items
            .AsNoTracking()
            .Include(item => item.Tags)
                .ThenInclude(itemTag => itemTag.Tag)
            .Include(item => item.Type)
            .Where(item => item.Type.IsSystem && item.Type.Name == typeName)
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
