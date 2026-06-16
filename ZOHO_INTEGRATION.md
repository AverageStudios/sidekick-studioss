# Zoho CRM Integration

## Overview

SideKick supports a workspace-scoped Zoho CRM OAuth connection for:

- connecting a workspace to Zoho CRM
- storing encrypted OAuth tokens server-side
- sending a manual `Send Test Lead` verification lead from Workspace Settings

This integration is designed so each SideKick workspace connects its own Zoho CRM account without exposing tokens to the browser.

## Zoho API Console setup

Create the Zoho app as:

- Client type: `Server-based Applications`

Add these redirect URLs:

- Local: `http://localhost:3000/api/integrations/zoho/callback`
- Production: `https://sidekickstudioss.com/api/integrations/zoho/callback`

## Required env vars

Add these server-only env vars:

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REDIRECT_URI`
- `ZOHO_ACCOUNTS_URL`
- `ZOHO_SCOPES`

Suggested values:

```env
ZOHO_REDIRECT_URI=https://sidekickstudioss.com/api/integrations/zoho/callback
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_SCOPES=ZohoCRM.modules.Leads.CREATE ZohoCRM.modules.Leads.READ ZohoCRM.modules.Leads.UPDATE ZohoCRM.users.READ ZohoCRM.org.READ
```

For local development:

```env
ZOHO_REDIRECT_URI=http://localhost:3000/api/integrations/zoho/callback
```

## Required scopes

SideKick currently requests:

- `ZohoCRM.modules.Leads.CREATE`
  Needed to create the test lead and future CRM handoff leads.
- `ZohoCRM.modules.Leads.READ`
  Needed for lead object access and validation-safe follow-up reads if required later.
- `ZohoCRM.modules.Leads.UPDATE`
  Keeps the token ready for future lead upsert/update behavior.
- `ZohoCRM.users.READ`
  Useful for future user/account context support.
- `ZohoCRM.org.READ`
  Needed to validate the connected CRM org and store safe workspace metadata.

## OAuth flow

SideKick uses:

- Connect route: `/api/integrations/zoho/connect`
- Callback route: `/api/integrations/zoho/callback`

Flow:

1. User clicks `Connect Zoho` in Workspace Settings.
2. SideKick creates a signed workspace-scoped OAuth state.
3. User is redirected to the Zoho authorization screen.
4. Zoho redirects back with an authorization code.
5. SideKick exchanges the code server-side for tokens.
6. SideKick stores encrypted tokens in the workspace CRM connection record.
7. SideKick stores safe metadata such as org ID, org name, `api_domain`, and `accounts-server` when available.

## Region and api_domain note

Zoho may return an `api_domain` in the token response. SideKick stores and uses that domain for CRM API calls.

If Zoho does not return `api_domain`, SideKick falls back to:

- `https://www.zohoapis.com`

Zoho can also use different accounts servers by data center. SideKick captures `accounts-server` from the callback when available so token refresh stays aligned with the connected Zoho region.

## Send Test Lead

Workspace owners, workspace admins, and global SideKick admins can use:

- `Workspace Settings -> Integrations -> Zoho CRM -> Send Test Lead`

The test creates a Zoho CRM Lead with:

- `First_Name = SideKick`
- `Last_Name = Test Lead`
- `Email = test+sidekick@sidekickstudioss.com`
- `Phone = 555-010-2026`
- `Lead_Source = SideKick CRM Delivery Test`
- `Company = SideKick Studioss Test`

Success message:

- `Test lead sent to Zoho CRM.`

## Local testing steps

1. Add the Zoho env vars locally.
2. Confirm `ZOHO_REDIRECT_URI` matches the local redirect configured in Zoho.
3. Sign in to SideKick.
4. Open `Workspace Settings -> Integrations`.
5. Click `Connect Zoho`.
6. Finish the Zoho authorization flow.
7. Confirm the card shows `Connected`.
8. Click `Send Test Lead`.
9. Confirm the lead appears in Zoho CRM Leads.

## Troubleshooting

If connection fails:

1. Confirm the redirect URI exactly matches the value configured in the Zoho API Console.
2. Confirm the app is a `Server-based Applications` client.
3. Confirm all required scopes are present.
4. Confirm `ZOHO_ACCOUNTS_URL` matches the correct Zoho accounts region if using a non-default data center.

If test delivery fails:

1. Reconnect Zoho CRM.
2. Confirm the active workspace is the one you connected.
3. Confirm your role is workspace owner/admin or global admin.
4. Confirm the connected Zoho user has permission to create Leads in that CRM org.

## Security notes

- Zoho client secrets stay server-side only.
- OAuth access and refresh tokens are stored encrypted at rest.
- Tokens are never returned to the browser.
- Tokens are not logged.
- Workspace membership is verified before the callback persists the connection.
- Test delivery is server-side only and rate limited.
