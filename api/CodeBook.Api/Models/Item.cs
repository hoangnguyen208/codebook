namespace CodeBook.Api.Models;

public class Item
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = null!;
    public string ContentType { get; set; } = null!; // text | file
    public string? Content { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public int? FileSize { get; set; }
    public string? Url { get; set; }
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
    public bool IsPinned { get; set; }
    public string? Language { get; set; }
    public string? UserId { get; set; }

    public string TypeId { get; set; } = null!;
    public ItemType Type { get; set; } = null!;

    public string? CollectionId { get; set; }
    public Collection? Collection { get; set; }

    // Navigation properties
    public ICollection<ItemTag> Tags { get; set; } = new List<ItemTag>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
