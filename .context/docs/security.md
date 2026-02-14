## Security & Compliance Notes

This document defines the security and compliance guardrails for the Renum Social Media project. It is intended for developers and reviewers who need to understand how the application protects identities, data, and infrastructure.

### Security objectives

- **Protect user identity and sessions**: prevent unauthorized access, session hijacking, and privilege escalation.
- **Protect customer/organization data**: enforce tenant boundaries (organization isolation) and least-privilege access to data.
- **Protect secrets and third-party credentials**: avoid leakage in source control, logs, and client bundles.
- **Maintain auditability**: produce sufficient logs and evidence for troubleshooting and compliance attestations.

### High-level trust boundaries

- **Client application (browser)**: Contains UI, calls external services (e.g., Supabase Auth, API endpoints). Treat all browser state as untrusted.
- **Authentication provider**: Supabase Auth is used by the application code (`src/services/auth.ts`, `src/main.tsx`).
- **Data store**: Supabase/Postgres (types defined in `src/types/database.types.ts`). Security must rely on server-side controls (Row Level Security policies), not client filtering.
- **Third-party APIs**: OpusClip integration (`src/services/opusclip.ts`) uses API keys and must be treated as sensitive.

### Core guardrails (must-follow)

1. **Do not trust client input**
   - Validate and authorize on the server or via Supabase RLS.
   - Never rely on UI logic to enforce permissions.

2. **Enforce tenant isolation**
   - All data access must be scoped to the current organization.
   - Prefer server-enforced constraints and RLS rather than client-side filtering.

3. **Least privilege**
   - Use the minimal set of permissions required for each role and each integration key.
   - Separate read/write capabilities where possible (e.g., different API keys or policies).

4. **Secure logging**
   - Do not log secrets, access tokens, refresh tokens, passwords, or full third-party request payloads if they may contain credentials.
   - If application logs include user-identifiers, treat logs as sensitive.

5. **Secure dependencies**
   - Keep dependencies patched and monitor for vulnerabilities.
   - Avoid introducing authentication/crypto utilities without review.

6. **Transport security**
   - Use HTTPS for all requests. Do not allow mixed-content assets.

For system overview and component boundaries, see **[architecture.md](./architecture.md)**.

---

## Authentication & Authorization

### Identity provider

The project uses **Supabase Authentication** as the identity provider. The primary auth entry points are:

- `signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin` in `src/services/auth.ts`
- `useAuth` hook in `src/hooks/useAuth.ts`
- `SupabaseAuthListener` in `src/main.tsx` (observes auth state changes)

Developers should treat Supabase as the source of truth for session state and user identity.

### Token formats and session strategy

- Supabase issues **JWT-based access tokens** (short-lived) and **refresh tokens** (longer-lived) via its client SDK.
- Sessions are managed by the Supabase client library; tokens may be persisted by the SDK in browser storage depending on configuration.
- **Rules**:
  - Never persist tokens manually in application code.
  - Never send tokens to third-party services except where required for first-party API calls.
  - Avoid exposing tokens through query strings, URL fragments, or logs.

### Session lifecycle

- **Sign-in**: `signIn` initiates Supabase auth; on success the SDK maintains session state.
- **Auth state changes**: `SupabaseAuthListener` should respond to events (e.g., sign-in/sign-out/token refresh) and synchronize UI state.
- **Sign-out**: `signOut` must clear Supabase session and reset any app-level state derived from the user.
- **Last-login tracking**: `updateLastLogin` indicates the project stores/updates last login timestamps; ensure this write is authorized and does not leak PII in logs.

### Authorization model (roles & permissions)

The codebase indicates an organization-centric data model:

- `OrganizationsRow`, `UsersRow`, `UserWithOrganization` in `src/types/database.types.ts`
- `useOrganization` hook in `src/hooks/useOrganization.ts`

**Recommended authorization approach (expected for this architecture):**

1. **Authentication** confirms *who* the user is (Supabase user id).
2. **Authorization** confirms *what* the user can do:
   - Determine the active **organization** context (e.g., from user profile / membership).
   - Enforce access control at the database layer using **Row Level Security (RLS)** and/or server-side checks.

**Minimum permissions to define**
- **Organization member**: read/write resources belonging to their organization.
- **Organization admin**: manage organization settings, invite/remove users, elevated write permissions.
- **System admin (if applicable)**: operational access (should be extremely limited; ideally separate environment).

**Implementation guardrails**
- Any queries against `videos`, `posts`, `api_logs`, etc. must include organization scoping **and** be protected by RLS so that scoping cannot be bypassed from the client.
- Components like `src/components/auth/ProtectedRoute.tsx` can improve UX, but must not be the only authorization layer.

### Multi-tenancy and data access

Because this is a browser-based app, assume users can manipulate requests. Therefore:

- **All organization/user scoping must be enforced server-side** (Supabase RLS policies).
- Use stable identifiers (Supabase `auth.uid()`), not user-provided ids, when binding data to a user.

### Example usage patterns (client-side)

