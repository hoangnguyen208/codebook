using System.Security.Claims;
using System.Text.Json;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CodeBook.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/preferences")]
public class PreferenceController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public PreferenceController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
    }

    [HttpGet]
    public async Task<ActionResult<EditorPreferencesDto>> Get()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var pref = await _dbContext.UserPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId);

        var json = pref?.EditorPreferences ?? "{}";
        return Ok(new EditorPreferencesDto { Preferences = JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new() });
    }

    [HttpPut]
    public async Task<ActionResult<EditorPreferencesDto>> Update([FromBody] EditorPreferencesDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var json = JsonSerializer.Serialize(dto.Preferences ?? new Dictionary<string, object>());

        var pref = await _dbContext.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
        if (pref == null)
        {
            pref = new UserPreference { UserId = userId, EditorPreferences = json };
            _dbContext.UserPreferences.Add(pref);
        }
        else
        {
            pref.EditorPreferences = json;
        }

        await _dbContext.SaveChangesAsync();
        return Ok(dto);
    }
}

public class EditorPreferencesDto
{
    public Dictionary<string, object> Preferences { get; set; } = new();
}
