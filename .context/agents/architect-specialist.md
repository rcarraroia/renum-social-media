# Architect Specialist Playbook (renum-social-media)

## Mission
Own and evolve the system architecture for **renum-social-media** by:
- Defining and maintaining clean boundaries between UI/components, services, and external integrations.
- Establishing extensible patterns for adding new social-media/third-party capabilities (e.g., OpusClip) without increasing coupling.
- Ensuring cross-cutting concerns (auth, error handling, logging, config, rate limiting) are applied consistently across the codebase.

Engage this agent whenever:
- Adding a new external integration (API provider) or a new domain capability.
- Refactoring service boundaries or moving logic between UI and services.
- Introducing new auth flows, session rules, or user lifecycle behavior.
- Scaling concerns emerge (retries, rate limits, queueing, idempotency, observability).

---

## Responsibilities
1. **Architectural boundaries & layering**
   - Keep orchestration and business logic inside `src/services`.
   - Keep request/UI handlers and components from embedding provider-specific details.

2. **Integration architecture**
   - Define patterns for external APIs (client wrappers, typed DTOs, retries/timeouts, error normalization).
   - Ensure new integrations follow the established service conventions (see `OpusClipService`).

3. **Auth architecture**
   - Define standard ways to authenticate, persist sessions, and update user activity using `src/services/auth.ts`.

4. **Consistency & maintainability**
   - Establish repository-wide conventions for typing, naming, and error handling.
   - Drive incremental refactors that reduce coupling and improve testability.

5. **Documentation and decision records**
   - Create/update short architecture notes and ADR-style decisions when patterns change.

---

## Repository Starting Points (what to focus on)
### Core service layer
- `src/services/`  
  Primary location for domain logic and integrations.
  - `src/services/opusclip.ts` — OpusClip integration and orchestration.
  - `src/services/auth.ts` — authentication and user session lifecycle.

### UI/request handling (entry surfaces)
- `src/components/auth/`  
  UI/request handling for auth-related flows. Ensure it calls `src/services/auth.ts` rather than duplicating logic.

### Public assets / runtime outputs
- `public/`  
  Static resources and/or externally-facing assets. Ensure architecture decisions don’t leak secrets/config into public.

---

## Key Files (and what they’re for)
- `src/services/opusclip.ts`
  - Defines exported types and the `OpusClipService`.
  - Architectural role: **external provider integration + orchestration**. This is the reference pattern for future provider integrations.
  - Key exports:
    - `OpusClipProject`
    - `OpusClipClip`
    - `CreateProjectRequest`
    - `OpusClipService`

- `src/services/auth.ts`
  - Defines the app’s auth primitives and lifecycle behaviors.
  - Architectural role: **single source of truth** for user authentication and “current user” retrieval, plus activity updates.
  - Key exports:
    - `signUp`, `signIn`, `signOut`
    - `getCurrentUser`
    - `updateLastLogin`

- `src/components/auth/`
  - Auth UI/request logic.
  - Architectural role: **thin layer** that delegates to `src/services/auth.ts`.

---

## Architecture Context (current detected design)
### Service Layer (dominant pattern)
- Pattern: encapsulate provider logic and domain workflows inside service modules/classes.
- Confirmed implementation: `OpusClipService` in `src/services/opusclip.ts`.

**Architectural intent to preserve**
- UI/components call services.
- Services own:
  - API clients / provider calls
  - DTO typing and mapping
  - error normalization
  - orchestration steps (create project → poll status → fetch clips, etc., as applicable)

---

## Key Symbols for This Agent (reference points)
- **OpusClip integration**
  - `OpusClipService` — `src/services/opusclip.ts`
  - `OpusClipProject`, `OpusClipClip`, `CreateProjectRequest` — provider/domain DTOs

- **Auth system**
  - `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` — `src/services/auth.ts`

---

## Golden Rules (architectural constraints)
1. **No provider-specific logic in UI/components**
   - `src/components/**` may call `src/services/**`, but should not speak in provider DTOs directly unless intentionally part of UI state.
2. **One integration = one service module (minimum)**
   - Use `src/services/<provider>.ts` with exported DTOs and a main service entry point.
3. **Normalize errors at the service boundary**
   - Components should not need to interpret raw HTTP/client errors.
4. **Auth is centralized**
   - All login/logout/current-user logic must go through `src/services/auth.ts`.
5. **Types are part of the API**
   - Prefer exported request/response types for service methods (see `CreateProjectRequest`).

---

## Standard Workflows (step-by-step)

### 1) Adding a new external integration service (OpusClip-like)
**Goal:** add `src/services/<newProvider>.ts` following the established service-layer pattern.

1. **Define provider DTOs**
   - Create exported types/interfaces at the top of the module:
     - `<Provider>Project`, `<Provider>Asset`, etc.
   - Add request payload types (like `CreateProjectRequest`) for all public service methods.

2. **Create a service entry point**
   - Export a `<Provider>Service` class (or a well-structured set of functions if the repo uses functions elsewhere).
   - Keep its public methods small and composable:
     - `createX(...)`
     - `getXStatus(...)`
     - `listY(...)`
   - Hide low-level HTTP/client details behind private methods or helper functions.

3. **Error normalization**
   - Convert provider-specific failures into app-meaningful errors (consistent shape/message).
   - Ensure the boundary to UI returns actionable messages and stable error types.

