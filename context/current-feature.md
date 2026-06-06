# Current Feature

Auth Email Verification

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Send registration verification email through Resend using `RESEND_API_KEY`
- Require confirmed email before local sign-in
- Provide clear verification UX for check-email, confirm-email, and return-to-login flows

## Notes

<!-- Any extra notes -->

Implement Duende Identity email verification with Resend and complete the user flow from register to verified sign-in.

**Implementation notes:**
- Identity registration now sends confirmation links via Resend (`IEmailSender` implementation)
- Confirmed email is required before password login (`RequireConfirmedEmail = true`)
- Added `/Account/Register/CheckEmail` and `/Account/Register/ConfirmEmail` pages for user guidance
- Confirm email success now shows explicit verified message and returns users to login (no silent redirect)
- Login return URLs strip `screen_hint=signup` to avoid register-loop on "Back to login"
- Identity service now loads Resend secrets from `api/CodeBook.Identity/.env.production` in docker-compose
- `api/CodeBook.Identity/.env` and `.env.production` are ignored from Git

**References:**
- Feature spec: `@context/features/auth-phase-3-spec.md`
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
- **Auth Setup - Phase 2**: Updated current feature to implement registration via Duende + NextAuth from `auth-phase-2-spec.md`
- **Auth Setup - Phase 2 Implementation**: Added `/api/auth/register` + `/auth/register`, implemented Duende local registration page/handler, and fixed HTTP cookie policy to complete redirects back to `/dashboard`
- **Auth UI - Phase 3**: Updated current feature to implement custom auth UI + user identity interactions from `auth-phase-3-spec.md`
- **Auth UI - Phase 3 Implementation**: Added custom landing auth actions, session-backed dashboard avatar/name display, profile route, and `/api/auth/signout-all` flow
- **Auth UI - Phase 3 Stabilization**: Fixed Duende identity mapping/session claims, improved logout/login re-entry flow, and finalized top-nav profile dropdown behavior
- **Auth Email Verification**: Added Duende registration email confirmation flow, enforced confirmed email sign-in, and integrated Resend as the Identity email sender via `RESEND_API_KEY`
