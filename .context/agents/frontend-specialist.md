# Frontend Specialist Agent Playbook (renum-social-media)

## Mission

Own the user experience of the application: build, refine, and maintain React UI screens and shared UI components with a strong focus on accessibility, responsiveness, consistency, and integration with the existing service layer (auth + OpusClip). Engage this agent whenever work involves UI/UX changes, new pages/components, component-library usage, responsive behavior, loading/empty states, or frontend integration with services.

---

## Responsibilities

- **Implement and evolve UI** using the existing component system in `src/components/ui` and feature components in `src/components`, `src/pages`, `src/components/auth`, `src/components/layout`.
- **Maintain visual and behavioral consistency** across the app (spacing, typography, variants, loading states).
- **Create/modify shared UI components** (buttons, badges, textareas, sidebar, chart, carousel, skeleton, calendar) and ensure they remain reusable and well-typed.
- **Wire UI to service calls** in `src/services` (e.g., `signIn`, `signUp`, `OpusClipService`) with correct loading/error states and user feedback.
- **Responsiveness and mobile behavior**, using the existing `useIsMobile` hook and existing patterns.
- **Accessibility** (keyboard navigation, focus states, ARIA labels, semantic HTML).
- **Frontend quality**: keep TypeScript types clean, avoid duplicate utilities, and follow local conventions (`cn`, `formatDateShort`, existing prop patterns).

---

## Repository Starting Points (Frontend-Relevant)

- `src/main.tsx` — application entry point; includes `SupabaseAuthListener` integration.
- `src/pages/` — page-level composition and routing-level UI (where screens typically live).
- `src/components/` — feature components, composed views.
  - `src/components/auth/` — authentication-related UI (forms, guards, etc.).
  - `src/components/layout/` — layout primitives (shells, headers, navigation patterns).
  - `src/components/ui/` — shared UI building blocks (design-system-like components).
- `src/hooks/` — shared hooks (notably `use-mobile.tsx` for responsive behavior).
- `src/services/` — service layer that the UI calls into (`auth.ts`, `opusclip.ts`).
- `src/utils/` and `src/lib/` — shared utilities (`formatDateShort`, `cn`).

---

## Key Files (What they are for)

### Entry & App-Wide Behavior
- `src/main.tsx`
  - Contains `SupabaseAuthListener` (symbol detected) which suggests auth session state synchronization. Frontend work that changes auth flows should consider this listener’s behavior.

### Hooks
- `src/hooks/use-mobile.tsx`
  - Exports `useIsMobile`. Use this instead of ad-hoc window-width logic to keep breakpoints consistent.

### Shared UI Components (Design System Surface)
- `src/components/ui/button.tsx` — `ButtonProps` and button variants/usage patterns.
- `src/components/ui/badge.tsx` — `Badge` and `BadgeProps`, status/label UI.
- `src/components/ui/textarea.tsx` — `TextareaProps`, form input consistency.
- `src/components/ui/skeleton.tsx` — `Skeleton` for loading placeholders.
- `src/components/ui/sidebar.tsx` — `useSidebar` and sidebar composition/state.
- `src/components/ui/chart.tsx` — `ChartConfig` and `useChart` (chart behavior/config).
- `src/components/ui/carousel.tsx` — `useCarousel` for carousel interactions/state.
- `src/components/ui/calendar.tsx` — `CalendarProps` for date UI (if used by pages/forms).

### Utilities
- `src/lib/utils.ts` — exports `cn` (className combiner). Use it for conditional classes everywhere.
- `src/utils/formatters.ts` — exports `formatDateShort`. Prefer this for short date display to keep formatting consistent.

### Services (UI Integration Points)
- `src/services/auth.ts` — `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`.
- `src/services/opusclip.ts` — types (`OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`) and `OpusClipService`.

---

## Architecture Context (Frontend View)

### Components Layer
- **Directories**: `src/components/ui`, `src/components`, `src/pages`, `src/components/auth`, `src/components/layout`
- **Core idea**: `ui/` contains reusable primitives; feature components compose primitives; pages compose features into screens.

### Utilities Layer
- **Directories**: `src/utils`, `src/lib`
- **Core idea**: keep formatting, class composition, and small helpers centralized.
- **Key exports**:
  - `formatDateShort` — `src/utils/formatters.ts`
  - `cn` — `src/lib/utils.ts`