**Sign in and load current user**
```ts
import { signIn, getCurrentUser } from "@/services/auth";

await signIn(email, password);
const user = await getCurrentUser();
// Use user to load organization context via useOrganization or profile lookup
```

**Route protection (UX only)**
```tsx
// ProtectedRoute should redirect if no authenticated user,
// but do not rely on it for authorization checks.
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

---

## Secrets & Sensitive Data

### Data classification

Use the following classifications when handling data:

- **Public**: marketing content, non-sensitive UI assets.
- **Internal**: operational metadata, non-user-specific analytics.
- **Confidential**: user profile data, organization data, posts/videos metadata, audit logs.
- **Restricted**: credentials and secrets (API keys), access/refresh tokens, password equivalents, any regulated identifiers.

Treat anything in `UsersRow`, `UserWithOrganization`, and organization-scoped content (`PostsRow`, `VideosRow`) as **Confidential** by default.

### Where secrets must live

Because this is a front-end-heavy project, be explicit about what can and cannot be shipped to the browser:

- **Allowed in client bundle**:
  - Public Supabase project configuration (e.g., Supabase URL and *anon/public* key), if the security model relies on RLS.
  - Non-sensitive feature flags.

- **Must NOT be shipped to the client**:
  - Service role keys (Supabase service role).
  - Any privileged database credentials.
  - Third-party API secrets that grant write/admin access (e.g., OpusClip API keys) unless they are explicitly designed to be public and heavily constrained (rare).

**Integration-specific note (OpusClip)**
- `src/services/opusclip.ts` implies usage of an OpusClip API key/token.
- This credential must be stored in an environment secret store and used only in a trusted environment (server, edge function, or backend proxy). If the current implementation calls OpusClip directly from the browser, review immediately and migrate to a server-side proxy.

### Storage locations (recommended)

Use one of the following for secret storage (depending on hosting platform):

- **CI/CD secret store** (GitHub Actions Secrets, GitLab CI Variables, etc.)
- **Cloud secret manager** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
- **Managed platform environment variables** (Vercel/Netlify/Render/Fly.io) with restricted access

**Rules**
- Never commit secrets to git.
- Never place secrets in `.env` files that are committed.
- Use `.env.example` for documenting required variables, without real values.

### Rotation cadence

Recommended minimum rotation cadence:

- **Third-party API keys** (e.g., OpusClip): rotate every **90 days** or immediately upon suspected exposure.
- **Privileged keys** (service role, admin tokens): rotate every **30–60 days**.
- **User credentials**: handled by Supabase; enforce strong password policy and MFA where applicable.

On rotation, ensure:
- Old keys are revoked.
- Deployments are updated atomically (no downtime window where keys mismatch).
- Audit logs capture who rotated and when (where possible).

### Encryption practices

- **In transit**: HTTPS/TLS required for all network traffic.
- **At rest**: rely on managed encryption at rest (Supabase/Postgres, cloud provider).
- **Application-level encryption**:
  - Only required for highly sensitive fields. If added, manage keys via a secret manager and rotate them.
  - Do not implement custom crypto without review.

### Handling sensitive data in logs and UI

- Do not display full tokens or secrets in UI error messages.
- Redact values in logs:
  - `Authorization` headers
  - API keys
  - refresh tokens
  - password fields
- Treat `ApiLogsRow` as sensitive; if it stores request/response bodies, ensure redaction is applied before persistence.

---

## Compliance & Policies

- **GDPR (if EU users are supported)**
  - Evidence: data inventory (what personal data is stored), lawful basis, retention policy, DSR process (export/delete), breach notification procedure.
- **SOC 2-aligned controls (recommended baseline even if not certified)**
  - Evidence: access control policy, change management, incident response, audit logging, vulnerability management.
- **Internal secure development policy**
  - Evidence: code review requirements for auth/crypto changes, secret scanning enabled, dependency scanning results, documented release process.
- **Data retention & minimization**
  - Evidence: retention schedule for posts/videos/logs; procedures for deletion and anonymization.

---

## Incident Response

### Reporting and escalation

- **Security issues**: open a security incident ticket (private) and notify maintainers immediately.
- **Credential exposure** (e.g., leaked API key):
  1. Revoke/rotate the exposed secret immediately.
  2. Invalidate sessions/tokens if applicable.
  3. Review audit logs to assess impact.
  4. Patch root cause (e.g., remove secret from client bundle, purge git history if needed).
  5. Document timeline and remediation.

### Detection and triage (recommended tooling)

- **Source scanning**: secret scanning in VCS (GitHub secret scanning or equivalent).
- **Dependency scanning**: Dependabot/Snyk/npm audit in CI.
- **Runtime monitoring**:
  - Monitor auth anomalies (repeated failures, unusual geolocation/IP if available).
  - Monitor API error rates and spikes in `api_logs` (if used).

### Post-incident activities

- Perform a blameless postmortem including:
  - impact scope (users/orgs affected)
  - root cause
  - corrective actions (code, process, monitoring)
  - follow-up tasks with owners and deadlines

---

## Related Resources

- [architecture.md](./architecture.md)
