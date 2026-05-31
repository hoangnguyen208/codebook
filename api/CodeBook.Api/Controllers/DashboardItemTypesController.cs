using CodeBook.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Route("api/dashboard/item-types")]
public class DashboardItemTypesController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public DashboardItemTypesController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("system")]
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

public class DashboardItemTypeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool IsSystem { get; set; }
}
