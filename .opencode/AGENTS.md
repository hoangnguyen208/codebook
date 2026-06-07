# CodeBook

A dev handbook for snippets, commands, prompts, and conventions for documentation.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Build, lint, and run commands

- `npm run dev` starts the Next.js development server.
- `npm run build` creates the production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- There is currently no `test` script, no test runner config, and no `*.test.*` or `*.spec.*` files in the repo, so there is no supported command for running the full test suite or a single test yet.

## High-level architecture

- This repository is a minimal **Next.js 16.2.4 App Router** app with **React 19** and **TypeScript**. Route structure lives under `src/app`, not a top-level `app/` folder.
- `src/app/layout.tsx` is the root layout for the whole app. It:
  - imports `src/app/globals.css`
  - loads `Geist` and `Geist_Mono` through `next/font/google`
  - sets app-wide `Metadata`
  - owns the root `<html>` and `<body>` structure and shared classes
- `src/app/page.tsx` is currently the only route (`/`), so new pages should be added by creating new route segment folders and `page.tsx` files under `src/app`.
- Styling is set up with **Tailwind CSS v4** through `src/app/globals.css`, which currently only contains `@import "tailwindcss";`. Utility classes are applied directly in components/layouts.
- `public/` is the static asset folder. Files there are served from the site root (for example, `public/logo.png` is requested as `/logo.png`).

## Key conventions for this repo

- Follow **App Router** conventions, not Pages Router conventions. The repo’s `AGENTS.md` and `CLAUDE.md` both explicitly warn that this project uses a newer Next.js with breaking changes, and future sessions should consult the bundled docs in `node_modules/next/dist/docs/` before changing routing, rendering, or file conventions.
- Assume **Server Components by default**. Only add `"use client"` to components that actually need browser APIs, state, effects, or event handlers.
- Keep routing file-based and explicit: folders define segments, but a route is only exposed when a `page.tsx` or `route.ts` file exists inside that segment.
- Use the configured TypeScript path alias `@/*` for imports from `src/*`.
- Preserve the current root-layout responsibilities in `src/app/layout.tsx` rather than spreading them across pages: global fonts, metadata, `html/body`, and app-wide classes belong there.
- Prefer typed Next.js APIs already used in the repo, such as `Metadata` exports, instead of ad hoc document/head patterns.
- `next.config.ts` is currently an empty typed config object. Do not introduce custom Next config unless the change requires it.
