# Current Feature

Auth Setup - Phase 1

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Set up `api/CodeBook.Identity` with Duende IdentityServer + ASP.NET Core Identity
- Keep Identity DB separate from `CodeBook.Api` DB (SQL Server `CodeBookIdentity` vs `CodeBook`)
- Seed demo account for testing (`bob` / `Pass123$`)
- Configure NextAuth v5 (`next-auth@beta`) in `webapp` with:
  - Duende provider
  - GitHub provider
  - JWT session strategy
- Add Auth.js route handler at `src/app/api/auth/[...nextauth]/route.ts`
- Protect `/dashboard/*` using Next.js 16 `src/proxy.ts` named export (`proxy`)
- Redirect unauthenticated users to default NextAuth sign-in page
- Extend `Session` type with `user.id` in `src/types/next-auth.d.ts`

## Notes

<!-- Any extra notes -->

Implement authentication phase 1 by introducing a dedicated Duende IdentityServer and wiring App Router authentication/protection in Next.js with NextAuth v5.

**Implementation notes:**
- Duende identity client is configured for NextAuth callback URL (`/api/auth/callback/duende-identity-server6`)
- `/dashboard/:path*` is protected via `src/proxy.ts` and keeps `callbackUrl` during redirects
- Keep NextAuth default sign-in page (no custom sign-in page configured)
- Duende sign-in button is configured as text-only (`Sign in with Duende`) without a provider logo
- Local development auth topology:
  - Webapp: `http://app.codebook.local:3000`
  - IdentityServer: `http://id.codebook.local:5001`
  - API: `http://api.codebook.local:5000`

**References:**
- Feature spec: `@context/features/auth-phase-1-spec.md`
- Identity template reference: https://docs.duendesoftware.com/identityserver/quickstarts/0-overview/#preparation
- NextAuth Duende reference: https://next-auth.js.org/providers/duende-identityserver6
- Follow `@context/coding-standards.md` for TypeScript/Next.js conventions

## History

<!-- Keep this updated. Earliest to latest -->

- Initial Next.js app setup with App Router, TypeScript, Tailwind CSS, and ESLint
- Boilerplate cleanup by removing the default starter assets and unused starter styles
- Added the initial project context files and Copilot guidance for future sessions
- **Dashboard UI Phase 1**: Implemented dashboard UI with ShadCN setup, a dark-first app shell, and a `/dashboard` route with search/new item controls plus Sidebar/Main placeholders
- **Dashboard UI Phase 2**: Added a collapsible sidebar, mobile drawer navigation, item type routes, favorite/recent collection sections, and the user avatar area
- **Dashboard UI Phase 3**: Implemented the main dashboard area with stats cards, recent collections, pinned items, and a 10-item recent activity list
- **Backend Setup Phase 1**: Created .NET 10 API with Entity Framework Core, SQL Server integration, Entity Framework models, initial migration, Docker containers, and docker-compose.yml for service orchestration
- **Backend Cleanup**: Removed Duende IdentityServer; project now focuses on data migrations and core API with SQL Server + EF Core
- **Database Seeding**: Added seed spec and updated current feature to implement `DatabaseSeeder` for demo data
- **Database Seeding Implementation**: Added runtime seeding after migrations with idempotent checks; seeded 1 demo user, 7 system item types, 5 collections, and 18 sample items
- **Dashboard Collections Data Integration**: Started replacing dashboard collection cards from mock data to .NET/EF-backed data
- **Dashboard Collections Data Integration Implementation**: Added API-backed recent collections endpoint and wired dashboard cards to live .NET/EF-derived data with dominant-type border colors and type icons
- **Dashboard Items Data Integration**: Updated current feature to replace the dashboard's pinned/recent item cards with .NET/EF-backed data
- **Dashboard Items Data Integration Implementation**: Added live dashboard items endpoint/fetcher, wired dashboard cards and stats to database-backed data, and hid the pinned section when empty
- **Stats & Sidebar**: Updated current feature to implement stats/sidebar database integration from `stats-sidebar-spec.md`
- **Stats & Sidebar Implementation**: Added API-backed system item types + full collections endpoints, switched dashboard stats/sidebar from mock data to DB-backed data, and added sidebar "View all collections" link
- **Auth Setup - Phase 1**: Updated current feature to implement Duende IdentityServer + NextAuth v5 + dashboard route protection from `auth-phase-1-spec.md`
- **Auth Setup - Phase 1 Implementation**: Added `CodeBook.Identity` service, NextAuth route/config/proxy wiring, dashboard protection, and auth environment/client configuration
- **Auth Setup - Phase 1 Stabilization**: Fixed Duende callback/provider ID mismatches, aligned Docker hostnames to `*.codebook.local` on HTTP, and made Duende sign-in button text-only
