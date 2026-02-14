## Glossary & Domain Concepts

This project (“renum-social-media”) is a social-media content workflow application centered around **organizations**, **users**, **videos**, and derived **posts/clips**. It integrates with **Supabase** for authentication and database access and with **OpusClip** (external service) for generating clips/projects from longer videos.

Key concept clusters:

- **Identity & access**: Users authenticate via Supabase Auth. Each user is associated with an **Organization** (tenant boundary).
- **Content pipeline**: A **Video** can be processed into an **OpusClip Project**, which can produce one or more **Clips**. Clips and/or processed outputs become **Posts** to be published/shared (exact publishing mechanics depend on the UI flows).
- **Auditability/observability**: API-related actions can be logged in **API Logs** for troubleshooting and traceability.

For an overview of the application goals, architecture, and high-level workflows, see: [project-overview.md](./project-overview.md).

---

## Type Definitions

Exported types and interfaces used across the application (domain, services, and UI). Paths are relative to repository root.

### Database/domain (Supabase-generated) types

- [`Json`](../src/types/database.types.ts) — JSON-compatible value type used for unstructured columns.
- [`OrganizationsRow`](../src/types/database.types.ts) — Row shape for organizations/tenants.
- [`UsersRow`](../src/types/database.types.ts) — Row shape for users.
- [`UserWithOrganization`](../src/types/database.types.ts) — Convenience shape representing a user joined with organization data.
- [`VideosRow`](../src/types/database.types.ts) — Row shape for videos (source content).
- [`PostsRow`](../src/types/database.types.ts) — Row shape for posts (published or publishable content units).
- [`ApiLogsRow`](../src/types/database.types.ts) — Row shape for API log entries (tracking requests/events).
- [`Database`](../src/types/database.types.ts) — Full typed Supabase database schema (tables, views, functions).

### External service types (OpusClip)

- [`OpusClipProject`](../src/services/opusclip.ts) — OpusClip “project” representation returned/used by the OpusClip API client.
- [`OpusClipClip`](../src/services/opusclip.ts) — OpusClip “clip” representation (a generated short segment).
- [`CreateProjectRequest`](../src/services/opusclip.ts) — Request payload for creating an OpusClip project.

### UI/component prop types (public API surface for UI primitives)

- [`BadgeProps`](../src/components/ui/badge.tsx) — Props for `<Badge />`.
- [`ButtonProps`](../src/components/ui/button.tsx) — Props for `<Button />`.
- [`TextareaProps`](../src/components/ui/textarea.tsx) — Props for `<Textarea />`.
- [`CalendarProps`](../src/components/ui/calendar.tsx) — Props for calendar UI component.
- [`ChartConfig`](../src/components/ui/chart.tsx) — Configuration shape for charts.

---

## Enumerations

No exported `enum` declarations were identified in the current public API/symbol index. The codebase primarily uses:

- **String literal unions** and **typed objects** (common in TS/React projects and Supabase-generated schemas), and/or
- **External API enumerations** represented as strings (e.g., OpusClip statuses) rather than TypeScript `enum`s.

If enums are introduced later (e.g., `PostStatus`, `VideoProcessingState`), list them here with links and describe their allowed values and transitions.

---

## Core Terms

- **Organization (Tenant)**
  - **Meaning:** A top-level grouping for users and content; defines tenancy boundaries.
  - **Where in code:** `OrganizationsRow` in [`src/types/database.types.ts`](../src/types/database.types.ts); organization context access via [`useOrganization`](../src/hooks/useOrganization.ts).
  - **Why it matters:** Most queries and UI should be scoped to the active organization to prevent cross-tenant data access.

- **User**
  - **Meaning:** An authenticated person using the app. Typically belongs to an organization.
  - **Where in code:** `UsersRow`, `UserWithOrganization` in [`src/types/database.types.ts`](../src/types/database.types.ts); auth workflows in [`src/services/auth.ts`](../src/services/auth.ts); auth state via [`useAuth`](../src/hooks/useAuth.ts).
  - **Why it matters:** Drives access control, personalization, and audit trails (e.g., last login updates).

- **Auth (Supabase Auth)**
  - **Meaning:** Authentication and session management provided by Supabase.
  - **Where in code:** [`signUp`, `signIn`, `signOut`, `getCurrentUser`, `updateLastLogin`](../src/services/auth.ts) in `src/services/auth.ts`; auth listener in `src/main.tsx` (`SupabaseAuthListener` symbol).
  - **Why it matters:** The primary gateway to the application; failures here impact all protected features.

- **Video**
  - **Meaning:** A source media asset (typically long-form) from which clips/posts may be created.
  - **Where in code:** `VideosRow` in [`src/types/database.types.ts`](../src/types/database.types.ts).
  - **Why it matters:** Anchor entity for the content pipeline; used to initiate OpusClip processing.

- **Post**
  - **Meaning:** A content unit intended for social platforms (could be a clip, caption, metadata, etc.).
  - **Where in code:** `PostsRow` in [`src/types/database.types.ts`](../src/types/database.types.ts).
  - **Why it matters:** Represents the primary output of the workflow (what users ultimately publish/manage).

