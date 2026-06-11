# Current Feature

Global Search / Command Palette

## Status

<!-- Not Started|In Progress|Completed -->
Completed

## Goals

<!-- Goals & requirements -->

- Cmd+K / Ctrl+K keyboard shortcut to open command palette
- Fuzzy search across all items and collections (client-side via cmdk)
- Grouped results: Items section with type icons, Collections section with item counts
- Keyboard navigation (arrow keys, Enter to select)
- Navigate to item drawer or collection page on select
- TopBar search input opens palette on click, shows ⌘K hint
- Pre-fetch searchable data on dashboard load

## Notes

<!-- Any extra notes -->

Uses shadcn cmdk component. Client-side only — no server round-trips. Search data pre-fetched via existing `getDashboardCollections` and `getRecentDashboardItems`.

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
- **Quick Copy Icons on Cards**: Added copy-to-clipboard button with Check feedback to ItemCard for text-type items; implemented `document.execCommand("copy")` fallback for HTTP environments; extended `RecentDashboardItemDto` with `Content`/`Url` so list endpoints expose copyable content; removed copy icon from FileRow, ImageCard, and from the drawer for file/image types; fixed cleanup (deleted orphaned `mock-data.ts`, deleted unreachable `/auth/register` page)
- **Collection Create**: Added "New Collection" button in dashboard top bar alongside "New Item"; created `CreateCollectionDialog` modal with Name/Description fields using sonner toasts; implemented full-stack flow: `POST /api/collections` .NET endpoint → `lib/db/collections.ts` createCollection → `actions/collections.ts` server action with Zod validation; added 13 unit tests for CollectionsController; added `.dockerignore` and optimized Dockerfiles with NuGet/npm cache mounts, non-root users, and proper layer ordering; fixed identity `UnauthorizedAccessException` for `/app/keys` directory; added API + Identity healthchecks to docker-compose with `condition: service_healthy` ordering; created `fetchWithRetry` with exponential backoff for all API calls; added graceful error fallback UI in dashboard and items pages
- **Add Items to Collections**: Added many-to-many Item↔Collection relationship via `ItemCollection` join table with data migration from old `Item.CollectionId` FK; added `CollectionIds` to Create/Update DTOs and request schemas; added collection multi-select pill UI to CreateItemDialog and ItemDrawerSheet edit mode via server action; added 9 unit tests (72 total); fixed `server-only` import leak by wrapping client-facing calls in server action; added OIDC token refresh in NextAuth JWT callback to prevent 401 on expired access tokens
- **Collections Pages**: Added `/collections` page with 3-column grid of `CollectionCard` components; added `/collections/[id]` page with `ItemsGridClient` reusing ItemCard/ImageCard/FileRow; added `GET /api/dashboard/items/by-collection/{collectionId}` endpoint and `getItemsByCollection` fetch wrapper; made dashboard collection cards and sidebar favorite/recent collection items clickable links; added 4 unit tests (76 total)
- **Collection Actions**: Added `PUT /api/collections/{id}`, `DELETE /api/collections/{id}`, and `GET /api/collections/{id}` endpoints; created `EditCollectionDialog` modal for editing name/description; added inline delete confirmation on collection detail page with redirect to `/collections`; added 3-dots dropdown (Edit/Delete/Favorite) to `CollectionCard` and `DashboardCollectionCard`; added `CollectionHeaderActions` component for detail page actions; auto-attach collection when creating item from collection page; added 12 unit tests (88 total)
- **Global Search**: Added Cmd+K/Ctrl+K command palette with fuzzy search across items and collections using cmdk; created `SearchProvider` context pre-fetching existing dashboard data; grouped results with type icons and item counts; keyboard navigation with arrow keys and Enter; search input in top bar opens palette on click with ⌘K hint
