# Security Fixes Phase 5

Phase 5 adds practical rate limiting and abuse protection to SideKick Studioss without changing the core auth, dashboard, templates, or campaign flows.

## Strategy

- Added a shared server-side helper in `lib/rate-limit.ts`.
- The helper supports rate limiting by:
  - IP address
  - authenticated user ID
  - email when available
  - route/action key
- API routes now return:
  - `429 Too Many Requests`
  - a safe generic error message
  - `Retry-After` header
- Server actions now:
  - log rate-limit hits server-side
  - redirect with a safe generic error message

## Storage Model

Current implementation:

- Uses an in-memory store attached to `globalThis`.
- This is lightweight and requires no new infrastructure or environment variables.
- It is suitable for:
  - local development
  - basic protection on a single server process

Production caveat:

- In-memory rate limiting is not durable across:
  - server restarts
  - multiple server instances
  - serverless cold starts
- For stronger production guarantees, the recommended next step is a shared persistent store such as:
  - Upstash Redis
  - Vercel KV / Redis-equivalent
  - another centralized low-latency key/value store

No new environment variables were added in this phase.

## Protected Routes And Actions

### Public / auth-adjacent

- `signUpAction`
- `signInAction`
- `resendConfirmationAction`
- `submitLeadAction`
- `GET /auth/callback`
- `GET /api/meta/connect`
- `GET /api/meta/callback`
- `GET /api/integrations/crm/connect`
- `GET /api/integrations/crm/callback`
- `POST /api/meta/webhook`

### Authenticated mutation APIs

- `POST /api/campaign-drafts`
- `GET /api/meta/budget-guidance`
- `POST /api/meta/preflight`
- `POST /api/meta/publish`
- `POST /api/admin/template-media-upload`
- `POST /api/admin/template-preview-upload`

### Authenticated server actions

- `updateLeadStatusAction`
- `updateLeadNotesAction`
- `retryCrmDeliveryAction`
- `retryFailedCrmDeliveriesAction`

## Limits Used

### Public / auth-adjacent

- Signup:
  - `3 / hour`
  - keyed by IP and email
- Sign-in:
  - `5 / minute`
  - keyed by IP and email
- Resend confirmation:
  - `3 / hour`
  - keyed by IP and email
- Public lead submission:
  - `5 / minute`
  - keyed by IP and email
  - plus `30 / hour`
  - keyed by IP and email
- Auth callback:
  - `20 / hour`
  - keyed by IP
- Meta connect:
  - `10 / hour`
  - keyed by IP and user
- Meta callback:
  - `10 / hour`
  - keyed by IP and user
- CRM connect:
  - `10 / hour`
  - keyed by IP and user
- CRM callback:
  - `10 / hour`
  - keyed by IP and user
- Meta webhook:
  - `240 / minute`
  - keyed by IP
  - applied after signature verification

### Authenticated mutations

- Campaign drafts:
  - `30 / minute`
  - keyed by IP and user
- Meta budget guidance:
  - `30 / minute`
  - keyed by IP and user
- Meta preflight:
  - `30 / minute`
  - keyed by IP and user
- Meta publish:
  - `5 / minute`
  - keyed by IP and user
- Admin template media upload:
  - `10 / hour`
  - keyed by IP and user
- Admin template preview upload:
  - `10 / hour`
  - keyed by IP and user
- Lead status updates:
  - `30 / minute`
  - keyed by IP and user
- Lead notes updates:
  - `30 / minute`
  - keyed by IP and user
- CRM delivery retry:
  - `10 / hour`
  - keyed by IP and user
- Retry all failed CRM deliveries:
  - `10 / hour`
  - keyed by IP and user

## Logging

Rate-limit hits are logged server-side with:

- route/action key
- user ID when available
- hashed IP fingerprint
- retry-after seconds
- timestamp

The logs do not include:

- secrets
- tokens
- auth headers
- full request bodies

## Manual Test Checklist

- Anonymous `POST /api/campaign-drafts` returns `401`
- Unsigned `POST /api/meta/webhook` returns `403`
- Signed `POST /api/meta/webhook` still succeeds normally
- Repeated signed `POST /api/meta/webhook` requests eventually return `429`
- API rate-limited responses include `Retry-After`
- Signup/login/resend flows still render and submit normally
- Meta connect/callback routes still redirect correctly when used normally
- CRM connect/callback routes still redirect correctly when used normally
- Admin upload routes still work for single normal uploads
- Lead status/notes changes still work under normal usage

## Checks Run

- `./node_modules/.bin/tsc --noEmit`
- ESLint on changed files via bundled Node runtime
- Local smoke probes:
  - anonymous `POST /api/campaign-drafts` -> `401`
  - unsigned `POST /api/meta/webhook` -> `403`
  - signed `POST /api/meta/webhook` -> `200`
  - repeated signed `POST /api/meta/webhook` -> `429` with `Retry-After`

## Known Limitations / Remaining Risks

- The current limiter is in-memory only and is not a strong distributed production control.
- A persistent shared store is still recommended for full production-grade enforcement.
- The public lead submission limiter was added to `submitLeadAction`, but the current repository does not appear to expose an active mounted public funnel page using `components/public-lead-form.tsx`, so that specific path was not directly smoke-tested through the browser in this phase.
