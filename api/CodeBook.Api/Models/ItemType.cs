namespace CodeBook.Api.Models;

public class ItemType
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = null!;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool IsSystem { get; set; }

    public string? UserId { get; set; }
    public User? User { get; set; }

    // Navigation properties
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
