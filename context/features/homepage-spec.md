# Homepage

## Overview

Replace the bare sign-in landing page at `/` with a dark-theme marketing homepage based on `prototypes/homepage/`. Use Tailwind and shadcn/ui patterns from the existing project. Keep the existing session check — authenticated users still get `redirect("/dashboard")`.

## Requirements

- Replace `webapp/src/app/page.tsx` with the marketing homepage
- Authenticated users still redirect to `/dashboard` (keep existing `auth()` check at top of page)
- Unauthenticated users see the full marketing homepage

## Sections

### 1. Navigation (server component)
- Fixed top nav with `backdrop-blur`, gets border on scroll via a client wrapper
- CodeBook logo (blue `<rect>` with `</>` text, same as mockup) + brand text
- Links: Features (`href="#features"`), Pricing (`href="#pricing"`)
- Sign In button: links to `/auth/login`
- Get Started button: links to `/auth/register`, styled with shadcn button using `bg-blue-500`
- Extract to `src/components/marketing/Navbar.tsx`

### 2. Hero (server + client components)
- Headline: "Stop Losing Your **Developer Knowledge**" with gradient text (`bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 bg-clip-text text-transparent`)
- Subheadline about scattered knowledge with CTA buttons (Get Started Free → `/auth/register`, See Features → `#features`)
- Chaos-to-order visual: 3-column grid (chaos / arrow / dashboard)
  - **ChaosContainer** — client component with `useEffect`/`requestAnimationFrame` for floating icons (Notion, GitHub, Slack, VS Code, browser, terminal, file, bookmark). Icons drift, bounce off walls, gently repel from mouse. Use Lucide React icons or inline SVGs from the mockup.
  - **TransformArrow** — CSS pulse animation (server, CSS keyframe)
  - **DashboardPreview** — static server component: sidebar nav lines, 3×2 stat pills, 6 dummy item cards with colored top borders matching item type colors

### 3. Features (server component)
- 6 cards in a responsive grid (3 cols → 2 → 1)
- Cards: Code Snippets (blue), AI Prompts (amber), Instant Search (indigo), Commands (cyan), Files & Docs (slate), Collections (green)
- Each card: accent-colored top border, icon box with accent bg tint, title, description
- Extract to `src/components/marketing/Features.tsx`

### 4. AI Section (server component)
- Two-column layout (stacks on mobile)
- Left: "Pro Feature" badge (amber gradient pill), headline, checklist with green checkmark icons for 4 AI features
- Right: Code editor mockup with macOS dots, JSON tag snippet, "AI Generated Tags" badge, radial blue glow
- Match the mockup styling from `prototypes/homepage/index.html`

### 5. Pricing (client component)
- Section heading, Monthly/Yearly toggle switch with "Save 25%" badge
- Two cards: Free ($0, 50 items, 3 collections, basic search, all types) and Pro ($8/mo highlighted with "Most Popular" badge and blue border, unlimited items/collections, AI features, 50MB uploads)
- Yearly toggle switches Pro card to `$72/year`
- Free CTA → `/auth/register`, Pro CTA → `/auth/register?plan=pro`
- Extract to `src/components/marketing/Pricing.tsx` ("use client")

### 6. CTA (server component)
- "Ready to Organize Your Knowledge?" headline
- "Get Started Free" button → `/auth/register`

### 7. Footer (server component)
- Logo, "Your developer knowledge, organized." tagline
- Link columns: Product (Features, Pricing, Changelog), Resources (Docs, API, Blog), Company (About, Privacy, Terms)
- Copyright with `new Date().getFullYear()` (client wrapper or `suppressHydrationWarning`)
- Extract to `src/components/marketing/Footer.tsx`

## Technical

- Delete existing `prototypes/homepage/` folder after implementation is complete (no longer needed)
- Use Tailwind classes only — no custom CSS files
- Use shadcn Button component (from `@/components/ui/button`) for all CTAs
- All links/buttons route to correct app paths: `/auth/login`, `/auth/register`, `/auth/register?plan=pro`
- Navbar scroll border effect: wrap in a tiny client component that tracks `scrollY` via event listener
- Chaos animation: create `src/components/marketing/ChaosContainer.tsx` ("use client") with `requestAnimationFrame` loop
- Keep the existing `auth()` session check at the top of `page.tsx` with `redirect("/dashboard")`
- Component files go in `webapp/src/components/marketing/`
- Keep code DRY — extract repeated section headers, icon patterns, card structures into reusable building blocks
