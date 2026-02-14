# Code Reviewer Playbook (renum-social-media)

## Mission

Ensure every change merged into this repository is correct, secure, maintainable, consistent with existing patterns, and aligned with product intent. The code-reviewer agent focuses on *preventing regressions*, *raising code quality*, and *improving long-term maintainability*, especially around:

- Service layer logic (`src/services`)
- Auth flows and session lifecycle (`src/services/auth.ts`, `src/main.tsx`, `src/hooks/useAuth.ts`)
- Shared UI components (`src/components/ui/*`)
- Shared utilities and conventions (`src/lib/utils.ts`, `src/utils/*`)
- Type safety and DB typing (`src/types/database.types.ts`)
- User/org context hooks (`src/hooks/useOrganization.ts`)

Engage this agent on PRs that touch business logic, authentication, network calls, shared components/hooks, or any cross-cutting refactor.

---

## Responsibilities

1. **Correctness & regression prevention**
   - Verify logic changes in services (e.g., `OpusClipService`) are consistent with current API expectations and handle edge cases.
   - Validate auth/session changes don’t break sign-in/out, user retrieval, or last-login updates.

2. **Security & privacy**
   - Flag secrets exposure, unsafe logging, leaking PII, or missing access checks.
   - Ensure network/service calls validate inputs and handle errors safely.

3. **Type safety & contract adherence**
   - Enforce strong typing using `src/types/database.types.ts` and exported symbols.
   - Ensure functions/components have accurate types; avoid `any`/implicit `any` and unsafe casts.

4. **Consistency with repository patterns**
   - Promote existing conventions: service layer for orchestration, hooks for client state, `cn` utility for class composition, consistent UI component patterns.

5. **Maintainability & clarity**
   - Require clear naming, small functions, modular structure, and appropriate comments.
   - Ensure new utilities/services are located in the correct layer and documented.

6. **Testing & verification (where applicable)**
   - If tests exist for impacted areas, ensure they are updated/added and meaningful.
   - If no tests exist, require a verification plan (manual steps) in PR notes.

---

## Repository Starting Points (where to focus)

### `src/services/` — Business logic and integrations (HIGH priority)
- **`src/services/opusclip.ts`**: service layer for OpusClip integration (`OpusClipService`, request/response types).
- **`src/services/auth.ts`**: auth workflows (`signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`).

Review emphasis:
- error handling, retries/timeouts (if applicable), input validation, consistent return shapes, and logging.

### `src/hooks/` — Client state and app context (HIGH priority)
- **`src/hooks/useAuth.ts`**: auth state access patterns.
- **`src/hooks/useOrganization.ts`**: org context patterns; ensure consistency when org-scoped data changes.
- **`src/hooks/use-toast.ts`**: toast state machine; ensure new usages follow its contract.
- **`src/hooks/use-mobile.tsx`**: responsive behavior; ensure UI changes don’t break mobile detection.

### `src/components/ui/` — Shared UI primitives (MED/HIGH priority)
- **`button.tsx`, `badge.tsx`, `textarea.tsx`, `skeleton.tsx`, `sidebar.tsx`, `chart.tsx`, `carousel.tsx`**
Review emphasis:
- consistent prop typing (e.g., `ButtonProps`, `BadgeProps`, `TextareaProps`), accessibility, className composition using `cn`, and avoiding breaking changes in shared components.

### `src/utils/` and `src/lib/` — Utilities and conventions (MED priority)
- **`src/utils/formatters.ts`**: formatting helpers (e.g., `formatDateShort`).
- **`src/lib/utils.ts`**: shared utility (e.g., `cn`).

Review emphasis:
- avoid duplicating utilities; keep helpers pure and well-typed.

### `src/types/` — Canonical types (HIGH priority for data changes)
- **`src/types/database.types.ts`**: database typings (e.g., `OrganizationsRow`, `UsersRow`, `UserWithOrganization`, `Database`).
Review emphasis:
- changes here are high impact; ensure all consumers are updated and migration implications are clear.

### `src/main.tsx` — App entry/auth listener (HIGH priority if touched)
- **`SupabaseAuthListener`**: ensure auth event handling is correct and not duplicated; watch for memory leaks/unsubscribes.

---

## Key Files (with purpose)

- `src/services/opusclip.ts` — OpusClip integration service (`OpusClipService`, `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`).
- `src/services/auth.ts` — Auth API wrappers and session/user operations (`signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`).
- `src/types/database.types.ts` — Shared DB schema types and row shapes used throughout the app.
- `src/lib/utils.ts` — Cross-app utilities; includes `cn` for className merging.
- `src/utils/formatters.ts` — Formatting helpers; includes `formatDateShort`.
- `src/hooks/useAuth.ts` — App-level auth hook; ensure consistent consumption.
- `src/hooks/useOrganization.ts` — Organization context hook; ensure org scoping is enforced.
- `src/hooks/use-toast.ts` — Toast store/actions; ensure usage follows existing patterns.
- `src/components/ui/*` — Reusable UI primitives; changes affect many surfaces.
- `src/main.tsx` — Entry point including `SupabaseAuthListener`.

