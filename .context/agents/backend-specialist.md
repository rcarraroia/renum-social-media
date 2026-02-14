# Backend Specialist Agent Playbook (renum-social-media)

## Mission

Own and evolve the backend-facing parts of the app: service-layer business logic, integrations (notably OpusClip), authentication flows, and data model correctness. Engage this agent when implementing new backend capabilities, hardening auth and logging, adding/adjusting database types, or integrating external APIs.

This repository appears to be a TypeScript app where “backend” concerns are implemented primarily as **service modules** (rather than a traditional controller/router server). The agent’s job is to keep these services reliable, typed, testable, and consistent.

---

## Responsibilities

- **Service-layer implementation**
  - Add/modify business logic in `src/services/*`
  - Enforce consistent request/response shapes and error handling conventions
- **Authentication orchestration**
  - Maintain auth flows in `src/services/auth.ts` (sign up/in/out, current user retrieval, last login updates)
- **External API integration**
  - Maintain and extend the OpusClip integration in `src/services/opusclip.ts`
  - Ensure secure handling of API keys/tokens and robust failure modes (timeouts, retries where appropriate)
- **Data model and type safety**
  - Keep database types accurate and consumable via `src/types/database.types.ts`
  - Add missing row types / joins as needed (e.g., `UserWithOrganization`)
- **Logging and auditability**
  - Ensure backend-relevant operations can be traced (see `ApiLogsRow` in database types)
- **Quality & maintainability**
  - Add tests where the repo supports them; otherwise provide deterministic, isolated functions and clear seams for mocking
  - Keep documentation touchpoints updated when behavior changes

---

## Repository Starting Points (Backend-Relevant)

- `src/services/`
  - Backend “service layer”: business logic and external integrations.
- `src/types/`
  - Shared backend data types, especially database row and schema types.
- `src/components/auth/`
  - Auth-related UI/controller-adjacent code; relevant when wiring service calls into flows.
- `public/`
  - Not backend per se, but listed as service-related context—check for static integration artifacts, webhook verification files, etc.

---

## Key Files (What they are for)

- `src/services/auth.ts`
  - Primary auth API for the app:
    - `signUp`, `signIn`, `signOut`
    - `getCurrentUser`
    - `updateLastLogin`
- `src/services/opusclip.ts`
  - OpusClip integration service:
    - Types: `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`
    - Class: `OpusClipService` (encapsulates API calls and orchestration)
- `src/types/database.types.ts`
  - Database schema typing and canonical row types:
    - `OrganizationsRow`, `UsersRow`, `VideosRow`, `PostsRow`, `ApiLogsRow`
    - `UserWithOrganization` join type
    - `Database` schema type and `Json`

---

## Architecture Context (As Implemented Here)

### Services (Business logic + orchestration)
- **Directory**: `src/services`
- **Primary pattern**: service modules and service classes
  - `OpusClipService` is a class-based integration boundary (good for dependency injection/mocking).
  - Auth service is function-based exports (good for simple orchestration; keep functions small and pure where possible).
- **Agent focus**:
  - Keep service boundaries clean: services should not leak UI concerns.
  - Prefer typed input/output, and consistent error shapes.

### “Repositories” / Data access (Typed schema orientation)
- **Directory**: `src/types`
- **Reality in this repo**: the “repository” layer is represented as *types* rather than a separate persistence module.
- **Agent focus**:
  - Ensure any database interaction elsewhere uses these canonical row types.
  - When schema changes, update types first and propagate.

### Controllers / Request handling
- **Directory**: `src/components/auth`
- **Reality in this repo**: request handling may be implicit (framework-driven) rather than explicit server controllers.
- **Agent focus**:
  - When adding endpoints/actions (if applicable), route through services and keep controller code thin.

---

## Key Symbols for This Agent (Entry Points)

- **Auth**
  - `signUp` — `src/services/auth.ts`
  - `signIn` — `src/services/auth.ts`
  - `signOut` — `src/services/auth.ts`
  - `getCurrentUser` — `src/services/auth.ts`
  - `updateLastLogin` — `src/services/auth.ts`
- **OpusClip**
  - `OpusClipService` — `src/services/opusclip.ts`
  - `CreateProjectRequest` — `src/services/opusclip.ts`
  - `OpusClipProject`, `OpusClipClip` — `src/services/opusclip.ts`
- **Database types**
  - `Database`, `Json` — `src/types/database.types.ts`
  - `UsersRow`, `OrganizationsRow`, `PostsRow`, `VideosRow`, `ApiLogsRow` — `src/types/database.types.ts`
  - `UserWithOrganization` — `src/types/database.types.ts`

---

## Best Practices (Derived from Existing Patterns)

### Service design (match existing conventions)
- **Prefer a single “service boundary” per integration**
  - Follow the `OpusClipService` pattern for new external integrations (e.g., `SomeApiService`).
- **Export typed DTOs next to the service**
  - As seen with `CreateProjectRequest`, keep request/response types in the same module as the integration.
- **Keep auth operations cohesive**
  - Auth exports in `auth.ts` should remain the single source of truth for authentication orchestration.

### Type safety & schema alignment
- **Use row types from `src/types/database.types.ts`**
  - Don’t re-declare “User”, “Post”, etc. in services; import and compose from canonical row types.
- **Prefer explicit join types**
  - If a service returns combined entities (like user + organization), model it explicitly (as with `UserWithOrganization`).

### Error handling & observability
- **Normalize service errors**
  - Services should either:
    1) throw typed/domain errors, or
    2) return a consistent `Result` shape (pick one style per repo/module).
