# CRM Provider Selection

## Overview

SideKick now uses a cleaner CRM connection flow:

- `Workspace Settings -> Integrations` shows a CRM summary
- `Connect CRM` opens the dedicated CRM provider library
- provider-specific management lives on the CRM selection page

Route:

- `/workspace/settings/integrations/crm`

## What changed

The integrations settings page no longer shows a long stack of provider cards for every CRM.

Instead it shows:

- connected CRM summaries
- a primary `Connect CRM` button
- a compact handoff summary
- recent delivery activity

## Provider selection page

The CRM provider page shows cards for:

- GoHighLevel
- Pipedrive
- HubSpot
- Zoho CRM
- Freshsales / Freshworks CRM
- Monday CRM
- Keap
- Salesforce

Each card includes:

- provider mark
- provider name
- short description
- status badge
- connect, manage, or reconnect action

## Manage behavior

Connected providers can be managed from:

- `/workspace/settings/integrations/crm?provider={provider}`

That expanded manage state keeps existing actions available, including:

- reconnect
- disconnect
- `Send Test Lead`

Monday CRM also keeps:

- board picker
- manual board ID fallback

## Status meanings

- `Connected`: provider is connected and ready
- `Not connected`: provider has no active workspace connection
- `Needs setup`: provider is connected but still needs follow-up setup
- `Setup required`: SideKick env/OAuth setup is not configured for that provider

Current `Needs setup` examples:

- HubSpot connected through an older manual token instead of OAuth
- Monday connected without a selected board

## Logos and icons

This flow uses local text-based provider marks instead of remote logos.

Examples:

- `GHL`
- `PD`
- `HS`
- `ZO`
- `FS`
- `M`
- `K`
- `SF`

This keeps the UI polished without adding remote asset dependencies.

## Security notes

- provider tokens stay server-side only
- encrypted provider storage is unchanged
- no new public write endpoints were added
- OAuth routing and token handling remain unchanged
- CRM test delivery still requires authenticated admin or workspace owner/admin access
