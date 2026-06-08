using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CodeBook.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
}

// Add services
builder.Services.AddDbContext<CodeBookDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>()
        ?? ["http://localhost:3000", "http://webapp:3000", "http://app.codebook.local:3000"];

    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var identityAuthority = Environment.GetEnvironmentVariable("IDENTITY_AUTHORITY") ?? "http://id.codebook.local:5001";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = identityAuthority;
        options.TokenValidationParameters.ValidateAudience = false;
        options.RequireHttpsMetadata = false;

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpClient();

var app = builder.Build();

// Apply migrations on startup with retry logic
var maxRetries = 5;
var retryCount = 0;
while (retryCount < maxRetries)
{
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CodeBookDbContext>();
            dbContext.Database.Migrate();

            var userId = await GetDemoUserIdAsync(scope.ServiceProvider.GetRequiredService<IHttpClientFactory>());
            await DatabaseSeeder.SeedAsync(dbContext, userId);
            break;
        }
    }
    catch (Exception ex)
    {
        retryCount++;
        if (retryCount >= maxRetries)
        {
            throw new InvalidOperationException($"Failed to apply migrations after {maxRetries} attempts", ex);
        }
        System.Threading.Thread.Sleep(5000 * retryCount);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "CodeBook API - Running Successfully!").AllowAnonymous();
app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow }).AllowAnonymous();

app.Run();

static async Task<string?> GetDemoUserIdAsync(IHttpClientFactory httpClientFactory)
{
    var httpClient = httpClientFactory.CreateClient();
    var identityUrl = Environment.GetEnvironmentVariable("IDENTITY_URL") ?? "http://id.codebook.local:5001";

    // Get token for bob using resource owner password grant
    var tokenRequest = new Dictionary<string, string>
    {
        ["grant_type"] = "password",
        ["client_id"] = "codebook-webapp",
        ["client_secret"] = "codebook-webapp-secret",
        ["username"] = "bob",
        ["password"] = "Pass123$",
        ["scope"] = "openid profile email codebook.api offline_access"
    };

    var tokenResponse = await httpClient.PostAsync(
        $"{identityUrl}/connect/token",
        new FormUrlEncodedContent(tokenRequest));

    tokenResponse.EnsureSuccessStatusCode();

    var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
    using var tokenDoc = JsonDocument.Parse(tokenJson);
    var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString()!;

    // Call userinfo to get sub claim
    httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    var userInfoResponse = await httpClient.GetAsync($"{identityUrl}/connect/userinfo");
    userInfoResponse.EnsureSuccessStatusCode();

    var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
    using var userInfoDoc = JsonDocument.Parse(userInfoJson);
    return userInfoDoc.RootElement.GetProperty("sub").GetString();
}
