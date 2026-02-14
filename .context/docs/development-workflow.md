# Development Workflow

This repository is a frontend application with a component-driven UI (`src/components/**`), hooks (`src/hooks/**`), services for external integrations and auth (`src/services/**`), and shared utilities/types (`src/utils/**`, `src/lib/**`, `src/types/**`). Day-to-day development typically follows this loop:

1. **Pick a unit of work**
   - Start from a small, reviewable scope (bugfix, UI tweak, service integration change).
   - Prefer creating/using an issue that describes expected behavior and acceptance criteria.

2. **Create a short-lived branch**
   - Branch from the main development line (see [Branching & Releases](#branching--releases)).
   - Keep branches focused to ease review and reduce merge conflicts.

3. **Implement with the existing layering**
   - **UI & pages:** `src/pages/**`, `src/components/**` (including `src/components/ui/**` for reusable primitives).
   - **Business logic / state:** colocate in hooks (`src/hooks/**`) where possible.
   - **External calls:** go through `src/services/**` (e.g., auth helpers in `src/services/auth.ts`, external integration in `src/services/opusclip.ts`).
   - **Types:** prefer `src/types/**` for shared types (e.g., `src/types/database.types.ts`).
   - **Utilities:** use `src/lib/utils.ts` and `src/utils/**` for cross-cutting helpers (e.g., `cn`, `formatDateShort`).

4. **Validate locally**
   - Run the dev server, exercise the impacted flows, and run tests/linting if available.
   - If you add/modify services or hooks, verify UI state transitions and error handling (especially auth/session flows).

5. **Open a Pull Request early**
   - Open as *Draft* if still in progress.
   - Include context, screenshots for UI changes, and explicit test steps.

6. **Review, iterate, and merge**
   - Address comments with follow-up commits.
   - Keep the PR up to date with the base branch to avoid drift.

For deeper guidance on test expectations and tooling conventions, see:
- [testing-strategy.md](./testing-strategy.md)
- [tooling.md](./tooling.md)

---

## Branching & Releases

- **Branching model:** Trunk-based development (recommended for this repo)
  - `main` is the stable integration branch.
  - Feature work happens on short-lived branches and merges back via PR.

- **Branch naming conventions (recommended)**
  - `feat/<short-description>` — new user-facing functionality
  - `fix/<short-description>` — bug fixes
  - `chore/<short-description>` — refactors, maintenance, deps, tooling
  - `docs/<short-description>` — documentation-only changes

- **Pull request hygiene**
  - Keep PRs small and focused (ideally one feature/fix per PR).
  - Avoid mixing formatting-only changes with logic changes unless necessary.

- **Release cadence**
  - Default: release when a meaningful set of changes is ready (continuous delivery).
  - If you adopt a scheduled cadence later (e.g., weekly), document the schedule and responsibilities here.

- **Tagging conventions (recommended)**
  - Use semantic versioning tags: `vMAJOR.MINOR.PATCH` (e.g., `v1.4.2`).
  - Patch: backward-compatible bug fixes
  - Minor: backward-compatible features
  - Major: breaking changes (coordinate carefully)

- **Hotfixes**
  - For urgent production fixes, branch from the latest stable tag (or `main` if tags aren’t used yet), open a PR, and prioritize review/merge.
  - Follow with a patch tag (`vX.Y.(Z+1)`) after merge.

---

## Local Development

> The exact scripts may vary by setup. Use the commands below as the standard workflow, and refer to `package.json` for the authoritative list of scripts.

- **Install dependencies**
  ```bash
  npm install
  ```

- **Run locally (development server)**
  ```bash
  npm run dev
  ```

- **Build for production**
  ```bash
  npm run build
  ```

- **Preview the production build (if supported by the tooling)**
  ```bash
  npm run preview
  ```

- **Run tests (if configured)**
  ```bash
  npm test
  ```
  See [testing-strategy.md](./testing-strategy.md) for what to run before opening a PR.

- **Lint / format (if configured)**
  ```bash
  npm run lint
  npm run format
  ```
  See [tooling.md](./tooling.md) for linting/formatting rules and editor setup.

- **Environment variables**
  - Create a local env file as needed (commonly `.env` or `.env.local` depending on the toolchain).
  - Keep secrets out of git; use example files (e.g., `.env.example`) when introducing new variables.
  - If the app integrates with auth/external services (e.g., Supabase auth helpers in `src/services/auth.ts`, integrations in `src/services/opusclip.ts`), ensure required keys/URLs are present in your env.

---

## Code Review Expectations

Code review is expected for all merges to the main branch. Reviews should focus on correctness, maintainability, security, and user impact—not just style.

**What reviewers look for**
- **Correctness & UX**
  - The change meets the acceptance criteria and doesn’t introduce regressions.
  - UI changes are accessible and consistent with existing patterns in `src/components/ui/**`.
- **Architecture fit**
  - UI logic stays in components; reusable logic goes into hooks (`src/hooks/**`).
  - External API and auth operations are routed through services (`src/services/**`).
  - Shared logic is extracted into `src/utils/**` or `src/lib/**` when it benefits reuse.
- **Types & data contracts**
  - Database/external contracts use shared types where available (e.g., `src/types/database.types.ts`).
  - Public exports remain stable unless a breaking change is intentional.
- **Error handling**
  - Network/auth failures are handled and surfaced appropriately.
  - No sensitive information is logged or exposed.
- **Testing**
  - New behavior is covered by tests when feasible.
  - At minimum, PR includes clear manual test steps.
  - Follow the guidance in [testing-strategy.md](./testing-strategy.md).
- **Tooling compliance**
  - Passes lint/format/build checks as defined in [tooling.md](./tooling.md).

**Approvals**
- Recommended baseline: at least **one approving review** before merging.
- For higher-risk changes (auth/session handling, service integrations, cross-cutting refactors), require **two approvals** or a domain owner review.

**Agent collaboration**
- If you use coding agents or automated assistants, follow **AGENTS.md** for collaboration guidelines:
  - how to structure tasks,
  - what context to provide,
  - and how to validate agent-generated changes before review.

---

## Onboarding Tasks

New contributors can get productive quickly by completing these tasks:

1. **Set up local dev**
   - Install dependencies, run the app, confirm the main flows load (see [Local Development](#local-development)).

2. **Learn the code layout**
   - Browse `src/components/**` (UI and layout structure)
   - Review key hooks: `src/hooks/useAuth.ts`, `src/hooks/useOrganization.ts`
   - Skim service boundaries: `src/services/auth.ts`, `src/services/opusclip.ts`
   - Check shared types: `src/types/database.types.ts`

3. **Take a starter task**
   - Look for issues labeled (recommended): `good first issue`, `help wanted`, `starter`, or `docs`.
   - Good starter changes in this repo often include:
     - small UI component fixes in `src/components/ui/**`
     - improving error/loading states
     - documentation updates (including clarifying environment setup)
     - adding or tightening types in `src/types/**`

4. **Reference runbooks/tools**
   - Testing expectations: [testing-strategy.md](./testing-strategy.md)
   - Tooling/editor setup: [tooling.md](./tooling.md)

---

## Related Resources

- [testing-strategy.md](./testing-strategy.md)
- [tooling.md](./tooling.md)
