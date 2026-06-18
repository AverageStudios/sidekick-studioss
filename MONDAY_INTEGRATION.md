# Monday CRM Integration

## Overview

SideKick supports workspace-scoped monday.com OAuth connections for CRM verification and future handoff workflows.

Current v1 support includes:

- OAuth connect and callback
- secure encrypted token storage
- workspace-level board picker and manual board ID fallback
- `Send Test Lead` from `Workspace Settings -> Integrations`

## Environment variables

Add these server-side env vars:

```env
MONDAY_CLIENT_ID=
MONDAY_CLIENT_SECRET=
MONDAY_REDIRECT_URI=
MONDAY_SCOPES=me:read boards:read boards:write workspaces:read
```

Recommended redirect URIs:

- local: `http://localhost:3000/api/integrations/monday/callback`
- production: `https://sidekickstudioss.com/api/integrations/monday/callback`

## OAuth flow

SideKick uses the shared CRM OAuth architecture:

1. User clicks `Connect Monday`
2. SideKick sends them to monday OAuth
3. monday redirects back to the SideKick callback
4. SideKick exchanges the code server-side
5. Tokens are stored encrypted against the current workspace

OAuth routes:

- connect: `/api/integrations/monday/connect`
- callback: `/api/integrations/monday/callback`
- shared callback bridge: `/api/integrations/crm/callback`

## Required scopes

Recommended monday scopes for v1:

- `me:read`
- `boards:read`
- `boards:write`
- `workspaces:read`

These scopes let SideKick:

- verify the connected monday user
- verify board access
- create a simple board item for the CRM test flow

## Board setup

After OAuth connects, go to:

- `Workspace Settings -> Integrations -> Monday CRM`

Then:

1. click `Load Boards`
2. choose a board from the picker
3. click `Save Board`
4. click `Send Test Lead`

If board loading is unavailable, you can still:

1. paste the monday board ID manually
2. click `Save Board`
3. click `Send Test Lead`

SideKick stores these board details on the monday workspace connection metadata:

- board ID
- board name
- monday workspace name when available

## Finding a board ID manually

If you need the manual fallback, monday board URLs include the board ID.

Example shape:

- `https://youraccount.monday.com/boards/123456789`

In that case the board ID is:

- `123456789`

## Board picker behavior

The board picker loads accessible boards server-side only.

It shows:

- board name
- board ID
- monday workspace name when available

If boards cannot be loaded, SideKick shows:

- `Could not load monday boards. You can paste a board ID manually.`

If no board is saved yet, SideKick shows:

- `Choose a monday board before sending a test lead.`

If a board is already saved, SideKick shows:

- `Selected board: {board name}`

Then:

1. click `Load Boards`
2. choose a board from the picker or paste a board ID manually
3. click `Save Board`
3. click `Send Test Lead`

If the board cannot be reached, SideKick shows a safe user-facing error instead of exposing provider details.

## Test lead behavior

The monday CRM test flow creates a simple item on the configured board.

Test payload:

- Name: `SideKick Test Lead`
- Email: `test+sidekick@sidekickstudioss.com`
- Phone: `555-010-2026`
- Source: `SideKick CRM Delivery Test`

Success message:

- `Test lead sent to Monday CRM.`

Board access error:

- `SideKick could not access that monday board. Check the board ID and permissions.`

Missing board error:

- `Add a monday board ID before sending a test lead.`

## Security notes

- monday tokens stay server-side only
- tokens are encrypted before database storage
- no token values are returned to the browser
- no token values are logged
- only workspace owners, workspace admins, or global admins can send test leads
- rate limiting is applied to OAuth and test-delivery flows

## Local testing

1. set the monday env vars locally
2. start the app on `http://localhost:3000`
3. open `Workspace Settings -> Integrations`
4. connect Monday CRM
5. save a valid board ID
6. click `Send Test Lead`

## Troubleshooting

If OAuth does not start:

- confirm `MONDAY_CLIENT_ID`
- confirm `MONDAY_REDIRECT_URI`
- confirm the monday app allows the local or production callback URL

If the test fails:

1. reconnect Monday CRM
2. confirm the saved board or pasted board ID is correct
3. confirm the connected monday user can read and write that board
4. retry from the same workspace
