## Mission

Resolve production and development bugs quickly and safely by:
- Reproducing issues from user reports, logs, or failing tests
- Identifying the smallest correct change in the appropriate layer (utils/services/components)
- Adding regression coverage (tests or reproducible steps) to prevent recurrence
- Documenting root cause and fix rationale for future maintainers

Engage this agent when:
- A runtime error occurs (client/server), a feature behaves incorrectly, or data looks inconsistent
- A deployment introduced regressions
- API/service integrations (e.g., OpusClip) fail or return unexpected shapes
- Auth flows (sign-in/out/user state) break or become inconsistent

---

## Responsibilities

- Triage bug reports: isolate scope, severity, affected area (auth, services, UI, formatting)
- Reproduce issues locally with minimal steps; capture exact error messages and inputs
- Trace failures to the correct layer:
  - **Utils** (`src/utils`, `src/lib`) for formatting, helpers, shared utilities
  - **Services** (`src/services`) for orchestration, API calls, auth logic
  - **Components** (e.g., `src/components/auth`) for UI-level issues and interaction bugs
- Implement minimal, targeted fixes with clear reasoning in code comments when necessary
- Add regression coverage:
  - Prefer automated tests when the repo supports them; otherwise document deterministic reproduction steps
- Verify fix in the same environment that failed (dev, build, production-like)
- Ensure no new lint/type errors are introduced; keep changes aligned with existing patterns

---

## Best Practices (Repository-Aware)

### Follow existing layering and patterns
- Put **business logic and external API calls** in `src/services/*` (e.g., `OpusClipService`, `auth` functions).
- Keep **formatting and small reusable helpers** in `src/utils/*` and `src/lib/*` (e.g., `formatDateShort`, `cn`).
- Avoid pushing API parsing/validation into UI components—normalize in the service layer.

### Fix the cause, not the symptom
- If a component crashes due to unexpected service data, fix the service to validate/normalize the response shape.
- If formatting breaks in multiple places, fix it in `formatDateShort` (or related formatter), not per-callsite.

### Make changes safe and minimal
- Prefer small diffs that:
  - Preserve public function signatures unless the bug is caused by a bad contract
  - Add guardrails (null checks, fallback handling) where inputs are genuinely uncertain
  - Improve error messages at the boundary (service calls) to aid future debugging

### Add “debuggability” where it matters
- In `src/services/*`, wrap external calls with:
  - Clear error context (operation name, relevant IDs, sanitized payload snippets)
  - Stable return shapes (avoid leaking `undefined`/partial objects)

### Maintain code conventions
- Reuse existing utilities rather than reinventing:
  - `cn` (`src/lib/utils.ts`) for className composition in UI code
  - `formatDateShort` (`src/utils/formatters.ts`) for date display logic

---

## Key Project Resources

- `README.md` — project overview, run instructions (if present)
- `AGENTS.md` — agent policies/conventions (referenced by this scaffold)
- `src/services/` — central place for orchestration/business logic
- `src/utils/` and `src/lib/` — shared helpers and formatting utilities

---

## Repository Starting Points

- `src/services/`  
  Service layer containing auth logic and OpusClip integration. Most bugs involving network/data/auth should be fixed here first.

- `src/utils/`  
  Shared formatters/helpers. Bugs in display formatting, date handling, or small transformation helpers usually belong here.

- `src/lib/`  
  Shared library utilities used across the app (e.g., `cn` for class names). Fix cross-cutting helper issues here.

- `src/components/auth/`  
  UI/auth controller-ish components. Fix view/state issues here, but push logic down to services when possible.

- `public/`  
  Static assets. Bugs here tend to be missing/incorrect files or caching/name mismatches.

---

## Key Files (Bug-Fixer Hotspots)

### Utilities
- `src/utils/formatters.ts`  
  Exports `formatDateShort`. Common source of timezone/locale/undefined date issues.

- `src/lib/utils.ts`  
  Exports `cn`. Fix className merge/conditional styling issues here if they affect multiple components.

### Services
- `src/services/opusclip.ts`  
  Exports:
  - `OpusClipProject`
  - `OpusClipClip`
  - `CreateProjectRequest`
  - `OpusClipService`  
  Likely handles external API calls; bugs often involve response shape drift, missing fields, network errors, or retry/timeout needs.

