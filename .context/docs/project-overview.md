# Project Overview

`renum-social-media` is a web application for planning, organizing, and publishing social-media content with an organization-aware workflow. It helps creators and teams stay consistent by combining authentication, organization context, and content/video-related data models so you can manage posts and assets in one place.

## Codebase Reference

> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts

- Root: `E:\PROJETOS SITE\repositorios\renum-social-media`
- Languages: TypeScript/TSX (see [`codebase-map.json`](./codebase-map.json) for exact counts)
- Primary entry points:
  - App bootstrap: `src/main.tsx`
  - App shell/router: `src/App.tsx`
  - Shared UI components: `src/components/ui/*`
  - Services layer (auth + external integrations): `src/services/*`
  - Types/data contracts: `src/types/database.types.ts`
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points

- Client bootstrap (React mount + app startup): [`src/main.tsx`](../src/main.tsx)
  - Includes `SupabaseAuthListener` (auth state listener wiring).
- Application root (top-level composition used by multiple modules): [`src/App.tsx`](../src/App.tsx)
- Primary layout wrapper (shared page frame): [`src/components/layout/MainLayout.tsx`](../src/components/layout/MainLayout.tsx)
- Public static assets (served as-is): [`public/`](../public)

## Key Exports

The project exposes a small set of reusable building blocks across **services**, **hooks**, **types**, **utilities**, and **UI components**. For the complete list and exact locations, reference [`codebase-map.json`](./codebase-map.json). Highlights include:

- **Auth service functions**: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` (from `src/services/auth.ts`)
- **External integration service**: `OpusClipService` and related request/response interfaces (from `src/services/opusclip.ts`)
- **Hooks**: `useAuth`, `useOrganization`, `useIsMobile` (from `src/hooks/*`)
- **Utilities**: `cn` (className helper), `formatDateShort` (date formatter)
- **Shared UI types/components**: `ButtonProps`, `BadgeProps`, `CalendarProps`, `ChartConfig`, `TextareaProps`
- **Database contracts**: `Database`, `Json`, and row types like `UsersRow`, `OrganizationsRow`, `PostsRow`, `VideosRow`, `ApiLogsRow` (from `src/types/database.types.ts`)

## File Structure & Code Organization

Top-level structure (with the “why”):

- `src/` — Main application source code (React UI, hooks, services, types).
  - `src/components/` — Feature and layout components (including auth and layout).
    - `src/components/auth/` — Authentication UI and route protection (e.g., login/signup forms, protected routing).
    - `src/components/layout/` — Layout scaffolding shared across pages (e.g., `MainLayout`).
    - `src/components/ui/` — Reusable UI primitives (buttons, badges, charts, sidebar, form controls).
  - `src/pages/` — Page-level components (route targets).
  - `src/services/` — “Service layer” for auth and external APIs (e.g., OpusClip integration).
  - `src/hooks/` — Reusable React hooks (auth state, organization context, mobile detection, toast helpers).
  - `src/lib/` — Small cross-cutting helpers (e.g., `cn` utility).
  - `src/utils/` — Generic utilities (e.g., formatting).
  - `src/types/` — Shared TypeScript types; includes database schema types.
  - `src/stores/` — Client-side state containers (e.g., auth store).
  - `src/main.tsx` — App bootstrap entry.
  - `src/App.tsx` — App root composition.
- `public/` — Static assets published directly by the web build pipeline.
- `docs/` — Project documentation (this file, architecture, workflow, tooling, and the generated `codebase-map.json`).

For a deeper architectural view (layers, dependencies, hotspots), see [architecture.md](./architecture.md) and [`codebase-map.json`](./codebase-map.json).

## Technology Stack Summary

This codebase is a **TypeScript + React** single-page application (SPA) with a component-driven UI architecture and a small service layer for authentication and third-party integrations.

- **Runtime/platform**: Web (browser), built with a modern front-end toolchain (see `package.json` for exact scripts and versions).
- **Language**: TypeScript (including TSX for React components).
- **Auth & user context**: Implemented via `src/services/auth.ts` and app-level listening in `src/main.tsx` (see `SupabaseAuthListener`).
- **Data contracts**: Centralized in `src/types/database.types.ts` (typed rows and `Database` interface).
- **Quality/tooling**: The repository typically relies on standard front-end tooling (formatter/linter/test runner) as configured in project-level config files; check [tooling.md](./tooling.md) for the canonical setup and commands.

## Core Framework Stack (optional)

At a high level, the application follows a familiar layering:

- **UI layer (React components)**: `src/components/**`, `src/pages/**`
- **State & context (hooks/stores)**: `src/hooks/**`, `src/stores/**`
- **Service layer (API/auth/integrations)**: `src/services/**`
  - Auth service functions (`signIn`, `signUp`, etc.) provide a consistent interface for the rest of the app.
  - `OpusClipService` encapsulates the OpusClip integration behind typed request/response shapes.
- **Type contracts (database + domain)**: `src/types/**`

This encourages a pattern where pages/components call hooks/services rather than importing low-level clients directly—making behavior easier to test and update.

## UI & Interaction Libraries (optional)

The UI is organized around reusable primitives under `src/components/ui/` (e.g., `button`, `badge`, `textarea`, `calendar`, `chart`, `sidebar`). A common pattern is to export both the component and its prop types (e.g., `ButtonProps`, `BadgeProps`) so feature components can stay strongly typed.

You’ll also find interaction-focused hooks and helpers such as:

- Toast utilities (`src/hooks/use-toast.ts`) for consistent in-app notifications
- Responsive behavior via `useIsMobile` (`src/hooks/use-mobile.tsx`)

## Development Tools Overview (optional)

Most day-to-day work happens through package scripts (install, dev server, build, lint/format). For the authoritative list of scripts and environment expectations, see:

- [development-workflow.md](./development-workflow.md) — daily commands and recommended workflow
- [tooling.md](./tooling.md) — environment setup, linters/formatters, and debugging tips

## Getting Started Checklist

1. Install prerequisites
   - Install a current Node.js LTS version.
   - Ensure you have access to any required environment variables (auth/provider keys, API endpoints). Check [tooling.md](./tooling.md) for details.
2. Install dependencies  
   - Run: `npm install`
3. Configure environment  
   - Create/update your local env file (commonly `.env` / `.env.local`) with the required keys for auth and any integrations.
4. Start the dev server  
   - Run: `npm run dev`
5. Verify the app is working
   - Confirm you can load the app, create an account/sign in, and that organization context loads (see `useOrganization`).
6. Get oriented in the code
   - Start at `src/main.tsx` → `src/App.tsx` → `src/components/layout/MainLayout.tsx`
   - Skim [architecture.md](./architecture.md) for the big-picture structure.
7. Adopt the standard workflow
   - Follow [development-workflow.md](./development-workflow.md) for branching, scripts, and review conventions.

## Next Steps (optional)

If you’re new to the project, these are the quickest ways to build confidence:

- Read [architecture.md](./architecture.md) to understand how UI, hooks, and services are intended to interact.
- Use [`codebase-map.json`](./codebase-map.json) to identify the highest-impact modules (imports/exports, dependency hubs).
- Review [development-workflow.md](./development-workflow.md) and [tooling.md](./tooling.md) before making changes that affect build, formatting, or CI behavior.

## Related Resources

- [architecture.md](./architecture.md)
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)
- [codebase-map.json](./codebase-map.json)