- **Log meaningful events**
  - Use the existence of `ApiLogsRow` as a cue to maintain audit logs for critical actions (auth events, external API calls, failures/retries).

### Security
- Never hardcode secrets in service modules.
- Ensure tokens/session data are handled only in the auth service boundary.
- Sanitize any user-provided content before sending to external services.

---

## Standard Workflows (Step-by-Step)

### 1) Add or extend an OpusClip capability
**Goal**: Add a new OpusClip API method while keeping types + errors consistent.

1. **Locate integration boundary**
   - Edit `src/services/opusclip.ts` and implement in `OpusClipService`.
2. **Define/extend DTO types**
   - Add request/response interfaces near `CreateProjectRequest`, `OpusClipProject`, `OpusClipClip`.
3. **Implement the method**
   - Keep method inputs typed, validate required fields early.
   - Convert raw API response into typed return objects (don’t leak untyped JSON).
4. **Handle failure modes**
   - Provide deterministic error mapping (e.g., unauthorized vs. validation vs. upstream failure).
   - Consider rate limits and retries only if the product needs it; prefer idempotency.
5. **Add logging hooks (if the app logs API calls)**
   - Where the app persists API logs, record request id/correlation id, operation name, status, and error summary.
6. **Update consuming code**
   - If other modules call this method, update signatures and ensure no `any` escapes.
7. **Document**
   - Add a short usage snippet in the relevant docs touchpoint (or inline JSDoc) describing method behavior.

### 2) Implement a new auth-related feature (e.g., password reset, MFA hook)
**Goal**: Keep `auth.ts` the “auth brain” and maintain consistent flows.

1. **Start in `src/services/auth.ts`**
   - Add a new exported function to match existing style (`signIn`, etc.).
2. **Keep side effects explicit**
   - If you update last login / audit logs, reuse or extend `updateLastLogin`.
3. **Expose a minimal API**
   - Avoid passing UI-specific objects. Prefer primitives and typed DTOs.
4. **Update any auth UI/controller wiring**
   - If `src/components/auth/*` needs changes, keep them thin—call the service and handle UX there.
5. **Ensure consistent session/user shape**
   - If user objects include organization context, prefer a typed composite (like `UserWithOrganization`).

### 3) Update database types after a schema change
**Goal**: Maintain a single canonical schema typing source.

1. **Edit `src/types/database.types.ts`**
   - Update/add row types: `UsersRow`, `PostsRow`, etc.
   - Ensure `Database` schema type remains correct.
2. **Propagate changes**
   - Search for impacted fields and adjust service logic accordingly.
3. **Prefer additive, backward-compatible changes**
   - If removing fields, coordinate refactors so builds remain green.

### 4) Add a new “backend service” module
**Goal**: Mirror established patterns to keep the repo consistent.

1. **Create `src/services/<service>.ts`**
2. **Export types + service API**
   - If integration-heavy, prefer a class `XService`.
   - If straightforward orchestration, exported functions are fine (match `auth.ts`).
3. **Keep configuration external**
   - Read secrets/config from environment or a centralized config module (if present), not hardcoded.
4. **Design for testability**
   - Accept dependencies (fetch/client) via constructor parameters if using classes.
   - Keep pure helper functions exported or internal and separately testable.

---

## Code Conventions & Patterns to Follow

- **TypeScript-first**
  - Avoid `any`; prefer `unknown` + narrowing when dealing with external payloads.
- **Named exports**
  - Repo exports key functions/types directly (e.g., `signIn`, `OpusClipService`).
- **Service modules are the integration boundaries**
  - Controllers/components should call services; services should not import UI.

---

## Testing & Validation Checklist (Pragmatic)

If a dedicated test setup exists, add/extend tests following that pattern. If not, use this lightweight validation approach:

- For service methods:
  - Validate inputs (required properties present, correct types).
  - Ensure errors are predictable (consistent thrown error type/message or result shape).
  - Ensure outputs are typed and stable (no raw upstream payload leakage).
- For auth:
  - Confirm `getCurrentUser` behavior across logged-in/logged-out states.
  - Confirm `updateLastLogin` is called at the right times (e.g., after successful sign-in).

---

## Documentation Touchpoints

- `src/services/auth.ts` (inline JSDoc for exported functions)
- `src/services/opusclip.ts` (inline JSDoc and typed examples for each public method)
- `src/types/database.types.ts` (keep as canonical reference; add comments for tricky fields/JSON columns)
- Repo-level docs (if present):
  - `README.md`
  - `AGENTS.md`
  - `docs/*` (if exists)

---

## Collaboration Checklist (Operational)

- [ ] Confirm the change category: auth, integration, schema types, or new service.
- [ ] Identify the service boundary file(s) to edit (`src/services/*` first).
- [ ] Update/introduce types alongside the service (DTOs and DB row types).
- [ ] Ensure consistent error handling (no silent failures; no untyped throws).
- [ ] Add/adjust logging/audit points for critical actions (auth + upstream API calls).
- [ ] Update any consuming modules (components/controllers) minimally.
- [ ] Run typecheck/build and any existing tests.
- [ ] Update docs/JSDoc to reflect new behavior and parameters.

---

## Hand-off Notes (What to leave behind after changes)

- A short summary of:
  - What service methods were added/changed
  - Any schema/type changes in `database.types.ts`
  - Any new required environment variables or upstream API behavior assumptions
- Known risks:
  - Upstream API rate limits / timeouts
  - Auth edge cases (session invalidation, stale user state)
- Suggested follow-ups:
  - Add tests around newly introduced logic seams
  - Add/extend API logging coverage if failures are hard to debug

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
