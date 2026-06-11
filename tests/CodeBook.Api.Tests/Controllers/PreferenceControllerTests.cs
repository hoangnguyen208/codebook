using System.Security.Claims;
using System.Text.Json;
using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Controllers;

public class PreferenceControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<UserPreference> _preferences;
    private const string TestUserId = "test-user";

    public PreferenceControllerTests()
    {
        _preferences =
        [
            new() { UserId = TestUserId, EditorPreferences = """{"fontSize":16,"theme":"monokai"}""" }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.UserPreferences).Returns(MockDbSetHelper.CreateDbSetMock(_preferences).Object);
        mockDbContext.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _dbContext = mockDbContext.Object;
    }

    private PreferenceController CreateController(string? userId = null)
    {
        return new PreferenceController(_dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim("sub", userId ?? TestUserId)
                    ]))
                }
            }
        };
    }

    [Fact]
    public async Task Get_ReturnsStoredPreferences()
    {
        var controller = CreateController();

        var result = await controller.Get();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<EditorPreferencesDto>(okResult.Value);
        Assert.Equal(16L, ((JsonElement)dto.Preferences["fontSize"]).GetInt64());
        Assert.Equal("monokai", ((JsonElement)dto.Preferences["theme"]).GetString());
    }

    [Fact]
    public async Task Get_ReturnsEmptyForNewUser()
    {
        var controller = CreateController("new-user");

        var result = await controller.Get();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<EditorPreferencesDto>(okResult.Value);
        Assert.Empty(dto.Preferences);
    }

    [Fact]
    public async Task Get_ReturnsUnauthorizedWhenNoUser()
    {
        var controller = new PreferenceController(_dbContext)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        var result = await controller.Get();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task Update_CreatesForNewUser()
    {
        var controller = CreateController("new-user");
        var dto = new EditorPreferencesDto
        {
            Preferences = new Dictionary<string, object> { ["fontSize"] = 14, ["wordWrap"] = false }
        };

        var result = await controller.Update(dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(2, _preferences.Count);
        Assert.Equal("new-user", _preferences.Last().UserId);
    }

    [Fact]
    public async Task Update_UpdatesExistingUser()
    {
        var controller = CreateController();
        var dto = new EditorPreferencesDto
        {
            Preferences = new Dictionary<string, object> { ["fontSize"] = 20, ["theme"] = "github-dark" }
        };

        var result = await controller.Update(dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<EditorPreferencesDto>(okResult.Value);
        Assert.Equal(20, Convert.ToInt32(updated.Preferences["fontSize"]));
        Assert.Equal("github-dark", updated.Preferences["theme"] as string);
    }

    [Fact]
    public async Task Update_ReturnsUnauthorizedWhenNoUser()
    {
        var controller = new PreferenceController(_dbContext)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        var result = await controller.Update(new EditorPreferencesDto());

        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}
