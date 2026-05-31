# Current Feature

Dashboard Collections Data Integration

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- ✅ Create `src/lib/db/collections.ts` with collection data-fetching functions
- ✅ Fetch recent collections directly in the dashboard server component (replace mock data)
- ✅ Derive each collection card border color from its most-used content type
- ✅ Show small icons for all content types present in each collection
- ✅ Keep current dashboard card layout/design consistent with existing UI
- ✅ Update collection stats display with real database-backed values

## Notes

<!-- Any extra notes -->

Replace dashboard main-area collection cards (currently mock-based) with SQL-backed data while preserving the current visual design and layout.

**Implementation notes:**
- Scope is the right-side main dashboard area collections section only
- Do not add collection items under cards yet
- Keep the current 6-card recent collections presentation
- Use collection content composition to compute border color (most-used type)
- Render type indicator icons per collection based on existing type metadata/icon names

**References:**
- Feature spec: `@context/features/dashboard-collections-spec.md`
- Screenshot reference: `@context/screenshots/dashboard-ui-main.png`
- Existing mock source to replace: `@src/lib/mock-data.ts`
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
- **Dashboard Collections Data Integration**: Started replacing dashboard collection cards from mock data to SQL-backed data
- **Dashboard Collections Data Integration Implementation**: Added API-backed recent collections endpoint and wired dashboard cards to live SQL-derived data with dominant-type border colors and type icons
