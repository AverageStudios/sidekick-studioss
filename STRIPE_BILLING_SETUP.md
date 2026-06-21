# Stripe Billing Setup

SideKick uses user-level billing.

- Plan: `SideKick Core`
- Price: `$97/month`
- Trial: `14 days`
- Payment method required up front
- Unlimited workspaces included

## Environment variables

Set these in local env and Vercel:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

## Stripe Dashboard setup

1. Create a product named `SideKick Core`.
2. Create a recurring monthly price for `$97/month`.
3. Copy that price ID into `STRIPE_PRICE_ID`.
4. Turn on the Stripe Customer Portal.
5. In the portal, allow cancelation and payment method management.
6. Create a webhook endpoint pointing to:
   - Local: `http://localhost:3000/api/stripe/webhook`
   - Production: `https://sidekickstudioss.com/api/stripe/webhook`
7. Subscribe the webhook to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

## Notes

- Billing attaches to the authenticated user account, not to workspaces.
- One paid user unlocks SideKick access across all of their workspaces.
- Ad spend is billed separately by Meta.
- Future: add agency/team pricing if unlimited workspaces needs to be monetized separately.
