# Current Feature

Database Seeding

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- ✅ Create a `DatabaseSeeder` class in `api/CodeBook.Api/Data/` that seeds demo data on startup
- ✅ Guard against re-seeding: skip if data already exists (idempotent)
- ✅ Run seeding only after all EF migrations have been applied
- ✅ Seed a demo user (`demo@codebook.io`, password `12345678` hashed with BCrypt 12 rounds)
- ✅ Seed all 7 system item types (snippet, prompt, command, note, file, image, link)
- ✅ Seed 5 collections with items as per `@context/features/seed-spec.md`

## Notes

<!-- Any extra notes -->

**Seed data summary** (see `@context/features/seed-spec.md` for full details):

- **User:** `demo@codebook.io` / `12345678` (BCrypt, 12 rounds), `isPro: false`
- **System Item Types** (`isSystem: true`):
  | Name    | Icon       | Color   |
  | ------- | ---------- | ------- |
  | snippet | Code       | #3b82f6 |
  | prompt  | Sparkles   | #8b5cf6 |
  | command | Terminal   | #f97316 |
  | note    | StickyNote | #fde047 |
  | file    | File       | #6b7280 |
  | image   | Image      | #ec4899 |
  | link    | Link       | #10b981 |

- **Collections & Items:**
  - **React Patterns** — 3 TypeScript snippets (useDebounce, Context providers, utility functions)
  - **AI Workflows** — 3 prompts (code review, docs generation, refactoring)
  - **DevOps** — 1 snippet (Docker/CI config), 1 command (deployment), 2 links (real URLs)
  - **Terminal Commands** — 4 commands (git, docker, process mgmt, package manager)
  - **Design Resources** — 4 links (Tailwind, component libs, design systems, icon libraries — real URLs)

**Implementation notes:**
- Add `DatabaseSeeder.cs` to `api/CodeBook.Api/Data/`
- Call seeder from `Program.cs` after the migration retry block
- Use BCrypt work factor 12 for password hashing
- Icon values are Lucide React component names (for frontend rendering)

**References:**
- Seed spec: `@context/features/seed-spec.md`
- EF models: `api/CodeBook.Api/Models/`
- DbContext: `api/CodeBook.Api/Data/CodeBookDbContext.cs`
- Follow `@context/coding-standards.md` for C# conventions

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
