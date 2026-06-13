using Microsoft.AspNetCore.Identity;

namespace CodeBook.Identity.Models;

public class ApplicationUser : IdentityUser
{
    public bool IsPro { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
}
