# Security Auditor Agent Playbook (renum-social-media)

## Mission
Reduce security risk in the app by proactively finding and fixing vulnerabilities across authentication, session handling, data access, secrets management, dependency supply chain, and third‑party API usage. Engage this agent for:
- Any auth/session changes (Supabase, login flows, user state).
- New third‑party integrations (e.g., OpusClip) or changes to API keys.
- Any new storage of user data, uploads, or rendering of untrusted content.
- Pre-release security review and recurring hygiene (dependency updates, secrets checks).

---

## Responsibilities
- **Threat model key flows**: authentication lifecycle, user state persistence, third‑party API calls, and any data storage/handling.
- **Audit auth correctness**: sign up/in/out flows, session refresh, token storage, and last-login tracking.
- **Review client-side security**: XSS vectors, unsafe rendering, localStorage usage, URL parameter handling, and error logging that may leak sensitive data.
- **Validate authorization**: ensure data access is enforced by backend policies (Supabase RLS) and not only in the UI.
- **Secret handling**: confirm no secrets are committed; ensure environment variables are used correctly for public vs private values.
- **Dependency and supply chain**: audit package versions, known CVEs, lockfile integrity, and risky packages.
- **Deliver actionable findings**: severity, impact, reproduction steps, recommended fixes, and verification steps.

---

## Repository Starting Points (Security-Relevant Areas)
### Primary code areas
- `src/services/` — business logic that touches external systems (auth + OpusClip). **Highest priority.**
- `src/hooks/` — client state, auth session synchronization (`useAuth`), side effects.
- `src/main.tsx` — application entry and auth listener wiring (`SupabaseAuthListener`).

### Secondary areas (commonly security-relevant)
- `public/` — static assets; verify no leaked keys/config, and check for unsafe client config patterns.
- Root config files (if present): `package.json`, lockfile, `.env*`, `vite.config.*`, `tsconfig.json`, `eslint*`.

---

## Key Files (What They Do / What to Audit)
- `src/services/auth.ts`
  - Exports: `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`.
  - **Audit focus**: credential handling, error messages, session storage, user enumeration risks, and any writes to user tables (authorization/RLS).
- `src/hooks/useAuth.ts`
  - Exports: `useAuth`.
  - **Audit focus**: whether tokens or user objects are persisted unsafely; race conditions; stale session handling; handling of auth events.
- `src/main.tsx`
  - Defines `SupabaseAuthListener`.
  - **Audit focus**: global auth event subscriptions, session refresh behavior, and whether auth state changes leak data or cause insecure redirects.
- `src/services/opusclip.ts`
  - Exports: `OpusClipService` and request/response types (`OpusClipProject`, `OpusClipClip`, `CreateProjectRequest`).
  - **Audit focus**: API key handling, request signing, input validation, SSRF-like risks (if URLs are accepted), logging of responses, and rate limiting/backoff behavior.

---

## Architecture Context (Security View)
### Services layer (`src/services`, `public`)
- Centralized external calls and orchestration.
- **Security risks**: leaking secrets to the client bundle, improper request construction, logging sensitive info, missing input validation, and trusting client-side checks.

### Controllers/UI entry points (`src/components/auth`, `src/main.tsx`)
- UI flows can accidentally leak sensitive details via errors, query params, or insecure redirects.
- **Security risks**: user enumeration, unsafe rendering of user-provided strings, open redirects, weak session assumptions.

### Hooks/state (`src/hooks`)
- Auth session and user state management.
- **Security risks**: storing tokens in `localStorage`, failing to clear state on sign-out, or retaining user data across sessions.

---

## Key Symbols for This Agent
- Auth:
  - `signUp` — `src/services/auth.ts`
  - `signIn` — `src/services/auth.ts`
  - `signOut` — `src/services/auth.ts`
  - `getCurrentUser` — `src/services/auth.ts`
  - `updateLastLogin` — `src/services/auth.ts`
  - `useAuth` — `src/hooks/useAuth.ts`
  - `SupabaseAuthListener` — `src/main.tsx`
- Third-party integration:
  - `OpusClipService` — `src/services/opusclip.ts`
  - `CreateProjectRequest` — `src/services/opusclip.ts`

