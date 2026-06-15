# HubSpot Integration

## Overview

SideKick connects HubSpot at the workspace level using OAuth.

This replaces the older manual private-token testing path. Existing manual HubSpot token records should be treated as reconnect-required so each workspace ends up with a real OAuth access token and refresh token pair.

## Callback URLs

- Production: `https://sidekickstudioss.com/api/integrations/hubspot/callback`
- Local: `http://localhost:3000/api/integrations/hubspot/callback`

## Required env vars

```env
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_REDIRECT_URI=
HUBSPOT_SCOPES=oauth crm.objects.contacts.read crm.objects.contacts.write
```

## Required scopes

- `oauth`
- `crm.objects.contacts.read`
- `crm.objects.contacts.write`

Why:

- `oauth` is required for the install flow
- `crm.objects.contacts.read` supports account/contact access patterns SideKick may need
- `crm.objects.contacts.write` is required for test delivery and contact upsert

## How the flow works

1. User clicks `Connect HubSpot` in Workspace Settings.
2. SideKick creates a signed workspace-scoped OAuth state value.
3. User is redirected to HubSpot OAuth authorization.
4. HubSpot returns an authorization code to the callback route.
5. SideKick exchanges the code server-side for:
   - access token
   - refresh token
6. SideKick validates the account and stores the encrypted tokens in Supabase for the workspace.

## Test delivery

After a successful OAuth connection, SideKick can send a test contact to HubSpot:

- Email: `test+sidekick@sidekickstudioss.com`
- First name: `SideKick`
- Last name: `Test Lead`
- Phone: `555-010-2026`

Expected success message:

- `Test contact sent to HubSpot.`

## Migration note

If a workspace still has an older manual/private-token HubSpot connection:

- SideKick should treat it as needing reconnect
- users should reconnect HubSpot through OAuth
- old private-token records are not automatically migrated

## Local test steps

1. Add the HubSpot env vars to `.env.local`
2. Set:
   - `HUBSPOT_REDIRECT_URI=http://localhost:3000/api/integrations/hubspot/callback`
3. Start the app locally
4. Sign in
5. Open `Workspace Settings -> Integrations`
6. Click `Connect HubSpot`
7. Finish the HubSpot OAuth flow
8. After redirect back, click `Send Test Lead`

## Security notes

- client secret stays server-only
- access tokens and refresh tokens are stored encrypted
- tokens are never exposed to the browser
- no raw token values are logged
- test delivery is protected by auth, workspace role checks, and rate limiting
