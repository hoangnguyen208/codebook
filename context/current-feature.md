# Current Feature

Dashboard UI Phase 2

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- Goals & requirements -->

- Add a collapsible dashboard sidebar
- Add item/type links to `/items/TYPE` routes
- Show favorite collections
- Show most recent collections
- Add a user avatar area at the bottom of the sidebar
- Add a drawer icon to open and close the sidebar
- Use a drawer pattern for the sidebar on mobile view

## Notes

<!-- Any extra notes -->

- Reference the dashboard screenshot in `@context/screenshots/dashboard-ui-main.png` for layout direction
- Use `@context/project-overview.md` and `@context/features/dashboard-phase-2-spec.md` as the source requirements
- Mock dashboard data lives in `@src/lib/mock-data.ts`
- Review `@context/features/dashboard-phase-1-spec.md` and `@context/features/dashboard-phase-3-spec.md` for adjacent scope

## History

<!-- Keep this updated. Earliest to latest -->

- Initial Next.js app setup with App Router, TypeScript, Tailwind CSS, and ESLint
- Boilerplate cleanup by removing the default starter assets and unused starter styles
- Added the initial project context files and Copilot guidance for future sessions
- Implemented dashboard UI phase 1 in `webapp` with ShadCN setup, a dark-first app shell, and a `/dashboard` route with search/new item controls plus Sidebar/Main placeholders
- Switched the active feature context to dashboard UI phase 2
