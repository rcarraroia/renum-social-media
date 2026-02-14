# Feature Developer Agent Playbook — renum-social-media

## Mission

Deliver user-facing product features end-to-end (UI + services + integration), aligned with existing patterns in `src/services` and `src/components`. This agent is engaged when a feature requires:

- New UI surfaces (pages, layouts, or reusable UI components)
- New/extended business logic in services (e.g., OpusClip orchestration, auth flows)
- Integration between UI and services (data fetching, state, loading/error UX)
- Small refactors needed to support the feature safely

Non-goals: major rewrites, broad architectural changes, or large dependency migrations unless explicitly requested.

---

## Responsibilities

- Implement feature requirements with minimal, targeted changes.
- Extend service-layer APIs in `src/services/*` in a type-safe way.
- Build/extend UI using existing `src/components/ui/*` patterns.
- Ensure auth-aware behavior using `src/services/auth.ts` and existing auth components.
- Add/adjust loading, empty, and error states using existing UI primitives (e.g., `Skeleton`, `Badge`, `Button`).
- Update relevant docs and provide hand-off notes (what changed, how to test, risks).

---

## Repository Starting Points (focus areas)

### 1) `src/services/` — business logic and integrations
- Add or extend orchestration logic here instead of embedding in components.
- Key services:
  - `src/services/opusclip.ts` — OpusClip domain models + `OpusClipService`
  - `src/services/auth.ts` — authentication workflows (`signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`)

### 2) `src/components/ui/` — reusable UI primitives
- Prefer composing these components before introducing new patterns.
- Notable primitives/hooks:
  - `button.tsx` (`ButtonProps`)
  - `badge.tsx` (`Badge`, `BadgeProps`)
  - `textarea.tsx` (`TextareaProps`)
  - `skeleton.tsx` (`Skeleton`) for loading states
  - `sidebar.tsx` (`useSidebar`) for layout/nav behaviors
  - `chart.tsx` (`ChartConfig`, `useChart`) for visualization
  - `carousel.tsx` (`useCarousel`) for horizontal content

### 3) `src/pages/`, `src/components/`, `src/components/layout/`, `src/components/auth/`
- Feature surfaces typically land here (pages + feature components).
- Auth UI and request-handling patterns (as present) live in `src/components/auth`.

### 4) `public/`
- Static assets used by features (images, icons, etc.). Add assets here when needed.

---

## Key Files (what they do / when to touch)

- **`src/services/opusclip.ts`**
  - Defines OpusClip domain types (`OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`)
  - Provides `OpusClipService` for operations around projects/clips
  - Touch when: adding new OpusClip-related capability, endpoints, request/response shaping, error normalization

