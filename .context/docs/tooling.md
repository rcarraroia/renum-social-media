## Tooling & Productivity Guide

This project is a TypeScript/React web application with a conventional modern toolchain: a Node.js package manager, a dev server with hot reload, static analysis (linting + formatting), and type-safe integrations (notably Supabase types in `src/types/database.types.ts` and service wrappers under `src/services/*`).

This guide centralizes the tooling, scripts, and editor practices that keep day-to-day development fast and consistent across contributors.

For the end-to-end contribution flow (branching, running locally, opening PRs), see: **[development-workflow.md](./development-workflow.md)**.

---

## Required Tooling

> Install these tools before working on the repo. Version numbers may be enforced by the lockfile and CI; if the repo includes `.nvmrc` / `.node-version` / `engines` in `package.json`, follow those.

- **Node.js (LTS recommended)**
  - **What it powers:** running the dev server, builds, tests, linting, codegen.
  - **Install:**
    - macOS/Linux: use `nvm`, `fnm`, or system package manager.
    - Windows: use the Node installer or `nvm-windows`.
  - **Verify:**
    ```bash
    node -v
    ```

- **Package manager (use the one the repo is locked to)**
  - **What it powers:** dependency installation and script execution.
  - **Install/Use:**
    - If the repo contains `pnpm-lock.yaml`: use **pnpm**
    - If the repo contains `yarn.lock`: use **Yarn**
    - If the repo contains `package-lock.json`: use **npm**
  - **Verify (examples):**
    ```bash
    pnpm -v
    # or
    yarn -v
    # or
    npm -v
    ```

- **Git**
  - **What it powers:** version control, hooks, and PR workflows.
  - **Install:** via Git for Windows, Xcode command line tools (macOS), or package manager (Linux).
  - **Verify:**
    ```bash
    git --version
    ```

- **Supabase (account + project access)**
  - **What it powers:** authentication and database-backed features. Type definitions are present in `src/types/database.types.ts` (e.g., `Database`, `UsersRow`, `PostsRow`), and authentication helpers live in `src/services/auth.ts` (e.g., `signIn`, `signOut`, `getCurrentUser`).
  - **Install (optional CLI, but commonly used):**
    ```bash
    npm i -g supabase
    supabase --version
    ```
  - **You’ll need:** project URL/keys in environment variables (see `.env*` guidance in **development-workflow.md**).

- **Code editor (VS Code recommended)**
  - **What it powers:** TypeScript intellisense, formatting-on-save, ESLint feedback, import organization.

---

## Recommended Automation

Automation ensures consistent code style and catches issues early. Use the scripts from `package.json` as the source of truth; below are recommended conventions and how to wire them into your daily workflow.

### 1) One-command local development

Use the project’s dev script to start the local server with hot reload:

```bash
# use your repo’s package manager
pnpm dev
# or: npm run dev
# or: yarn dev
```

**Tip:** Keep this running while iterating on UI (`src/components/ui/*`, pages under `src/pages`, layouts under `src/components/layout/*`).

### 2) Type checking (fast feedback)

Run TypeScript checks before pushing changes, especially when editing shared types/services:

```bash
pnpm typecheck
# or: npm run typecheck
```

If a dedicated `typecheck` script doesn’t exist, the fallback is often:

```bash
pnpm build
```

### 3) Linting + formatting (make it routine)

Recommended workflow:

- **Lint** before committing:
  ```bash
  pnpm lint
  ```
- **Fix lint issues automatically** (if supported):
  ```bash
  pnpm lint --fix
  ```
- **Format** (if a formatter script exists):
  ```bash
  pnpm format
  ```

If your editor is configured correctly (see next section), formatting and many lint fixes happen automatically on save.

### 4) Pre-commit hooks (highly recommended)

To prevent style/type regressions from landing in the repo, set up pre-commit hooks to run:

- `lint` (or `eslint`)
- formatting (Prettier)
- optional: `typecheck` (may be slower—consider running on pre-push instead)

**Common setup options:**
- **Husky + lint-staged** (most common for JS/TS repos)
- **lefthook** (fast alternative)

A typical `lint-staged` configuration runs ESLint/Prettier only on changed files, keeping commits fast.

### 5) Watch modes / fast iteration loops

When supported by scripts, prefer watch modes while refactoring:

```bash
pnpm test --watch
pnpm lint --watch
```

If your project doesn’t define watch scripts, you can often achieve similar results by running the dev server plus occasional `pnpm lint` / `pnpm typecheck` in a second terminal.

### 6) Safe refactors: follow the service/type boundaries

The repo has clear boundaries that work well with automation:

- **Types**: `src/types/database.types.ts` (Supabase-driven)
- **Services**: `src/services/*` (e.g., `auth.ts`, `opusclip.ts`)
- **Utilities**: `src/lib/utils.ts` (`cn`), `src/utils/formatters.ts` (`formatDateShort`)
- **Hooks**: `src/hooks/*` (`useAuth`, `useOrganization`, `useIsMobile`)

When automation flags an issue, fix it closest to the boundary it belongs to (e.g., service layer vs. UI component).

---

## IDE / Editor Setup (optional)

Recommended VS Code setup to surface problems early and keep formatting consistent.

### Extensions

- **ESLint** (`dbaeumer.vscode-eslint`)
  - Inline linting, quick fixes, and auto-fix on save.
- **Prettier** (`esbenp.prettier-vscode`)
  - Consistent formatting across the team.
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) *(if Tailwind is used in the project)*
  - Class name autocompletion and linting.
- **EditorConfig** (`EditorConfig.EditorConfig`) *(if `.editorconfig` exists)*
  - Keeps indentation and line endings consistent.

### Workspace settings (recommended)

Add a `.vscode/settings.json` (or configure locally) to enforce formatting and fixes on save:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

If the project uses Prettier, ensure VS Code uses it as the default formatter:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### TypeScript performance tip

For large repos, consider using the workspace TypeScript version (if the project specifies one):

- Command Palette → **TypeScript: Select TypeScript Version** → **Use Workspace Version**

---

## Productivity Tips (optional)

### 1) Two-terminal workflow

A simple setup that keeps feedback tight:

- Terminal A:
  ```bash
  pnpm dev
  ```
- Terminal B:
  ```bash
  pnpm lint
  pnpm typecheck
  ```

### 2) Quick verification checklist before pushing

Run these in order to catch most issues:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

(If tests exist, include `pnpm test`.)

### 3) Keep environment variables explicit and local

Use `.env.local` (or the project’s preferred `.env*` file pattern) for developer-specific values (Supabase keys, API tokens). Avoid committing secrets.

If you’re unsure which env vars are required, check:
- `development-workflow.md`
- any `.env.example` file in the repo (if present)

### 4) Prefer existing utilities over re-implementing helpers

Before adding new helpers, scan existing utilities:

- `src/lib/utils.ts` — common UI helper(s) like `cn(...)`
- `src/utils/formatters.ts` — formatting helpers like `formatDateShort(...)`

This reduces duplication and keeps style consistent.

---

## Related Resources

- [development-workflow.md](./development-workflow.md)
