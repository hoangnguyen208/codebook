using CodeBook.Api.Controllers;
using CodeBook.Api.Data;
using CodeBook.Api.Models;
using CodeBook.Api.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CodeBook.Api.Tests.Controllers;

public class UsersControllerTests
{
    private readonly CodeBookDbContext _dbContext;
    private readonly List<User> _users;
    private readonly Mock<ILogger<UsersController>> _loggerMock;

    public UsersControllerTests()
    {
        _users =
        [
            new()
            {
                Id = "user-1", Email = "test@example.com",
                Password = "hashed-value", IsPro = false,
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 6, 1)
            },
            new()
            {
                Id = "user-2", Email = "pro@example.com",
                Password = "hashed-value-2", IsPro = true,
                CreatedAt = new DateTime(2026, 2, 1),
                UpdatedAt = new DateTime(2026, 6, 2)
            }
        ];

        var mockDbContext = new Mock<CodeBookDbContext>(new DbContextOptions<CodeBookDbContext>());
        mockDbContext.Setup(db => db.Users).Returns(MockDbSetHelper.CreateDbSetMock(_users).Object);
        mockDbContext.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _dbContext = mockDbContext.Object;
        _loggerMock = new Mock<ILogger<UsersController>>();
    }

    [Fact]
    public async Task GetUsers_ReturnsAllUsers()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);

        var result = await controller.GetUsers();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var users = Assert.IsAssignableFrom<IEnumerable<User>>(okResult.Value);
        Assert.Equal(2, users.Count());
    }

    [Fact]
    public async Task GetUser_ExistingId_ReturnsUser()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);

        var result = await controller.GetUser("user-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("test@example.com", user.Email);
    }

    [Fact]
    public async Task GetUser_NonExistingId_ReturnsNotFound()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);

        var result = await controller.GetUser("nonexistent");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateUser_ValidRequest_ReturnsCreatedAt()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);
        var request = new CreateUserRequest { Email = "new@example.com", Password = "secure123" };

        var result = await controller.CreateUser(request);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var user = Assert.IsType<User>(createdResult.Value);
        Assert.Equal("new@example.com", user.Email);
        Assert.False(user.IsPro);
        Assert.NotEqual("secure123", user.Password);
        Assert.StartsWith("pbkdf2-sha256$", user.Password);
    }

    [Fact]
    public async Task CreateUser_DuplicateEmail_ReturnsBadRequest()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);
        var request = new CreateUserRequest { Email = "test@example.com", Password = "secure123" };

        var result = await controller.CreateUser(request);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("User with this email already exists", badRequestResult.Value);
    }

    [Fact]
    public async Task CreateUser_MissingEmail_ReturnsBadRequest()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);

        var result = await controller.CreateUser(new CreateUserRequest { Email = "", Password = "secure123" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateUser_MissingPassword_ReturnsBadRequest()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);

        var result = await controller.CreateUser(new CreateUserRequest { Email = "test@example.com", Password = "" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateUser_ExistingId_UpdatesEmail()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);
        var request = new UpdateUserRequest { Email = "updated@example.com" };

        var result = await controller.UpdateUser("user-1", request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("updated@example.com", user.Email);
    }

    [Fact]
    public async Task UpdateUser_NonExistingId_ReturnsNotFound()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);

        var result = await controller.UpdateUser("nonexistent", new UpdateUserRequest { Email = "x@y.com" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task UpdateUser_EmptyEmail_KeepsOriginal()
    {
        var controller = new UsersController(_dbContext, _loggerMock.Object);
        var originalEmail = _users[0].Email;

        var result = await controller.UpdateUser("user-1", new UpdateUserRequest { Email = "" });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal(originalEmail, user.Email);
    }
}
