using CodeBook.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Route("api/dashboard/collections")]
public class DashboardCollectionsController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public DashboardCollectionsController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<RecentDashboardCollectionDto>>> GetRecentCollections(
        [FromQuery] int limit = 6)
    {
        var safeLimit = Math.Clamp(limit, 1, 100);

        var baseCollections = await _dbContext.Collections
            .Select(collection => new
            {
                collection.Id,
                collection.Name,
                collection.Description,
                ItemCount = collection.Items.Count,
                LastUpdatedAt = collection.Items
                    .Select(item => (DateTime?)item.UpdatedAt)
                    .Max() ?? collection.UpdatedAt,
                collection.IsFavorite
            })
            .OrderByDescending(collection => collection.LastUpdatedAt)
            .Take(safeLimit)
            .ToListAsync();

        var collectionIds = baseCollections.Select(collection => collection.Id).ToList();

        var typeStats = await _dbContext.Items
            .Where(item => item.CollectionId != null && collectionIds.Contains(item.CollectionId))
            .GroupBy(item => new
            {
                CollectionId = item.CollectionId!,
                TypeName = item.Type.Name,
                item.Type.Icon,
                item.Type.Color
            })
            .Select(group => new
            {
                group.Key.CollectionId,
                group.Key.TypeName,
                group.Key.Icon,
                group.Key.Color,
                Count = group.Count()
            })
            .ToListAsync();

        var typeStatsByCollectionId = typeStats
            .GroupBy(stat => stat.CollectionId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var response = baseCollections.Select(collection =>
        {
            var collectionTypeStats = typeStatsByCollectionId.GetValueOrDefault(collection.Id, []);
            var orderedTypeStats = collectionTypeStats
                .OrderByDescending(stat => stat.Count)
                .ThenBy(stat => stat.TypeName)
                .ToList();

            var dominantType = orderedTypeStats.FirstOrDefault();
            var dominantColor = MapTypeColorToken(
                dominantType?.TypeName,
                dominantType?.Color);

            return new RecentDashboardCollectionDto
            {
                Id = collection.Id,
                Name = collection.Name,
                Description = collection.Description,
                ItemCount = collection.ItemCount,
                LastUpdatedAt = collection.LastUpdatedAt,
                DominantColor = dominantColor,
                IsFavorite = collection.IsFavorite,
                TypeIcons = orderedTypeStats
                    .Select(stat => stat.Icon)
                    .Where(icon => !string.IsNullOrWhiteSpace(icon))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()!
            };
        });

        return Ok(response);
    }

    private static string MapTypeColorToken(string? typeName, string? typeColor)
    {
        var byName = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["snippet"] = "blue",
            ["prompt"] = "purple",
            ["command"] = "orange",
            ["note"] = "yellow",
            ["file"] = "slate",
            ["image"] = "pink",
            ["link"] = "emerald"
        };

        if (typeName != null && byName.TryGetValue(typeName, out var namedColor))
        {
            return namedColor;
        }

        var byHex = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["#3b82f6"] = "blue",
            ["#8b5cf6"] = "purple",
            ["#f97316"] = "orange",
            ["#fde047"] = "yellow",
            ["#6b7280"] = "slate",
            ["#ec4899"] = "pink",
            ["#10b981"] = "emerald"
        };

        if (typeColor != null && byHex.TryGetValue(typeColor, out var hexColor))
        {
            return hexColor;
        }

        return "slate";
    }
}

public class RecentDashboardCollectionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ItemCount { get; set; }
    public DateTime LastUpdatedAt { get; set; }
    public string DominantColor { get; set; } = "slate";
    public bool IsFavorite { get; set; }
    public List<string> TypeIcons { get; set; } = [];
}
