namespace CodeBook.Api.Models;

public class ItemCollection
{
    public string ItemId { get; set; } = null!;
    public string CollectionId { get; set; } = null!;

    public Item Item { get; set; } = null!;
    public Collection Collection { get; set; } = null!;
}