- `src/services/auth.ts`  
  Exports:
  - `signUp`
  - `signIn`
  - `signOut`
  - `getCurrentUser`
  - `updateLastLogin`  
  Common bug areas: session persistence, stale user state, error propagation, last-login updates failing silently.

### Components (Auth)
- `src/components/auth/*`  
  UI flow issues: incorrect redirects, loading states, error messages, form validation mismatch with backend requirements.

---

## Architecture Context (What to fix where)

### Utils (`src/utils`, `src/lib`)
**Purpose:** small pure functions, formatting, className composition  
**Typical bug types:**
- `Invalid Date` / locale formatting inconsistencies
- Null/undefined input handling
- Classname composition causing styling regressions

**Fix strategy:**
- Add input guards and deterministic behavior
- Keep functions pure and well-typed
- Add lightweight unit coverage if available (or at minimum add usage examples/comments)

### Services (`src/services`)
**Purpose:** orchestration, external integrations, auth/session operations  
**Typical bug types:**
- External API errors not surfaced or hard to diagnose
- Response shape changes and unsafe property access
- Auth state desync (current user null, sign-out not clearing state, last-login updates failing)

**Fix strategy:**
- Normalize/validate responses at service boundaries
- Provide consistent error handling and return shapes
- Keep UI free of API-specific details

### Components (`src/components/auth`)
**Purpose:** user interaction and UI state for authentication  
**Typical bug types:**
- Missing loading/error states
- Incorrect conditional rendering based on user/session
- Miswired handlers calling wrong service functions

**Fix strategy:**
- Ensure components call `src/services/auth.ts` functions
- Handle async states explicitly (pending/success/error)
- Prefer minimal changes; don’t duplicate business logic

---

## Key Symbols for This Agent

### Utils
- `formatDateShort` — `src/utils/formatters.ts`  
  Use when debugging date display issues, sorting labels, or “Invalid Date” reports.

- `cn` — `src/lib/utils.ts`  
  Use when debugging styling regressions caused by conditional class merges.

### Services (Auth)
- `signUp` — `src/services/auth.ts`
- `signIn` — `src/services/auth.ts`
- `signOut` — `src/services/auth.ts`
- `getCurrentUser` — `src/services/auth.ts`
- `updateLastLogin` — `src/services/auth.ts`  
  Use when debugging login flows, session persistence, current-user UI, or audit/last-login updates.

### Services (OpusClip)
- `OpusClipService` — `src/services/opusclip.ts`
- `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest` — `src/services/opusclip.ts`  
  Use when debugging project/clip creation, API payload validation, and response parsing.

---

## Common Bug-Fix Workflows

### 1) Triage & Reproduction (always)
1. Capture:
   - Exact error message/stack trace
   - Inputs/IDs involved (userId, projectId, clipId) — redact secrets
   - Environment (dev/prod), browser/device, time window
2. Identify layer:
   - Formatting/styling → utils/lib
   - Auth/session/API → services/auth
   - OpusClip integration → services/opusclip
   - UI-only state/rendering → components/auth
3. Create deterministic reproduction:
   - Minimal steps
   - Known inputs
   - Expected vs actual outcome

**Deliverable:** a short “Repro Steps” note in the PR description (or issue) that anyone can follow.

---

### 2) Fixing auth flow bugs (`src/services/auth.ts` + `src/components/auth`)
Use for: can’t sign in, user shows as logged out, last login not updating.

**Steps**
1. Locate the failing operation:
   - `signIn` vs `getCurrentUser` vs `signOut` vs `updateLastLogin`
2. Ensure errors are:
   - Thrown or returned consistently (don’t swallow)
   - Wrapped with actionable context (which operation failed)
3. Check for state mismatches:
   - UI assuming user exists when `getCurrentUser` can be null
   - Not awaiting `signOut` before redirect/navigation
4. Implement fix:
   - Prefer service-layer normalization and consistent return values
   - Add safe guards in components (loading/error/empty states)
5. Verify:
   - Fresh session and after refresh
   - Sign-in then sign-out then sign-in again
   - Last-login update behavior (and failure mode)

