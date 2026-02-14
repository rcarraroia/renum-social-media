# Performance Optimizer Agent Playbook (renum-social-media)

## Mission

Improve runtime performance and perceived responsiveness across the app by:

- Finding measurable bottlenecks (server, client, network, database, third-party APIs).
- Implementing targeted optimizations with clear before/after evidence.
- Preventing regressions by adding lightweight performance guardrails (instrumentation, budgets, tests, and docs).

Engage this agent when:
- Pages feel slow (TTFB, hydration, interaction delay), API routes time out, or background jobs lag.
- Traffic increases or a new integration is introduced (e.g., OpusClip).
- Error logs show rate limiting, retries, or large payloads.
- You’re preparing for launch and need performance baselines and budgets.

---

## Responsibilities

- **Profile and measure**: establish baselines (latency, payload size, render time) and identify the hot path.
- **Optimize service calls**: reduce redundant requests, improve concurrency, add caching, batch operations, and rate-limit safely.
- **Optimize data flow**: minimize payloads, avoid over-fetching, reduce JSON serialization costs, and ensure efficient types.
- **Client performance**: reduce bundle size, avoid unnecessary re-renders, optimize images/assets, and improve loading UX.
- **Instrumentation**: add structured timing/logging around critical operations (auth flows, OpusClip API calls).
- **Regression prevention**: introduce budgets (e.g., max payload size), add performance notes to PRs, and document learnings.

---

## Repository Starting Points (where to focus)

### Services (highest leverage)
- `src/services/opusclip.ts` — Third-party integration; likely network-bound and rate-limited.
- `src/services/auth.ts` — Auth flows; can affect every request/session and perceived app latency.

### Shared utilities
- `src/utils/formatters.ts` — formatting utilities; minor CPU cost but can contribute to render hot paths if used heavily.
- `src/lib/utils.ts` — shared helpers (e.g., `cn`); can affect render paths if used widely.

### Types / Data shapes
- `src/types/database.types.ts` — database row types and composite types; helps detect over-fetching and payload bloat.

---

## Key Files (purpose + typical performance opportunities)

- **`src/services/opusclip.ts`**
  - Purpose: defines `OpusClipService` and request/response types (`OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`).
  - Perf opportunities:
    - Reduce sequential API calls; use safe concurrency (`Promise.all`) when independent.
    - Add request timeouts, retries with backoff, and circuit-breaking behavior.
    - Cache stable responses (project metadata) when appropriate.
    - Log durations per endpoint and payload sizes.

- **`src/services/auth.ts`**
  - Purpose: auth functions `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`.
  - Perf opportunities:
    - Avoid redundant `getCurrentUser` calls per page/request.
    - Defer `updateLastLogin` (e.g., background/edge-friendly) if it blocks user navigation.
    - Ensure minimal data returned to client; avoid shipping unnecessary user/org fields.

- **`src/types/database.types.ts`**
  - Purpose: type definitions (`OrganizationsRow`, `UsersRow`, `VideosRow`, `PostsRow`, `ApiLogsRow`, `UserWithOrganization`, `Database`).
  - Perf opportunities:
    - Validate query selection matches actual needs (select only required columns).
    - Identify large JSON fields (`Json`) that may be overused or shipped to clients.

- **`src/utils/formatters.ts`** (`formatDateShort`)
  - Purpose: consistent formatting.
  - Perf opportunities:
    - Avoid repeated formatting in tight render loops; memoize where applicable.

- **`src/lib/utils.ts`** (`cn`)
  - Purpose: className composition.
  - Perf opportunities:
    - Ensure it’s not called excessively inside large lists without memoization (usually minor, but can matter in big lists).

---

## Key Symbols for This Agent

### Services
- `OpusClipService` (`src/services/opusclip.ts`)
- `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` (`src/services/auth.ts`)

### Data types
- `UserWithOrganization`, `PostsRow`, `VideosRow`, `ApiLogsRow` (`src/types/database.types.ts`)

### Utilities
- `formatDateShort` (`src/utils/formatters.ts`)
- `cn` (`src/lib/utils.ts`)

---

## Performance Workflows (step-by-step)

### 1) Triage: reproduce + define success metrics (required)
1. **Write the problem statement**:
   - “X action is slow” + environment (local/prod) + frequency.
2. **Pick 1–3 primary metrics** (must be measurable):
   - API latency (p50/p95), TTFB, total page load time, payload size, number of requests, error rate/timeouts.
3. **Reproduce consistently**:
   - Identify exact endpoints/actions causing it (auth? OpusClip? feed rendering?).
4. **Decide the optimization boundary**:
   - Client rendering vs server response vs third-party API vs DB.

**Deliverable**: a short “Baseline” note in the PR/issue: metric values + how measured.

---

### 2) Instrumentation-first for service bottlenecks (OpusClip/Auth)
Use a consistent timing approach in service functions:

1. Wrap the call path with timing markers:
   - start time, end time, duration
   - endpoint/action name
   - response status / error type
   - payload size (request + response, if available)
2. Log once per request at INFO; errors at ERROR with correlation fields.

**Where**:
- Add timing around **every outbound OpusClip request** in `OpusClipService`.
- Add timing around **`getCurrentUser`** and **`updateLastLogin`** in `auth.ts`.

**Deliverable**: “Before/after durations” captured in logs (or a simple measurement script).

---

### 3) Optimize network-bound flows (most common win)

#### A. Reduce sequential waits
- Convert independent calls from sequential `await` to `Promise.all`.
- Ensure ordering requirements are explicit (only keep sequential when necessary).

