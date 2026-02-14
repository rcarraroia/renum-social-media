# Feature Developer Agent Playbook — `renum-social-media`

## Mission
Implement new product features end-to-end (UI → services → integration) in a way that matches the repository’s existing structure and conventions, and that is safe to merge (tested, consistent UI, no regressions).

---

## Where to Work (Focus Areas)

### 1) UI Components (Reusable building blocks)
**Primary directory:** `src/components/ui/`  
Use and extend these components instead of creating one-off UI patterns.

Key UI primitives/patterns already present:
- `src/components/ui/button.tsx` — `Button` + `ButtonProps`
- `src/components/ui/textarea.tsx` — `Textarea` + `TextareaProps`
- `src/components/ui/badge.tsx` — `Badge` + `BadgeProps`
- `src/components/ui/skeleton.tsx` — loading placeholder pattern
- `src/components/ui/sidebar.tsx` — sidebar + `useSidebar` hook
- `src/components/ui/chart.tsx` — charts + `ChartConfig` + `useChart`
- `src/components/ui/carousel.tsx` — carousel + `useCarousel`

**When implementing a feature:** prefer composing these primitives first; only add new primitives when the pattern is reused in multiple views.

---

### 2) Pages / Views (Feature surfaces)
**Primary directories:**
- `src/pages`
- `src/components` (feature-level components)
- `src/components/layout` (shell/layout)
- `src/components/auth` (auth-related UI and request handling)

**Rule of thumb:**
- Page components orchestrate data fetching + layout.
- Feature components encapsulate UI + local state.
- UI primitives remain generic.

---

### 3) Services (Business logic + external integrations)
**Primary directory:** `src/services/`  
Encapsulate orchestration, API calls, and business logic here.

Key service modules:
- `src/services/auth.ts`
  - `signUp`
  - `signIn`
  - `signOut`
  - `getCurrentUser`
  - `updateLastLogin`
- `src/services/opusclip.ts`
  - Types: `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`
  - Class: `OpusClipService`

**Service-layer convention:** keep network/external concerns in services and keep UI components thin.

---

### 4) Public assets
**Directory:** `public`  
Use for static assets referenced by UI.

---

## Key Files and Their Purpose

- `src/services/auth.ts`  
  Authentication flows (sign-up/in/out), current user retrieval, and last-login updates. Use as the single source of truth for auth operations.

- `src/services/opusclip.ts`  
  Integration/service abstraction for OpusClip workflows. Use `OpusClipService` and exported types instead of duplicating request/response shapes.

- `src/components/ui/button.tsx`, `textarea.tsx`, `badge.tsx`  
  Canonical UI primitives—reuse to ensure consistent style and behavior.

- `src/components/ui/sidebar.tsx`  
  Sidebar system; use `useSidebar` for state control.

- `src/components/ui/skeleton.tsx`  
  Standard loading placeholder—use during async fetches.

- `src/components/ui/chart.tsx` and `carousel.tsx`  
  Established patterns for data visualization and carousels; follow the existing hook-driven APIs (`useChart`, `useCarousel`).

---

## Standard Feature Delivery Workflow

### Step 0 — Confirm Feature Scope (before coding)
Collect:
- User story + acceptance criteria
- Target route/page (where the feature lives)
- Data requirements (what inputs/outputs, which service owns it)
- Loading/error/empty states
- Permissions/auth requirements (do we require current user?)

Deliverable: a short implementation plan describing:
- Files you will touch
- New/updated types and service methods
- UI components involved
- Testing approach

---

### Step 1 — Find the Existing Pattern to Mirror
Before creating anything new, search for similar flows:
- Auth-gated pages or UI in `src/components/auth`
- Async request patterns that show loading skeletons
- Pages that integrate service methods

**Rule:** follow existing conventions over introducing new architecture.

---

### Step 2 — Implement/Extend the Service Layer First
When a feature requires data fetching or external actions:

1. **Add or extend types** in the relevant service module (e.g., `CreateProjectRequest`-style types in `opusclip.ts`).
2. **Add a method** to the correct service module/class:
   - Auth-related: extend `src/services/auth.ts`
   - OpusClip-related: extend `OpusClipService` in `src/services/opusclip.ts`
3. **Keep UI-agnostic behavior in services:**
   - Request building, parsing, validation, mapping, retries/timeouts (if present in existing patterns)
4. **Return typed objects** using the exported types so pages/components can rely on stable shapes.

**Don’ts:**
- Don’t fetch directly inside UI primitives.
- Don’t duplicate OpusClip/auth request shapes in components.

---

### Step 3 — Build Feature UI by Composing UI Primitives
1. Create/modify a feature component in `src/components/` (or page in `src/pages`).
2. Use existing primitives:
   - `Button` for actions
   - `Textarea` for text inputs
   - `Badge` for status labels
   - `Skeleton` for loading state
3. Use hooks exposed by existing UI systems where appropriate:
   - `useSidebar` for sidebar interactions
   - `useChart` / `ChartConfig` for charts
   - `useCarousel` for carousels

**State handling guidance:**
- Local UI state stays in the feature component.
- Service calls happen in the page/feature component (not in primitives).
- Keep components small and composable.

---

