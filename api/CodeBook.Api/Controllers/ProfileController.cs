using CodeBook.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public ProfileController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ProfileStatsDto>> GetStats()
    {
        var totalItems = await _dbContext.Items.CountAsync();
        var totalCollections = await _dbContext.Collections.CountAsync();

        var typeBreakdown = await _dbContext.Items
            .AsNoTracking()
            .GroupBy(item => new
            {
                item.TypeId,
                item.Type.Name,
                item.Type.Icon,
                item.Type.Color
            })
            .Select(group => new ItemTypeStatDto
            {
                TypeId = group.Key.TypeId,
                TypeName = group.Key.Name,
                Icon = group.Key.Icon,
                Color = group.Key.Color,
                Count = group.Count()
            })
            .OrderByDescending(stat => stat.Count)
            .ThenBy(stat => stat.TypeName)
            .ToListAsync();

        return Ok(new ProfileStatsDto
        {
            TotalItems = totalItems,
            TotalCollections = totalCollections,
            TypeBreakdown = typeBreakdown
        });
    }
}

public class ProfileStatsDto
{
    public int TotalItems { get; set; }
    public int TotalCollections { get; set; }
    public List<ItemTypeStatDto> TypeBreakdown { get; set; } = [];
}

public class ItemTypeStatDto
{
    public string TypeId { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int Count { get; set; }
}
