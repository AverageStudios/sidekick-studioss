# CRM Test Delivery

## Overview

SideKick includes a reusable `Send Test Lead` flow inside:

- `Workspace Settings -> Integrations`

This is a private verification tool for supported CRM integrations. It lets a workspace owner or admin confirm that SideKick can create a real test record in the connected CRM without exposing tokens to the browser.

## Who can use it

Only these users can send CRM test leads:

- global SideKick admins
- workspace owners
- workspace admins

Regular workspace members can see CRM connection status but cannot trigger test delivery.

## Supported providers

Current launch-visible test-delivery support:

- Pipedrive
- Zoho CRM
- Monday CRM
- Keap
- Close CRM

Not available yet:

- future CRM providers until a provider-specific helper is implemented
- additional hidden providers that are not part of the public launch picker yet

## Test lead payload

All supported providers use the same test lead details:

- Name: `SideKick Test Lead`
- Email: `test+sidekick@sidekickstudioss.com`
- Phone: `555-010-2026`
- Source: `SideKick CRM Delivery Test`
- Note: `Created by SideKick Studioss to verify the CRM integration.`

## What gets created

### Pipedrive

Creates:

- Person
- Lead in the Leads Inbox

Success message:

- `Test lead sent to Pipedrive Leads Inbox.`

### Zoho CRM

Creates:

- Lead

Required Zoho scopes:

- `ZohoCRM.modules.Leads.CREATE`
- `ZohoCRM.modules.Leads.READ`
- `ZohoCRM.modules.Leads.UPDATE`
- `ZohoCRM.org.READ`

Success message:

- `Test lead sent to Zoho CRM.`

### Monday CRM

Creates:

- Board item on the configured monday board

Required monday scopes:

- `me:read`
- `boards:read`
- `boards:write`
- `workspaces:read`

Additional requirement:

- a monday board must be selected and saved in `Workspace Settings -> Integrations`
- manual board ID paste is still available as a fallback if the picker cannot load boards

Success message:

- `Test lead sent to Monday CRM.`

### Keap

Creates:

- Contact

Required Keap scope:

- `full`

Success message:

- `Test contact sent to Keap.`

Connection requirement:

- Keap must be connected through OAuth
- SideKick stores and refreshes Keap OAuth tokens server-side

### Close CRM

Creates:

- Lead
- nested Contact details on that lead

Required Close scopes:

- `all.full_access`
- `offline_access`

Success message:

- `Test lead sent to Close CRM.`

Connection requirement:

- Close CRM must be connected through OAuth
- SideKick stores and refreshes Close OAuth tokens server-side

## Security notes

- CRM access tokens stay server-side only
- encrypted CRM tokens are decrypted only on the server
- no token values are returned to the client
- no token values are logged
- no public API route is used for test delivery
- rate limiting is applied per user, workspace, and provider
- service-role access is only used after auth and workspace role checks pass

## Rate limiting

Test delivery is limited to:

- `5 requests / hour`
- keyed by user + provider action scope

## Troubleshooting

If test delivery fails:

1. Confirm the CRM shows `Connected`
2. Reconnect the CRM from Workspace Settings
3. Confirm the correct workspace is active
4. Confirm you are a workspace owner/admin or a global admin
5. Retry after a minute if the provider recently refreshed tokens

If the provider is connected but the UI does not show a test button:

1. Confirm the provider supports test delivery
2. Confirm your workspace role is `owner` or `admin`

If the provider is unsupported:

- the UI should say `Test delivery is not available yet`

For launch, the public CRM picker only shows:

- Pipedrive
- Zoho CRM
- Monday CRM
- Keap
- Close CRM

Additional CRMs like HubSpot, GoHighLevel, Salesforce, Follow Up Boss, Freshsales, and Nutshell can be requested or added later.

## Future expansion

To add a new provider:

1. implement a provider helper such as `sendHubSpotTestLead(...)`
2. return the shared normalized test result shape
3. register the provider in the shared CRM test dispatch function
4. the Workspace Settings UI can then use the same `Send Test Lead` pattern
