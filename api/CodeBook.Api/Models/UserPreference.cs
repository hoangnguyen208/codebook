namespace CodeBook.Api.Models;

public class UserPreference
{
    public string UserId { get; set; } = null!;
    public string EditorPreferences { get; set; } = "{}";
}
