# Pipedrive OAuth for SideKick Studioss

## Callback URLs

- Production: `https://sidekickstudioss.com/api/integrations/pipedrive/callback`
- Local: `http://localhost:3000/api/integrations/pipedrive/callback`

## Required env vars

Add these server-side env vars:

```env
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=
```

Recommended values:

- Local `PIPEDRIVE_REDIRECT_URI`: `http://localhost:3000/api/integrations/pipedrive/callback`
- Production `PIPEDRIVE_REDIRECT_URI`: `https://sidekickstudioss.com/api/integrations/pipedrive/callback`

## Scopes

This flow relies on the scopes configured for the public Pipedrive app itself in the Pipedrive Developer Hub.

For this first OAuth connection pass, keep scopes limited to what SideKick needs to identify the connected account and support future CRM handoff work. A practical starting point is:

- `base`
- people or contacts write scopes only when you are ready to send leads into Pipedrive

## OAuth flow

1. User clicks `Connect Pipedrive` in Workspace Settings.
2. SideKick creates a signed workspace-scoped OAuth state value.
3. User is redirected to `https://oauth.pipedrive.com/oauth/authorize`.
4. Pipedrive redirects back to `PIPEDRIVE_REDIRECT_URI` with `code` and `state`.
5. SideKick exchanges the code server-side at `https://oauth.pipedrive.com/oauth/token`.
6. SideKick fetches current user/account metadata from Pipedrive.
7. The encrypted CRM connection is saved to the current workspace in Supabase.

## Local testing

1. Add local env vars in `.env.local`.
2. Set `PIPEDRIVE_REDIRECT_URI=http://localhost:3000/api/integrations/pipedrive/callback`.
3. Start the app locally.
4. Sign in to SideKick.
5. Open Workspace Settings → Integrations.
6. Click `Connect Pipedrive`.
7. Complete the Pipedrive OAuth flow.
8. Confirm you return to the workspace integrations screen with a connected state.

## Security notes

- `PIPEDRIVE_CLIENT_SECRET` stays server-only.
- Access and refresh tokens are never exposed to the browser.
- Tokens are stored through the existing encrypted CRM connection storage path.
- The flow is rate-limited on both connect and callback routes.
- OAuth state is signed and workspace-scoped before token exchange is allowed.
- Callback completion verifies the signed-in user still belongs to the target workspace.

## Current limitation

This v1 work adds the workspace OAuth connection cleanly without changing SideKick into a Pipedrive-native CRM flow. Pipedrive lead delivery can be added later on top of this connection layer.
