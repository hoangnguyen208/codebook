# Current Feature

Backend Setup: SQL Server + Entity Framework + Duende IdentityServer

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Set up Entity Framework ORM with SQL Server database
- Create initial schema based on the Prisma data models in `@context/project-overview.md`
- Extend Duende IdentityServer identity setup models with the User model
- Add appropriate indexes and cascade deletes
- Containerize SQL Server, Entity Framework API, Duende IdentityServer, and the Next.js webapp using Docker Compose
- Ensure all containers stay connected and can communicate with each other
- Set up migrations using Entity Framework (never push directly; always migrate)

## Notes

<!-- Any extra notes -->

- Use `@context/features/database-spec.md` as the source requirements
- Reference the data models in `@context/project-overview.md` (Prisma draft, will evolve)
- Follow `@context/coding-standards.md` for database standards
- Check latest Entity Framework docs before implementation
- Development branch will use DATABASE_URL environment variable
- Always create migrations, never push directly to database
- All services should be containerized and run via Docker Compose

## History

<!-- Keep this updated. Earliest to latest -->

- Initial Next.js app setup with App Router, TypeScript, Tailwind CSS, and ESLint
- Boilerplate cleanup by removing the default starter assets and unused starter styles
- Added the initial project context files and Copilot guidance for future sessions
- **Dashboard UI Phase 1**: Implemented dashboard UI with ShadCN setup, a dark-first app shell, and a `/dashboard` route with search/new item controls plus Sidebar/Main placeholders
- **Dashboard UI Phase 2**: Added a collapsible sidebar, mobile drawer navigation, item type routes, favorite/recent collection sections, and the user avatar area
- **Dashboard UI Phase 3**: Implemented the main dashboard area with stats cards, recent collections, pinned items, and a 10-item recent activity list
- Started backend setup for SQL Server + Entity Framework + Duende IdentityServer with containerization
