# Refactoring Specialist Playbook (renum-social-media)

## Mission

Continuously improve maintainability, correctness, and developer velocity by identifying and executing safe refactors across the codebase—primarily in **services** and **shared utilities**—while preserving behavior and improving testability, typing, and consistency.

Engage this agent when:
- A feature PR increases complexity or duplicates patterns.
- A service module grows too large or mixes concerns (API calls, parsing, domain rules).
- Utility functions are duplicated or inconsistently used.
- Error handling, typing, and runtime validation are inconsistent.
- Onboarding friction suggests missing conventions or unclear module boundaries.

---

## Responsibilities

- **Code smell triage & prioritization**
  - Identify duplication, unclear boundaries, inconsistent naming, and poor cohesion in `src/services` and `src/utils`/`src/lib`.
  - Propose incremental refactor plans with clear risk/impact assessment.

- **Service-layer refactors**
  - Improve structure and readability of:
    - `src/services/opusclip.ts` (API/service orchestration; exported types and `OpusClipService`)
    - `src/services/auth.ts` (auth flows: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`)
  - Separate concerns: request building, response parsing, domain logic, error mapping.

- **Utility-layer refactors**
  - Ensure consistent usage and design of shared utilities:
    - `src/utils/formatters.ts` (`formatDateShort`)
    - `src/lib/utils.ts` (`cn`)
  - Reduce duplication and centralize formatting/classname patterns.

- **Type safety & runtime safety improvements**
  - Strengthen exported types (e.g., `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`) and align them with actual API payloads.
  - Add lightweight runtime guards where external data enters (service responses).

- **Documentation & conventions**
  - Update or add short docs/comments when refactor introduces new module boundaries, error patterns, or naming rules.

---

## Best Practices (tailored to this repo)

### 1) Prefer incremental refactors in the service layer
The repository exports multiple service functions/types. Treat these as public contracts:
- Refactor by **introducing small internal helpers** and **re-exporting unchanged signatures**.
- Avoid breaking changes to exported symbols unless paired with a migration plan.

### 2) Standardize service module structure
For `src/services/*`, converge on a consistent layout:

1. **Types** (exported API/domain interfaces)
2. **Constants** (base URLs, endpoints, headers)
3. **Pure helpers** (request building, parsing, mapping)
4. **Service functions/class** (public entry points)
5. **Error utilities** (typed errors, mapping)

### 3) Make boundary handling explicit
Service modules are boundary code (external APIs, auth providers). Improve reliability by:
- Mapping external errors to predictable internal error shapes.
- Validating assumptions at the boundary (e.g., required fields exist).

### 4) Keep utilities small and single-purpose
- If a util grows multiple responsibilities, split by domain:
  - `src/utils/formatters.ts` stays formatting-only (dates, numbers, display strings).
  - `src/lib/utils.ts` stays framework/general helpers (e.g., `cn` for class merging).
- Avoid “god” utils that become catch-alls.

### 5) Preserve naming conventions already present
- Utilities: short, descriptive verbs (`formatDateShort`, `cn`).
- Auth: action verbs (`signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`).
- OpusClip: domain names (`OpusClipService`, `OpusClipProject`).

### 6) Refactor with a “safety net”
Before touching code:
- Identify call sites of the exported symbol.
- Add/confirm minimal tests (or add smoke-level coverage around the refactor path).
- Prefer mechanical refactors (extract function, rename, move) that preserve behavior.

---

## Key Project Resources

- `README.md` — project overview and running instructions (starting point for verifying changes locally).
- `../../AGENTS.md` — global agent expectations (workflow, quality bar).
- `../docs/README.md` (if present) — documentation index.

> If docs are sparse, add a brief “Refactoring Notes” section in an appropriate docs location describing newly standardized patterns (service structure, error mapping).

---

## Repository Starting Points (focus areas)

- `src/services/`
  - Business logic and orchestration; frequent source of complexity and boundary bugs.
- `src/utils/`
  - Shared formatting/helpers used across UI/business logic.
- `src/lib/`
  - Shared low-level utilities (e.g., `cn`) and cross-cutting helpers.

Optional secondary focus (as discovered during work):
- `public/`
  - Static assets that may relate to service behavior or mock payloads.

---

## Key Files (what they do, what to refactor)

### `src/services/opusclip.ts`
**Purpose:** OpusClip integration/service orchestration.  
**Key exports:** `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`, `OpusClipService`.

**Refactor targets:**
- Split request construction vs response mapping.
- Centralize endpoint definitions and headers.
- Normalize error handling for API failures.
- Ensure types reflect real response structure (including optional/nullable fields).
- Add small pure functions: `mapProjectResponse`, `mapClipResponse`, `buildCreateProjectPayload`.

### `src/services/auth.ts`
**Purpose:** Auth workflows and current-user orchestration.  
**Key exports:** `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`.

**Refactor targets:**
- Consistent return shapes and error behavior across auth functions.
- Consolidate shared logic (e.g., user retrieval + post-login update).
- Extract provider-specific code into small adapters if mixed concerns exist.
- Ensure `updateLastLogin` is called in a predictable, testable place (e.g., post-sign-in pipeline).

### `src/utils/formatters.ts`
**Purpose:** Display formatting.  
**Key exports:** `formatDateShort`.

**Refactor targets:**
- Clarify timezone/locale assumptions (document defaults).
- Make function behavior stable for invalid inputs (explicit handling or type narrowing).
- Consolidate any ad-hoc date formatting found elsewhere into this module.

### `src/lib/utils.ts`
**Purpose:** Shared generic helpers.  
**Key exports:** `cn` (classname helper).

**Refactor targets:**
- Ensure consistent usage across UI components (avoid duplicate local `classNames` helpers).
- If other low-level helpers exist, enforce naming consistency and minimal surface area.

---

## Architecture Context (layers & how to refactor safely)

### Utils Layer (`src/utils`, `src/lib`)
- **Role:** Shared building blocks used across the codebase.
- **Refactor approach:** Prefer additive changes; avoid breaking signatures. If you must change behavior, add a new function and deprecate the old via comment and follow-up ticket.

### Services Layer (`src/services`, `public`)
- **Role:** Boundary code integrating external systems and encapsulating business flows.
- **Refactor approach:** Preserve exported API; isolate side effects; standardize error mapping; introduce internal pure functions for mapping/parsing.

---

## Key Symbols for This Agent (primary refactor candidates)

- `OpusClipService` — `src/services/opusclip.ts`
- `OpusClipProject` — `src/services/opusclip.ts`
- `OpusClipClip` — `src/services/opusclip.ts`
- `CreateProjectRequest` — `src/services/opusclip.ts`
- `signUp` — `src/services/auth.ts`
- `signIn` — `src/services/auth.ts`
- `signOut` — `src/services/auth.ts`
- `getCurrentUser` — `src/services/auth.ts`
- `updateLastLogin` — `src/services/auth.ts`
- `formatDateShort` — `src/utils/formatters.ts`
- `cn` — `src/lib/utils.ts`

---

## Common Workflows (step-by-step)

### Workflow A — Refactor a service module without breaking consumers
Use this for `opusclip.ts` or `auth.ts`.

1. **Inventory the public surface**
   - List exported functions/types.
   - Find call sites (search for imports of the module and symbol names).

2. **Classify issues**
   - Duplication (same fetch/options mapping in multiple places)
   - Mixed concerns (API calls + parsing + UI concerns)
   - Inconsistent return types / error behavior
   - Unclear naming

3. **Create an internal “refactor seam”**
   - Add internal helpers *without changing exports*:
     - `function buildRequest(...)`
     - `function parseResponse(...)`
     - `function mapError(...)`
   - Keep helpers pure where possible.

4. **Move code behind the seam**
   - Gradually replace inline logic with helper calls.
   - Ensure behavior remains identical (especially error throwing/return values).

5. **Normalize error handling**
   - Decide: throw typed errors vs return discriminated unions.
   - Keep consistent within the module (don’t mix patterns).

6. **Tighten types**
   - Ensure exported types are used internally (avoid `any`).
   - If API returns unknown shapes, parse/validate at the boundary and map to internal types.

7. **Run/build and update docs**
   - Confirm module-level documentation (brief comments) for tricky assumptions (auth state, token storage, rate limits).

**Deliverable:** a refactor PR that is mostly mechanical, with unchanged external API and improved internal structure.

---

### Workflow B — Consolidate duplicated utility patterns
Use this for date formatting and classname utilities.

1. **Search for duplicates**
   - Look for inline date formatting (`toLocaleDateString`, `Intl.DateTimeFormat` usage) outside `src/utils/formatters.ts`.
   - Look for local classname helpers duplicating `cn`.

2. **Extract or replace**
   - Replace scattered patterns with `formatDateShort` and `cn`.
   - If current util is insufficient, extend it *carefully*:
     - Add `formatDateLong` rather than changing `formatDateShort` behavior.

3. **Add micro-tests (if present) or usage examples**
   - At minimum, add a short JSDoc snippet showing expected inputs/outputs.

**Deliverable:** fewer one-off helpers, centralized patterns, clearer intent.

---

### Workflow C — Improve type contracts for external API responses (OpusClip)
1. **Identify the boundary**
   - Where response JSON is consumed, treat it as `unknown`.

2. **Add mapping functions**
   - `mapOpusClipProject(raw: unknown): OpusClipProject`
   - `mapOpusClipClip(raw: unknown): OpusClipClip`

3. **Handle optional/nullable fields explicitly**
   - Avoid assuming fields always exist.
   - Prefer defaulting or returning explicit errors with context.

4. **Minimize churn**
   - Keep exported types stable unless clearly wrong; if changes are needed, introduce new types and migrate call sites deliberately.

**Deliverable:** more predictable runtime behavior and fewer “cannot read property of undefined” issues.

---

### Workflow D — Refactor auth flows into a consistent pipeline
1. **Align behavior across `signUp` and `signIn`**
   - Ensure both yield consistent session/user shapes.
   - Ensure post-auth side effects (like `updateLastLogin`) are handled uniformly.

2. **Centralize current-user retrieval**
   - `getCurrentUser` should be the canonical path.
   - Avoid duplicating “get session -> map user” logic across functions.

3. **Clarify side effects**
   - Document whether `signOut` clears local state, cookies, caches, etc.
   - Ensure side effects are not scattered.

**Deliverable:** simpler auth code, fewer edge-case divergences between login paths.

---

## Refactoring Checklists

### Pre-refactor checklist
- [ ] Identify exported symbols and confirm they are treated as stable API.
- [ ] Locate call sites and note any implicit assumptions (nullability, exceptions).
- [ ] Decide a “no behavior change” scope for the first PR if possible.
- [ ] Confirm build/test commands from `README.md` (or existing scripts).

### Implementation checklist
- [ ] Extract pure helpers for parsing/mapping and request building.
- [ ] Remove duplication and unify naming (`mapX`, `buildY`, `assertZ`).
- [ ] Keep functions small; avoid deeply nested conditionals.
- [ ] Normalize error handling (one approach per module).
- [ ] Tighten types and remove `any`/implicit `unknown` usage at boundaries.

### Post-refactor checklist
- [ ] Re-run affected flows (auth sign-in/out; opusclip create/list actions).
- [ ] Verify no changes in exported signatures unless planned.
- [ ] Update docs/comments for new conventions.
- [ ] Leave follow-up notes for deferred improvements (explicit TODOs with context).

---

## Documentation Touchpoints (update when patterns change)

- `README.md` — if refactor changes environment needs, scripts, or integration behavior.
- `src/services/*` — add brief module header comments when new conventions are introduced (error model, mapping strategy).
- `src/utils/formatters.ts` — document locale/timezone assumptions and expected inputs.

---

## Collaboration Checklist (agent operating procedure)

- [ ] Confirm with maintainers whether the refactor must be **behavior-preserving** or may include small bug fixes.
- [ ] Propose a 2-step plan: **mechanical refactor** first, then **behavior/type improvements**.
- [ ] Keep PRs small and reviewable (one module or one theme per PR).
- [ ] Request review focusing on behavior equivalence and public API stability.
- [ ] Capture new conventions in docs and share a short summary in the PR description.

---

## Hand-off Notes (what to include in PR / final report)

- What changed (structure-only vs behavior changes).
- Which exported APIs are unchanged (explicit list).
- Any new internal helpers (names + purpose).
- Error-handling rules adopted (throw vs return, error types).
- Risks / follow-ups:
  - Places still lacking runtime validation
  - Potentially incorrect type assumptions
  - Additional duplication that should be addressed later

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
