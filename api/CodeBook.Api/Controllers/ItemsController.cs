using CodeBook.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Route("api/items")]
public class ItemsController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public ItemsController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ItemDetailDto>> GetItem(string id)
    {
        var item = await _dbContext.Items
            .AsNoTracking()
            .Include(i => i.Type)
            .Include(i => i.Tags)
                .ThenInclude(it => it.Tag)
            .Include(i => i.Collection)
            .FirstOrDefaultAsync(i => i.Id == id);

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
