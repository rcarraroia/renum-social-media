## Architecture Notes

This repository implements a **single-page web application** for managing social-media-related workflows, built as a **modular frontend monolith**. The codebase centers around:

- A React application shell (`src/main.tsx`, `src/App.tsx`) that wires global providers, routing/layout composition, and authentication state listening.
- A set of **UI components** (largely “shadcn/ui”-style primitives) that standardize presentation and interaction patterns.
- A small set of **service modules** that encapsulate external integrations (notably **Supabase Auth** and an **OpusClip** API client).
- A **typed data contract layer** (`src/types/database.types.ts`) that defines the canonical shapes for persisted entities (organizations, users, videos, posts, logs) and is reused across services/hooks/components.

The architecture favors:
- **Separation of concerns**: “services” for remote calls, “hooks” for stateful orchestration, “components” for UI.
- **Type-first integration**: shared TypeScript types reduce drift between UI and data access code.
- **Client-side composition**: most domain orchestration is performed in hooks/components rather than a server-side backend layer within this repo.

> Cross-reference: the request and state transitions are detailed further in [`data-flow.md`](./data-flow.md). For symbol-level detail and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

---

## System Architecture Overview

### Topology and deployment model
- **Topology:** Frontend monolith (modular SPA).
- **Runtime:** Browser-executed React application.
- **External backends:** Supabase (authentication and likely database access) and OpusClip (media processing/project creation).

### Request / control flow (typical)
1. **User interaction** occurs in a page or feature component (under `src/pages/` and `src/components/`).
2. UI components delegate **stateful logic** to hooks (under `src/hooks/`), e.g., auth/session or organization selection.
3. Hooks/services invoke **service modules** (under `src/services/`) that perform HTTP calls to external platforms:
   - `src/services/auth.ts` wraps authentication operations.
   - `src/services/opusclip.ts` provides an API client class for OpusClip operations.
4. Results are returned to hooks/components and rendered via UI primitives (`src/components/ui/`).

### Layer pivot points
- **UI → Hook boundary:** UI components remain largely presentational; hooks own side effects and orchestration.
- **Hook → Service boundary:** services act as the I/O boundary, isolating vendor APIs and credentials from the rest of the app.
- **Service → Contract boundary:** service return values and persisted shapes are expressed via types in `src/types/`.

This design keeps vendor dependencies localized while allowing pages/components to remain testable and composable.

---

## Architectural Layers

- **Application Shell / Bootstrap**: App startup, global providers, and top-level routing/layout composition (`src/main.tsx`, `src/App.tsx`).
- **Pages / Feature Composition**: Route-level components and feature screens (`src/pages/`).
- **Layout Components**: Shared layouts and structural wrappers (`src/components/layout/`).
- **Feature Components**: Domain or feature-specific components (e.g., auth gating/forms) (`src/components/`, `src/components/auth/`).
- **UI Primitives (Design System)**: Reusable visual components and interaction primitives (`src/components/ui/`).
- **Hooks (Orchestration Layer)**: Stateful logic, subscriptions, responsive helpers, and cross-cutting orchestration (`src/hooks/`).
- **Services (Integration Layer)**: External API clients and auth helper methods (`src/services/`).
- **Types / Contracts**: Canonical TypeScript types for database entities and shared contracts (`src/types/`).
- **Utilities**: Generic helpers and formatting (`src/utils/`, `src/lib/`).
- **Public Assets / Static**: Static files served as-is (`public/`).

> See [`codebase-map.json`](./codebase-map.json) for complete symbol counts and dependency graphs.

---

## Detected Design Patterns

| Pattern | Confidence | Locations | Description |
|---------|------------|-----------|-------------|
| Layered Architecture (UI → Hooks → Services) | 85% | `src/components/**`, `src/hooks/**`, `src/services/**` | Clear separation between presentation, orchestration, and integration boundaries. |
| Service Wrapper / Adapter | 85% | [`src/services/auth.ts`](../src/services/auth.ts), [`src/services/opusclip.ts`](../src/services/opusclip.ts) | Encapsulates vendor APIs (Supabase Auth, OpusClip) behind app-friendly functions/classes. |
| Client Class (API Client) | 80% | [`OpusClipService`](../src/services/opusclip.ts) | Stateful class representing an integration client, concentrating request logic and types. |
| React Hooks as Controller/Orchestrator | 75% | [`useAuth`](../src/hooks/useAuth.ts), [`useOrganization`](../src/hooks/useOrganization.ts), [`useIsMobile`](../src/hooks/use-mobile.tsx) | Hooks coordinate side effects and expose a stable interface to components (controller-like role). |
| Route Guard / Protected Route | 70% | [`src/components/auth/ProtectedRoute.tsx`](../src/components/auth/ProtectedRoute.tsx) | Prevents unauthenticated access by gating children based on auth state. |
| Typed Contract Boundary | 70% | [`src/types/database.types.ts`](../src/types/database.types.ts) | Centralized type definitions used across layers to enforce shared contracts. |
| Presentational Component Library | 65% | `src/components/ui/*` (e.g., [`button.tsx`](../src/components/ui/button.tsx), [`badge.tsx`](../src/components/ui/badge.tsx)) | UI primitives are reusable and largely stateless, encouraging composition and consistency. |

