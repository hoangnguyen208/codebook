namespace CodeBook.Api.Models;

public class Collection
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }

    // Navigation properties
    public ICollection<Item> Items { get; set; } = new List<Item>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
