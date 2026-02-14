# Devops Specialist Agent Playbook (renum-social-media)

## Mission

Ensure the project ships reliably and securely by designing, implementing, and maintaining CI/CD workflows, environment configuration, observability, and operational runbooks. Engage this agent whenever changes affect builds, deployments, runtime configuration, secrets, reliability, cost, or incident response.

---

## Responsibilities

- Own CI/CD pipelines (build, test, lint/typecheck, security scanning, deploy, rollback).
- Define and maintain environment configuration and secrets management across dev/staging/prod.
- Ensure reproducible builds (lockfiles, Node versions, caching, artifact strategy).
- Provide deployment strategies (preview deployments, canary/blue-green when applicable).
- Implement operational guardrails: health checks, monitoring, alerting, logging, error tracking.
- Maintain DevOps documentation/runbooks and ensure developer onboarding is smooth.
- Review PRs for operational impact: env var changes, infra changes, dependency risk, cost.

---

## Repository Starting Points (DevOps-relevant areas)

- `src/` — application source; used to infer runtime needs, env vars, external integrations.
  - `src/services/opusclip.ts` — service layer integration; may require external API keys, rate limits, retries.
  - `src/utils/` and `src/lib/` — shared helpers; can hint at runtime and formatting but typically low DevOps impact.