---

## Entry Points

- [`src/main.tsx`](../src/main.tsx) — Browser entry; mounts the React app and includes auth listening (`SupabaseAuthListener`).
- [`src/App.tsx`](../src/App.tsx) — Application root; primary composition point for pages/layout and shared providers.
- [`src/components/layout/MainLayout.tsx`](../src/components/layout/MainLayout.tsx) — Core layout wrapper used by top-level routes/features.
- [`src/components/auth/ProtectedRoute.tsx`](../src/components/auth/ProtectedRoute.tsx) — Route-guard style entry for protected sections.
- [`public/`](../public) — Static asset entry (served directly by the hosting setup).

---

## Public API

Exported symbols detected in the codebase (intended for reuse across modules). Where UI components export both component and props, the table lists the exported types/symbols explicitly discovered.

| Symbol | Type | Location |
|--------|------|----------|
| `OpusClipService` | class | [`src/services/opusclip.ts`](../src/services/opusclip.ts) |
| `OpusClipProject` | interface | [`src/services/opusclip.ts`](../src/services/opusclip.ts) |
| `OpusClipClip` | interface | [`src/services/opusclip.ts`](../src/services/opusclip.ts) |
| `CreateProjectRequest` | interface | [`src/services/opusclip.ts`](../src/services/opusclip.ts) |
| `signUp` | function | [`src/services/auth.ts`](../src/services/auth.ts) |
| `signIn` | function | [`src/services/auth.ts`](../src/services/auth.ts) |
| `signOut` | function | [`src/services/auth.ts`](../src/services/auth.ts) |
| `getCurrentUser` | function | [`src/services/auth.ts`](../src/services/auth.ts) |
| `updateLastLogin` | function | [`src/services/auth.ts`](../src/services/auth.ts) |
| `useAuth` | function (hook) | [`src/hooks/useAuth.ts`](../src/hooks/useAuth.ts) |
| `useOrganization` | function (hook) | [`src/hooks/useOrganization.ts`](../src/hooks/useOrganization.ts) |
| `useIsMobile` | function (hook) | [`src/hooks/use-mobile.tsx`](../src/hooks/use-mobile.tsx) |
| `cn` | function | [`src/lib/utils.ts`](../src/lib/utils.ts) |
| `formatDateShort` | function | [`src/utils/formatters.ts`](../src/utils/formatters.ts) |
| `Json` | type | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `OrganizationsRow` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `UsersRow` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `UserWithOrganization` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `VideosRow` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `PostsRow` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `ApiLogsRow` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `Database` | interface | [`src/types/database.types.ts`](../src/types/database.types.ts) |
| `ButtonProps` | interface | [`src/components/ui/button.tsx`](../src/components/ui/button.tsx) |
| `BadgeProps` | interface | [`src/components/ui/badge.tsx`](../src/components/ui/badge.tsx) |
| `TextareaProps` | interface | [`src/components/ui/textarea.tsx`](../src/components/ui/textarea.tsx) |
| `CalendarProps` | type | [`src/components/ui/calendar.tsx`](../src/components/ui/calendar.tsx) |
| `ChartConfig` | type | [`src/components/ui/chart.tsx`](../src/components/ui/chart.tsx) |

---

## Internal System Boundaries (optional)

While this repo is a single deployable SPA, it has clear **bounded seams**:

- **Auth boundary (Supabase):**
  - Ownership: `src/services/auth.ts` + `src/hooks/useAuth.ts` + `src/components/auth/*`.
  - Contract: user/session data flows from Supabase to UI; `ProtectedRoute` enforces access.
  - Synchronization: session is listened to at app bootstrap (`SupabaseAuthListener` in `src/main.tsx`), minimizing stale auth state.

