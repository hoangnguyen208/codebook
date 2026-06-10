using System.Security.Claims;
using Amazon;
using Amazon.S3;
using Amazon.Runtime;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
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

    [HttpPost("api/items")]
    public async Task<ActionResult<ItemDetailDto>> CreateItem([FromBody] CreateItemRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var type = await _dbContext.ItemTypes.FirstOrDefaultAsync(t => t.Name == request.TypeName);
        if (type == null)
        {
            return BadRequest(new { error = $"Unknown item type: {request.TypeName}" });
        }

        var item = new Item
        {
            Id = Guid.NewGuid().ToString(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Content = request.Content?.Trim(),
            Url = request.Url?.Trim(),
            Language = request.Language?.Trim(),
            FileUrl = request.FileUrl?.Trim(),
            FileName = request.FileName?.Trim(),
            FileSize = request.FileSize,
            ContentType = request.ContentType ?? "text",
            UserId = userId,
            TypeId = type.Id,
            Type = type,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        if (request.Tags is { Count: > 0 })
        {
            foreach (var tagName in request.Tags)
            {
                var trimmedName = tagName.Trim();
                if (string.IsNullOrWhiteSpace(trimmedName)) continue;

                var tag = await _dbContext.Tags.FirstOrDefaultAsync(t => t.Name == trimmedName)
                    ?? new Tag { Id = Guid.NewGuid().ToString(), Name = trimmedName };

                item.Tags.Add(new ItemTag { ItemId = item.Id, TagId = tag.Id, Tag = tag });
            }
        }

        _dbContext.Items.Add(item);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetItem), new { id = item.Id }, ToItemDetailDto(item));
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

        return Ok(ToItemDetailDto(item));
    }

    [HttpDelete("api/items/{id}")]
    public async Task<IActionResult> DeleteItem(string id)
    {
        var userId = GetUserId();
        var item = await _dbContext.Items
            .Include(i => i.Tags)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            return NotFound();
        }

        // Delete file from R2 if present
        if (!string.IsNullOrWhiteSpace(item.FileUrl))
        {
            try
            {
                var accountId = Environment.GetEnvironmentVariable("R2_ACCOUNT_ID");
                var accessKey = Environment.GetEnvironmentVariable("R2_ACCESS_KEY_ID");
                var secretKey = Environment.GetEnvironmentVariable("R2_SECRET_ACCESS_KEY");
                var bucketName = Environment.GetEnvironmentVariable("R2_BUCKET_NAME");
                var publicUrl = Environment.GetEnvironmentVariable("R2_PUBLIC_URL");

                if (!string.IsNullOrWhiteSpace(accountId) && !string.IsNullOrWhiteSpace(accessKey)
                    && !string.IsNullOrWhiteSpace(secretKey) && !string.IsNullOrWhiteSpace(bucketName)
                    && !string.IsNullOrWhiteSpace(publicUrl) && item.FileUrl.StartsWith(publicUrl))
                {
                    var rawKey = item.FileUrl.Substring(publicUrl.Length).TrimStart('/');
                    var key = Uri.UnescapeDataString(rawKey);
                    var credentials = new BasicAWSCredentials(accessKey, secretKey);
                    var config = new AmazonS3Config
                    {
                        ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                    };

                    using var s3Client = new AmazonS3Client(credentials, config);
                    await s3Client.DeleteObjectAsync(bucketName, key);
                }
            }
            catch
            {
                // Log but don't block deletion
            }
        }

        _dbContext.ItemTags.RemoveRange(item.Tags);
        _dbContext.Items.Remove(item);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("api/items/{id}")]
    public async Task<ActionResult<ItemDetailDto>> UpdateItem(string id, [FromBody] UpdateItemRequest request)
    {
        var userId = GetUserId();
        var item = await _dbContext.Items
            .Include(i => i.Tags)
                .ThenInclude(it => it.Tag)
            .Include(i => i.Type)
            .Include(i => i.Collection)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            return NotFound();
        }

        item.Title = request.Title.Trim();
        item.Description = request.Description?.Trim();
        item.Content = request.Content?.Trim();
        item.Url = request.Url?.Trim();
        item.Language = request.Language?.Trim();
        item.FileUrl = request.FileUrl?.Trim();
        item.FileName = request.FileName?.Trim();
        item.FileSize = request.FileSize;
        if (!string.IsNullOrWhiteSpace(request.ContentType))
        {
            item.ContentType = request.ContentType;
        }
        item.UpdatedAt = DateTime.UtcNow;

        // Handle tags: disconnect all existing, connect-or-create new ones
        _dbContext.ItemTags.RemoveRange(item.Tags);

        if (request.Tags is { Count: > 0 })
        {
            foreach (var tagName in request.Tags)
            {
                var trimmedName = tagName.Trim();
                if (string.IsNullOrWhiteSpace(trimmedName)) continue;

                var tag = await _dbContext.Tags
                    .FirstOrDefaultAsync(t => t.Name == trimmedName);

                if (tag == null)
                {
                    tag = new Tag
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = trimmedName,
                    };
                    _dbContext.Tags.Add(tag);
                }

                item.Tags.Add(new ItemTag
                {
                    ItemId = item.Id,
                    TagId = tag.Id,
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        // Reload with includes for response
        var updated = await _dbContext.Items
            .AsNoTracking()
            .Include(i => i.Type)
            .Include(i => i.Tags)
                .ThenInclude(it => it.Tag)
            .Include(i => i.Collection)
            .FirstOrDefaultAsync(i => i.Id == id);

        return Ok(ToItemDetailDto(updated!));
    }

    private static ItemDetailDto ToItemDetailDto(Item item)
    {
        return new ItemDetailDto
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
                .Select(it => it.Tag?.Name)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList()!,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
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
            Content = item.Content,
            Url = item.Url,
            TypeId = item.TypeId,
            CollectionId = item.CollectionId,
            FileUrl = item.FileUrl,
            FileName = item.FileName,
            FileSize = item.FileSize,
            Tags = item.Tags
                .Select(itemTag => itemTag.Tag.Name)
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList(),
            IsFavorite = item.IsFavorite,
            IsPinned = item.IsPinned,
            UpdatedAt = item.UpdatedAt,
            CreatedAt = item.CreatedAt
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
            Content = item.Content,
            Url = item.Url,
            TypeId = item.TypeId,
            CollectionId = item.CollectionId,
            FileUrl = item.FileUrl,
            FileName = item.FileName,
            FileSize = item.FileSize,
            Tags = item.Tags
                .Select(itemTag => itemTag.Tag.Name)
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList(),
            IsFavorite = item.IsFavorite,
            IsPinned = item.IsPinned,
            UpdatedAt = item.UpdatedAt,
            CreatedAt = item.CreatedAt
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
    public string? Content { get; set; }
    public string? Url { get; set; }
    public string TypeId { get; set; } = string.Empty;
    public string? CollectionId { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public int? FileSize { get; set; }
    public List<string> Tags { get; set; } = [];
    public bool IsFavorite { get; set; }
    public bool IsPinned { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
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

public class CreateItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? Url { get; set; }
    public string? Language { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public int? FileSize { get; set; }
    public string? ContentType { get; set; }
    public List<string> Tags { get; set; } = [];
}

public class UpdateItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? Url { get; set; }
    public string? Language { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public int? FileSize { get; set; }
    public string? ContentType { get; set; }
    public List<string> Tags { get; set; } = [];
}
