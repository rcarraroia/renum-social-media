# Test Writer Agent Playbook — renum-social-media

## Mission

Create reliable, maintainable automated tests that protect business logic and user-facing behavior, with emphasis on **service-layer correctness** and **utility stability**. This agent is engaged when:
- New features are added/changed in `src/services/**`, `src/utils/**`, `src/lib/**`, or auth components.
- Bug fixes require regression coverage.
- Refactors need safety nets (tests that lock in behavior before/after).
- CI failures need targeted fixes or test stabilization.

---

## Responsibilities

- **Write unit tests** for pure utilities and deterministic functions (e.g., formatters, className utilities).
- **Write integration-style tests** for service methods that orchestrate API calls/auth flows (mocking network/auth providers).
- **Define test cases** based on requirements and edge cases (invalid input, null/undefined, API failures, timezones).
- **Establish/maintain test conventions** (file naming, mocking strategy, fixtures).
- **Prevent flaky tests** by controlling time, randomness, and external I/O (network, localStorage, auth state).
- **Document test intent** in readable test names and minimal, high-signal assertions.

---

## Repository Starting Points (focus areas)

### 1) Services (highest priority)
- `src/services/**`  
  Business logic and orchestration live here; tests should validate behavior and error handling.
  - `src/services/opusclip.ts` — `OpusClipService` + types used for OpusClip project/clip flows.
  - `src/services/auth.ts` — auth actions: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`.

### 2) Shared utilities
- `src/utils/**`  
  Small helpers; ideal for fast unit tests.
  - `src/utils/formatters.ts` — `formatDateShort`.

- `src/lib/**`  
  Cross-cutting helpers.
  - `src/lib/utils.ts` — `cn` (class name composition helper).

### 3) Auth UI components (targeted)
- `src/components/auth/**`  
  If UI logic exists, prefer component tests focusing on user-visible behavior and service integration boundaries.

---

## Key Files (what they do + what to test)

- `src/services/opusclip.ts`
  - **Purpose:** Encapsulate OpusClip API interactions and data shaping.
  - **Test goals:**
    - Correct request construction (URLs, headers, body).
    - Parsing/return shape matches `OpusClipProject` / `OpusClipClip`.
    - Error paths (non-2xx, unexpected payloads) handled consistently.
    - Boundary conditions: missing IDs, empty lists, invalid request payload.

- `src/services/auth.ts`
  - **Purpose:** Wrap auth provider operations and user session behaviors.
  - **Test goals:**
    - Successful sign-up/sign-in/out flows call provider with correct parameters.
    - `getCurrentUser` returns expected value for logged-in vs logged-out states.
    - `updateLastLogin` updates appropriate user metadata and handles failures.

- `src/utils/formatters.ts` (`formatDateShort`)
  - **Purpose:** Presentational formatting.
  - **Test goals:**
    - Stable output for known dates.
    - Edge cases: invalid date input, timezone-dependent output (lock timezone/time if needed).

- `src/lib/utils.ts` (`cn`)
  - **Purpose:** Consistent className merging.
  - **Test goals:**
    - Merges strings/arrays/conditional values correctly.
    - Deduping/merging behavior (if using `clsx`/`tailwind-merge` patterns).

---

## Key Symbols for This Agent

### Services
- `OpusClipService` — `src/services/opusclip.ts`
- Types:
  - `OpusClipProject`
  - `OpusClipClip`
  - `CreateProjectRequest`

### Auth
- `signUp` — `src/services/auth.ts`
- `signIn` — `src/services/auth.ts`
- `signOut` — `src/services/auth.ts`
- `getCurrentUser` — `src/services/auth.ts`
- `updateLastLogin` — `src/services/auth.ts`

### Utilities
- `formatDateShort` — `src/utils/formatters.ts`
- `cn` — `src/lib/utils.ts`

---

## Test Strategy (what “good” looks like here)

### Prioritization
1. **Service layer**: highest ROI (most regressions, highest complexity).
2. **Utils**: quick wins; lock in expected outputs.
3. **Auth components**: test user outcomes and integration, not internal implementation.

### Test types
- **Unit tests**: utilities + isolated service methods with fully mocked dependencies.
- **Integration-ish tests**: service flows using mocked network/auth but exercising real orchestration logic.

---

## Workflows (common tasks)

### Workflow A — Add tests for a service method (OpusClip/auth)
1. **Locate the public API** (exported function or class method).
2. **Map dependencies**:
   - Network calls (`fetch`, axios, etc.)
   - Auth/session provider
   - Date/time, storage, environment variables
3. **Define scenarios**:
   - Happy path
   - Common failure (401/403/500, invalid payload)
   - Edge input (missing ID, empty strings, null)
4. **Mock boundaries**:
   - Mock network at the lowest stable boundary (prefer mocking `fetch` or a dedicated client).
   - Avoid mocking the function under test.
5. **Assert outcomes**:
   - Returned value shape
   - Side effects (e.g., update calls, signOut invoked)
   - Error semantics (throws vs returns error object)
6. **Add regression test** replicating the bug (if applicable).
7. **Run and stabilize**: ensure deterministic time and environment.

### Workflow B — Add tests for utilities (`formatDateShort`, `cn`)
1. Identify accepted input types (Date/string/number/undefined).
2. Create **table-driven tests** covering:
   - Typical inputs
   - Edge cases
3. Ensure locale/timezone stability:
   - If formatting is locale-sensitive, lock locale or assert pattern rather than exact string when appropriate.

### Workflow C — Fix a failing/flaky test
1. Identify flake source: time, random, async timing, network.
2. Control it:
   - Mock timers and `Date`
   - Avoid real network; use stable mocks
   - Await async UI updates properly
3. Reduce over-assertion: assert only behavior that matters.

---

## Best Practices (tailored to this codebase)

### Services: test behavior, not implementation
- Validate **inputs to external boundaries** (request payloads, auth provider calls).
- Validate **outputs and thrown errors**.
- Keep service tests independent from UI rendering.

### Mock external I/O consistently
- For OpusClip-related tests: mock HTTP layer and assert request shape.
- For auth-related tests: mock auth provider methods and user/session state.

### Control time and environment
- `formatDateShort` and any “last login” logic can become timezone/time dependent.
- Freeze time in tests when behavior depends on “now”.

### Prefer minimal fixtures with typed shapes
- Create lightweight fixtures for:
  - `OpusClipProject`
  - `OpusClipClip`
  - auth user/session object
- Keep fixtures close to tests unless reused widely.

### Use “Arrange / Act / Assert”
- Make intent obvious; keep assertions tight and high-signal.

---

## Test Coverage Checklist (per target)

### `src/services/opusclip.ts`
- [ ] Creates project with correct request payload (`CreateProjectRequest` coverage).
- [ ] Handles success response → returns `OpusClipProject`.
- [ ] Handles error response (non-2xx) → throws/returns consistent error.
- [ ] Handles malformed response payload gracefully.
- [ ] Any “list clips/projects” method: empty list vs populated list.

### `src/services/auth.ts`
- [ ] `signUp` passes correct params; handles provider error.
- [ ] `signIn` passes correct params; handles bad credentials.
- [ ] `signOut` clears state / calls provider exactly once.
- [ ] `getCurrentUser` returns null/undefined when logged out.
- [ ] `updateLastLogin` updates the correct field and handles network/provider failure.

### `src/utils/formatters.ts`
- [ ] Stable output for a known date.
- [ ] Invalid input behavior defined and tested.
- [ ] Timezone/locale considerations handled.

### `src/lib/utils.ts` (`cn`)
- [ ] Concatenates multiple args correctly.
- [ ] Ignores falsy values appropriately.
- [ ] Handles arrays/objects if supported.

---

## Conventions & Patterns to Follow

### Test file placement and naming
Use one of these patterns (match existing repo convention if present):
- Co-locate: `src/services/auth.test.ts` next to `auth.ts`
- Or mirror in test directory: `tests/services/auth.test.ts`

### Test naming
- Prefer: `it('returns <expected> when <condition>')`
- Describe “user” or “caller” perspective for services: `it('throws when opusclip API returns 401')`

### Table-driven tests
- For utilities, prefer parameterized tests with clear cases.

---

## Documentation Touchpoints

- `README.md` — project setup, scripts (use to discover test runner commands).
- `AGENTS.md` — shared agent guidance (if present in repo root).
- Any docs under `docs/**` (if present) — testing/CI notes and architectural decisions.

---

## Collaboration Checklist (definition of done)

- [ ] Confirm test runner/tooling and existing conventions (Vitest/Jest/RTL/Cypress) by checking `package.json` scripts and config.
- [ ] Add/extend tests covering new behavior and at least one failure mode.
- [ ] Ensure tests are deterministic (no real network/time reliance).
- [ ] Keep mocks localized; avoid global pollution between tests.
- [ ] Run full test suite locally (or targeted suite + CI-equivalent command).
- [ ] Update docs or add notes if new test patterns/mocks are introduced.

---

## Hand-off Notes (what to leave behind)

When completing a test-writing task, leave:
- A short summary of what behavior is now covered (and what is not).
- Any discovered edge cases or ambiguity in service contracts.
- Recommendations for refactors that would improve testability (e.g., dependency injection for HTTP/auth clients).

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
