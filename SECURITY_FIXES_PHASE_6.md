# Security Fixes Phase 6

Phase 6 adds baseline browser security headers and a careful Content Security Policy for SideKick Studioss without changing core auth, dashboard, template, CRM, or Meta flows.

## Files Changed

- `next.config.ts`

## Header Strategy

Headers are applied centrally through `next.config.ts` so the rollout stays minimal and predictable.

They are applied to:

- app pages
- auth pages
- product/public pages
- admin pages
- API responses

## Headers Added

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`

Production only:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

## CSP Summary

### Baseline directives

- `default-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`
- `frame-ancestors 'none'`
- `manifest-src 'self'`
- `worker-src 'self' blob:`

### Scripts

- `script-src 'self' 'unsafe-inline'`
- development also includes:
  - `'unsafe-eval'`

Why:

- Next.js needs looser development script rules for HMR/Turbopack.
- `unsafe-inline` is retained because this app currently uses standard Next.js behavior without a nonce-based CSP architecture.

### Styles

- `style-src 'self' 'unsafe-inline'`

Why:

- Keeps current Next.js/Tailwind styling behavior stable.
- Avoids breaking app UI while still keeping the policy bounded to self plus inline styles.

### Images

- `img-src 'self' data: blob:`
- Supabase public storage origin
- `https://graph.facebook.com`
- `https://*.fbcdn.net`
- `https://lh3.googleusercontent.com`

Why:

- Supabase public asset storage
- Meta/Facebook page/profile imagery
- Google profile avatars from social auth metadata

### Media

- `media-src 'self' blob: data:`
- Supabase public storage origin

Why:

- supports uploaded assets and preview media

### Fonts

- `font-src 'self' data:`

Why:

- current font usage is compatible with self-hosted Next font handling

### Forms

- `form-action 'self'`
- Supabase origin

Why:

- preserves app forms and Supabase auth-related behavior

### Connections

- `connect-src 'self'`
- app origin
- Supabase origin
- Supabase websocket origin
- `https://www.facebook.com`
- `https://graph.facebook.com`
- `https://services.leadconnectorhq.com`
- `https://api.hubapi.com`
- `https://nominatim.openstreetmap.org`

Development only:

- `http://localhost:*`
- `http://127.0.0.1:*`
- `ws://localhost:*`
- `ws://127.0.0.1:*`

Why:

- Supabase auth/session calls
- Meta integrations
- CRM integration flows
- location search
- local HMR/dev sockets

### Frames

- `frame-src 'self' https://www.facebook.com https://*.facebook.com`

Why:

- conservative allowance in case Facebook-owned flows require framed content
- app itself still blocks embedding with `frame-ancestors 'none'`

### Production-only CSP tightening

Production adds:

- `upgrade-insecure-requests`

Development does not include this, so localhost stays usable.

## Allowed Domains And Why

- `https://vgkrgqqspbjkwupqratd.supabase.co`
  - Supabase auth/session/storage
- `wss://vgkrgqqspbjkwupqratd.supabase.co`
  - Supabase realtime/websocket-compatible connections if needed
- `https://graph.facebook.com`
  - Meta page/profile images and API-adjacent browser-safe resources
- `https://www.facebook.com`
  - Meta OAuth/integration related browser flows
- `https://*.fbcdn.net`
  - Facebook-hosted image assets
- `https://lh3.googleusercontent.com`
  - Google user avatars
- `https://services.leadconnectorhq.com`
  - GoHighLevel/LeadConnector CRM integration
- `https://api.hubapi.com`
  - HubSpot integration
- `https://nominatim.openstreetmap.org`
  - location search API

## Dev Vs Production Behavior

### Development

- CSP includes `unsafe-eval` for local Next.js/Turbopack/HMR support
- no HSTS
- localhost and ws localhost are allowed in `connect-src`

### Production

- no `unsafe-eval`
- HSTS is enabled
- `upgrade-insecure-requests` is enabled
- localhost dev allowances are removed

## Checks Run

- `./node_modules/.bin/tsc --noEmit`
- ESLint on changed files
- `next build`
- local header inspection on:
  - `/`
  - `/login`
  - `/signup`
  - `/dashboard`
  - `/templates`
  - `/product/templates`
  - `/admin/templates`
  - `/auth/callback`

## Manual Test Checklist

- login page loads normally
- signup page loads normally
- Google sign-in still redirects correctly
- Supabase auth callback still completes normally in the browser
- dashboard loads after sign-in
- templates pages still render
- public website/product pages still render
- admin templates still load for admins
- Meta connect/reconnect flow still redirects correctly
- CRM connect flow still redirects correctly
- Supabase-hosted public images still render
- Google profile avatars still render

## Remaining Risks / Follow-Ups

- `script-src 'unsafe-inline'` remains in place because the app does not yet use a nonce-based CSP architecture. A future hardening phase could move to nonces or hashes for stricter script control.
- `style-src 'unsafe-inline'` remains for compatibility with current styling behavior.
- CSP was verified at the header level locally, but browser-based manual regression testing is still recommended for:
  - Google OAuth
  - Supabase auth callback
  - Meta connect/callback flows
  - CRM connect/callback flows
