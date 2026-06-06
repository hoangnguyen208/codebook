# Current Feature

Profile Page

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Display user info: avatar (GitHub or initials), username, email, provider badge (Email/Password vs GitHub)
- Show usage stats: total items, total collections, breakdown by item type
- Change password action (Duende users only) — links to Identity server change-password page
- Delete account with confirmation dialog (Duende users delete from Identity; GitHub users sign out)

## Notes

<!-- Any extra notes -->

Implement the full profile page per `context/features/profile-spec.md`.

**Implementation notes:**
- New `GET /api/profile/stats` endpoint in `CodeBook.Api`
- Store `provider` in NextAuth JWT/session (`auth.config.ts`)
- `webapp/src/lib/db/profile.ts` — fetches profile stats
- `webapp/src/app/profile/page.tsx` — full Server Component profile page
- `webapp/src/components/profile/DeleteAccountDialog.tsx` — Client Component modal
- `webapp/src/actions/profile.ts` — delete account Server Action
- `api/CodeBook.Identity/Pages/Account/Manage/ChangePassword` — new Razor Page
- `api/CodeBook.Identity/Pages/Account/Manage/DeleteAccount` — new Razor Page

**References:**
- Feature spec: `@context/features/profile-spec.md`
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
- **Auth Setup - Phase 2**: Updated current feature to implement registration via Duende + NextAuth from `auth-phase-2-spec.md`
- **Auth Setup - Phase 2 Implementation**: Added `/api/auth/register` + `/auth/register`, implemented Duende local registration page/handler, and fixed HTTP cookie policy to complete redirects back to `/dashboard`
- **Auth UI - Phase 3**: Updated current feature to implement custom auth UI + user identity interactions from `auth-phase-3-spec.md`
- **Auth UI - Phase 3 Implementation**: Added custom landing auth actions, session-backed dashboard avatar/name display, profile route, and `/api/auth/signout-all` flow
- **Auth UI - Phase 3 Stabilization**: Fixed Duende identity mapping/session claims, improved logout/login re-entry flow, and finalized top-nav profile dropdown behavior
- **Auth Email Verification**: Added Duende registration email confirmation flow, enforced confirmed email sign-in, and integrated Resend as the Identity email sender via `RESEND_API_KEY`
- **Forgot Password**: Added forgot-password / reset-password flow on Duende Identity; Resend sends the reset link, `returnUrl` threads through ForgotPassword pages, and Confirmation redirects to a fresh webapp OIDC sign-in to avoid PKCE mismatch