---

## Security Review Workflows (Step-by-Step)

### 1) Auth & Session Security Review (Supabase)
**Goal:** Ensure authentication is robust, errors don’t leak info, and sessions are handled safely.

1. **Map the auth lifecycle**
   - Trace: UI action → `src/services/auth.ts` → session update in `useAuth` → listener in `main.tsx`.
   - Confirm what is stored in memory vs browser storage.

2. **Check user enumeration & error leakage**
   - Review `signIn`/`signUp` error handling:
     - Avoid differentiating “email not found” vs “wrong password” in UI.
     - Ensure logs do not contain tokens, password hints, magic links, or full user objects.

3. **Verify session storage strategy**
   - Confirm whether Supabase is configured to use `localStorage` or cookies.
   - If using `localStorage`, document the XSS risk and propose mitigations (strict CSP, sanitization, reduce untrusted HTML, consider cookie-based auth if applicable).

4. **Confirm sign-out clears sensitive state**
   - Ensure `signOut` invalidates session and clears any cached user-specific data in hooks/stores.

5. **Validate `updateLastLogin` authorization**
   - If it updates a user profile table:
     - Ensure it only updates the current user (server-side enforced with RLS).
     - Ensure the client cannot update arbitrary user IDs.

6. **Check auth event listener correctness**
   - In `SupabaseAuthListener`:
     - Confirm unsubscribe on unmount.
     - Ensure auth change triggers do not cause data leakage (e.g., fetching private data before session is ready).

**Deliverable:** A short report section: findings + exact code locations + recommended remediations + how to verify.

---

### 2) Authorization & Data Access Review (Supabase RLS assumptions)
**Goal:** Ensure access control is enforced beyond the UI.

1. Identify all operations that read/write user data (start with `auth.ts` and any services).
2. For each operation, answer:
   - What table/resource is affected?
   - Is access restricted by server-side policy (RLS) or only client logic?
3. If policies are not visible in this repo:
   - Add a checklist item to confirm Supabase RLS policies in the Supabase dashboard/migrations.
   - Request a policy export or migration scripts for auditability.

**Red flags to file immediately**
- Any client-provided `userId` used for updates without server-side checks.
- Any “admin” capability implied in client code.
- Broad selects (`select *`) on user tables without server-enforced filters.

---

### 3) Third-Party API Integration Review (OpusClip)
**Goal:** Prevent secret leakage, request tampering, and unvalidated inputs.

1. **Locate how the OpusClip API key is sourced**
   - Ensure it is not embedded in client code unless explicitly safe/public.
   - If it must be secret, it should be handled via a server-side proxy (not a frontend service).

2. **Validate request payloads**
   - For `CreateProjectRequest`:
     - Validate any URL fields (avoid allowing internal network URLs if requests are server-side).
     - Enforce size/type constraints for media references.
   - Ensure inputs are normalized and validated before sending.

3. **Check logging & error handling**
   - Do not log full responses if they contain user media URLs, IDs, or tokens.
   - Ensure errors returned to UI are sanitized.

4. **Rate limiting/backoff**
   - Ensure the client doesn’t inadvertently DDoS the API (retry loops).
   - If jobs/polling exists, ensure polling intervals are bounded.

---

### 4) Frontend XSS / Injection Review
**Goal:** Prevent token theft and account compromise via XSS.

1. Search for unsafe rendering patterns:
   - `dangerouslySetInnerHTML`
   - Rendering raw HTML/markdown without sanitization
2. Review user-provided content flows:
   - Anything derived from profile fields, captions, project titles, query params.
3. Confirm escaping/sanitization strategy:
   - Prefer React’s default escaping; sanitize when HTML is necessary.
4. Add CSP recommendations (even for SPA) if feasible via hosting config:
   - Block inline scripts, restrict `connect-src`, and avoid permissive `*`.

---

### 5) Secrets & Config Hygiene
**Goal:** Prevent credential leakage and environment misconfiguration.

1. Check repository for committed secrets:
   - `.env`, `.env.local`, service keys, tokens, webhook secrets.
