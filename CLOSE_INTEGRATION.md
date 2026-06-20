# Close CRM Integration

## Overview

SideKick supports workspace-scoped Close CRM OAuth for CRM connectivity and manual CRM verification.

Current v1 support includes:

- OAuth connect and callback
- encrypted access token and refresh token storage
- automatic server-side token refresh
- `Send Test Lead` from `Workspace Settings -> Integrations`

## Environment variables

Add these server-side env vars:

```env
CLOSE_CLIENT_ID=
CLOSE_CLIENT_SECRET=
CLOSE_REDIRECT_URI=
CLOSE_SCOPES=all.full_access offline_access
```

`CLOSE_SCOPES` is optional in practice. SideKick does not send a `scope` parameter on the Close authorization URL because Close grants app scopes automatically, but keeping the env var documented helps diagnostics stay consistent.

Recommended redirect URIs:

- local: `http://localhost:3000/api/integrations/close/callback`
- production: `https://sidekickstudioss.com/api/integrations/close/callback`

## Creating the Close OAuth app

Create the app in Close:

- Settings -> Developer -> OAuth Apps
- App name: `SideKick Studioss`
- Redirect URL: match `CLOSE_REDIRECT_URI`

Close docs:

- OAuth auth flow: [Authentication with OAuth](https://developer.close.com/api/overview/oauth-authentication)
- App setup: [Creating an OAuth App](https://developer.close.com/integrations/create-an-oauth-app)

## Scopes

Close currently grants OAuth apps:

- `all.full_access`
- `offline_access`

That is the official Close OAuth model today. SideKick uses that access only for:

- reading account/user info during verification
- creating Close leads
- creating nested contact details inside those leads
- refreshing the workspace token when needed

Close scopes are granted by the app itself. SideKick does not need to send a `scope` query parameter on the authorization URL.

## OAuth flow

SideKick routes:

- connect: `/api/integrations/close/connect`
- callback: `/api/integrations/close/callback`
- shared callback handling: `/api/integrations/crm/callback`

Flow:

1. user clicks `Connect Close CRM`
2. SideKick redirects to Close OAuth
3. user approves the Close organization
4. Close redirects back to SideKick
5. SideKick exchanges the code server-side
6. SideKick attempts a lightweight account lookup for nicer labels
7. encrypted tokens are saved to the current workspace

If the token exchange succeeds but the Close account lookup fails, SideKick now keeps the connection and stores minimal workspace-scoped metadata instead of failing the whole OAuth flow.

## Lead and contact model

Close treats Leads as the primary CRM object and contacts live under the lead.

For v1, SideKick test delivery creates:

- one Lead
- one Contact linked to that Lead

## Send Test Lead

The Close CRM test delivery creates:

- Lead name: `SideKick Studioss Test`
- Contact name: `SideKick Test Lead`
- Email: `test+sidekick@sidekickstudioss.com`
- Phone: `555-010-2026`

Success message:

- `Test lead sent to Close CRM.`

Validation failure message:

- `Close CRM rejected the test lead because a required field is missing.`

Permission failure message:

- `Close CRM rejected the test lead because SideKick does not have the required API permissions.`

## Security notes

- access tokens stay server-side only
- refresh tokens stay server-side only
- tokens are encrypted before persistence
- no token values are logged
- no token values are returned to the browser
- workspace auth and workspace-role checks run before test delivery
- rate limits apply to OAuth and test delivery flows

## Local testing

1. set the Close env vars locally
2. run the app on `http://localhost:3000`
3. open `Workspace Settings -> Integrations`
4. click `Connect CRM`
5. choose `Close CRM`
6. finish the Close OAuth flow
7. click `Send Test Lead`

## Troubleshooting

If Close does not connect:

1. confirm `CLOSE_CLIENT_ID`
2. confirm `CLOSE_CLIENT_SECRET`
3. confirm `CLOSE_REDIRECT_URI`
4. confirm the redirect URI is registered in the Close OAuth app
5. confirm the Close user authorizing the app belongs to the same Close organization that created the OAuth app if the app is still private

If the test lead fails:

1. reconnect Close CRM
2. confirm the workspace is the one you connected
3. retry after reconnect if the token expired
4. if Close validation rejects the record, check whether the Close org requires extra fields for lead creation
