namespace CodeBook.Api.Models;

public class Tag
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = null!;

    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    // Navigation properties
    public ICollection<ItemTag> Items { get; set; } = new List<ItemTag>();
}
