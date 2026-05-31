# Current Feature

Stats & Sidebar

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Display stats from database-backed data while keeping the current design/layout
- Display system item types in the sidebar with icons, linking to `/items/[typename]`
- Display actual collection data from the database in the sidebar
- Add a "View all collections" link under the collections list that links to `/collections`
- Keep star icons for favorite collections
- For recent collections, show a colored circle based on the most-used item type in each collection
- Create `src/lib/db/items.ts` and add database functions (using `src/lib/db/collections.ts` as reference)

## Notes

<!-- Any extra notes -->

Replace remaining mock-driven stats/sidebar data with database-backed data while preserving current visual design and layout.

**Implementation notes:**
- Scope includes dashboard main-area stats and sidebar item types/collections sections
- Sidebar should use live item types and collection data
- Keep existing visual structure/components unless required by the feature
- Maintain current favorite vs recent collection behavior with required icon updates

**References:**
- Feature spec: `@context/features/stats-sidebar-spec.md`
- Existing mock source to replace: `@src/lib/mock-data.ts`
- Reference implementation: `@src/lib/db/collections.ts`
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