- **`src/services/auth.ts`**
  - Auth functions: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`
  - Touch when: feature requires auth gating, updating login metadata, or adding user session behaviors

- **`src/components/ui/button.tsx`**
  - Canonical button API (`ButtonProps`) and styling variants
  - Touch when: you need consistent actions, submit buttons, destructive/secondary variants, disabled/loading behavior

- **`src/components/ui/textarea.tsx`**
  - Standard textarea API (`TextareaProps`)
  - Touch when: feature needs multi-line input consistent with design system

- **`src/components/ui/badge.tsx`**
  - Status labels / tags (`Badge`, `BadgeProps`)
  - Touch when: feature needs status/labels (e.g., “Processing”, “Draft”, “Published”)

- **`src/components/ui/skeleton.tsx`**
  - Loading placeholders
  - Touch when: new async screens need skeleton UX rather than blank spinners

- **`src/components/ui/sidebar.tsx`**
  - Sidebar behaviors via `useSidebar`
  - Touch when: feature adds nav items, panels, or needs responsive sidebar interactions

- **`src/components/ui/chart.tsx`**
  - Chart config + hook (`ChartConfig`, `useChart`)
  - Touch when: feature introduces analytics/metrics visualization

- **`src/components/ui/carousel.tsx`**
  - Carousel hook (`useCarousel`)
  - Touch when: feature needs horizontal scrolling galleries/clips

---

## Architecture Context (how to implement features here)

### Service Layer (primary pattern)
- Business logic is encapsulated in service modules/classes (e.g., `OpusClipService`).
- UI components should call services rather than duplicating orchestration logic.
- Domain types live alongside service logic (`OpusClipProject`, `OpusClipClip`, request types).

### Component Layer (composition-first)
- Reuse primitives from `src/components/ui/*`.
- Keep page-level components responsible for:
  - Wiring state (loading/error/data)
  - Calling services
  - Composing feature UI components

### Auth (cross-cutting)
- Treat auth as a prerequisite for gated features.
- Prefer using `getCurrentUser` to determine session state; use `updateLastLogin` where relevant (e.g., after sign-in).

---

## Key Symbols for This Agent (most commonly used)

### Services
- `OpusClipService` — `src/services/opusclip.ts`
- `OpusClipProject` — `src/services/opusclip.ts`
- `OpusClipClip` — `src/services/opusclip.ts`
- `CreateProjectRequest` — `src/services/opusclip.ts`
- `signUp` / `signIn` / `signOut` — `src/services/auth.ts`
- `getCurrentUser` / `updateLastLogin` — `src/services/auth.ts`

### UI
- `ButtonProps` — `src/components/ui/button.tsx`
- `Badge`, `BadgeProps` — `src/components/ui/badge.tsx`
- `TextareaProps` — `src/components/ui/textarea.tsx`
- `Skeleton` — `src/components/ui/skeleton.tsx`
- `useSidebar` — `src/components/ui/sidebar.tsx`
- `ChartConfig`, `useChart` — `src/components/ui/chart.tsx`
- `useCarousel` — `src/components/ui/carousel.tsx`

---

## Standard Workflows (actionable steps)

### Workflow A — Add a new feature screen/page (UI-first, service-backed)
1. **Confirm entry point**
   - Identify where the feature lives: `src/pages/*` (route-level) or within an existing page.
2. **Define UI states**
   - Minimum: `loading`, `error`, `empty`, `success`.
   - Use `Skeleton` for loading and `Badge` for statuses.
3. **Wire service call**
   - Add/extend a function in `src/services/*` if orchestration is non-trivial or reused.
   - Keep component calls thin (pass typed inputs, receive typed outputs).
4. **Compose UI using primitives**
   - Use `Button` for actions; ensure disabled states during async.
   - Use `Textarea` for multi-line inputs with consistent styling.
5. **Add guardrails**
   - If auth-gated: call `getCurrentUser` and handle unauthenticated UI path.
6. **Finalize UX**
   - Confirm copy, validation, and edge cases.
7. **Document**
   - Update relevant docs/readmes if present; add a short “How to test” note in PR/hand-off.

### Workflow B — Extend OpusClip capabilities (service-driven)
1. **Start in `src/services/opusclip.ts`**
   - Add types first (request/response/domain) near existing ones:
     - `CreateProjectRequest`, `OpusClipProject`, `OpusClipClip`
2. **Extend `OpusClipService`**
   - Add a method with a clear name and typed signature.
   - Normalize errors in one place (service layer), not in every component.
3. **Update UI components/pages**
   - Use the service method and render the results.
   - Add `Skeleton` states for fetch/processing.
4. **Visual consistency**
   - Use `Badge` for project/clip status.
   - Use `Carousel` for clip galleries if appropriate.

### Workflow C — Implement an auth-aware feature
1. **Determine auth requirement**
   - Optional vs required.
2. **Use `getCurrentUser`**
   - If no user: show sign-in prompt or route to auth flow (depending on app pattern).
3. **On sign-in**
   - If feature includes sign-in, call `signIn` then `updateLastLogin` (where applicable/expected).
4. **On sign-out**
   - Call `signOut` and reset feature-local state (avoid leaking prior user’s data).
5. **UI patterns**
   - Show auth state with `Badge` (e.g., “Signed in”) when relevant.
   - Disable privileged actions via `Button` disabled state until user is known.

### Workflow D — Add a reusable UI component to `src/components/ui`
1. **Check for existing primitive first**
   - Prefer extending `ButtonProps` variants or composing existing primitives.
2. **Follow conventions**
   - Export prop types (e.g., `XProps`) like existing files (`TextareaProps`, `ButtonProps`, `BadgeProps`).
3. **Keep it headless where possible**
   - Avoid binding to a single feature’s data model.
4. **Add integration usage**
   - Use the component in at least one page/feature component to validate API design.

---

## Best Practices (derived from current codebase patterns)

### Service-layer rules
- Put external integration logic and domain typing in `src/services/*`.
- Prefer a single service abstraction (`OpusClipService`) over scattered fetch logic.
- Export types needed by UI (`OpusClipProject`, `OpusClipClip`, request DTOs).

### UI consistency rules
- Reuse primitives from `src/components/ui/*` rather than inventing new styling patterns.
- Always provide:
  - Disabled state for async actions (`Button`)
  - Loading skeletons (`Skeleton`)
  - Clear status labeling (`Badge`)
- Use hooks provided by UI modules (`useSidebar`, `useChart`, `useCarousel`) rather than reimplementing behavior.

### Type-safety and boundaries
- Keep request/response shapes typed in services.
- Components should depend on exported types instead of duplicating interfaces.
- Avoid leaking raw API response shapes into UI—map/normalize in services.

### Error and empty-state UX
- Components must render a stable UI for:
  - No data (empty state)
  - Partial data (missing optional fields)
  - Network/service errors
- Centralize error translation in services where possible; show user-friendly messages in UI.

---

## Feature Implementation Checklist (use for every task)

- [ ] Requirement clarified: user story, acceptance criteria, edge cases
- [ ] Impacted areas identified (`src/services`, `src/pages`, `src/components/ui`)
- [ ] Types defined/updated in service layer (if applicable)
- [ ] Service method added/extended (if applicable)
- [ ] UI composed using existing primitives (`Button`, `Badge`, `Textarea`, `Skeleton`)
- [ ] Loading, error, and empty states implemented
- [ ] Auth behavior implemented using `auth.ts` functions (if applicable)
- [ ] No duplicated business logic in components
- [ ] Docs/hand-off updated (how to test, risks, follow-ups)

---

## Collaboration Checklist (agent workflow)

- [ ] Confirm assumptions (routes, auth expectations, OpusClip behavior, UI placement)
- [ ] Identify minimal touch set of files; avoid drive-by refactors
- [ ] Implement behind types and service boundaries; keep UI thin
- [ ] Self-review for state handling (loading/error/empty), disabled actions, and consistent primitives
- [ ] Provide a clear hand-off note: changed files, new APIs, and manual test steps

---

## Hand-off Notes (template to include in PR or final summary)

**What changed**
- Services:
  - `src/services/...`: (new methods/types)
- UI:
  - `src/pages/...`: (new/updated page)
  - `src/components/...`: (new/updated feature components)
  - `src/components/ui/...`: (only if a new primitive/variant was added)

**How to test**
- Steps (happy path)
- Steps (error path)
- Steps (unauthenticated path, if relevant)

**Risks / follow-ups**
- Any known limitations, TODOs, or areas needing product confirmation

---

## Documentation Touchpoints

If present in the repo, consult/update:
- `README.md` (root) — setup, scripts, runtime notes
- `AGENTS.md` — agent conventions and expectations (linked below)
- Any docs under `docs/` if they exist

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
