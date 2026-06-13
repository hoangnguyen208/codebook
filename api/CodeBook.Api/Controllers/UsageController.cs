using System.Security.Claims;
using CodeBook.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeBook.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/usage")]
public class UsageController : ControllerBase
{
    private readonly UsageLimitsService _usageLimitsService;

    public UsageController(UsageLimitsService usageLimitsService)
    {
        _usageLimitsService = usageLimitsService;
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
    }

    private bool GetIsPro()
    {
        var isProClaim = User.FindFirst("isPro")?.Value;
        return isProClaim == "true";
    }

    [HttpGet("limits")]
    public async Task<ActionResult<UsageLimits>> GetLimits()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var isPro = GetIsPro();
        var limits = await _usageLimitsService.GetUsageLimitsAsync(userId, isPro);
        return Ok(limits);
    }
}
