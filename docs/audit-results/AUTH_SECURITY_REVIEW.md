# Authentication Security Audit

**Last Audit Date**: 2026-06-07
**Auditor**: Auth Security Agent

## Executive Summary

An authentication security audit has been performed on the custom authentication flows in CodeBook, covering the Next.js frontend (`webapp`), the Duende Identity Server (`CodeBook.Identity`), and the `.NET Core API` (`CodeBook.Api`). 

While the use of NextAuth v5 and Duende Identity Server provides a robust foundation for OAuth state management, secure session token handling, and CSRF protection, several critical security vulnerabilities were discovered in custom configurations. Most notably, a critical configuration mismatch completely bypassed route protection in the Next.js frontend, and the backend API endpoints lack any authentication or user data isolation. Implementing the recommended fixes is critical to ensuring the security and privacy of user data.

---

## Findings

### Critical Issues

#### Missing Authentication & User Isolation in Backend API

**Severity**: Critical
**Files**: 
- `api/CodeBook.Api/Controllers/DashboardItemsController.cs` (lines 18-50)
- `api/CodeBook.Api/Controllers/DashboardCollectionsController.cs` (lines 18-35)
- `api/CodeBook.Api/Controllers/ProfileController.cs` (lines 18-51)

**Vulnerable Code** (Example from `DashboardItemsController.cs`):
```csharp
[HttpGet("recent")]
public async Task<ActionResult<IEnumerable<RecentDashboardItemDto>>> GetRecentItems(
    [FromQuery] int limit = 100)
{
    var safeLimit = Math.Clamp(limit, 1, 200);

    var items = await _dbContext.Items
        .AsNoTracking()
        .Include(item => item.Tags)
            .ThenInclude(itemTag => itemTag.Tag)
        .OrderByDescending(item => item.UpdatedAt)
        .Take(safeLimit)
        .ToListAsync();
    // ...
}
```

**Problem**: 
The main `.NET Core API` (`CodeBook.Api`) has no authentication configured in its pipeline (`Program.cs` lacks `UseAuthentication` and `UseAuthorization`). Consequently, controllers such as `DashboardItemsController`, `DashboardCollectionsController`, and `ProfileController` are entirely public. 

Moreover, these controllers query all database items and collections unconditionally without filtering by user identity, even though the database schema maintains a `UserId` on each `Item` and `Collection` record. This represents a critical **Broken Object Level Authorization (BOLA / IDOR)** and **Missing Authentication** vulnerability.

**Attack Scenario**: 
An attacker sends a direct HTTP request to `GET http://api.codebook.local/api/dashboard/items/recent` or `GET http://api.codebook.local/api/profile/stats`. The API responds with sensitive items, collections, or stats belonging to all users across the entire platform.

**Fix**:
1. Configure JWT Bearer Authentication in `api/CodeBook.Api/Program.cs` to validate tokens issued by `CodeBook.Identity`.
2. Secure controllers with the `[Authorize]` attribute.
3. Extract the authenticated user's Subject ID from the current claims principal (`User.FindFirst(ClaimTypes.NameIdentifier)?.Value`) and filter all database queries accordingly.

*Secure Code Example for `DashboardItemsController.cs`:*
```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[ApiController]
[Route("api/dashboard/items")]
public class DashboardItemsController : ControllerBase
{
    private readonly CodeBookDbContext _dbContext;

    public DashboardItemsController(CodeBookDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<RecentDashboardItemDto>>> GetRecentItems([FromQuery] int limit = 100)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var safeLimit = Math.Clamp(limit, 1, 200);
        var items = await _dbContext.Items
            .AsNoTracking()
            .Where(item => item.UserId == userId) // Filter by user identity
            .Include(item => item.Tags)
                .ThenInclude(itemTag => itemTag.Tag)
            .OrderByDescending(item => item.UpdatedAt)
            .Take(safeLimit)
            .ToListAsync();
        
        // ... mapped return ...
    }
}
```

---

### High Severity

No High Severity vulnerabilities were identified in the custom authentication configuration.

---

### Medium Severity

#### Long-Lived Password Reset and Email Confirmation Tokens

**Severity**: Medium
**File**: `api/CodeBook.Identity/HostingExtensions.cs`
**Line(s)**: 60-65

**Vulnerable Code**:
```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.SignIn.RequireConfirmedEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
```

**Problem**: 
By default, ASP.NET Core Identity's standard token providers configure a token lifespan of **1 day (24 hours)**. While this might be reasonable for email confirmations, a 24-hour expiration window for password reset tokens is excessively long and exposes the system to exploitation if an email account is compromised, if links are leaked via logs/headers, or if they are cached in browser history.

**Attack Scenario**: 
An attacker intercepts an old password reset link that was sent 18 hours prior. Because the token's validity is set to 24 hours, the link remains valid, allowing the attacker to reset the password and compromise the user account.

**Fix**: 
Configure the default Token Provider Lifespan to 1 hour (or register a separate short-lived token provider specifically for password resets).

*Secure Code Example:*
```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.SignIn.RequireConfirmedEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure default token lifespan to 1 hour
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(1);
});
```

---

#### Missing Secure-Only Cookie Flags in Non-Development Environments