2. Ensure correct env var exposure (Vite convention):
   - Only `VITE_*` variables are exposed to the client bundle.
   - Never place private API keys in `VITE_*`.
3. Confirm `public/` contains no config dumps, keys, or debug artifacts.

---

### 6) Dependency & Supply Chain Audit
**Goal:** Reduce risk from vulnerable packages.

1. Review `package.json` and lockfile:
   - Identify auth/crypto/http libs and their versions.
2. Run/require CI checks (recommendation):
   - `npm audit` (or `pnpm audit`/`yarn audit`)
   - Dependabot or Renovate policy
3. Flag high-risk packages:
   - Deprecated packages, unmaintained HTTP clients, or packages with install scripts.

---

## Best Practices (Tailored to This Codebase)
- **Keep secrets out of `src/services/*`** if that code runs in the browser. If `OpusClipService` needs a private key, move calls behind a server function/proxy.
- **Treat `updateLastLogin` as a privileged write**: require RLS policies restricting updates to `auth.uid()` only.
- **Avoid logging auth/session objects** in `auth.ts`, `useAuth`, and `main.tsx`.
- **Standardize error messages** for sign-in/up to reduce user enumeration.
- **Prefer server-side enforcement** (Supabase RLS) over client-side checks for all reads/writes.
- **Assume XSS = token compromise** if session uses browser storage; prioritize XSS prevention and CSP hardening.
- **Document auth event flow** (listener + hook) to avoid regressions that reintroduce stale sessions or leak data.

---

## Common Findings Checklist (Use During PR Review)
### Auth/session
- [ ] No tokens/refresh tokens logged or stored manually.
- [ ] Sign-out clears app state and unsubscribes listeners.
- [ ] Errors shown to users do not reveal account existence.
- [ ] `updateLastLogin` cannot be used to update other users.

### Authorization (Supabase)
- [ ] All sensitive reads/writes rely on RLS, not UI conditions.
- [ ] No client-provided identifiers are trusted without server-side checks.

### Third-party integrations
- [ ] No private API keys in frontend-exposed env vars.
- [ ] Input validation exists for URLs, IDs, titles, and file metadata.
- [ ] Safe retry/polling strategy with upper bounds.

### Frontend injection
- [ ] No unsafe HTML injection without sanitization.
- [ ] Query params and external data are validated/escaped.
- [ ] CSP considered/implemented where hosting allows.

### Secrets & dependencies
- [ ] No `.env*` committed; secrets scanning in CI recommended.
- [ ] Dependencies audited; critical/high CVEs addressed.

---

## Documentation Touchpoints
- `README.md` — project overview and setup (verify environment variable guidance doesn’t encourage leaking secrets).
- `../../AGENTS.md` — agent system conventions.
- `../docs/README.md` — documentation index (add security notes and threat model links if missing).

---

## Collaboration Checklist (Engagement Workflow)
- [ ] Confirm runtime context: is this purely a frontend SPA, or is there any server/runtime (functions, edge, SSR)?
- [ ] Identify which services run in the browser (likely all `src/services/*`) and classify secrets accordingly.
- [ ] Review `src/services/auth.ts` and `src/hooks/useAuth.ts` end-to-end for session flow and storage.
- [ ] Review `src/services/opusclip.ts` for secret usage and input validation.
- [ ] Perform repository-wide scan for: `dangerouslySetInnerHTML`, `localStorage`, `sessionStorage`, `.env`, `VITE_`, and hard-coded URLs/keys.
- [ ] Produce findings with severity (Critical/High/Medium/Low), affected files/symbols, and a concrete fix plan.
- [ ] Add/adjust security notes in docs (setup, env vars, RLS requirements, CSP recommendation).
- [ ] Re-verify after fixes (targeted regression review around auth listener + hook behavior).

---

## Hand-off Notes (What to Provide After an Audit)
Include:
- **Summary:** what was reviewed (files/symbols) and overall risk posture.
- **Findings table:** severity, title, affected area, exploit scenario, remediation.
- **Verification steps:** how to test the fix (manual steps + any automated checks).
- **Follow-ups:** recommended backlog items (e.g., add CI secret scanning, dependency bot, document RLS policies, add CSP headers).

---

## Related Resources
- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
