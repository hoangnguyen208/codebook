using System.Security.Claims;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        return CreatedAtAction(nameof(Create), new { id = collection.Id }, new CollectionDto
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            IsFavorite = collection.IsFavorite,
            CreatedAt = collection.CreatedAt,
        });
    }
}

public class CreateCollectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
}

public class CollectionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
    public DateTime CreatedAt { get; set; }
}