**Severity**: Medium
**File**: `api/CodeBook.Identity/HostingExtensions.cs`
**Line(s)**: 79-90

**Vulnerable Code**:
```csharp
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});
```

**Problem**: 
`CookieSecurePolicy.SameAsRequest` sets the `Secure` flag on cookies only if the request initiating the cookie creation is secure (HTTPS). In non-development/production environments, this increases the risk of man-in-the-middle (MitM) attacks if a user accesses the site over an unencrypted connection (HTTP), causing session cookies to be transmitted in plaintext.

**Attack Scenario**: 
A user in a production deployment accidentally accesses the site via HTTP, or their traffic is downgraded by a MitM attacker. Because the secure policy is set to `SameAsRequest`, the cookie is transmitted without the `Secure` flag, enabling the attacker to sniff the session cookie.

**Fix**: 
Enforce `CookieSecurePolicy.Always` in production/staging environments, while allowing `SameAsRequest` only for local development.

*Secure Code Example:*
```csharp
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() 
        ? CookieSecurePolicy.SameAsRequest 
        : CookieSecurePolicy.Always; // Force secure in production
});
```

---

### Low Severity

#### Missing Strong Password Complexity Policy

**Severity**: Low
**File**: `api/CodeBook.Identity/HostingExtensions.cs`
**Line(s)**: 60-65

**Vulnerable Code**:
```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.SignIn.RequireConfirmedEmail = true;
    })
```

**Problem**: 
The Identity options do not explicitly define a password complexity policy, falling back to Identity's default requirements: minimum length of 6 characters. A 6-character password is highly vulnerable to modern brute-forcing techniques. Industry best practices (NIST, OWASP) recommend a minimum length of 10-12 characters.

**Fix**: 
Explicitly configure a strong password policy in `AddIdentity`.

*Secure Code Example:*
```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.SignIn.RequireConfirmedEmail = true;
        
        // Hardened Password Policy
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequireUppercase = true;
        options.Password.RequiredLength = 10; // Enforce minimum length of 10
        options.Password.RequiredUniqueChars = 3;
    })
```

---

#### Information Disclosure in Email Confirmation Link Failures

**Severity**: Low
**File**: `api/CodeBook.Identity/Pages/Account/Register/ConfirmEmail.cshtml.cs`
**Line(s)**: 39-43

**Vulnerable Code**:
```csharp
var user = await _userManager.FindByIdAsync(userId);
if (user is null)
{
    return NotFound($"Unable to load user with ID '{userId}'.");
}
```

**Problem**: 
Returning a precise `404 NotFound` with user ID exposes user non-existence, potentially aiding in user enumeration. For confirmation flow, error responses should be generic and not reveal database details.

**Fix**: 
Set `IsSuccess = false` and generic `StatusMessage` instead of returning a detailed `NotFound` string.

*Secure Code Example:*
```csharp
var user = await _userManager.FindByIdAsync(userId);
if (user is null)
{
    IsSuccess = false;
    StatusMessage = "Email confirmation failed. The link is invalid or expired.";
    return Page();
}
```

---

## Passed Checks

The following security measures were correctly implemented and found to follow best security practices:

- **Email Enumeration Mitigated on Forgot/Reset Password**: `ForgotPassword/Index.cshtml.cs` always redirects to the `EmailSent` page regardless of whether the email exists. `ResetPassword/Index.cshtml.cs` redirects to the login screen without confirming if a user ID was found.
- **Brute-Force Brute Protection (Lockout)**: The login handler (`Login/Index.cshtml.cs`) passes `lockoutOnFailure: true` to `PasswordSignInAsync`. This successfully blocks login attempts after multiple sequential failures, preventing brute-force password cracking.
- **Strong Legacy Password Hashing**: The `PasswordHashing.cs` file in the main API implements PBKDF2 using HMAC-SHA256 with 210,000 iterations and a cryptographically secure salt. This meets OWASP password storage requirements.
- **No Client-Exposed Credentials in NextAuth Session**: NextAuth configurations strictly store only `accessToken` and `refreshToken` securely on the server-side JWT session, keeping plain passwords out of client-side reach.
- **Anti-Forgery (CSRF) Protection**: Enabled on all C# Identity server Razor endpoints by default through internal form tag helpers and `app.UseCookiePolicy()`.

---

## Recommendations Summary

1. **Implement API Authentication & Authorization (CRITICAL)**: Configure JWT Bearer validation in `CodeBook.Api/Program.cs` and add `[Authorize]` with `UserId` filters on all items/collections endpoints.
2. **Shorten Token Lifespans (MEDIUM)**: Reduce the validity of password reset tokens in Identity Server to 1 hour using `builder.Services.Configure<DataProtectionTokenProviderOptions>`.
3. **Harden Production Cookie Policy (MEDIUM)**: Enforce `CookieSecurePolicy.Always` on cookies in staging/production environments.
4. **Enforce Strong Password Policies (LOW)**: Configure a minimum length of 10+ characters in ASP.NET Core Identity options.
5. **Mask Email Confirmation Failures (LOW)**: Render generic confirmation failure screens rather than revealing explicit database user lookup failures.
