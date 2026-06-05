# Auth Setup - Duende IdentityServer + ASP.NET Core API + Next.js + GitHub Provider

## Overview

- Set up a dedicated authentication server using Duende IdentityServer as a separate .NET container.
- Set up NextAuth v5 with Duende provider and GitHub OAuth. Use NextAuth's default pages for testing.

## Architecture

- `webapp` → Next.js frontend
- `api/CodeBook.Api` → ASP.NET Core Web API with Entity Framework + SQL Server
- `api/CodeBook.Identity` → Duende IdentityServer authentication server

+--------------------+
|    Next.js App     |
|      webapp        |
+---------+----------+
          |
          | OpenID Connect
          |
          v
+--------------------+
| CodeBook.Identity  |
| Duende IdentitySrv |
+---------+----------+
          |
          | JWT Access Token
          |
          v
+--------------------+
|   CodeBook.Api     |
| ASP.NET Core API   |
+--------------------+

## Goal

- Centralize authentication in `CodeBook.Identity`
- Use OpenID Connect (OIDC) + OAuth2
- Allow Next.js app to authenticate users using NextAuth/Auth.js callback with Duende provider
- Support future extensibility:
  * refresh tokens
  * external login providers such as Github

## Login Flow

1. User visits protected route in Next.js
2. NextAuth redirects user to Duende IdentityServer
3. User signs in
4. IdentityServer issues:
   - ID Token
   - Access Token
   - Refresh Token
5. Next.js stores session
6. Access token is attached to API calls

## Token Responsibility

### IdentityServer

Responsible for:

- login/logout
- issuing JWTs
- user management
- OAuth2/OIDC flows

### API

Responsible for:

- validating JWT access token
- authorization
- protecting resources

### Next.js

Responsible for:

- initiating login flow
- storing session
- attaching bearer token to API requests

## Requirements

- Install Duende Identity Server template as default, start from there and then customize it if needed
- Do not mix Identity Server database (you can choose either Postgres or SQL Server) with Codebook.Api application database
- Seeding a demo account for testing for example: user "bob", password "Pass123$"
- Install NextAuth v5 (`next-auth@beta`) and configure for Duende identity provider
- Add GitHub OAuth provider
- Protect `/dashboard/*` routes using Next.js 16 proxy
- Redirect unauthenticated users to sign-in

## Files to Create

### NextJs 
1. `src/auth.ts` - Full config with Duende and JWT strategy
2. `src/app/api/auth/[...nextauth]/route.ts` - Export handlers from auth.ts
3. `src/proxy.ts` - Route protection with redirect logic
4. `src/types/next-auth.d.ts` - Extend Session type with user.id
5. Any other files if needed

### DuendeIdentityServer

- Use the default Duende Identity Server template for ASP.NET to get started, customize it if needed

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Use `next-auth@beta` (not `@latest` which installs v4)
- Proxy file must be at `src/proxy.ts` (same level as `app/`)
- Use named export: `export const proxy = auth(...)` not default export
- Use `session: { strategy: 'jwt' }` with split config pattern
- Don't set custom `pages.signIn` - use NextAuth's default page

## Environment Variables

```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```
For reference: @webapp/.env, @webapp/.env.production

## Testing

1. Go to `/dashboard` - should redirect to sign-in
2. Click "Sign in with GitHub"
3. Verify redirect back to `/dashboard` after auth

## References

- next-auth with DuendeIdentityServer6 (keep in mind that this docs is for next-auth v4, please take it as a reference to configure for v5): https://next-auth.js.org/providers/duende-identityserver6
- DuendeIdentityServer templates: https://docs.duendesoftware.com/identityserver/quickstarts/0-overview/#preparation
- Duende ASP.NET Core Identity: https://docs.duendesoftware.com/identityserver/quickstarts/5-aspnetid/