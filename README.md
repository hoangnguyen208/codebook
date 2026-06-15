# CodeBook

A developer knowledge hub—your personal library for code snippets, prompts, commands, notes, links, files, and images. Built with Next.js + .NET, featuring AI-powered tagging, description generation, code explanation, and prompt optimization.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [AI Features](#ai-features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Data Model](#data-model)
- [Testing](#testing)
- [AI-Assisted Development](#ai-assisted-development)

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│  .NET 10     │────▶│  SQL Server  │
│   Web App    │     │  REST API    │     │  (CodeBookApi)│
│  :3000       │     │  :5000       │     │  :1433        │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │                                              
       │ OIDC (NextAuth v5)                           
       ▼                                              
┌──────────────┐     ┌──────────────┐                
│   Duende     │────▶│  SQL Server  │                
│ Identity Srv │     │ (CodeBookId) │                
│  :5001       │     │  :1433        │                
└──────────────┘     └──────────────┘                
       │                                              
       │ Email                                         
       ▼                                              
┌──────────────┐                                      
│    Resend    │                                      
│   (Email)    │                                      
└──────────────┘                                      
```

Four Docker Compose services orchestrated on a custom bridge network with health-check dependency ordering.

| Service | Port | Purpose |
|---------|------|---------|
| `webapp` | 3000 | Next.js 16 App Router frontend |
| `api` | 5000 | .NET 10 REST API (JWT Bearer auth) |
| `identity` | 5001 | Duende IdentityServer 7 + ASP.NET Core Identity |
| `sqlserver` | 1433 | SQL Server 2022 (two databases: `CodeBookApi`, `CodeBookIdentity`) |

External services: **OpenAI** (GPT-5-nano for AI features), **Stripe** (payments), **Cloudflare R2** (file storage), **Resend** (transactional email).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui (Radix + Base UI components) |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Markdown** | `react-markdown` + `remark-gfm` + `@tailwindcss/typography` |
| **Validation** | Zod 4 (client + server actions) |
| **Backend API** | .NET 10, ASP.NET Core, Entity Framework Core 10 |
| **Auth (Frontend)** | NextAuth v5 (JWT sessions, OIDC via Duende) |
| **Auth (Backend)** | Duende IdentityServer 7 (OIDC/OAuth), ASP.NET Core Identity |
| **Database** | SQL Server 2022 (EF Core ORM, auto-migration on startup) |
| **AI** | OpenAI Responses API (GPT-5-nano) |
| **Payments** | Stripe (checkout, customer portal, webhooks) |
| **Storage** | Cloudflare R2 (S3-compatible, via AWS SDK) |
| **Email** | Resend |
| **Testing (C#)** | xUnit 3 + Moq (113+ tests) |
| **Testing (TS)** | Vitest + Testing Library (29 AI tests) |
| **Containerization** | Docker Compose (4 services) |
| **Logging** | Serilog (Identity service) |

---

## Features

### Dashboard & Navigation
- Dark-first dashboard with collapsible sidebar
- Stats cards (items, collections, favorites)
- Recent collections (6) with type icon badges and dominant color borders
- Pinned items section (appears when items are pinned)
- Recent activity list (10 most recently updated items)
- Mobile drawer sidebar navigation
- **Cmd+K / Ctrl+K** global fuzzy search across items and collections

### Item Types & Management
Seven built-in item types, each with a distinct color and icon:

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| Snippet | `<Code2/>` | Blue | Code snippets with Monaco code editor |
| Prompt | `<Sparkles/>` | Purple | AI prompts with markdown editor |
| Command | `<Terminal/>` | Orange | Terminal commands with code editor |
| Note | `<FileText/>` | Yellow | Freeform notes with markdown editor |
| Link | `<Link2/>` | Emerald | URLs with link input |
| File | `<File/>` | Slate | File uploads with download support |
| Image | `<FileImage/>` | Pink | Image uploads with preview gallery |

Full CRUD for items via server actions and .NET REST API:
- **Create** — Type selector, dynamic form fields (code/markdown editor, language, URL, file upload), tag input with AI suggestions, collection multi-select
- **View** — Right-side Sheet drawer with code/markdown viewer, file preview, image gallery, download button
- **Edit** — Inline edit mode in drawer with same form as create
- **Delete** — Confirmation dialog in drawer
- **Favorite** — Star toggle on cards and in drawer
- **Pin** — Pin toggle on cards and in drawer, pinned items float to top of dashboard

### Collections
- Create, edit, delete collections
- Collection menu dropdown (Edit / Favorite / Delete) on hover
- Paginated collection grid at `/collections`
- Items within a collection at `/collections/[id]`
- Auto-attach new items to collection when created from a collection page
- Dashboard collection cards with type icon indicators

### Views
- `/items/[type]` — Items filtered by type, paginated (5 per page)
- `/collections` — All collections grid, paginated
- `/collections/[id]` — Items within a collection, paginated
- `/favorites` — Sortable list (Name/Date/Type) of favorited items and collections
- Image gallery view (3-column grid, 16:9 thumbnails, hover zoom)
- File list view (single-column with download buttons)

### Monetization (Stripe)
- **Free tier**: 50 items, 3 collections, no AI, no file/image uploads
- **Pro tier**: $8/month or $72/year, unlimited items/collections, all AI features unlocked
- Stripe Checkout flow, Customer Portal for subscription management
- Webhook handler for 5 event types (checkout, invoices, subscription updates)
- Feature gating: usage limit checks on creation, Pro badges on restricted types

### Editor Preferences
Per-user persisted settings across sessions:
- Font size (12–24px)
- Tab size (2, 4, or 8 spaces)
- Editor theme (8 Monaco themes: vs-dark, vs-light, hc-black, etc.)
- Word wrap toggle
- Minimap toggle

### Account & Settings
- Settings page with GitHub-style sidebar tab navigation
- Account section: change password, delete account, sign out all sessions
- Billing section: upgrade/manage subscription buttons
- Editor preferences section
- Profile page with usage stats

---

## AI Features

All AI features use OpenAI's **GPT-5-nano** model via the Responses API and are **Pro-only**. Rate limited to **20 requests per hour per user**.

| Feature | Description | Trigger |
|---------|-------------|---------|
| **Auto-Tagging** | Suggests 3–5 lowercase tags from title + content. Accept/reject individual suggestions. | "Suggest Tags" button in create dialog and edit drawer |
| **Description Generation** | Generates a 1–2 sentence summary from title, content, type, language, and URL metadata. | "Generate description" button below description field |
| **Code Explanation** | Explains code snippets or terminal commands in 200–300 words using markdown formatting. Covers what the code does, key concepts, and notable patterns. | "Explain" tab in CodeEditor for snippet/command items |
| **Prompt Optimization** | Refines AI prompts to be clearer, more specific, and more effective while preserving intent. Accept/Reject the optimized version. | "Optimize" button in MarkdownEditor header for prompt items |

Implementation pattern: each AI feature has a Zod-validated server action gated by Pro auth check + in-memory rate limit bucket, calling the OpenAI client via a shared `aiQuery()` helper.

---

## Getting Started

### Prerequisites

- **Docker** and Docker Compose
- Node.js 20+ (for local frontend development)
- .NET SDK 10 (for local backend development)

### Quick Start (Docker Compose)

```bash
# Clone the repository
git clone <repo-url> codebook
cd codebook

# Copy and configure environment files
cp webapp/.env.example webapp/.env
cp api/CodeBook.Api/.env.example api/CodeBook.Api/.env
cp api/CodeBook.Identity/.env.example api/CodeBook.Identity/.env

# Start all services
docker compose up -d
```

A demo user is seeded automatically:
- **Username**: `bob`
- **Password**: `Pass123$`

### Local Development

```bash
# Start only the backend services
docker compose up -d sqlserver identity api

# Run the Next.js dev server
cd webapp
npm install
npm run dev
```

### Useful Commands

```bash
# Frontend
cd webapp
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest tests

# Backend
cd api/CodeBook.Api
dotnet run           # Run API server

# Tests
cd tests/CodeBook.Api.Tests
dotnet test          # Run all C# tests
```

---

## Environment Variables

### Webapp (`webapp/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -hex 32`) |
| `AUTH_URL` | Yes | Frontend URL |
| `AUTH_TRUST_HOST` | Yes | Set to `true` for dev/Docker |
| `AUTH_DUENDE_ISSUER` | Yes | Identity Server URL |
| `AUTH_DUENDE_CLIENT_ID` | Yes | OIDC client ID |
| `AUTH_DUENDE_CLIENT_SECRET` | Yes | OIDC client secret |
| `OPEN_API_KEY` | Pro | OpenAI API key (for AI features) |
| `R2_ACCOUNT_ID` | Pro | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Pro | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Pro | R2 secret key |
| `R2_BUCKET_NAME` | Pro | R2 bucket name |
| `R2_PUBLIC_URL` | Pro | R2 public URL |
| `STRIPE_SECRET_KEY` | Pro | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Pro | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | Pro | Stripe monthly price ID |
| `STRIPE_PRICE_ID_YEARLY` | Pro | Stripe yearly price ID |

### API (`api/CodeBook.Api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ConnectionStrings__DefaultConnection` | Yes | SQL Server connection string |
| `IDENTITY_AUTHORITY` | Yes | Identity Server URL |

### Identity (`api/CodeBook.Identity/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ConnectionStrings__DefaultConnection` | Yes | SQL Server connection string |
| `GitHub__ClientId` | No | GitHub OAuth client ID |
| `GitHub__ClientSecret` | No | GitHub OAuth client secret |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `RESEND_FROM_EMAIL` | Yes | From email address |
| `RESEND_FROM_NAME` | Yes | From name |

---

## Project Structure

```
codebook/
├── webapp/                          # Next.js 16 frontend
│   ├── src/
│   │   ├── app/                     # App Router pages & layouts
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── items/[type]/        # Items by type
│   │   │   ├── collections/         # Collection grid & detail
│   │   │   ├── favorites/           # Favorited items & collections
│   │   │   ├── settings/            # Account, preferences, billing
│   │   │   ├── profile/             # Usage stats
│   │   │   └── upgrade/             # Pricing & Stripe checkout
│   │   ├── actions/                 # Server actions (Zod-validated)
│   │   │   ├── items.ts             # Item CRUD, toggle favorite/pin
│   │   │   ├── collections.ts       # Collection CRUD, toggle favorite
│   │   │   ├── ai.ts                # AI features (tags, desc, explain, optimize)
│   │   │   ├── preferences.ts       # Editor preferences get/update
│   │   │   └── profile.ts           # Account deletion
│   │   ├── components/              # React components
│   │   │   ├── dashboard/           # DashboardShell, sidebar, header, stats
│   │   │   ├── items/               # Item cards, drawer, create dialog, editors
│   │   │   ├── collections/         # Collection cards, create/edit dialogs
│   │   │   ├── search/              # GlobalSearch, SearchProvider
│   │   │   ├── settings/            # Settings client, editor preferences
│   │   │   ├── marketing/           # Homepage sections
│   │   │   └── ui/                  # shadcn/ui primitives
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── use-tag-suggestions.ts
│   │   │   ├── use-generate-description.ts
│   │   │   ├── use-collection-actions.ts
│   │   │   └── use-drawer-ai.ts
│   │   ├── lib/                     # Shared utilities
│   │   │   ├── ai.ts                # OpenAI client + AI_MODEL
│   │   │   ├── ai-rate-limit.ts     # In-memory rate limiter
│   │   │   ├── action-result.ts     # ActionResult<T> type
│   │   │   ├── action-auth.ts       # requireAuth, requireProAuth guards
│   │   │   ├── action-validate.ts   # validateOrFail Zod helper
│   │   │   ├── action-wrap.ts       # wrapDbAction error wrapper
│   │   │   ├── color-utils.ts       # Shared color/token maps
│   │   │   ├── icons.ts             # Shared item type icons
│   │   │   ├── item-type-config.ts  # Type-conditional sets & config
│   │   │   ├── stripe.ts            # Stripe client
│   │   │   ├── fetch.ts             # API fetch helpers with retry
│   │   │   ├── languages.ts         # Programming language options
│   │   │   └── db/                  # Database query functions
│   │   └── types/                   # TypeScript type definitions
│   ├── tests/                       # Vitest tests
│   ├── auth.ts                      # NextAuth v5 init
│   ├── auth.config.ts               # Duende OIDC provider + callbacks
│   ├── proxy.ts                     # Auth middleware
│   └── next.config.ts              # Next.js config
│
├── api/
│   ├── CodeBook.Api/                # .NET 10 REST API
│   │   ├── Controllers/             # Items, Collections, Dashboard, etc.
│   │   ├── Models/                  # EF Core entity models
│   │   ├── DTOs/                    # Request/response DTOs
│   │   ├── Data/                    # DbContext, migrations, seeder
│   │   └── Program.cs               # App startup
│   └── CodeBook.Identity/           # Duende IdentityServer 7
│       ├── Pages/                   # Razor Pages (Login, Register, etc.)
│       ├── Services/                # ProfileService, RateLimiterService
│       └── Program.cs               # Identity startup
│
├── tests/
│   └── CodeBook.Api.Tests/          # xUnit + Moq tests (113+)
│
├── context/                         # Feature specs & project docs
│   ├── project-overview.md          # Full architecture & roadmap
│   ├── current-feature.md           # Current feature + history
│   ├── coding-standards.md          # Code conventions
│   ├── ai-interaction.md            # AI dev workflow
│   └── features/                    # 27 feature specs
│
├── .opencode/                       # OpenCode AI configuration
│   ├── agents/                      # AI sub-agents
│   └── skills/                      # AI skills
│
├── docker-compose.yml               # 4-service orchestration
└── codebook.sln                     # .NET solution file
```

---

## API Endpoints

### .NET API (`localhost:5000`)

**Items**
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/items` | Create item |
| `GET` | `/api/items/{id}` | Get item detail |
| `PUT` | `/api/items/{id}` | Update item |
| `DELETE` | `/api/items/{id}` | Delete item |
| `PUT` | `/api/items/{id}/favorite` | Toggle favorite |
| `PUT` | `/api/items/{id}/pin` | Toggle pin |

**Collections**
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/collections` | List collections (paginated) |
| `POST` | `/api/collections` | Create collection |
| `GET` | `/api/collections/{id}` | Get collection |
| `PUT` | `/api/collections/{id}` | Update collection |
| `DELETE` | `/api/collections/{id}` | Delete collection |
| `PUT` | `/api/collections/{id}/favorite` | Toggle favorite |

**Dashboard & Discover**
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/dashboard/items/recent` | Recent items (10) |
| `GET` | `/api/dashboard/items/by-type/{typeName}` | Items by type (paginated) |
| `GET` | `/api/dashboard/items/by-collection/{id}` | Items by collection (paginated) |
| `GET` | `/api/dashboard/favorites` | All favorites |
| `GET` | `/api/dashboard/item-types/system` | System item types |
| `GET` | `/api/dashboard/collections` | Collections (paginated) |
| `GET` | `/api/dashboard/collections/recent` | Recent collections (6) |

**User & Misc**
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/profile/stats` | User stats |
| `GET` | `/api/preferences` | Get editor preferences |
| `PUT` | `/api/preferences` | Update editor preferences |
| `GET` | `/api/usage/limits` | Usage limits |
| `POST` | `/api/webhooks/stripe` | Stripe webhook |

### Identity Server (`localhost:5001`)

Standard OIDC endpoints (`.well-known/openid-configuration`, `connect/token`, `connect/userinfo`) plus:
- `/Account/Login` — Login page
- `/Account/Register` — Registration page (email verification via Resend)
- `/Account/ForgotPassword` — Password reset flow
- `/Account/Manage` — Account management

---

## Data Model

### CodeBookApi Database

```
Item ────────── Many-to-Many ─────── Tag (via ItemTag)
Item ────────── Many-to-Many ─────── Collection (via ItemCollection)
Item ────────── FK ───────────────── ItemType
UserPreference ─ PK (UserId)
```

**Item**: title, typeName, description, content, url, language, fileUrl/fileName/fileSize, contentType, isFavorite, isPinned, userId, tags, collections

**ItemType**: 7 system types (snippet, prompt, command, note, file, image, link) with name, icon, color

**Collection**: name, description, isFavorite, items

**UserPreference**: per-user editor settings persisted as JSON

### CodeBookIdentity Database

**ApplicationUser** extends `IdentityUser` with: `IsPro`, `StripeCustomerId`, `StripeSubscriptionId`

---

## Testing

### Backend Tests (C#)
```
tests/CodeBook.Api.Tests/
├── Controllers/     # ItemsController, CollectionsController, DashboardController, etc.
│                    # 113+ tests using xUnit + Moq + EF Core async query provider
```

Run: `dotnet test` from the `tests/CodeBook.Api.Tests/` directory.

### Frontend Tests (TypeScript)
```
webapp/tests/
├── actions/
│   └── ai.test.ts   # 29 tests for AI server actions (auto-tags, description, code explain)
```

Run: `npm run test` from the `webapp/` directory.

---

## AI-Assisted Development

This project was built using an **AI pair-programming workflow** powered by [OpenCode](https://opencode.ai). Key aspects:

### Workflow
1. **Spec first** — Every feature starts as a spec in `context/features/` with requirements, data model changes, API endpoints, and UI details
2. **Single feature at a time** — `context/current-feature.md` tracks the active feature and full history
3. **Branch per feature** — `feature/<name>` branches, merged to `main` after build passes
4. **Iterate** — Implement → test in browser → run lint/build → fix → iterate
5. **Periodic scans** — Refactoring agents scan for duplication and oversize components

### AI Agents
- **`refactor-scanner`** — Scans folders for duplicate code patterns (e.g., found 5x `colorClasses` duplication, 3x `itemTypeIcons`, split 1043-line `DashboardShell` into 5 files)
- **`ui-reviewer`** — Playwright-based visual audit (responsiveness, accessibility, missing states)
- **`auth-auditor`** — Security review of NextAuth + Duende IdentityServer integration

### AI in the Product
Beyond development, AI is also integrated as a **user-facing feature**—tag suggestions, description generation, code explanation, and prompt optimization—all using OpenAI's GPT-5-nano model. See [AI Features](#ai-features) above.

### Context Files
- `project-overview.md` — Full architecture diagrams (Mermaid), data model, roadmap
- `coding-standards.md` — C#/TypeScript conventions
- `ai-interaction.md` — AI development workflow rules
- `current-feature.md` — 90+ entries of feature development history

---