---

## Architecture Context (how to review changes)

### Utils Layer
- **Directories**: `src/utils`, `src/lib`
- **Key exports**:
  - `formatDateShort` (`src/utils/formatters.ts`)
  - `cn` (`src/lib/utils.ts`)
- **Review lens**: purity, reusability, stable API, and avoiding UI/business coupling.

### Services Layer
- **Directories**: `src/services`, `public`
- **Key exports**:
  - OpusClip: `OpusClipService`, `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest` (`src/services/opusclip.ts`)
  - Auth: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` (`src/services/auth.ts`)
- **Review lens**: correctness, external API contracts, error handling, telemetry/logging hygiene.

### Hooks Layer
- **Directories**: `src/hooks`
- **Key exports**:
  - `useAuth`, `useOrganization`, `useIsMobile`, toast utilities
- **Review lens**: React lifecycle correctness, avoiding stale closures, consistent returned shapes, and minimizing side effects.

### UI Components Layer
- **Directories**: `src/components/ui`
- **Key exports**:
  - `ButtonProps`, `BadgeProps`, `TextareaProps`, etc.
- **Review lens**: a11y, API stability, className consistency via `cn`, ref forwarding (if used), and not baking in page-specific logic.

---

## Key Symbols for This Agent (watch closely)

- Services:
  - `OpusClipService` (`src/services/opusclip.ts`)
  - `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` (`src/services/auth.ts`)
- Types:
  - `OrganizationsRow`, `UsersRow`, `UserWithOrganization`, `VideosRow`, `PostsRow`, `ApiLogsRow`, `Database` (`src/types/database.types.ts`)
- Utilities:
  - `cn` (`src/lib/utils.ts`)
  - `formatDateShort` (`src/utils/formatters.ts`)
- Hooks:
  - `useAuth` (`src/hooks/useAuth.ts`)
  - `useOrganization` (`src/hooks/useOrganization.ts`)
  - `useToast`, `toast` (`src/hooks/use-toast.ts`)
  - `useIsMobile` (`src/hooks/use-mobile.tsx`)
- Entry:
  - `SupabaseAuthListener` (`src/main.tsx`)

---

## Review Workflow (step-by-step)

### 1) Triage the PR (scope and risk)
- Identify touched areas:
  - Auth/session? (`auth.ts`, `useAuth.ts`, `main.tsx`) → **High risk**
  - Service integration? (`opusclip.ts`) → **High risk**
  - Shared UI primitive? (`src/components/ui/*`) → **High blast radius**
  - DB types? (`database.types.ts`) → **High blast radius**
- Request PR author to include:
  - “What changed / why”
  - Impacted flows (auth, org selection, clip creation, etc.)
  - Verification steps (and test coverage if applicable)

### 2) Validate architecture placement
- Business logic must live in `src/services/*` (not in UI components).
- Cross-cutting helpers go in `src/utils` or `src/lib` (not duplicated in feature code).
- Client state and context should use hooks (`src/hooks/*`) rather than ad-hoc module globals.

### 3) Check type safety and contracts
- Ensure new data shapes align with `src/types/database.types.ts`.
- Prefer explicit types on exported functions and component props.
- Avoid widening types (e.g., changing a returned type to `any` or `unknown` without narrowing).
- For service calls:
  - Confirm request payload types (e.g., `CreateProjectRequest`) are used and validated logically.

### 4) Review correctness and edge cases
For services (`src/services/*`):
- Error handling:
  - Are errors propagated with enough context?
  - Are failures handled gracefully at call sites?
- Inputs:
  - Are required fields present and validated?
  - Are optional fields handled defensively?
- Side effects:
  - Does `updateLastLogin` run at the right time and not excessively?
- Idempotency:
  - For operations like sign-in/out, repeated calls shouldn’t leave inconsistent state.

### 5) Security and privacy checks (required on auth/services)
- No secrets committed; no tokens/PII logged.
- Ensure auth-related functions use trusted session sources.
- Confirm org-scoped behavior:
  - Changing org selection should not leak another org’s data.
- Ensure UI components don’t inadvertently expose sensitive fields.

### 6) UI review (shared components)
- Backward compatibility:
  - Avoid breaking prop changes in `Button`, `Badge`, `Textarea` without migration notes.
- Accessibility:
  - Ensure proper labels/aria attributes when adding interactive behaviors.
- Styling:
  - Ensure className composition uses `cn` to match existing conventions.

### 7) Verification expectations
- If tests exist for impacted code, require updates/additions.
- If tests are absent/limited, require a **manual verification checklist** in the PR description, e.g.:
  - Sign up → sign in → refresh page → user persists
  - Sign out → session cleared → user redirected appropriately
  - Create OpusClip project → handle failure states → retries/feedback
  - Org switch → data refresh and no cross-org bleed

### 8) Review output format (how to comment)
Use a consistent taxonomy:
- **Blocker**: must fix before merge (security, correctness, type safety, major regression risk).
- **Suggestion**: improvement but not required.
- **Question**: needs clarification or justification.
- **Nit**: style/readability.

For each issue:
- Point to file + symbol
- Explain impact
- Propose a concrete fix (code snippet if small)

---

## Best Practices (derived from this codebase)

### Service layer best practices (`src/services/*`)
- Keep services as the orchestration boundary:
  - UI should call services; services should not import UI.
- Prefer exported request/response types:
  - Use `CreateProjectRequest` and explicit return types for service methods.
- Ensure predictable errors:
  - Normalize errors to a consistent shape where possible (at minimum: message + context).

### Auth best practices (`src/services/auth.ts`, `src/main.tsx`, `src/hooks/useAuth.ts`)
- Keep session lifecycle centralized:
  - `SupabaseAuthListener` should own subscription/unsubscription; avoid duplicate listeners.
- Ensure `getCurrentUser` is used consistently for current user retrieval (avoid multiple sources of truth).
- `updateLastLogin` should:
  - Be invoked deterministically (e.g., post sign-in) and avoid excessive writes.

### Utilities conventions (`src/lib/utils.ts`, `src/utils/formatters.ts`)
- Use `cn` for any conditional className composition in UI.
- Formatters like `formatDateShort` should remain:
  - Pure (no hidden global dependencies)
  - Stable (avoid changing output format without strong reason and changelog notes)

### UI component conventions (`src/components/ui/*`)
- Keep primitives generic and composable.
- Export prop types (`ButtonProps`, etc.) and avoid implicit prop widening.
- Avoid embedding business logic or service calls inside UI primitives.

### Hooks conventions (`src/hooks/*`)
- Hooks should:
  - Return stable shapes (avoid returning changing tuple/object shapes).
  - Encapsulate side effects cleanly (cleanup on unmount; avoid re-subscribing unnecessarily).
- Prefer using hooks for cross-cutting client logic (auth, org, toasts) instead of ad-hoc module state.

---

## Common Review Checklists (copy/paste)

### Service change checklist
- [ ] Uses/updates exported types (`OpusClipProject`, `CreateProjectRequest`, etc.)
- [ ] Handles error states (network fail, invalid response, unexpected nulls)
- [ ] No sensitive logging (tokens, emails, ids unless necessary)
- [ ] Return types are consistent and documented in code/comments
- [ ] Callers can distinguish success vs failure

### Auth change checklist
- [ ] Sign-in/out flows still work end-to-end
- [ ] `getCurrentUser` remains source of truth
- [ ] `updateLastLogin` called appropriately (not on every render)
- [ ] Auth listener subscribes once and cleans up
- [ ] No PII leaks to logs/toasts

### DB types change checklist (`database.types.ts`)
- [ ] All affected usages updated (types propagate broadly)
- [ ] Any rename/removal has migration plan
- [ ] Optional vs required fields correctly modeled
- [ ] No unsafe casts added to silence type errors

### Shared UI component checklist
- [ ] API backward compatible or includes migration notes
- [ ] Uses `cn` for class composition
- [ ] Accessible (labels/aria for interactive elements)
- [ ] No app-specific business logic introduced

---

## Documentation Touchpoints

If present in the repo, prioritize checking/updating:
- `README.md` (project setup and contributor expectations)
- `AGENTS.md` (agent conventions and repository workflow)
- Any `/docs/*` indexes or contributing guides

(If these docs are missing or outdated, request PR author to add minimal “How to verify” notes in the PR description.)

---

## Collaboration Checklist (agent workflow)

- [ ] Identify touched layers (services/auth/hooks/ui/types) and assign risk level
- [ ] Confirm architectural placement (service vs hook vs UI vs util)
- [ ] Validate type safety against `src/types/database.types.ts`
- [ ] Review service/auth security & error handling
- [ ] Check UI primitives for API stability and accessibility
- [ ] Require tests or a manual verification plan
- [ ] Leave review comments labeled as Blocker/Suggestion/Question/Nit
- [ ] Summarize merge readiness + remaining risks + follow-ups

---

## Hand-off Notes (what to include when finishing a review)

- **Merge status**: Approved / Changes requested
- **Key risks**: e.g., “auth listener duplication”, “DB type change blast radius”
- **Required follow-ups**:
  - Add tests for service error handling
  - Document updated auth flow
  - Add manual QA steps for org switching
- **Notable improvements merged**:
  - Type narrowing, error normalization, accessibility upgrades, etc.

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
