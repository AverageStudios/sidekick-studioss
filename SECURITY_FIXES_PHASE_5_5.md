# Security Fixes Phase 5.5

Phase 5.5 upgrades SideKick Studioss rate limiting from development-only in-memory storage to a production-capable shared store using Upstash Redis, while preserving the same route/action integration points from Phase 5.

## Strategy

- Kept the existing `lib/rate-limit.ts` helper as the single integration point.
- Preserved the same helper API used by current call sites:
  - `checkRateLimit(...)`
  - `logRateLimitHit(...)`
  - `createRateLimitResponse(...)`
  - IP helpers
- Upgraded `checkRateLimit(...)` to support:
  - Upstash Redis when production env vars are present
  - automatic in-memory fallback when they are not present
  - automatic in-memory fallback if Redis errors at runtime

## Shared Store Behavior

### Production path

If both of these env vars are present:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

the helper uses Upstash Redis for rate limit counters.

### Development / fallback path

If those env vars are missing, the helper falls back to the existing in-memory store.

If Redis is configured but fails at runtime:

- the helper logs a server-side warning once
- the limiter falls back to in-memory
- the app does not crash
- clients do not see internal Redis errors

## Dependency Added

- `@upstash/redis`

## Rate Limit Algorithm

- Redis implementation uses a fixed-window counter per:
  - route/action key
  - hashed IP key
  - user ID key
  - hashed email key
- Each Redis key includes the current window start time.
- Requests increment the counter with `INCR`.
- The key gets a short expiry with `PEXPIRE`.
- `retryAfterSeconds` is derived from the end of the active window.

This preserves the same functional behavior as the existing call sites while making production enforcement shared across instances.

## Privacy / Safety Notes

- Full IP addresses are not stored as raw rate-limit identifiers.
- IP and email identifiers continue to be hashed before becoming storage keys.
- Redis credentials are never logged.
- Redis URL/token are never returned to clients.
- Redis failures do not surface raw internals to users.

## Required Production Env Vars

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

No additional app code changes are required once these env vars are set.

## Vercel Deployment Steps

1. Create an Upstash Redis database.
2. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Add both env vars in Vercel for the SideKick project.
4. Redeploy the app.
5. Confirm rate-limited routes still return:
   - normal success for single valid requests
   - `429` plus `Retry-After` for bursts

## Checks Run

- `./node_modules/.bin/tsc --noEmit`
- ESLint on changed files
- `next build`
- Local fallback behavior verified with missing Upstash env vars
- Local signed Meta webhook still rate-limited correctly under fallback
- Local anonymous protected API behavior unchanged
- Local dummy-Upstash runtime probe verified app does not crash and falls back safely

## Remaining Risks

- If Redis is misconfigured or unavailable in production, rate limiting falls back to per-instance memory, which is safer than failing open but weaker than a healthy shared store.
- The current Redis algorithm is fixed-window, which is practical and lightweight but can allow some boundary burstiness near window edges.