#### B. Add timeouts + retries (with backoff) for third-party APIs
- Add a request timeout (avoid hanging requests).
- Use limited retries for transient failures (429/5xx) with exponential backoff.
- Respect rate limit headers if available.

#### C. Cache stable results
- Cache read-only data (e.g., project details) with:
  - TTL
  - cache key = projectId/userId/orgId as appropriate
- Avoid caching user-specific secrets/tokens.

**Deliverable**: fewer requests and lower p95 latency, documented with measurements.

---

### 4) Optimize auth latency (high impact across app)

1. **Minimize calls to `getCurrentUser`**
   - Prefer a single call per request lifecycle; pass the user down.
   - If used on multiple components/routes, introduce a shared loader or memoization boundary.

2. **Make `updateLastLogin` non-blocking**
   - If it runs during sign-in or page load, ensure it doesn’t block the primary response.
   - Consider “fire-and-forget” patterns only where safe (and ensure errors are logged).

3. **Trim returned user data**
   - Return only what the client needs (avoid sending whole `UsersRow` when only id/email is needed).

**Deliverable**: reduced auth round-trips and improved TTFB for authenticated pages.

---

### 5) Reduce payload sizes and over-fetching (types-guided)
Use `src/types/database.types.ts` as a guide:

1. Identify endpoints returning:
   - large `Json` blobs
   - wide row objects with many unused columns
2. Narrow selection:
   - select only needed columns
   - avoid embedding `UserWithOrganization` if only IDs needed
3. Consider pagination/limits for lists (`PostsRow`, `VideosRow`).

**Deliverable**: smaller responses (bytes) and faster serialization.

---

### 6) Client-side rendering and perceived performance
1. Identify slow views (lists, dashboards):
   - heavy repeated formatting (`formatDateShort`) or class composition in large lists (`cn`)
2. Apply:
   - memoization for computed values in large renders
   - windowing/virtualization for large lists (if applicable)
   - avoid re-render cascades (stable props, keys, and memo boundaries)

**Deliverable**: improved interaction responsiveness; fewer renders.

---

## Best Practices (tailored to this codebase)

### Service layer (OpusClip/Auth)
- **Prefer explicit orchestration in services** (`src/services/*`) rather than spreading performance hacks across UI.
- **Log durations per method** (e.g., `OpusClipService.createProject`) and include identifiers (projectId, orgId).
- **Treat third-party APIs as unreliable**: timeout + retry + rate-limit awareness.
- **Avoid blocking on non-critical side effects** (e.g., `updateLastLogin` should not delay a sign-in redirect if possible).

### Data and types
- Use `database.types.ts` to **spot wide types** and enforce “select what you use”.
- Beware of `Json` fields: they can balloon payloads and serialization time.

### Utilities in render paths
- `formatDateShort` and `cn` are fine generally, but in large lists:
  - precompute formatted strings
  - memoize row components
  - avoid creating new objects/arrays per render

---

## Common Optimization Recipes

### Recipe: Speed up OpusClip multi-step flows
- Measure each step duration.
- Parallelize independent steps.
- Cache intermediate results (project metadata).
- Add backoff on 429 and log rate-limit events.
- Add a single “overall flow” timer plus per-call timers.

### Recipe: Reduce “auth chatter”
- Ensure `getCurrentUser` is called once per request/page.
- Make `updateLastLogin` asynchronous and resilient.
- Return minimal session/user shapes.

### Recipe: Shrink list endpoints (posts/videos)
- Add pagination defaults.
- Select minimal columns.
- Avoid including large JSON by default.

---

## Review Checklist (for PRs touching performance)

- [ ] Baseline metrics captured (what was slow, how measured).
- [ ] Added/updated timings in `src/services/auth.ts` and/or `src/services/opusclip.ts` when changing those flows.
- [ ] No new redundant calls (especially `getCurrentUser`) introduced.
- [ ] Payload sizes considered (avoid returning full row objects by default).
- [ ] Concurrency safe (no accidental stampedes; limit parallelism if needed).
- [ ] Third-party calls have timeouts and sensible retry behavior (if relevant).
- [ ] Post-change metrics captured (before/after).
- [ ] Notes added to docs or agent handoff (what changed, risks, follow-ups).

---

## Architecture Context (performance lens)

### Utils
- Directories: `src/utils`, `src/lib`
- Hot-path risk: medium (often used in UI loops)
- Key exports: `formatDateShort`, `cn`

### Services
- Directories: `src/services`, `public`
- Hot-path risk: high (network, orchestration)
- Key exports: `OpusClipService` and auth functions

### “Repositories” / Types
- Directory: `src/types`
- Hot-path risk: medium (drives data shape decisions)
- Key exports: `Database` and row types

---

## Documentation Touchpoints

- `src/services/opusclip.ts` (inline docs and method comments should include latency/rate-limit notes)
- `src/services/auth.ts` (document when `updateLastLogin` runs and whether it blocks)
- `src/types/database.types.ts` (use as reference for payload/column trimming)

---

## Hand-off Notes (what to leave behind after an optimization)

Include in the PR description (or a short doc note):

- **Problem**: what was slow + where.
- **Root cause**: network latency, sequential calls, over-fetching, large payload, render loop, etc.
- **Change summary**: what you did (parallelized, cached, trimmed, deferred).
- **Evidence**: before/after metrics (p50/p95, payload size, request count).
- **Risks**: caching staleness, retry amplification, rate-limit behavior.
- **Follow-ups**: any remaining hotspots or future improvements.

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
