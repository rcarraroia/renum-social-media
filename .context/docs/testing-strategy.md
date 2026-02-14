# Testing Strategy

This repository is a TypeScript/React application with a layered structure (UI components, hooks, services, and shared utilities). The testing strategy is designed to keep feedback fast for day-to-day development while still providing confidence that key user flows (auth, organization context, and service integrations) behave correctly.

The approach is:

- **Prefer unit tests for pure logic** (utilities in `src/utils` and `src/lib`, small hooks, isolated components).
- **Use integration tests for “multiple modules working together”** (components + hooks + stores; services interacting with Supabase/HTTP through mocks).
- **Reserve E2E tests for critical paths** (auth + navigation + guarded routes, core screens), run less frequently due to cost and flakiness risk.
- **Shift-left quality**: linting/formatting/type-checking are treated as part of the test gate and should pass before merging.

Where to focus first:
- **Services** (`src/services/*`): `auth.ts`, `opusclip.ts` should be covered with deterministic tests using mocks.
- **Hooks** (`src/hooks/*`): `useAuth`, `useOrganization`, `use-mobile` should be tested with a hooks test harness.
- **Route protection/auth flow** (`src/components/auth/*`): `ProtectedRoute`, `LoginForm`, `SignupForm` should have integration coverage.
- **Shared utilities** (`src/lib/utils.ts`, `src/utils/formatters.ts`): these should be close to 100% unit covered because they’re cheap and stable.

---

## Test Types

- **Unit**
  - **Goal:** Validate behavior of a single function/component/hook in isolation.
  - **Framework(s):** Jest *or* Vitest (choose one and standardize—see repository scripts).
  - **DOM/React tooling:** React Testing Library (`@testing-library/react`), `@testing-library/jest-dom`.
  - **File naming conventions:**
    - `*.test.ts` / `*.test.tsx` (preferred)
    - `*.spec.ts` / `*.spec.tsx` (acceptable, but be consistent)
  - **Typical targets in this repo:**
    - `src/utils/formatters.ts` (`formatDateShort`)
    - `src/lib/utils.ts` (`cn`)
    - Small UI components in `src/components/ui/*` (rendering + props behavior)

- **Integration**
  - **Goal:** Validate behavior across module boundaries (component + hook + store/service), while still running in Node/JSDOM with mocks for external systems.
  - **Framework(s):** Same runner as unit tests (Jest/Vitest) + React Testing Library.
  - **Required tooling/patterns:**
    - Mock external dependencies (e.g., Supabase client, fetch/HTTP) using the runner’s mocking tools.
    - Prefer **MSW (Mock Service Worker)** for HTTP-style integration tests when you want realistic request/response behavior without real network calls.
  - **File naming conventions:**
    - `*.int.test.ts` / `*.int.test.tsx` (recommended to distinguish from unit tests)
    - or colocate under `__tests__/integration/*`
  - **Typical scenarios in this repo:**
    - `ProtectedRoute` redirects/blocks when `useAuth` reports unauthenticated
    - `useOrganization` returns the correct organization based on mocked user/session
    - `OpusClipService` methods call the expected endpoints/payloads (mock transport)

- **E2E**
  - **Goal:** Validate real user flows in a real browser against a running app.
  - **Framework(s):** Playwright *or* Cypress (pick one; Playwright is commonly preferred for modern TS setups).
  - **Required tooling/patterns:**
    - Seed/test accounts and test data (or stub network with MSW/Playwright routing where appropriate)
    - Dedicated `.env.e2e` (or equivalent) to avoid using developer credentials
    - Stable selectors (prefer `data-testid` only for E2E if semantic queries aren’t sufficient)
  - **File naming conventions:**
    - `e2e/**/*.spec.ts` (Playwright default)
    - `cypress/e2e/**/*.cy.ts` (Cypress default)
  - **Typical scenarios in this repo:**
    - Sign up / sign in / sign out flow
    - Accessing a protected page redirects to login
    - Creating or viewing primary domain entities (posts/videos/projects) with mocked or test backend

---

## Running Tests

> Exact script names can vary by setup. Use the commands below as the expected interface; keep `package.json` scripts aligned to them.

- **All tests**
  ```bash
  npm run test
  ```

- **Watch mode (local development)**
  ```bash
  npm run test -- --watch
  ```

- **Coverage**
  ```bash
  npm run test -- --coverage
  ```

- **Run a single test file**
  ```bash
  npm run test -- src/utils/formatters.test.ts
  ```

- **Run only integration tests (recommended convention)**
  ```bash
  npm run test -- --testPathPattern="\.int\.test\."
  ```

- **E2E (if configured)**
  ```bash
  npm run test:e2e
  ```

---

## Quality Gates

- **Coverage thresholds (minimums)**
  - **Global:** 80% lines / 80% statements / 80% branches / 80% functions
  - **Critical modules (recommended higher bar):**
    - `src/utils/**`: 95%+
    - `src/lib/**`: 90%+
    - `src/services/**`: 85%+ (with strong branch coverage around error handling)
  - Notes:
    - Coverage should not be used as a proxy for quality; include assertions that validate behavior, error paths, and edge cases.
    - Any coverage exclusions must be justified (generated files, type-only modules, etc.).

- **Linting and formatting must pass before merge**
  - Lint: `npm run lint`
  - Format check (if present): `npm run format:check` (or equivalent)
  - Type check: `npm run typecheck` (or `tsc -p . --noEmit`)
  - These checks should run in CI for pull requests and block merging if failing.

- **Deterministic tests**
  - No real network calls in unit/integration tests.
  - Mock time (`Date.now`, timers) when validating time-dependent behavior.
  - Avoid random IDs unless seeded; if IDs are required, mock the generator.

- **PR expectations**
  - New features require tests for:
    - main success path
    - at least one error/failure path
  - Bug fixes require:
    - a regression test demonstrating the bug
    - a test validating the fix

---

## Troubleshooting

Flaky or slow tests are usually caused by async timing, unmocked network calls, or environment differences.

Common fixes:

- **Tests hang or time out**
  - Ensure all Promises resolve (await async calls).
  - If using fake timers, advance timers and restore real timers after the test.
  - Verify there are no real HTTP requests; use MSW or mocks.

- **Auth/session-dependent tests are inconsistent**
  - Centralize auth mocking (e.g., mock `src/services/auth.ts` or the Supabase client wrapper once in a shared test setup file).
  - Reset mocks between tests (`afterEach(() => jest.resetAllMocks())` / Vitest equivalent).

- **Component tests fail due to missing providers**
  - Create a shared `renderWithProviders` helper for common wrappers (router, auth context/store, toast provider).
  - Prefer integration tests for provider-heavy components rather than over-mocking internals.

- **E2E failures in CI but not locally**
  - Use headless mode locally to reproduce.
  - Ensure deterministic test data and a dedicated E2E environment configuration.
  - Add tracing/screenshots/video on failure (Playwright/Cypress config).

---

## Related Resources

- [development-workflow.md](./development-workflow.md)