- **Organization / Tenant boundary:**
  - Ownership: `src/hooks/useOrganization.ts` plus related UI selectors/pages.
  - Contract: `OrganizationsRow` and `UserWithOrganization` types define tenant context.
  - Constraint: organization context must be established before tenant-scoped actions (e.g., posts/videos) are executed.

- **Media processing boundary (OpusClip):**
  - Ownership: `src/services/opusclip.ts` and consumers.
  - Contract: `OpusClipProject`, `OpusClipClip`, and request types isolate vendor-specific shapes.

Shared contract enforcement is primarily TypeScript-based (compile-time). Runtime validation is not evident from the exported surface; where strict runtime guarantees are required, add schema validation at the service boundary.

---

## External Service Dependencies (optional)

- **Supabase (Auth / potentially DB)**
  - Usage: sign-up/sign-in/sign-out, current user retrieval, last-login update.
  - Auth method: Supabase session/JWT managed by Supabase client (exact instantiation details live in code; entry listening occurs in `src/main.tsx`).
  - Failure considerations: token expiry, network failure, and session desynchronization; mitigate with centralized listener + retry/backoff at call sites where appropriate.

- **OpusClip API**
  - Usage: project/clip creation and retrieval via [`OpusClipService`](../src/services/opusclip.ts).
  - Auth method: likely API key/Bearer token set in request headers (implementation is in `src/services/opusclip.ts`).
  - Failure considerations: rate limiting and long-running processing; consider idempotency keys for create calls and polling/backoff for status endpoints if applicable.

- **Hosting/CDN**
  - Static SPA hosting for `public/` and compiled assets.
  - Failure considerations: cache invalidation and environment-specific configuration (API URLs/keys).

---

## Key Decisions & Trade-offs (optional)

- **Frontend-monolith instead of micro-frontends:** simplifies deployment and cross-feature refactors; trade-off is repository growth and potential build-time increase.
- **Hooks-driven orchestration:** keeps components declarative and improves reuse; trade-off is that complex hooks can become “god hooks” if not segmented by domain.
- **Service wrappers for integrations:** reduces vendor coupling and centralizes error handling; trade-off is additional abstraction that must stay aligned with vendor API changes.
- **Type-centric contracts (database.types.ts):** improves maintainability and onboarding; trade-off is reliance on type generation/maintenance workflows to keep types current.

---

## Diagrams (optional)

```mermaid
flowchart LR
  subgraph Browser[Client (SPA)]
    UI[Pages & Components\nsrc/pages, src/components]
    UIK[UI Primitives\nsrc/components/ui]
    Hooks[Hooks / Orchestration\nsrc/hooks]
    Services[Services / Integrations\nsrc/services]
    Types[Contracts\nsrc/types]
    Utils[Utils\nsrc/utils, src/lib]
  end

  subgraph External[External Services]
    Supabase[Supabase Auth/DB]
    OpusClip[OpusClip API]
  end

  UI --> UIK
  UI --> Hooks
  Hooks --> Services
  Services --> Types
  Hooks --> Types
  UI --> Utils
  Hooks --> Utils

  Services --> Supabase
  Services --> OpusClip
```

---

## Risks & Constraints (optional)

- **Client-side secret management:** API keys must not be embedded in the frontend unless they are explicitly public/safe. Prefer backend proxying for privileged calls.
- **Rate limits / throttling:** external APIs (especially media processing) may enforce rate limits; add centralized handling in service wrappers.
- **Auth race conditions:** ensure session listener initialization precedes protected route evaluation to prevent flicker/false redirects (bootstrap ordering in `src/main.tsx` is critical).
- **Type drift:** if `src/types/database.types.ts` is generated, ensure CI checks prevent stale contracts.
- **Scaling constraints:** SPA performance depends on bundle size; keep UI primitives tree-shakeable and monitor large dependencies (charts/carousels).

---

## Top Directories Snapshot

Approximate snapshot of top-level directories (counts are directional; see repository for exact numbers):

- `src/` — primary application code (dozens of files across components, hooks, services, types, utils)
- `public/` — static assets (few to several files)
- `docs/` — documentation (multiple markdown files including architecture/data-flow/project overview)

> For fine-grained inventory, dependency graphs, and symbol indexing, see [`codebase-map.json`](./codebase-map.json).

---

## Related Resources

- [Project Overview](./project-overview.md)
- [Data Flow](./data-flow.md)
- [Codebase Map](./codebase-map.json)
