# Salesforce Integration

## Overview

SideKick supports workspace-scoped Salesforce OAuth for CRM connectivity and manual CRM verification.

Current v1 support includes:

- OAuth connect and callback
- encrypted access token and refresh token storage
- server-side token refresh
- `Send Test Lead` from `Workspace Settings -> Integrations`

## Environment variables

Add these server-side env vars:

```env
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_REDIRECT_URI=
SALESFORCE_SCOPES=api refresh_token
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_API_VERSION=v61.0
```

Recommended redirect URIs:

- local: `http://localhost:3000/api/integrations/salesforce/callback`
- production: `https://sidekickstudioss.com/api/integrations/salesforce/callback`

## OAuth setup

Create a Salesforce Connected App and configure:

- Consumer Key as `SALESFORCE_CLIENT_ID`
- Consumer Secret as `SALESFORCE_CLIENT_SECRET`
- callback URL matching `SALESFORCE_REDIRECT_URI`

SideKick routes:

- connect: `/api/integrations/salesforce/connect`
- callback: `/api/integrations/salesforce/callback`
- shared callback handling: `/api/integrations/crm/callback`

## Scopes

Recommended Salesforce scopes:

- `api`
- `refresh_token`

Optional if your Salesforce app setup expects it:

- `offline_access`

`api` is required for Lead creation. `refresh_token` lets SideKick refresh the workspace token without asking the user to reconnect every time the access token rotates.

## Token and instance behavior

Salesforce returns an `instance_url` with the token response. SideKick stores that server-side and uses it for later REST API calls.

SideKick also stores safe account metadata when available, such as:

- org name
- org id
- instance host
- identity URL

## Send Test Lead

The Salesforce test delivery creates a Lead using:

- `POST {instance_url}/services/data/{apiVersion}/sobjects/Lead`

Test payload:

- `FirstName`: `SideKick`
- `LastName`: `Test Lead`
- `Company`: `SideKick Studioss Test`
- `Email`: `test+sidekick@sidekickstudioss.com`
- `Phone`: `555-010-2026`
- `LeadSource`: `SideKick CRM Delivery Test`

Success message:

- `Test lead sent to Salesforce.`

Validation failure message:

- `Salesforce rejected the test lead because a required Lead field is missing.`

Permission failure message:

- `Salesforce rejected the test lead because SideKick does not have the required API permissions.`

## Security notes

- access tokens stay server-side only
- refresh tokens stay server-side only
- tokens are encrypted before persistence
- no token values are logged
- no token values are returned to the browser
- workspace auth and role checks run before CRM test delivery
- rate limits apply to OAuth and test delivery flows

## Local testing

1. set the Salesforce env vars locally
2. run the app on `http://localhost:3000`
3. open `Workspace Settings -> Integrations`
4. click `Connect Salesforce`
5. finish the Salesforce OAuth flow
6. click `Send Test Lead`

## Troubleshooting

If Salesforce does not connect:

1. confirm `SALESFORCE_CLIENT_ID`
2. confirm `SALESFORCE_CLIENT_SECRET`
3. confirm `SALESFORCE_REDIRECT_URI`
4. confirm the redirect URI is registered in the Salesforce Connected App
5. confirm the Connected App includes API access and refresh-token access

If the test lead fails:

1. reconnect Salesforce
2. confirm the workspace is the one you connected
3. retry after reconnect if the token has expired
4. if Salesforce validation rejects the lead, check required fields on the Lead object in that org
