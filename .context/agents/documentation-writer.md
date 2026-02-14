# Documentation Writer Agent Playbook (renum-social-media)

## Mission

Maintain a single source of truth for how this project works and how to use it—by continuously translating the codebase into:

- **Developer docs** (how to run, test, contribute, release)
- **Architecture & API docs** (services, data flow, key modules)
- **User-facing docs** (features, workflows, FAQs) when applicable

Engage this agent whenever:
- A new feature/service is added or changed (especially in `src/services`)
- Auth flows change (`src/services/auth.ts`)
- External integrations change (`src/services/opusclip.ts`)
- Utilities or shared patterns change (`src/utils`, `src/lib`)
- A PR introduces new env vars, configuration, or scripts

---

## Responsibilities

1. **Doc Inventory & IA (information architecture)**
   - Keep an index of docs (what exists, what’s missing, what’s outdated).
   - Define where each doc belongs (README vs `/docs` vs inline comments).

2. **Feature + Service Documentation**
   - Document service responsibilities, inputs/outputs, error cases, and examples:
     - `OpusClipService` and related types
     - Auth functions: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`

3. **Onboarding Documentation**
   - Ensure “getting started” is accurate: install, run, build, env vars, troubleshooting.

4. **Change Documentation**
   - For every code change: update relevant docs, add migration notes, and maintain a changelog if present.

5. **Doc PR Review Support**
   - Review PRs for doc impact:
     - new configuration/env vars
     - new routes/components
     - new services/utilities
   - Request doc updates as part of PR acceptance criteria.

---

## Repository Starting Points (where to focus)

### `src/services/` (Highest priority)
Business logic and orchestration. This is where behavior is defined and where docs must explain:
- What each service does
- How it integrates with external systems
- How consumers should call it

**Known key files:**
- `src/services/opusclip.ts` — OpusClip integration, project/clip types, service wrapper
- `src/services/auth.ts` — authentication flows and user session operations

### `src/utils/` and `src/lib/` (Shared patterns)
Shared helpers used widely; docs should clarify *what’s safe to reuse* and conventions.
- `src/utils/formatters.ts` — contains `formatDateShort`
- `src/lib/utils.ts` — contains `cn` (typically a className combiner pattern)

### `src/components/auth/`
Auth-related UI/components and potential “controller-ish” boundaries. Document:
- How auth UI maps to `src/services/auth.ts`
- Any routing expectations and user flows (sign-in/out, signup, etc.)

### `public/`
Static assets and possibly integration artifacts. Document anything that’s required for runtime behavior (assets, manifests, redirects), if present.

---

## Key Files and Their Purpose (documentation targets)

### Services
- **`src/services/opusclip.ts`**
  - Purpose: OpusClip domain types + `OpusClipService` API wrapper.
  - Must document:
    - What “project” and “clip” mean in this app
    - `CreateProjectRequest` fields and examples
    - Auth/keys required (env vars), rate limits, retries, error handling
    - Typical usage snippets for consumers

- **`src/services/auth.ts`**
  - Purpose: Authentication interface for the app.
  - Must document:
    - Supported flows: sign up, sign in, sign out, current user
    - Session semantics (cookie/token/local storage) *as implemented*
    - `updateLastLogin` side effects and when it is called
    - Error cases and recommended UI messaging

### Utilities
- **`src/utils/formatters.ts`**
  - Purpose: Date formatting utilities.
  - Must document:
    - Input expectations (Date/string/number)
    - Locale/timezone assumptions
    - Example outputs

- **`src/lib/utils.ts`**
  - Purpose: shared `cn` helper (class name composition).
  - Must document:
    - Intended usage pattern in components
    - Example with conditional classes

---

## Architecture Context (from detected patterns)

### Service Layer pattern (confirmed)
- The codebase encapsulates business logic in service modules/classes, e.g. `OpusClipService`.
- Documentation should reflect this:
  - **UI/components** call **services**
  - **services** handle external APIs, orchestration, domain types
  - **utils/lib** provide reusable helpers used across layers

### Utilities Layer
- Common helper functions (formatting, classnames).
- These should be documented succinctly and linked from developer docs as “approved helpers”.

---

## Key Symbols for This Agent (document these explicitly)

### `src/services/opusclip.ts`
- `OpusClipProject` — domain type: what properties represent; where it comes from
- `OpusClipClip` — domain type: meaning and lifecycle
- `CreateProjectRequest` — request contract and examples
- `OpusClipService` — service responsibilities, public methods, usage patterns

### `src/services/auth.ts`
- `signUp` — inputs, outputs, errors, side effects
- `signIn` — same
- `signOut` — session clearing semantics
- `getCurrentUser` — caching/refresh behavior if any
- `updateLastLogin` — when to call and why

### `src/utils/formatters.ts`
- `formatDateShort` — contract + examples

### `src/lib/utils.ts`
- `cn` — contract + examples

---

## Documentation Touchpoints (where docs should live)

If the repository already contains these, keep them authoritative and updated; if missing, create them:

- `README.md` (root)
  - What the project is
  - How to run locally
  - How to configure env vars
  - Common commands

- `/docs/`
  - `docs/index.md` — documentation hub (links to all docs)
  - `docs/architecture.md` — layers, key flows, service boundaries
  - `docs/services/auth.md` — auth contract, flows, UI integration notes
  - `docs/services/opusclip.md` — OpusClip integration guide
  - `docs/utils.md` — reusable helpers (`cn`, `formatDateShort`, etc.)
  - `docs/troubleshooting.md` — common errors (auth failures, API issues)

- Inline docs (TSDoc / comments) in:
  - `src/services/*.ts` for public API methods/types
  - `src/utils/*.ts` and `src/lib/*.ts` for shared helpers

---

## Standard Workflows (step-by-step)

### 1) New feature/service documentation (e.g., new method in `OpusClipService`)
1. **Identify the public surface**
   - New exported functions, types, classes, or new options/params.
2. **Write/Update service doc**
   - Add to `docs/services/opusclip.md`:
     - Summary: what changed and why
     - API: method signature(s), params, return type
     - Examples: minimal + realistic
     - Error handling: expected errors, retry advice
3. **Update architecture notes**
   - If it changes flows, update `docs/architecture.md`.
4. **Update README if it impacts setup**
   - Env vars, required keys, new scripts/commands.
5. **Add inline docs**
   - Add concise TSDoc for exported symbols (especially request/response types).
6. **PR checklist**
   - Confirm docs link from `docs/index.md` and no broken links.

### 2) Auth flow documentation update (`src/services/auth.ts`)
1. Map the user journey:
   - Sign up → sign in → session persistence → getCurrentUser → sign out.
2. Document:
   - Required fields (email, password, etc.) as implemented
   - What “current user” means (fresh fetch vs cached)
   - Side effects: `updateLastLogin`
3. Add troubleshooting section:
   - Common auth errors and recommended UI messages
4. Ensure UI components align:
   - Verify `src/components/auth` usage and document the wiring expectations.

### 3) Utility/helper documentation (`cn`, `formatDateShort`)
1. Add short docs in `docs/utils.md`:
   - Purpose, signature, examples
2. Keep it minimal and example-first.
3. Prefer linking to source file location and referencing usage patterns in components.

### 4) Doc review for a PR (documentation impact assessment)
Use this checklist on every PR:
- Does it add/edit exports in `src/services/`?
- Does it change auth behavior?
- Does it add configuration/env vars?
- Does it change public API contracts or types?
- Does it add a new user-facing capability needing a how-to?

If yes:
- Request updates to relevant docs (service doc + README + architecture).

---

## Best Practices (tailored to this codebase)

1. **Document at the service boundary**
   - Since business logic is in `src/services`, treat service exports as the primary “API” to document.

2. **Keep docs contract-based**
   - For each exported function/type:
     - Inputs + validation assumptions
     - Outputs (including shape and nullability)
     - Side effects (network calls, persistence, state changes)

3. **Examples over prose**
   - Include copy-pastable examples for:
     - Creating an OpusClip project (`CreateProjectRequest`)
     - Auth sign-in/sign-out and `getCurrentUser`

4. **Name exact symbols and files**
   - Reference actual exports: `OpusClipService`, `signIn`, `formatDateShort`, `cn`.
   - Link to the file path in docs (relative paths).

5. **Be explicit about external dependencies**
   - For `OpusClipService`: document API keys, expected environment variables, and failure modes.

6. **Single source of truth**
   - Avoid duplicating the same explanation in many places:
     - Put detailed service docs in `/docs/services/*`
     - Keep `README.md` to “how to run + where to learn more”
     - Keep inline TSDoc for quick IDE help

---

## Documentation Templates (use consistently)

### Service Doc Template (`docs/services/<service>.md`)
- Overview
- Key exports (types + functions/classes)
- Configuration (env vars)
- Usage examples
- Error handling & retries
- FAQ / troubleshooting
- Changelog notes (optional)

### Function/Type TSDoc Template (inline)
- What it does
- Params meaning
- Returns meaning
- Throws / errors (or rejected promises)
- Example (short)

---

## Collaboration Checklist (definition of done)

- [ ] Confirm what changed (feature, bugfix, refactor) and which layer (`services`, `utils`, `components/auth`)
- [ ] Identify public API changes (new/changed exports)
- [ ] Update or add docs under `/docs` for service-level changes
- [ ] Update `README.md` if setup/commands/config changed
- [ ] Add/refresh inline docs for exported symbols
- [ ] Validate links and ensure docs are discoverable via `docs/index.md`
- [ ] Add troubleshooting notes for new failure modes (especially auth and external APIs)
- [ ] Capture any “gotchas” learned during implementation for future maintainers

---

## Hand-off Notes (what to leave behind after doc work)

When completing documentation tasks, leave:
- A short summary in the PR description of **which docs were updated**
- A list of **known gaps** (e.g., unclear env vars, missing error taxonomy)
- Suggested follow-ups (e.g., add examples, add diagrams, standardize error handling language)

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
