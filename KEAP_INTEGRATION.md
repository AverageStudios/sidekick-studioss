# Keap Integration

## Overview

SideKick supports workspace-scoped Keap OAuth for CRM connectivity and manual CRM verification.

Current v1 support includes:

- OAuth connect and callback
- encrypted access token and refresh token storage
- automatic access token refresh
- `Send Test Lead` from `Workspace Settings -> Integrations`

## Environment variables

Add these server-side env vars:

```env
KEAP_CLIENT_ID=
KEAP_CLIENT_SECRET=
KEAP_REDIRECT_URI=
KEAP_SCOPES=full
```

Recommended redirect URIs:

- local: `http://localhost:3000/api/integrations/keap/callback`
- production: `https://sidekickstudioss.com/api/integrations/keap/callback`

## OAuth setup

Create a Keap developer app and configure:

- client ID
- client secret
- redirect URI

SideKick routes:

- connect: `/api/integrations/keap/connect`
- callback: `/api/integrations/keap/callback`
- shared callback handling: `/api/integrations/crm/callback`

## Scopes

Keap currently uses:

- `full`

This scope is broader than some other CRM providers. SideKick uses the Keap connection only for contact creation and contact update-style CRM handoff behavior in v1, but Keap’s OAuth model currently exposes this broader scope.

## Token refresh behavior

Keap access tokens expire and refresh tokens must be rotated correctly.

SideKick:

- stores the access token encrypted
- stores the refresh token encrypted
- refreshes the access token server-side when needed
- stores a newly returned refresh token when Keap rotates it
- preserves the previous refresh token if Keap does not return a replacement

## Workspace Settings flow

Users can connect Keap from:

- `Workspace Settings -> Integrations -> Keap`

Connected state supports:

- reconnect
- disconnect
- `Send Test Lead`

## Send Test Lead

The Keap test delivery sends a test contact using the connected workspace Keap account.

Test payload:

- given name: `SideKick`
- family name: `Test Lead`
- email: `test+sidekick@sidekickstudioss.com`
- phone: `555-010-2026`

Success message:

- `Test contact sent to Keap.`

Validation failure message:

- `Keap rejected the test contact because a required contact field is missing.`

Generic failure message:

- `Test failed. Please reconnect Keap or try again.`

## Security notes

- access tokens stay server-side only
- refresh tokens stay server-side only
- tokens are encrypted before persistence
- no token values are logged
- no token values are returned to the browser
- workspace auth and role checks run before CRM test delivery
- rate limits apply to OAuth and test delivery flows

## Local testing

1. set the Keap env vars locally
2. run the app on `http://localhost:3000`
3. open `Workspace Settings -> Integrations`
4. click `Connect Keap`
5. finish the Keap OAuth flow
6. click `Send Test Lead`

## Troubleshooting

If Keap does not connect:

1. confirm `KEAP_CLIENT_ID`
2. confirm `KEAP_CLIENT_SECRET`
3. confirm `KEAP_REDIRECT_URI`
4. confirm the redirect URI is registered in the Keap developer app

If the test contact fails:

1. reconnect Keap
2. confirm the workspace is the one you connected
3. retry after reconnect if the token has expired
4. if Keap validation rejects the contact, check required contact fields in that Keap account
