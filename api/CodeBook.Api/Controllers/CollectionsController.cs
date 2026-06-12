using System.Security.Claims;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/collections")]
public class CollectionsController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public CollectionsController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
    }

    [HttpPost]
    public async Task<ActionResult<CollectionDto>> Create([FromBody] CreateCollectionRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        if (request.Name.Trim().Length > 200)
            return BadRequest(new { error = "Name must be 200 characters or fewer" });

        var collection = new Collection
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsFavorite = request.IsFavorite,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _dbContext.Collections.Add(collection);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = collection.Id }, new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            IsFavorite = collection.IsFavorite,
            CreatedAt = collection.CreatedAt,
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CollectionDto>> Get(string id)
    {
        var userId = GetUserId();
        var collection = await _dbContext.Collections
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (collection == null)
            return NotFound();

        return Ok(new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            IsFavorite = collection.IsFavorite,
            CreatedAt = collection.CreatedAt,
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CollectionDto>> Update(string id, [FromBody] UpdateCollectionRequest request)
    {
        var userId = GetUserId();
        var collection = await _dbContext.Collections
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (collection == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        if (request.Name.Trim().Length > 200)
            return BadRequest(new { error = "Name must be 200 characters or fewer" });

        collection.Name = request.Name.Trim();
        collection.Description = request.Description?.Trim();
        collection.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            IsFavorite = collection.IsFavorite,
            CreatedAt = collection.CreatedAt,
        });
    }

    [HttpPut("{id}/favorite")]
    public async Task<IActionResult> ToggleFavorite(string id)
    {
        var userId = GetUserId();
        var collection = await _dbContext.Collections
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (collection == null)
            return NotFound();

        collection.IsFavorite = !collection.IsFavorite;
        await _dbContext.SaveChangesAsync();

        return Ok(new { id = collection.Id, isFavorite = collection.IsFavorite });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var userId = GetUserId();
        var collection = await _dbContext.Collections
            .Include(c => c.ItemCollections)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (collection == null)
            return NotFound();

        _dbContext.ItemCollections.RemoveRange(collection.ItemCollections);
        _dbContext.Collections.Remove(collection);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateCollectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
}

public class UpdateCollectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class CollectionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
    public DateTime CreatedAt { get; set; }
}
