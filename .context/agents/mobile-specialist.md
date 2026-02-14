# Mobile Specialist Playbook (renum-social-media)

## Mission

Ensure the product delivers an excellent **mobile experience** across iOS/Android browsers (and potential PWA packaging) by:
- Making screens **mobile-first**, responsive, and touch-friendly.
- Auditing and improving **navigation**, **layout**, and **interaction** patterns for small viewports.
- Ensuring critical flows (auth, content creation, media viewing) are **fast**, **accessible**, and resilient on mobile networks/devices.
- Providing reusable, consistent **UI patterns** via the existing component library.

Engage this agent when:
- A new feature impacts layout, navigation, or interaction patterns.
- Bugs reproduce primarily on mobile (viewport, touch, keyboard, iOS Safari quirks).
- UI work touches shared components (`src/components/ui`) or device detection (`src/hooks/use-mobile.tsx`).
- Performance regressions happen on low-end devices or poor networks.

---

## Responsibilities

1. **Mobile UX & layout**
   - Convert new pages to mobile-first responsive layouts.
   - Ensure readable typography, spacing, and touch target sizing.
   - Handle safe areas, scroll behavior, and virtual keyboard interactions.

2. **Device-aware behavior**
   - Use `useIsMobile` (`src/hooks/use-mobile.tsx`) to implement conditional UI where appropriate (e.g., sidebar collapse, simplified charts).
   - Avoid brittle UA sniffing; use viewport/media queries and existing hook.

3. **Navigation & structure on small screens**
   - Ensure sidebars/menus work well on mobile (open/close, overlay, focus management).
   - Validate that pages in `src/pages` remain usable without hover.

4. **Reusable UI components**
   - Extend or adapt existing UI primitives in `src/components/ui` rather than adding one-off markup.
   - Keep styles consistent using `cn` utility (`src/lib/utils.ts`).

5. **Performance & perceived speed**
   - Reduce layout shifts using `Skeleton` (`src/components/ui/skeleton.tsx`).
   - Favor lightweight mobile rendering: avoid heavy charts/carousels by default on small screens unless required.

6. **Accessibility (mobile-specific)**
   - Ensure focus order, button labeling, and readable contrast.
   - Ensure interactive components are usable with screen readers and keyboard (Bluetooth keyboards are common on tablets).

---

## Repository Starting Points (Mobile-Relevant)

- `src/pages/`  
  Page-level layouts and flows. Primary area for mobile responsiveness work.

- `src/components/ui/`  
  Shared UI primitives (e.g., `button`, `badge`, `textarea`, `sidebar`, `carousel`, `chart`, `skeleton`) used throughout the app.

- `src/components/layout/`  
  App-level layout composition (headers/sidebars/wrappers). Key for mobile navigation patterns.

- `src/hooks/use-mobile.tsx`  
  Canonical device/viewport detection hook: `useIsMobile`.

- `src/services/`  
  Flows may need mobile-safe UX around loading/error handling (auth, project creation, etc.).

- `src/utils/` and `src/lib/`  
  Shared utilities such as `formatDateShort` and `cn` for consistent formatting and class composition.

---

## Key Files (What to Look At / Change)

### Entry & App Wiring
- `src/main.tsx`
  - Contains `SupabaseAuthListener` (auth state tracking). Mobile work may require verifying auth transitions don’t break navigation or render loops on mobile.

### Mobile Detection
- `src/hooks/use-mobile.tsx`
  - Exports `useIsMobile`. Use this instead of ad-hoc window checks in components/pages.

### Core UI Primitives (Mobile Impact)
- `src/components/ui/button.tsx` (`ButtonProps`)
  - Ensure touch target sizing (min-height), loading states, and variant styles work on mobile.
- `src/components/ui/textarea.tsx` (`TextareaProps`)
  - Mobile keyboard behavior and resizing; ensure adequate padding and font size.
- `src/components/ui/badge.tsx` (`Badge`, `BadgeProps`)
  - Keep badges readable at small sizes.
- `src/components/ui/sidebar.tsx` (`useSidebar`)
  - Mobile nav: overlay behavior, close actions, scroll lock, focus management.
- `src/components/ui/carousel.tsx` (`useCarousel`)
  - Touch/swipe behavior; ensure it is performant and doesn’t trap scroll.
