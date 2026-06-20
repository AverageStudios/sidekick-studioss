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

- Pipedrive
- Zoho CRM
- Monday CRM
- Keap
- Close CRM

Hidden from the current selection UI for now:

- GoHighLevel
- HubSpot
- Freshsales / Freshworks CRM
- Follow Up Boss
- Salesforce
- Nutshell

Those providers still exist in the backend and existing workspace connections are preserved.

Additional CRMs like HubSpot, GoHighLevel, Salesforce, Follow Up Boss, Freshsales, and Nutshell can be requested or added later.

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

If a hidden provider is already connected for a workspace, SideKick can still open its manage state directly without showing it in the main visible selection grid.

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

This flow uses local provider logo assets stored in:

- `public/crm-logos/`

The assets were pulled from official provider-owned sources and stored locally so the UI does not depend on external hotlinks at runtime.

If a provider does not yet have a local logo asset, SideKick falls back to a clean provider letter badge instead of an external hotlink.

## Security notes

- provider tokens stay server-side only
- encrypted provider storage is unchanged
- no new public write endpoints were added
- OAuth routing and token handling remain unchanged
- CRM test delivery still requires authenticated admin or workspace owner/admin access

## Request CRM

The CRM page now includes a `Request a CRM` form.

Authenticated users can submit:

- CRM name
- optional use case message

SideKick sends that request server-side to:

- `contact@sidekickstudioss.net`

The request is rate limited and includes the requesting user email plus workspace context when available.
