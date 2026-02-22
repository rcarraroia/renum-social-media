# Documentation Hub (`docs/README.md`)

This `docs/README.md` is the entry point for the repository’s internal documentation set. It provides a curated index of guides and a quick “where to start” path for developers working on **renum-social-media**.

Use this file to navigate the docs, understand the system at a high level, and find deeper references for architecture, workflows, testing, security, and integrations.

---

## How to use this documentation

Recommended reading order:

1. **Project Overview** → what the app is, what it does, and the major moving parts  
2. **Architecture Notes** → module boundaries, structure, and key technical decisions  
3. **Development Workflow** → running locally, branching, scripts, CI expectations  
4. Then pick a specialized guide depending on your task (testing, security, data flow, etc.)

---

## Core Guides

- **[Project Overview](./project-overview.md)**  
  High-level description of the product, core features, and major dependencies.

- **[Architecture Notes](./architecture.md)**  
  Source structure and responsibilities (components, services, types), plus system boundaries.

- **[Development Workflow](./development-workflow.md)**  
  Local setup, scripts, environment variables, and day-to-day engineering conventions.

- **[Testing Strategy](./testing-strategy.md)**  
  Test philosophy, tooling, how to run suites, and expected CI gates.

- **[Glossary & Domain Concepts](./glossary.md)**  
  Domain terms used in code and UI (organizations, posts, videos, etc.).

- **[Data Flow & Integrations](./data-flow.md)**  
  How data moves between UI, services, and external providers (notably Supabase and OpusClip).

- **[Security & Compliance Notes](./security.md)**  
  Authentication model, session handling, roles/permissions assumptions, and secret management.

- **[Tooling & Productivity Guide](./tooling.md)**  
  Helpful scripts, repo tooling, IDE hints, and automation notes.

- **[Design System](./design-system.md)**  
  Design tokens, UI components (shadcn/ui), colors, typography, spacing, and implementation guidelines.

---

## Repository snapshot (what you’ll see at the root)

Commonly referenced files/directories:

- `src/` — Application source (TypeScript + React)
- `public/` — Static assets served by the app
- `README.md` — Public-facing project readme (setup/usage)
- `package.json` / lockfiles — Dependencies and scripts (`npm`, `pnpm`)
- `vite.config.ts` — Vite build/dev configuration
- `tailwind.config.ts` / `postcss.config.js` — Styling toolchain
- `vercel.json` — Deployment configuration (Vercel)
- Setup notes:
  - `MCP_SETUP.md`
  - `WINDOWS_MCP_SETUP.md`
  - `install-mcp-dependencies.ps1`

---

## Codebase map (where things typically live)

This is the practical “where do I put/find X?” guide:

- **UI components**
  - `src/components/ui/` — reusable primitives (e.g., `button`, `badge`, `textarea`, charts) - baseados em shadcn/ui
  - `src/components/layout/` — layout scaffolding (e.g., `MainLayout`)
  - `src/pages/` — route-level pages / screens
  - `src/globals.css` — variáveis CSS do design system (cores, espaçamentos)
  - `tailwind.config.ts` — configuração do tema Tailwind

- **Auth**
  - `src/components/auth/` — auth UI and route protection (e.g., login/signup forms, protected routes)
  - `src/services/auth.ts` — auth operations (sign up/in/out, user lookup, last-login updates)
  - `src/hooks/useAuth.ts` — auth state access in React

- **Services / integrations**
  - `src/services/` — external APIs / integration clients
    - `src/services/opusclip.ts` — OpusClip API wrapper (`OpusClipService`)
  - `public/` — static service assets (if any)

- **Types / data models**
  - `src/types/database.types.ts` — database row types and `Database` typings (Supabase-style)

- **Utilities**
  - `src/lib/utils.ts` — shared helpers (e.g., `cn()` className combiner)
  - `src/utils/formatters.ts` — formatting helpers (e.g., `formatDateShort()`)

---

## Key “public API” modules (useful entry points)

These are common building blocks referenced throughout the app:

- **Authentication**
  - `src/services/auth.ts`: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`
  - `src/hooks/useAuth.ts`: `useAuth`

- **Organization context**
  - `src/hooks/useOrganization.ts`: `useOrganization`

- **OpusClip integration**
  - `src/services/opusclip.ts`: `OpusClipService`, request/response types (`OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`)

- **UI primitives**
  - `src/components/ui/*`: `Button`, `Badge`, `Textarea`, charts, calendar, etc.

- **Shared utilities**
  - `src/lib/utils.ts`: `cn`
  - `src/utils/formatters.ts`: `formatDateShort`

---

## Related documentation

If you’re editing or extending docs, keep these aligned:

- If you change repo structure or boundaries, update: **`architecture.md`**
- If you add/modify scripts, update: **`development-workflow.md`** and optionally **`tooling.md`**
- If you add a new integration (API/provider), update: **`data-flow.md`** and **`security.md`**
- If you add domain features/entities, update: **`glossary.md`**

---

## Contributing to the docs

When adding a new guide:

1. Create a new `docs/<topic>.md`
2. Add it to the **Core Guides** list above (or create a new section if it’s specialized)
3. Cross-link it from the most relevant existing guide (architecture/workflow/data-flow/etc.)

Keep docs:
- task-oriented (how to do X),
- accurate to the code (`src/services`, `src/hooks`, `src/types`),
- and easy to scan (headings, bullets, short examples).

---
