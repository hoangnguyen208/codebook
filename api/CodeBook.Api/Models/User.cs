namespace CodeBook.Api.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = null!;
    public string? Password { get; set; }
    public bool IsPro { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }

    // Navigation properties
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<ItemType> ItemTypes { get; set; } = new List<ItemType>();
    public ICollection<Collection> Collections { get; set; } = new List<Collection>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