- **OpusClip**
  - **Meaning:** External service/API used to create “projects” and generate “clips” from videos.
  - **Where in code:** Types and client wrapper in [`src/services/opusclip.ts`](../src/services/opusclip.ts), notably the exported `OpusClipService` class and related request/response types.
  - **Why it matters:** Powers automated clip generation; introduces external API constraints, latency, and error handling needs.

- **OpusClip Project**
  - **Meaning:** A unit of work in OpusClip created from a video; may produce multiple clips.
  - **Where in code:** `OpusClipProject`, `CreateProjectRequest` in [`src/services/opusclip.ts`](../src/services/opusclip.ts).
  - **Why it matters:** Tracks processing lifecycle and configuration for clip generation.

- **OpusClip Clip**
  - **Meaning:** A generated short-form segment produced by OpusClip.
  - **Where in code:** `OpusClipClip` in [`src/services/opusclip.ts`](../src/services/opusclip.ts).
  - **Why it matters:** Likely maps to post-ready assets; may be transformed into `PostsRow` records.

- **API Logs**
  - **Meaning:** Stored records of API requests/events (internal or external) to aid debugging/auditing.
  - **Where in code:** `ApiLogsRow` in [`src/types/database.types.ts`](../src/types/database.types.ts).
  - **Why it matters:** Supports observability and diagnosing integration issues (e.g., OpusClip failures).

- **Formatting utilities**
  - **Meaning:** Shared helpers for UI-friendly data formatting.
  - **Where in code:** `formatDateShort` in [`src/utils/formatters.ts`](../src/utils/formatters.ts).
  - **Why it matters:** Keeps UI consistent and reduces duplicated formatting logic.

- **`cn` (class name composition)**
  - **Meaning:** Utility to merge/condition CSS class names (typical Tailwind/React pattern).
  - **Where in code:** `cn` in [`src/lib/utils.ts`](../src/lib/utils.ts).
  - **Why it matters:** Standardizes conditional styling across UI components.

---

## Acronyms & Abbreviations

- **API** — Application Programming Interface (used for OpusClip integration and internal services).
- **DB** — Database (Supabase Postgres behind the typed `Database` schema).
- **PII** — Personally Identifiable Information (relevant if user records/logs contain identifying data; treat logs accordingly).
- **UUID** — Universally Unique Identifier (commonly used by Supabase for primary keys).
- **UI** — User Interface (React components under `src/components` and `src/pages`).

---

## Personas / Actors

### Organization Member (Primary User)
- **Goals:** Upload/manage videos, generate clips, create/manage posts for social media.
- **Key workflows:**
  - Authenticate (sign up / sign in)
  - Select/operate within an organization context
  - Create an OpusClip project from a video
  - Review generated clips and convert them into posts
- **Pain points addressed:** Reduces manual editing effort by automating clip generation; centralizes organization content management.

### Organization Admin (Tenant Administrator)
- **Goals:** Manage organization-level content visibility and user access (depending on implemented UI).
- **Key workflows:** Invite/manage users, ensure correct organization scoping, monitor activity.
- **Pain points addressed:** Prevents cross-organization data leakage; supports governance and accountability.

### Developer/Operator (Maintenance)
- **Goals:** Diagnose integration/auth issues and ensure system stability.
- **Key workflows:** Inspect API logs, review auth/session behavior, validate database schema and types.
- **Pain points addressed:** Typed schemas (`Database`, `*Row`) and API logging support faster troubleshooting.

---

## Domain Rules & Invariants

> Note: Some rules are implied by the type system and common Supabase multi-tenant patterns; enforce them at both the UI/service layer and (ideally) via Supabase Row Level Security (RLS).

### Tenancy & access control
- **All organization-owned entities must be scoped to an Organization.**
  - Videos/posts/users should never be queried or mutated across organizations without explicit admin/system intent.
  - Prefer using `UserWithOrganization` or `useOrganization()` context to consistently apply scoping.

### Authentication invariants
- **Protected actions require a valid authenticated user session.**
  - Auth entry points: `signUp`, `signIn`, `signOut`, `getCurrentUser`.
- **Login bookkeeping should be updated consistently.**
  - `updateLastLogin` indicates the system tracks last-login timestamps; ensure it’s called on successful auth flows where appropriate.

### Content pipeline consistency
- **A Video can be a source for one or more OpusClip Projects (depending on product decisions).**
- **An OpusClip Project can yield multiple Clips.**
  - Persist linkage between internal `VideosRow` and external `OpusClipProject` identifiers if the app needs reconciliation/retry logic.
- **Posts should map back to their originating asset (video/clip) where feasible.**
  - This enables traceability and repeatable workflows (e.g., regenerate a clip, re-export, etc.).

### Logging & data handling
- **API logs should avoid storing sensitive tokens or PII unnecessarily.**
  - If logging request/response payloads, redact auth headers, access tokens, and sensitive user fields.

---

## Related Resources

- [project-overview.md](./project-overview.md)