### Services Layer (Frontend calls into it)
- **Directories**: `src/services`
- **Core idea**: isolate API/business logic away from components.
- **Key exports**:
  - Auth: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` in `src/services/auth.ts`
  - OpusClip: `OpusClipService` and related types in `src/services/opusclip.ts`

---

## Key Symbols for This Agent (use/extend these first)

- `cn` — `src/lib/utils.ts`  
  Use for conditional styling and variant composition.
- `useIsMobile` — `src/hooks/use-mobile.tsx`  
  Standardize responsive behavior (mobile vs desktop UI).
- `Skeleton` — `src/components/ui/skeleton.tsx`  
  Prefer skeletons over spinners for page-level loading states.
- `useSidebar` — `src/components/ui/sidebar.tsx`  
  Use provided sidebar state management patterns.
- `useChart`, `ChartConfig` — `src/components/ui/chart.tsx`  
  Reuse existing chart wiring rather than re-inventing.
- `useCarousel` — `src/components/ui/carousel.tsx`  
  Use existing carousel logic for any slider/carousel UI.
- `ButtonProps`, `BadgeProps`, `TextareaProps`, `CalendarProps` — component prop contracts to follow/extend.

---

## Common Workflows (Actionable Steps)

### 1) Add a New Page / Screen
1. **Locate existing page patterns** in `src/pages/` (choose a similar page as a reference).
2. **Compose from existing components**:
   - Layout wrappers from `src/components/layout/`
   - Feature components from `src/components/`
   - UI primitives from `src/components/ui/`
3. **Responsive behavior**:
   - Use `useIsMobile()` when the layout meaningfully changes on mobile.
4. **Loading & empty states**:
   - Add `Skeleton` for initial loads.
   - Ensure empty states are explicit (no blank screens).
5. **Hook up services**:
   - Call `src/services/*` functions/classes from the page/feature layer.
   - Keep service calls out of low-level UI primitives in `src/components/ui`.
6. **Error handling**:
   - Render user-facing error copy near the affected UI (form field, card, section).
7. **Final check**:
   - Keyboard navigation through the page.
   - Visual regression check (spacing, typography, alignment).

### 2) Implement/Update a Form (Auth, Project Creation, Settings)
1. **Use existing input primitives** (`Textarea`, `Button`, etc.) from `src/components/ui`.
2. **Keep validation UX predictable**:
   - Inline field errors near fields.
   - Disable submit while loading; show progress (button state + skeleton if needed).
3. **Integrate auth services** (`src/services/auth.ts`):
   - `signIn`, `signUp` on submit
   - `signOut` for logout actions
   - `getCurrentUser` to prefill or gate UI
4. **Session-related UI**:
   - Consider `SupabaseAuthListener` behavior in `src/main.tsx` when adjusting auth flows.
5. **Success handling**:
   - Navigate/close modal/refresh relevant state.
   - Avoid leaving stale form state around.

### 3) Add/Modify a Shared UI Primitive (`src/components/ui`)
Use this flow for `Button`, `Badge`, `Textarea`, `Sidebar`, etc.

1. **Confirm the primitive belongs in `ui/`** (reusable across multiple screens).
2. **Follow existing prop conventions**:
   - Use exported `*Props` types pattern (e.g., `ButtonProps`, `BadgeProps`, `TextareaProps`).
3. **Styling**:
   - Use `cn()` for class concatenation.
   - Preserve existing variants and default behavior.
4. **Accessibility**:
   - Ensure semantic HTML (`button`, `label`, etc.).
   - Keyboard interactions for interactive components.
5. **Backwards compatibility**:
   - Avoid breaking prop signatures unless you update all call sites.
6. **Document usage**:
   - If there is a local pattern (storybook/docs), add examples; otherwise, leave clear inline comments and ensure types are descriptive.

### 4) Add a Loading Pattern for Data Fetching
1. Use `Skeleton` from `src/components/ui/skeleton.tsx` for:
   - Page headers, cards, list rows, charts placeholders.
2. Keep layout stable:
   - Skeleton dimensions should match final content to minimize layout shift.
3. Ensure transitions:
   - From skeleton → data view
   - Skeleton → empty state (if no data)
   - Skeleton → error state (if fetch fails)

### 5) Wire UI to OpusClip Features
1. Use `OpusClipService` from `src/services/opusclip.ts` in the page/feature component layer.
2. Type your requests with `CreateProjectRequest` and display results using `OpusClipProject` / `OpusClipClip`.
3. For media/clip lists:
   - Provide pagination/virtualization if lists can grow (if not present, keep rendering mindful).
   - Use skeletons for thumbnail rows/cards.
4. Handle errors:
   - Service errors should map to user-friendly UI copy (don’t leak raw error objects).

### 6) Responsive Navigation / Sidebar Work
1. Use `useSidebar` from `src/components/ui/sidebar.tsx` to control open/close state.
2. For mobile:
   - Use `useIsMobile` to change sidebar behavior (overlay vs fixed).
3. Confirm:
   - Focus trap and ESC close (if implemented; if not, add it where appropriate).
   - Scroll locking on mobile overlays if needed.

---

## Best Practices (Derived From This Codebase)

### Reuse Before Creating
- Prefer existing primitives in `src/components/ui` (Button/Badge/Textarea/Skeleton/Sidebar/Chart/Carousel/Calendar) before introducing new dependencies or one-off components.

### Keep “Smart” Logic Out of `ui/`
- UI primitives should be presentation-focused.
- Service calls and orchestration belong in `src/pages` and `src/components` (feature layer), using `src/services`.

### Consistent Styling via Utilities
- Use `cn` (`src/lib/utils.ts`) for all conditional className composition; avoid ad-hoc string concatenation.
- Use shared formatters (e.g., `formatDateShort` in `src/utils/formatters.ts`) for dates displayed in the UI.

### Type-First Component Contracts
- Maintain exported `*Props` types (e.g., `ButtonProps`, `BadgeProps`, `TextareaProps`) and extend them thoughtfully to avoid breaking call sites.

### Accessibility as a Baseline
- All interactive components must be keyboard-operable.
- Ensure visible focus states and appropriate ARIA where semantic HTML is insufficient.
- For icons-only buttons, ensure accessible labels.

### Predictable UX for Async States
- Loading: use `Skeleton`
- Empty: clear empty-state message + optional CTA
- Error: user-friendly message near the UI that failed + retry if sensible

---

## Key Project Resources

- `src/components/ui/*` — the authoritative set of shared UI primitives and interaction hooks.
- `src/services/auth.ts` — canonical auth API for the frontend.
- `src/services/opusclip.ts` — canonical OpusClip API/types for the frontend.
- `src/lib/utils.ts` (`cn`) and `src/utils/formatters.ts` (`formatDateShort`) — shared formatting/styling helpers.

(If the repo contains higher-level docs like `README.md`, `AGENTS.md`, or `docs/`, link them here once confirmed/available in the repository.)

---

## Documentation Touchpoints (Update when making changes)

- Component-level changes: add/adjust inline docs and prop comments in `src/components/ui/*`.
- For new UI patterns (loading/empty states, responsive navigation), document the pattern in the closest shared place (often the relevant `ui` component file or a short note in a central docs file if present).
- If adding new services endpoints: ensure UI usage stays in `src/services/*` and update any corresponding docs (if they exist).

---

## Collaboration Checklist (PR-ready workflow)

- [ ] Confirm the UI change scope (page-level vs shared primitive) and choose the correct directory (`pages/` vs `components/` vs `components/ui/`).
- [ ] Reuse existing primitives (`Button`, `Badge`, `Textarea`, `Skeleton`, etc.) and utilities (`cn`, `formatDateShort`) rather than duplicating.
- [ ] Validate responsive behavior using `useIsMobile` and check layout on narrow widths.
- [ ] Add explicit loading/empty/error states for any async data or auth flows.
- [ ] Accessibility pass: keyboard navigation, focus visibility, labels for inputs/buttons.
- [ ] Verify service integration uses `src/services/*` and that types (`CreateProjectRequest`, etc.) are preserved.
- [ ] Update any touched shared components with compatible props and minimal breaking changes.
- [ ] Leave clear notes in the PR description: what changed, why, and any follow-ups.

---

## Hand-off Notes (What to record after completing work)

- What components/pages were added/modified and where (`src/pages/...`, `src/components/...`, `src/components/ui/...`).
- Any new/updated variants or prop changes to shared components (call out breaking changes explicitly).
- Any new UX patterns introduced (e.g., new empty-state layout, new sidebar behavior).
- Known limitations / follow-ups (e.g., missing tests, pending API behaviors, performance concerns with large lists).

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
