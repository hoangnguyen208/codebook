namespace CodeBook.Api.Models;

public class ItemTag
{
    public string ItemId { get; set; } = null!;
    public string TagId { get; set; } = null!;

    public Item Item { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
