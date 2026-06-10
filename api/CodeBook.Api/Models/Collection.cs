namespace CodeBook.Api.Models;

public class Collection
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
    public string? UserId { get; set; }

    // Navigation properties
    public ICollection<ItemCollection> ItemCollections { get; set; } = new List<ItemCollection>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
