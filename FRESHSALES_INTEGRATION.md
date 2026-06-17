# Freshsales / Freshworks CRM Integration

## Overview

SideKick supports workspace-scoped Freshsales OAuth connections for:

- connecting a Freshsales / Freshworks CRM account to one workspace
- storing encrypted OAuth tokens server-side
- sending a private `Send Test Lead` verification record from Workspace Settings

Provider key used in the app:

- `freshsales`

UI label:

- `Freshsales / Freshworks CRM`

## Redirect URLs

Use these redirect URLs in the Freshworks app configuration:

- Local: `http://localhost:3000/api/integrations/freshsales/callback`
- Production: `https://sidekickstudioss.com/api/integrations/freshsales/callback`

## Environment variables

Add these server-side environment variables:

- `FRESHSALES_CLIENT_ID`
- `FRESHSALES_CLIENT_SECRET`
- `FRESHSALES_REDIRECT_URI`
- `FRESHSALES_SCOPES`
- `FRESHSALES_AUTH_BASE_URL`
- `FRESHSALES_API_BASE_URL`

Recommended starting values:

- `FRESHSALES_REDIRECT_URI=https://sidekickstudioss.com/api/integrations/freshsales/callback`
- `FRESHSALES_SCOPES=freshsales.contacts.create freshsales.contacts.edit freshsales.contacts.view`

## Base URL notes

Freshsales uses two important base URLs:

- `FRESHSALES_AUTH_BASE_URL`
  - your Freshworks org base URL
  - SideKick builds the authorize URL from this as `/org/oauth/v2/authorize`
  - SideKick exchanges tokens against the documented OAuth token path and safely falls back between the two documented token path variants if needed

- `FRESHSALES_API_BASE_URL`
  - your Freshsales CRM API base URL
  - expected shape: `https://your-domain.myfreshworks.com/crm/sales/api`

These are intentionally explicit env vars because Freshworks OAuth is org/account specific.

## OAuth flow

1. User clicks `Connect Freshsales` in `Workspace Settings -> Integrations`
2. SideKick redirects the signed-in user to the Freshworks OAuth consent flow
3. Freshworks redirects back to `/api/integrations/freshsales/callback`
4. SideKick validates OAuth state and exchanges the code server-side
5. Access and refresh tokens are encrypted and saved to the current workspace connection row
6. The workspace returns to `Workspace Settings -> Integrations`

## What SideKick stores

Per workspace connection, SideKick stores:

- encrypted access token
- encrypted refresh token when returned
- token type
- token expiry
- granted scopes
- safe metadata such as:
  - API base URL
  - auth base URL
  - account host

## Test delivery behavior

The `Send Test Lead` button currently sends a Freshsales Contact.

Test payload:

- First name: `SideKick`
- Last name: `Test Lead`
- Email: `test+sidekick@sidekickstudioss.com`
- Phone: `555-010-2026`

Why Contact instead of Lead:

- the current official Freshsales CRM API docs clearly document the Contacts endpoints for OAuth-backed CRM access
- SideKick uses that documented path for v1 reliability

Success message:

- `Test contact sent to Freshsales.`

Validation/layout error message:

- `Freshsales rejected the test lead because your CRM layout has required fields SideKick is not sending yet.`

## Local test steps

1. Set all `FRESHSALES_*` env vars locally
2. Start the app on `http://localhost:3000`
3. Open `Workspace Settings -> Integrations`
4. Click `Connect Freshsales`
5. Complete the Freshworks OAuth flow
6. Return to Workspace Settings and confirm the card shows `Connected`
7. Click `Send Test Lead`
8. Confirm the success message appears and the test contact exists in Freshsales

## Security notes

- OAuth tokens remain server-side only
- tokens are encrypted before storage
- SideKick never exposes Freshsales access or refresh tokens in the browser
- raw provider responses are not shown to users
- test delivery requires authenticated workspace-owner/admin access
- existing SideKick rate limits still apply

## Troubleshooting

If connect fails:

1. Confirm `FRESHSALES_AUTH_BASE_URL` matches the Freshworks org URL used for the OAuth app
2. Confirm `FRESHSALES_REDIRECT_URI` exactly matches the callback URL configured in Freshworks
3. Confirm the app credentials include the requested scopes

If test delivery fails:

1. Reconnect Freshsales to refresh tokens/scopes
2. Confirm `FRESHSALES_API_BASE_URL` points to the CRM API base, not just the main account homepage
3. Confirm the connection includes `freshsales.contacts.create`
4. Check whether the Freshsales contact layout has extra required fields beyond the default SideKick payload