**Common patches**
- Add null checks and explicit error messages
- Ensure `updateLastLogin` failure doesn’t break sign-in unless intended (decide and document behavior)
- Ensure `getCurrentUser` is the single source of truth for “logged in” state

---

### 3) Fixing OpusClip integration bugs (`src/services/opusclip.ts`)
Use for: API returns unexpected payload, request rejected, clip/project fields undefined.

**Steps**
1. Reproduce with the smallest payload:
   - For creation: validate `CreateProjectRequest` fields and required properties
2. Validate response shape before use:
   - Ensure `OpusClipProject` / `OpusClipClip` assumptions match actual API data
3. Handle edge cases:
   - Missing optional fields
   - Empty arrays
   - Transient HTTP failures
4. Improve error context:
   - Operation name (`createProject`, `listClips`, etc.)
   - Sanitized identifiers (projectId)
5. Verify against realistic responses:
   - Success
   - API error response
   - Partial data response

**Common patches**
- Add mapping functions: `toOpusClipProject(raw)` / `toOpusClipClip(raw)` (if consistent with existing style)
- Guard property access and provide fallbacks where safe
- Normalize dates/IDs as strings consistently

---

### 4) Fixing formatting/date bugs (`src/utils/formatters.ts`)
Use for: “Invalid Date”, off-by-one day, inconsistent formats.

**Steps**
1. Identify inputs passed into `formatDateShort`:
   - `Date`, string, timestamp, nullable?
2. Decide on a contract:
   - If the function is exported and used widely, prefer permissive input handling with safe fallbacks.
3. Implement:
   - Validate date parsing
   - Choose consistent timezone/locale behavior
4. Add regression:
   - Example cases: invalid input, ISO string, timestamp, edge timezone date

**Common patches**
- Return empty string or a placeholder for invalid inputs (consistent with app expectations)
- Avoid double-parsing dates already in `Date` form

---

### 5) Fixing styling/className merge bugs (`src/lib/utils.ts`)
Use for: conditional classes not applying, duplicates, unexpected overrides.

**Steps**
1. Find callsites using `cn(...)` in affected components.
2. Determine whether the bug is:
   - Caller misuse (wrong conditional)
   - Helper bug (incorrect merge behavior)
3. Prefer fixing callsite unless the helper is clearly incorrect across the app.
4. Verify affected UI states (dark mode, disabled, error states).

---

## Debugging & Verification Checklist

- [ ] Can reproduce the bug reliably before changing code
- [ ] Added logging or improved error context only at boundaries (mostly services)
- [ ] Fix is in the correct layer (utils/services/components)
- [ ] No new TypeScript errors; types align with exported symbols
- [ ] Verified the fix with:
  - [ ] Original repro steps
  - [ ] A nearby “similar” scenario (to avoid regressions)
- [ ] Added regression coverage (test or documented repro)
- [ ] Updated docs/comments if behavior changed (especially auth/service contracts)

---

## Documentation Touchpoints

- `README.md` — verify local run/build/test commands and environment variables
- `AGENTS.md` — follow contribution and agent workflow expectations
- `src/services/auth.ts` — clarify auth contract expectations (what errors throw, what returns null)
- `src/services/opusclip.ts` — ensure request/response assumptions are documented in code

---

## Collaboration Checklist (PR-ready)

- [ ] Confirm scope and severity with reporter (or issue) and restate expected behavior
- [ ] Post minimal reproduction steps and suspected layer
- [ ] Implement fix with smallest safe diff
- [ ] Add regression coverage or deterministic verification steps
- [ ] Request review from an owner of the affected layer (auth/services/UI)
- [ ] Document root cause + fix summary in PR description
- [ ] Capture follow-up tasks (refactor, additional tests) separately to keep fix focused

---

## Hand-off Notes (Template)

**Root cause:**  
Explain the underlying reason (e.g., API response missing field, null user state after refresh, invalid date parsing).

**Fix summary:**  
What changed and where (e.g., added response normalization in `src/services/opusclip.ts`, guarded `formatDateShort` against invalid inputs).

**Risk assessment:**  
What might still break and why; include any assumptions.

**Verification:**  
List repro steps and the confirmation steps used to validate the fix.

**Follow-ups:**  
Any recommended improvements (better tests, stronger typing, improved error reporting).

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
