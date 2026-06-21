# Loading States Audit

## Added or verified

- Campaign detail actions
  - Pause: pending label and disabled submit
  - Resume: pending label and disabled submit
  - Delete: pending label and disabled submit
  - Refresh Meta status: pending label and disabled submit
- Campaign launch flow
  - Save draft: pending label already present and double-submit guarded
  - Launch campaign: pending label already present and double-submit guarded
  - Reconnect Facebook: pending navigation feedback added
- Draft campaign management
  - Draft delete from drafts page: deleting state added
  - Draft delete from performance page: deleting state added
- CRM actions
  - Connect / reconnect / manage navigation in CRM cards: pending navigation feedback added
  - Disconnect CRM: disconnecting state added
  - Send Test Lead: sending state added
  - Monday pasted board save: saving label added
  - Retry failed CRM deliveries: retrying state added
  - Retry single CRM delivery: retrying state added
- Workspace settings
  - Save general settings: saving state added
  - Save icon settings: saving state added
  - Meta connect / reconnect: connecting state added
  - Meta refresh assets: refreshing state added
  - Meta disconnect: disconnecting state added
  - Meta sync recent leads: syncing state added
  - Meta backfill leads: backfilling state added
  - Save Meta selections: saving state added
  - Connect CRM library entry: opening state added
- Auth and account
  - Auth submit button uses pending state
  - Google sign-in already had connecting state
  - Account delete / cancel subscription confirmation actions use pending submit state
- Support
  - New ticket submit: submitting state added
  - Reply to ticket: sending state added
- Public forms
  - Public lead form submit: sending state added
- Workspace creation
  - Create workspace: creating state added
- Legacy template setup form
  - Save draft: saving state added
  - Create and launch: launching state added

## Existing good patterns reused

- `useFormStatus` for server-action forms
- `useTransition` for client-triggered async actions
- existing launch flow pending states in template launch wizard
- existing CRM request card pending state

## Small reusable helpers added

- `components/ui/async-submit-button.tsx`
- `components/ui/pending-link-button.tsx`

## Still worth future polish

- App shell workspace switcher and logout menu still use plain form buttons
- Admin template library forms and media uploads could use the shared pending button
- Profile/workspace image direct upload interactions could use more explicit item-level pending/success copy
- Some older pages still rely on redirect-driven success states instead of inline success confirmations

## Notes

- This pass focused on preventing “looks stuck” moments, double submits, and silent async actions without redesigning page layouts or changing business logic.
