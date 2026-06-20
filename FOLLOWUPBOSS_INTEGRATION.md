# Follow Up Boss Integration

## Overview

SideKick supports workspace-scoped Follow Up Boss OAuth connections.

Users connect Follow Up Boss from:

- `Workspace Settings -> Integrations -> Connect CRM`

SideKick stores the workspace connection server-side and keeps OAuth tokens encrypted in Supabase.

## Callback URLs

Use these redirect URLs in the Follow Up Boss OAuth app:

- Local: `http://localhost:3000/api/integrations/followupboss/callback`
- Production: `https://sidekickstudioss.com/api/integrations/followupboss/callback`

## Required env vars

Add these server-side env vars:

- `FOLLOWUPBOSS_CLIENT_ID`
- `FOLLOWUPBOSS_CLIENT_SECRET`
- `FOLLOWUPBOSS_REDIRECT_URI`
- `FOLLOWUPBOSS_SCOPES`
- `FOLLOWUPBOSS_SYSTEM_NAME`
- `FOLLOWUPBOSS_SYSTEM_KEY`

Notes:

- `FOLLOWUPBOSS_SCOPES` can be blank if the OAuth app does not require explicit scopes.
- `FOLLOWUPBOSS_SYSTEM_NAME` and `FOLLOWUPBOSS_SYSTEM_KEY` are used for Follow Up Boss API requests with `X-System` headers.

## OAuth flow

SideKick uses the Follow Up Boss OAuth flow documented by Follow Up Boss:

- Authorization URL: `https://app.followupboss.com/oauth/authorize`
- Token URL: `https://app.followupboss.com/oauth/token`

Authorization request behavior:

- `response_type=auth_code`
- `client_id`
- `redirect_uri`
- `state`
- `prompt=login`
- `scope` only when configured

Token exchange behavior:

- `POST https://app.followupboss.com/oauth/token`
- HTTP Basic Auth with `client_id:client_secret`
- `application/x-www-form-urlencoded`
- `grant_type=authorization_code`
- `code`
- `redirect_uri`

Refresh behavior:

- `POST https://app.followupboss.com/oauth/token`
- HTTP Basic Auth
- `grant_type=refresh_token`
- `refresh_token`

## Account metadata

After token exchange, SideKick attempts a safe identity lookup against:

- `GET https://api.followupboss.com/v1/identity`

If identity lookup fails for a non-auth reason, SideKick can still save the connection with fallback metadata so the workspace is not blocked unnecessarily.

## Send Test Lead

Follow Up Boss test delivery uses:

- `POST https://api.followupboss.com/v1/events`

SideKick does not use `POST /v1/people` for the test flow because Follow Up Boss documents that `/events` is the correct lead-ingestion path for automation, routing, notifications, and duplicate handling.

Test event behavior:

- sends a fixed SideKick test lead
- includes `Authorization: Bearer <token>`
- includes `X-System`
- includes `X-System-Key`
- creates a lead-style event for the connected workspace

## Local testing

1. Set the Follow Up Boss env vars locally.
2. Start the app on `http://localhost:3000`.
3. Open `Workspace Settings -> Integrations -> Connect CRM`.
4. Connect Follow Up Boss.
5. Open the Follow Up Boss provider card.
6. Click `Send Test Lead`.

Expected result:

- SideKick shows `Test lead sent to Follow Up Boss.`

## Security notes

- OAuth tokens stay server-side only.
- Access tokens and refresh tokens are encrypted at rest.
- No Follow Up Boss secrets are exposed to the browser.
- SideKick does not log tokens, client secrets, auth codes, or auth headers.
- Test delivery is limited to authenticated global admins and workspace owners/admins.