- `src/components/ui/chart.tsx` (`useChart`, `ChartConfig`)
  - Charts can be heavy; consider mobile fallbacks or simplified render.
- `src/components/ui/skeleton.tsx` (`Skeleton`)
  - Prevent layout shifts and improve perceived speed on mobile.

### Utilities
- `src/lib/utils.ts` (`cn`)
  - Standard way to merge conditional classes—use it for responsive class toggles.
- `src/utils/formatters.ts` (`formatDateShort`)
  - Use consistent, mobile-readable date formatting.

### Services (UX Touchpoints)
- `src/services/auth.ts` (`signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`)
  - Mobile UX often needs better error messaging, retry patterns, and loading state handling.
- `src/services/opusclip.ts` (`OpusClipService`, types)
  - Likely tied to media/project workflows; ensure mobile users have resilient progress/loading UI.

---

## Architecture Context (How Mobile Work Maps to Layers)

### Components (UI & Layout)
- **Directories:** `src/components/ui`, `src/pages`, `src/components`, `src/components/layout`, `src/components/auth`
- **Mobile focus:** responsive composition, touch/keyboard interactions, and consistent UI primitives.

### Hooks (Device responsiveness)
- **Directory:** `src/hooks`
- **Mobile focus:** `useIsMobile` as the standard for conditional rendering decisions.

### Services (Business logic)
- **Directory:** `src/services`
- **Mobile focus:** ensure UI properly handles service latency, errors, and retries.

### Utils / Lib
- **Directories:** `src/utils`, `src/lib`
- **Mobile focus:** consistent formatting and class composition with `cn`.

---

## Key Symbols for This Agent

- `useIsMobile` — `src/hooks/use-mobile.tsx`  
  Primary mechanism for viewport-aware UI decisions.

- `useSidebar` — `src/components/ui/sidebar.tsx`  
  Mobile navigation behavior and state management.

- `useCarousel` — `src/components/ui/carousel.tsx`  
  Touch-friendly, swipe behavior; ensure scroll interplay is correct.

- `useChart` / `ChartConfig` — `src/components/ui/chart.tsx`  
  Ensure chart rendering is mobile-appropriate.

- `Skeleton` — `src/components/ui/skeleton.tsx`  
  Preferred loading placeholder to reduce CLS on mobile.

- `ButtonProps`, `TextareaProps`, `BadgeProps` — `src/components/ui/*`  
  Keep primitive props stable; avoid introducing mobile-only variants that fragment the design system.

- `SupabaseAuthListener` — `src/main.tsx`  
  Ensure auth state changes don’t cause janky transitions on mobile.

---

## Workflows (Step-by-Step)

### 1) Make a Page Mobile-First (New or Existing)
1. **Locate the page** in `src/pages/` and identify layout containers (wrappers, grids, sidebars).
2. **Start with the smallest viewport**
   - Ensure primary actions and key content appear without requiring precision taps.
   - Verify text sizes and spacing are readable on ~360–430px widths.
3. **Use UI primitives**
   - Replace ad-hoc buttons/inputs with `Button`, `Textarea`, etc.
4. **Add responsive adjustments**
   - Use `cn` to apply responsive classes consistently.
   - Prefer layout changes via breakpoints rather than device sniffing.
5. **Handle navigation**
   - If the page depends on sidebar, ensure `useSidebar` behavior works in a mobile overlay pattern.
6. **Loading and error states**
   - Add `Skeleton` where content loads asynchronously.
   - Provide clear error text and retry options (especially for mobile networks).
7. **Test**
   - Narrow viewport in devtools + simulate touch.
   - Check iOS Safari quirks (scroll, fixed headers, input focus).

Deliverable: responsive page that works on small screens with stable loading states.

---

### 2) Mobile Navigation & Sidebar Hardening
When working on `src/components/ui/sidebar.tsx` or layout:
1. **Confirm open/close triggers** are large enough and reachable (thumb zone).
2. **Overlay & scroll lock**
   - When sidebar is open, background should not scroll accidentally.
3. **Focus management**
   - Ensure focus lands in sidebar when opened and returns when closed.
4. **Close affordances**
   - Tap outside to close (if design allows) + visible close button.
5. **State persistence**
   - Verify `useSidebar` state doesn’t break on route changes or auth transitions.

Deliverable: predictable, accessible, touch-friendly mobile nav.

---