- Root configuration (expected / typical in this repo type; verify and maintain):
  - `package.json`, lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`)
  - TypeScript config (`tsconfig.json`)
  - Lint/format config (`eslint.*`, `prettier.*`)
  - Next.js config (`next.config.*`) if this is a Next.js app
  - `.env*` conventions and templates
  - Containerization files (`Dockerfile`, `.dockerignore`) if present
  - CI config (`.github/workflows/*`) if using GitHub Actions
  - Hosting config (`vercel.json`, `netlify.toml`, etc.) if applicable

> If any of the above are missing, this agent should propose and add them in a minimal, idiomatic way consistent with the repo’s stack.

---

## Key Files (what they are for, and what to do with them)

### Application + runtime integration touchpoints
- `src/services/opusclip.ts`
  - **Why it matters for DevOps**: likely calls an external service (OpusClip). Expect API keys, base URLs, timeouts, retries, rate limiting, and webhook/callback URLs.
  - **DevOps actions**:
    - Inventory required env vars (`OPUSCLIP_API_KEY`, `OPUSCLIP_BASE_URL`, etc.).
    - Ensure secrets are configured in CI/hosting provider.
    - Add safe defaults and validation (fail fast on missing env).
    - Ensure logs don’t leak secrets.

### Utility exports (usually minimal ops impact but used for diagnostics)
- `src/utils/formatters.ts` (`formatDateShort`)
- `src/lib/utils.ts` (`cn`)
  - **Why it matters**: can influence logging formats/UI output; not typically deployment-critical.

### CI/CD and operational configuration (create/maintain as needed)
- `.github/workflows/ci.yml` (or similar)
  - lint/typecheck/test/build; PR gating.
- `.github/workflows/deploy.yml` (or similar)
  - deployments; preview vs production; environment protections.
- `Dockerfile` / `docker-compose.yml` (if used)
  - reproducible local/prod parity, build caching, healthchecks.
- `.env.example`
  - canonical list of env vars and brief notes.

---

## Architecture Context (DevOps lens)

### Service Layer (detected)
- **Location**: `src/services/`
- **Example**: `OpusClipService` in `src/services/opusclip.ts`
- **DevOps focus**:
  - External API dependencies: define SLOs (timeouts/retries), circuit breakers if needed.
  - Identify background/async workloads and queue needs (if any).
  - Define egress requirements (network), IP allowlists, webhook endpoints.

### Utils Layer
- **Locations**: `src/utils`, `src/lib`
- **DevOps focus**:
  - Ensure runtime logging/time formatting is consistent for observability.
  - Keep bundles small where possible; avoid heavy deps in shared utilities.

---

## Workflows (step-by-step)

### 1) Bootstrap/Verify CI for PRs
**Goal**: Every PR runs consistent checks and produces a deployable build artifact.

1. Detect package manager and Node version expectations:
   - Inspect `package.json` for `engines.node` and scripts.
   - Ensure lockfile is committed and used in CI.
2. Standard PR checks (minimum):
   - Install dependencies (with cache).
   - `lint` (ESLint) if configured.
   - `typecheck` (tsc) if configured.
   - `test` (unit) if configured.
   - `build` (Next.js/TS build) to catch runtime/build-time issues early.
3. Add concurrency controls:
   - Cancel in-progress workflow runs on new commits to same PR branch.
4. Produce useful CI output:
   - Upload test reports/coverage (if any).
   - Save build logs as artifacts on failure.

**PR Gate recommendation**: require CI checks before merge.

---

### 2) Deployment workflow (staging + production)
**Goal**: safe, repeatable releases with minimal manual steps.

1. Define environments:
   - `preview` (PR), `staging` (main branch), `production` (tag/release).
2. Choose deployment target:
   - If Next.js: Vercel or container-based deploy to a platform (Render/Fly/K8s).
3. Pipeline structure:
   - Build once, deploy many (avoid rebuilding differently per env when possible).
   - Use environment-specific runtime config via env vars (not code changes).
4. Promotion strategy:
   - Promote from staging to prod via tags or manual approval gate.
   - Enable rollback (previous deployment) and document steps.

**Minimum**: automatic deploy on `main` to staging, manual approval to prod.

---

### 3) Environment variables and secrets management
**Goal**: avoid secret leakage and ensure environments are consistent.

1. Inventory env vars:
   - From `src/services/opusclip.ts` and any other service/integration points.
2. Create/maintain:
   - `.env.example` (non-secret; includes descriptions).
   - Provider secrets:
     - `OPUSCLIP_API_KEY` (secret)
     - `OPUSCLIP_BASE_URL` (non-secret, if configurable)
     - `NODE_ENV`, `NEXT_PUBLIC_*` as needed
3. Enforce validation:
   - Add a small runtime validator (e.g., `zod` schema) or a custom check at startup.
4. CI safety:
   - Never print secrets.
   - Avoid dumping full env in logs.
5. Rotation process:
   - Document how to rotate external API keys with minimal downtime.

---

### 4) Dependency and supply-chain hygiene
**Goal**: reduce security risk and keep builds stable.

1. Pin dependencies via lockfile and keep it consistent.
2. Add automated scans:
   - `npm audit`/`pnpm audit` (non-blocking initially if noisy).
   - Dependency review (GitHub’s dependency-review action) on PRs.
3. Renovation strategy:
   - Use Renovate/Dependabot with grouping rules; require CI green before merge.

---

### 5) Observability baseline (logs, metrics, errors)
**Goal**: detect issues quickly and shorten incident time.

1. Logging:
   - Ensure structured logs in production (JSON preferred).
   - Correlate request IDs if applicable.
2. Error tracking:
   - Add Sentry (or similar) for frontend + backend where relevant.
3. Health:
   - Add a `/health` endpoint (or platform health check) that verifies critical dependencies lightly.
4. Alerts:
   - Define alerts for deployment failures, elevated error rate, API dependency failures (OpusClip).

---

### 6) Incident response and rollback runbook
**Goal**: consistent response and fast recovery.

1. Define severity levels (SEV-1/2/3) and communication steps.
2. Immediate actions:
   - Roll back to last known good deployment.
   - Disable feature flags or integrations if dependency is failing.
3. Post-incident:
   - Add a short RCA template and ensure follow-up tickets exist.

---

## Best Practices (tailored to this repo’s patterns)

- **Service integrations must be ops-friendly**: For `OpusClipService`-like code, enforce:
  - timeouts, retries with backoff, and clear error messages;
  - graceful degradation when external APIs fail (avoid cascading failures);
  - explicit env var configuration and startup validation.
- **Keep runtime config out of code**: use env vars and hosting provider configuration; document in `.env.example`.
- **Build reproducibility**:
  - use a single package manager and committed lockfile;
  - pin Node version (via `engines`, `.nvmrc`, or `.tool-versions`).
- **CI should match production**:
  - run `build` in CI the same way production builds run;
  - avoid “works on my machine” flags.
- **Secrets discipline**:
  - never commit `.env` files;
  - use least-privilege tokens and rotate regularly.

---

## Key Symbols for This Agent

- `OpusClipService` — `src/services/opusclip.ts`
  - External dependency integration; drives env var needs, reliability requirements, and deployment configuration.

- `formatDateShort` — `src/utils/formatters.ts`
  - Ensure consistent timestamps in logs/diagnostics if used server-side.

- `cn` — `src/lib/utils.ts`
  - Minimal DevOps impact; useful for understanding stack (common in Tailwind/React projects).

---

## Documentation Touchpoints (keep these accurate)

- `README.md`
  - Must include: prerequisites, env vars, local run, test, build, deploy notes.
- `AGENTS.md` (referenced)
  - Align DevOps practices with other agents.
- `docs/README.md` (referenced)
  - Link CI/CD, environments, and runbooks here.

If these files are missing or sparse, add:
- `docs/devops/cicd.md`
- `docs/devops/environments.md`
- `docs/devops/runbooks.md`

---

## Collaboration Checklist (operational workflow)

- [ ] Confirm deployment target(s) (Vercel/Netlify/Docker/K8s) and environments (preview/staging/prod).
- [ ] Identify all env vars required by `src/services/*` (starting with `OpusClipService`), document in `.env.example`.
- [ ] Ensure CI runs: install → lint → typecheck → test → build on every PR.
- [ ] Add security scanning (dependency review + basic audit) and make outcomes visible in PRs.
- [ ] Define rollback procedure and add it to docs; test rollback once.
- [ ] Add baseline observability (error tracking + structured logs) and document how to access them.
- [ ] Review PRs for: env var changes, new external services, increased build complexity, secret exposure.

---

## Hand-off Notes (what to leave behind after work)

- A working CI pipeline with required checks and caching.
- A deployment workflow with documented environments and rollback.
- A complete `.env.example` derived from service integrations (notably `OpusClipService`) and updated hosting provider secrets.
- A short ops doc set: CI/CD overview, environment matrix, and incident/rollback runbook.
- A list of remaining risks (e.g., missing timeouts/retries, unclear external API quotas, no error tracking) with prioritized follow-ups.

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)