### Step 4 — Handle Async UX Correctly (Loading / Error / Empty)
For any async operation:
- **Loading:** show `Skeleton` where data will render.
- **Error:** render a clear message + a retry action (`Button`).
- **Empty:** show guidance text and an action to create/populate data.

Checklist:
- No “silent failures”
- Buttons disabled while submitting (where applicable)
- Avoid double submits

---

### Step 5 — Wire Auth Requirements Consistently
When a feature depends on authentication:
- Use `getCurrentUser` to determine session/user.
- After sign-in flows, call `updateLastLogin` if that matches current behavior.
- Keep auth orchestration in `src/services/auth.ts` and auth UI in `src/components/auth`.

---

### Step 6 — Validate Types and Exports
- Prefer reusing exported types like:
  - `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`
  - `ButtonProps`, `TextareaProps`, `BadgeProps`
- If you introduce new types:
  - Put them close to the service/component that owns them
  - Export them only if they are used across modules

---

### Step 7 — Tests and Verification (Repository-Adapted)
If the repo has an established test setup, follow it; otherwise, at minimum provide:
- A manual test checklist (see below)
- Guardrails in code (types, basic runtime checks for required fields, clear errors)

**Recommended testing targets (when test infra exists):**
- Service methods: success + failure + malformed response cases
- Feature component: loading/error/empty/success render paths

---

## Common Task Playbooks

### A) Add a New OpusClip-Driven Feature (Create/List/Manage Clips)
1. Extend `src/services/opusclip.ts`
   - Add request/response types next to `CreateProjectRequest`
   - Add method(s) to `OpusClipService`
2. In the page/feature component:
   - Call the `OpusClipService` method
   - Render `Skeleton` while pending
   - Render results using `Badge` for status and `Button` for actions
3. If displaying items:
   - Use `Carousel` if the UX calls for a horizontally browsable set
   - Use `Chart` if showing metrics (align with `ChartConfig`)

**Acceptance checklist:**
- Service returns typed data
- UI handles all async states
- No direct fetch logic inside UI primitives

---

### B) Add/Modify Authentication-Dependent Behavior
1. Update `src/services/auth.ts` (single source of truth)
2. Update relevant UI in `src/components/auth`
3. Ensure:
   - Sign-in/out flows are consistent
   - `getCurrentUser` is used for gating
   - `updateLastLogin` invoked where appropriate

---

### C) Add a New Reusable UI Primitive
Only do this if the component will be reused across features.

Steps:
1. Create `src/components/ui/<component>.tsx`
2. Export props type (like `ButtonProps`, `BadgeProps`)
3. Ensure it is generic (no feature-specific logic)
4. Keep API consistent with existing UI components:
   - typed props
   - sensible defaults
   - composable children

---

### D) Add a New Page / Feature Surface
1. Add new route/page in `src/pages` (match existing structure)
2. Move feature UI into `src/components/<feature>/...` if it grows
3. Use layout primitives from `src/components/layout` where appropriate
4. Keep service calls out of UI primitives

---

## Codebase-Conformant Best Practices

### Service Layer
- Keep business logic centralized in `src/services/*`.
- Expose typed entities (`OpusClipProject`, etc.).
- Prefer a single service abstraction (`OpusClipService`) over scattered functions for the same domain.

### UI Consistency
- Use existing primitives for consistent styling and behavior.
- Prefer hook-based integrations (`useSidebar`, `useChart`, `useCarousel`) rather than ad-hoc state patterns.

### Type Safety
- Reuse exported types instead of duplicating shapes in components.
- Introduce new types in the owning module and export only when needed across modules.

### UX Quality Bar
- Always implement loading/error/empty states for async UI.
- Disable actions while submitting.
- Provide a retry path after failures.

---

## “Definition of Done” for a Feature PR
- Feature matches acceptance criteria and is discoverable in the intended page/flow.
- Service logic lives in `src/services/*` (no business logic in UI primitives).
- Uses existing UI primitives (`Button`, `Textarea`, `Badge`, `Skeleton`) where applicable.
- Handles loading/error/empty states.
- No duplicated request/response types if equivalents exist.
- Manual test checklist included in PR description:
  - Happy path
  - Error path (network/API failure)
  - Empty state
  - Authenticated vs unauthenticated behavior (if relevant)

---

## Quick Manual Test Checklist (Template)
- [ ] Navigate to the feature entry point (page/menu/button).
- [ ] Verify loading skeletons appear during fetch.
- [ ] Verify successful data renders correctly.
- [ ] Force an error (offline / invalid input) and verify error UI + retry works.
- [ ] Verify empty state UI when there is no data.
- [ ] Verify buttons disable during submit and no duplicate actions occur.
- [ ] If auth-gated: verify behavior when signed out and signed in.

---

## Practical File-Touch Map (Cheat Sheet)
- New external integration or domain behavior → `src/services/<domain>.ts`
- Auth flows → `src/services/auth.ts` and `src/components/auth/*`
- New page surface → `src/pages/*`
- Feature UI composition → `src/components/*`
- Shared UI component → `src/components/ui/*`
- Loading UI → `src/components/ui/skeleton.tsx`
- Sidebar-related UI/state → `src/components/ui/sidebar.tsx`
- Charts/carousels → `src/components/ui/chart.tsx`, `src/components/ui/carousel.tsx`
- Static assets → `public/*`
