# Current Feature

File List View

## Status

<!-- Not Started|In Progress|Completed -->
Completed

## Goals

<!-- Goals & requirements -->

- Single-column list layout with rows
- Each row shows: file icon (by extension), file name, file size, upload date, download button
- Row hover highlight
- Click row opens ItemDrawer
- Download button triggers direct download (stop propagation)
- Responsive: stack info vertically on mobile

## Notes

<!-- Any extra notes -->

Implement file list view per `context/features/file-display-spec.md`.

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
- **Rate Limiting for Auth**: Added rate limiting to Login, Register, ForgotPassword, ResetPassword, and Email Verification endpoints via `RateLimiterService` with per-IP and IP+email limiting
- **Items List View**: Created feature branch, added backend `/api/dashboard/items/by-type/{typeName}` endpoint, `getItemsByType` fetcher, `ItemCard` component with type-colored left border, and rewired `items/[type]/page.tsx` from mock data to real API data
- **API Unit Tests**: Created `tests/CodeBook.Api.Tests` xUnit project with Moq + EF Core async query provider, added 34 tests across all 5 controllers, made DbSet properties virtual for testability, and added test project to solution file
- **Item Drawer**: Added shadcn Sheet right-side drawer with ItemDrawerProvider/Sheet, skeleton loading, action bar (Favorite/Pin/Copy/Edit/Delete), wired into dashboard and items list pages; merged DashboardItems/DashboardItemTypes controllers into ItemsController; extracted shared types to fix server-client serialization
- **Item Drawer — Edit Mode**: Added inline edit mode to item drawer with type-specific inputs (title/description/tags/content/language/url), Zod-validated server action, `PUT api/items/{id}` endpoint with tag disconnect-and-reconnect logic, 26 unit tests for ItemsController, and item types tests merged into ItemsControllerTests.cs
- **Item Drawer — Delete**: Added `DELETE api/items/{id}` endpoint with ownership validation, `deleteItem` server action, confirmation dialog with warning in the item drawer, auto-close + list refresh after delete, and 3 unit tests (42 total)
- **Item Create**: Added `POST api/items` endpoint, `createItem` server action with Zod validation, shadcn Dialog modal with type selector and dynamic fields (content/language/url), wired New Item button in top bar, and 5 unit tests (47 total)
- **Code Editor**: Created `CodeEditor` component with Monaco Editor dark theme, macOS dots, copy button, language label; wired into CreateItemDialog and ItemDrawerSheet for snippet/command types
- **Markdown Editor**: Created `MarkdownEditor` component with Write/Preview tabs, copy button, macOS dots; used `@tailwindcss/typography` for `prose prose-invert` dark-theme rendering; replaced Textarea with MarkdownEditor for note/prompt types in CreateItemDialog and ItemDrawerSheet
- **File & Image Upload**: Added R2 upload/download API routes, FileUpload component with drag-and-drop and progress indicator, file/image type support in CreateItemDialog and ItemDrawerSheet with image preview and download button, R2 file deletion on item delete, 3 new unit tests (50 total)
- **Image Gallery View**: Added `ImageCard` component with 3-column gallery grid, 16:9 thumbnail with `object-cover`, hover zoom effect, fallback icon for images without preview; added `FileUrl` to dashboard item DTOs and API responses
- **File List View**: Added `FileRow` single-column list component for `/items/files`, extended `RecentDashboardItemDto` with `FileName`/`FileSize`/`CreatedAt` fields, wired `ItemsGridClient` to use `FileRow` for file type with download button and responsive layout