4. **Config handling**
   - Ensure secrets/tokens are sourced from environment/server-only config.
   - Never route secrets into `public/`.

5. **Integration documentation**
   - Add a short section to docs (or a README in `src/services/`) describing:
     - required env vars
     - main service capabilities
     - known limits (rate limits, timeouts)

**Definition of Done**
- A single service module encapsulates the integration.
- DTOs are typed and exported.
- Components call the service, not the provider.

---

### 2) Extending `OpusClipService` safely
**Goal:** add capabilities (e.g., new endpoints, new clip metadata) without breaking existing consumers.

1. **Start with types**
   - Update/add types (`OpusClipProject`, `OpusClipClip`, request/response types).
   - Prefer additive changes; avoid breaking property renames unless necessary.

2. **Add methods with clear naming**
   - Match existing naming conventions and keep verbs consistent (`create`, `get`, `list`, `update`).

3. **Preserve backward compatibility**
   - Don’t change existing method signatures unless you also update all callers.
   - If a breaking change is unavoidable, provide a transitional method or overload-like pattern.

4. **Boundary checks**
   - Validate required fields in requests (e.g., `CreateProjectRequest`) at the service boundary.
   - Normalize provider responses into stable app-level types.

---

### 3) Changing authentication flows (sign-up / sign-in / sign-out / current user)
**Goal:** adjust auth behavior without scattering session logic.

1. **Identify the canonical auth surface**
   - Changes must be centralized in `src/services/auth.ts`.

2. **Map the user journey**
   - `signUp` → session creation → `updateLastLogin` (if applicable)
   - `signIn` → session creation → `updateLastLogin`
   - `signOut` → session invalidation
   - `getCurrentUser` → user resolution + session validation

3. **Define a consistent return shape**
   - Ensure consumers can reliably handle success/failure states.
   - If errors are thrown, standardize message and/or error codes.

4. **Update UI layer**
   - `src/components/auth/**` should remain thin: call service functions, display results.

5. **Security checks**
   - Ensure sensitive error details aren’t leaked to UI.
   - Ensure last-login updates don’t create timing side-channels or excessive writes.

---

### 4) Introducing a new architectural pattern (cross-cutting concern)
Examples: retries/backoff, rate limiting, request tracing, caching.

1. **Choose the boundary**
   - Typically implement cross-cutting concerns in the **service layer** so UI remains simple.

2. **Apply consistently**
   - If you add retries to `OpusClipService`, define a helper and apply to other provider calls similarly.

3. **Document the pattern**
   - Add a small “Architecture Notes” doc or ADR stating:
     - why the pattern exists
     - where it must be applied
     - default parameters (timeouts, retry count)

---

## Best Practices (derived from current codebase patterns)
1. **Export typed contracts from services**
   - Follow the existing approach: exported DTOs (e.g., `OpusClipProject`, `OpusClipClip`) and request types (e.g., `CreateProjectRequest`).

2. **Prefer a single “service facade” per integration**
   - `OpusClipService` is the pattern: one exported service that owns provider interaction.

3. **Keep auth APIs as simple functions**
   - The auth layer is function-based (`signUp`, `signIn`, etc.). Maintain that simplicity and avoid duplicating auth logic elsewhere.

4. **Thin components/controllers**
   - `src/components/auth` should orchestrate UI state and delegate business rules to `src/services/auth.ts`.

5. **Minimize leakage of provider concepts**
   - Map provider responses into app-level types before returning from service methods.

---

## Common Architecture Decisions (templates)

### Service method design template
- **Input:** a single typed request object (e.g., `CreateProjectRequest`)
- **Output:** a typed domain object (`OpusClipProject`) or a small result type
- **Errors:** normalized and documented

### Error normalization template
- Convert:
  - network errors
  - provider HTTP errors
  - invalid provider payloads
- Into:
  - stable error type(s) at the service boundary
  - messages safe for UI display (or separate internal vs external messages)

---

## Review Checklist (use for PRs and design reviews)
- [ ] UI/components do not contain provider API calls or provider-specific business rules.
- [ ] New/changed service methods have exported request/response types.
- [ ] Auth changes are centralized in `src/services/auth.ts`.
- [ ] Sensitive configuration is not exposed to `public/` or client bundles.
- [ ] Errors are normalized at service boundaries (no raw provider error objects leaking).
- [ ] Naming conventions align with existing exports (`OpusClipService`, `CreateProjectRequest`, etc.).
- [ ] Documentation updated for any new env vars or integration capabilities.

---

## Documentation Touchpoints
- `src/services/opusclip.ts` — canonical example of provider integration patterns.
- `src/services/auth.ts` — canonical auth API for the app.
- `src/components/auth/` — consumer layer to verify “thin UI” adherence.
- `public/` — validate no secrets/config leakage.

---

## Hand-off Notes (what to leave behind after architecture work)
When the architect-specialist finishes a task, leave:
- A short “what changed and why” note (PR description or ADR-style doc).
- A list of impacted files and boundaries (e.g., “Auth UI calls `signIn` only; no direct session handling in components”).
- Any follow-ups:
  - tech debt created
  - migrations needed
  - hardening opportunities (timeouts/retries/rate limits)
- A quick validation plan (manual steps or key paths to test).

---

## Related Resources
- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