### 3) Touch & Gesture Components (Carousel)
When using or modifying `src/components/ui/carousel.tsx`:
1. Validate **swipe** doesn’t block vertical scroll unexpectedly.
2. Ensure **pagination/controls** are large enough for touch.
3. Keep **performance** in mind:
   - Avoid heavy re-renders; prefer memoization where patterns already exist.
4. Provide a **non-gesture fallback** (buttons, dots) where appropriate.

Deliverable: carousel that is usable with both swipe and tap, without scroll traps.

---

### 4) Charts on Mobile (Degrade Gracefully)
When `src/components/ui/chart.tsx` is used on mobile:
1. Decide if the chart is **essential** on mobile.
2. If not essential:
   - Render a simplified summary (key numbers) for `useIsMobile === true`.
3. If essential:
   - Ensure text labels are readable and tooltips are touch-friendly.
   - Avoid dense legends; prefer collapsible legends or minimal series.

Deliverable: charts that are readable and performant on mobile.

---

### 5) Auth Flows on Mobile (UX Resilience)
When working with `src/services/auth.ts` or auth pages/components:
1. Ensure **forms** use UI primitives (`Button`, `Textarea` where relevant).
2. Add **loading state** to buttons to prevent double submission.
3. Provide **clear error messages** and keep them visible without scrolling.
4. Ensure post-auth navigation doesn’t cause layout flicker:
   - Be mindful of `SupabaseAuthListener` in `src/main.tsx`.
5. Validate virtual keyboard behavior:
   - Inputs should remain visible when focused (avoid fixed elements overlapping).

Deliverable: stable mobile sign-in/sign-up with clear feedback and no double submits.

---

## Best Practices (Aligned to This Codebase)

### Use existing primitives and utilities
- Prefer components in `src/components/ui/` over bespoke implementations.
- Use `cn` from `src/lib/utils.ts` for conditional classes and breakpoint toggles.

### Keep mobile logic centralized
- For viewport-based branching, use `useIsMobile` (`src/hooks/use-mobile.tsx`).
- Avoid duplicating “is mobile” checks in multiple places.

### Loading UX should prevent layout shifts
- Use `Skeleton` (`src/components/ui/skeleton.tsx`) for async content.
- Avoid sudden height changes when data arrives (especially in feeds, charts, cards).

### Touch targets and readability
- Ensure interactive elements (buttons, icon buttons, close controls) are comfortably tappable.
- Keep spacing consistent; avoid dense layouts that require precision.

### Avoid mobile-only forks unless necessary
- Prefer responsive composition over separate mobile pages.
- If conditional rendering is needed (e.g., charts), keep the logic minimal and local.

### Service-driven UX patterns
- Service calls (auth/media/projects) should map to visible UI states:
  - idle → loading (`Skeleton`/disabled buttons) → success → error (actionable message).

---

## Documentation Touchpoints

- `README.md` (repo root) — project overview and run instructions (if present).
- `AGENTS.md` — contribution/agent coordination (linked below).
- `src/hooks/use-mobile.tsx` — canonical mobile detection.
- `src/components/ui/*` — component API patterns and conventions.

> If there is a docs directory (e.g., `docs/`), add mobile guidelines there and link it here after creation.

---

## Collaboration Checklist (Definition of Done for Mobile Work)

- [ ] Confirm target mobile breakpoints and primary devices (small phone, large phone, tablet).
- [ ] Identify all affected pages in `src/pages/` and shared UI in `src/components/ui/`.
- [ ] Use `useIsMobile` (not ad-hoc checks) for conditional rendering.
- [ ] Validate navigation (sidebar/menu) and ensure it’s closable and accessible.
- [ ] Add/verify loading states using `Skeleton` where appropriate.
- [ ] Verify touch target sizing and keyboard/focus behavior.
- [ ] Run through critical flows: auth, primary content/task creation, viewing media.
- [ ] Add brief notes to PR description: mobile screenshots + tested devices/simulations.
- [ ] If a new mobile pattern is introduced, document it (and prefer reusable UI primitives).

---

## Hand-off Notes (What to Record After Changes)

Include in PR or follow-up notes:
- Screens/pages touched and why (page-level vs shared components).
- Any new responsive rules and where they live.
- Known device quirks (e.g., iOS Safari viewport, keyboard overlap) and mitigations.
- Performance considerations (charts/carousel changes, skeleton usage).

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
