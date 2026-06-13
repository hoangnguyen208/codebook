using CodeBook.Identity.Data;
using CodeBook.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Identity.Controllers;

[ApiController]
[Route("api/subscription")]
public class SubscriptionController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public SubscriptionController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateSubscription(
        string userId,
        [FromBody] UpdateSubscriptionRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        if (request.IsPro.HasValue)
            user.IsPro = request.IsPro.Value;
        if (request.StripeCustomerId != null)
            user.StripeCustomerId = request.StripeCustomerId == string.Empty ? null : request.StripeCustomerId;
        if (request.StripeSubscriptionId != null)
            user.StripeSubscriptionId = request.StripeSubscriptionId == string.Empty ? null : request.StripeSubscriptionId;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return StatusCode(500, new { error = "Failed to update user subscription" });
        }

        return Ok(new { userId = user.Id, isPro = user.IsPro });
    }

    [HttpGet("by-stripe-customer/{stripeCustomerId}")]
    public async Task<IActionResult> GetByStripeCustomerId(string stripeCustomerId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.StripeCustomerId == stripeCustomerId);

        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        return Ok(new { userId = user.Id, isPro = user.IsPro, stripeCustomerId = user.StripeCustomerId });
    }
}

public class UpdateSubscriptionRequest
{
    public bool? IsPro { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
}
