# Security Gitignore Secret Audit

Final repository hygiene pass for `.gitignore` coverage and secret exposure review.

## Status

- `.gitignore` coverage: improved
- `.env.example`: safe to track
- real secret values found in tracked source: none confirmed in this pass
- tracked artifact risk found: yes, historical `UPHEX-PREVIEW/` export was tracked and is currently pending deletion from git

## .gitignore Coverage Summary

The ignore rules now cover:

### Environment / secrets

- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `.env.*`
- `!.env.example`
- `*.pem`
- `*.key`
- `*.crt`
- `*.p12`
- `*.pfx`

### Dependencies

- `node_modules/`
- `.pnpm-store/`
- `.npm/`
- `.yarn/`

### Next / Vercel / build

- `.next/`
- `out/`
- `build/`
- `dist/`
- `.vercel/`
- `next-env.d.ts`

### Logs / debug

- `npm-debug.log*`
- `yarn-debug.log*`
- `yarn-error.log*`
- `.pnpm-debug.log*`
- `*.log`
- `logs/`

### Coverage / testing / cache

- `coverage/`
- `.nyc_output/`
- `playwright-report/`
- `test-results/`
- `.turbo/`
- `.cache/`
- `.eslintcache`
- `*.tsbuildinfo`
- `tsconfig.tsbuildinfo`

### OS / editor

- `.DS_Store`
- `Thumbs.db`
- `.vscode/`
- `.idea/`

### Generated / preview / export artifacts

- `*-PREVIEW/`
- `*-EXPORT/`
- `UPHEX-PREVIEW/`

### Uploads / local storage / temp

- `uploads/`
- `tmp/`
- `temp/`
- `.tmp/`
- `local-storage/`
- `supabase/.branches/`
- `supabase/.temp/`

## .env.example Tracking Decision

- `.env.example` contains placeholder values only
- it should be tracked as documentation
- `.gitignore` was updated to allow tracking via `!.env.example`

## Secret Sweep Results

### Confirmed outcome

- no confirmed live API keys, service-role tokens, webhook secrets, private keys, or OAuth client secrets were identified in tracked source during this pass

### Pattern review notes

The sweep found several pattern matches that appear to be code or documentation references, not exposed secret values:

- `README.md`
  - env variable names only
- `SECURITY_*` docs
  - variable names and security guidance only
- `lib/env.ts`
  - server env variable lookups only
- `lib/meta.ts`
  - provider request parameter names such as `client_secret` and `fb_exchange_token`
- `lib/crm-integration.ts`
  - OAuth request field names such as `client_secret`

False-positive examples in the broad scan were caused by normal strings such as:

- `before_images_json`
- `more_volume`
- image metadata field names like `profile_picture_url`

These do not appear to be secret material.

## Tracked File Check

### Env files

Tracked in git:

- `.env`: not tracked
- `.env.local`: not tracked
- `.env.production`: not tracked
- `.env.production.local`: not tracked
- `.env.example`: currently not tracked, but now safe and allowed to be tracked

### Sensitive/build/artifact files

Currently tracked or historically tracked:

- `UPHEX-PREVIEW/`
  - previously tracked export artifact
  - now ignored
  - currently shows as deleted in git status and should be committed as a removal

Not found as tracked in this pass:

- build output under `.next/`, `out/`, `build/`, `dist/`
- log files
- private key / cert files
- local env files

## Files / Patterns Added To .gitignore

- `node_modules/`
- `/.pnpm-store/`
- `/.npm/`
- `coverage/`
- `.nyc_output/`
- `playwright-report/`
- `test-results/`
- `.next/`
- `out/`
- `build/`
- `dist/`
- `Thumbs.db`
- `*.key`
- `*.crt`
- `*.p12`
- `*.pfx`
- `UPHEX-PREVIEW/`
- `uploads/`
- `tmp/`
- `temp/`
- `.tmp/`
- `local-storage/`
- `*.log`
- `logs/`
- `!.env.example`
- `.turbo/`
- `.cache/`
- `.eslintcache`
- `supabase/.branches/`
- `supabase/.temp/`
- `.vscode/`
- `.idea/`
- `tsconfig.tsbuildinfo`

## Manual Removal / History Notes

- `UPHEX-PREVIEW/` should be committed as a deletion so it is no longer present in the repository state.
- No confirmed real secret was found that would require immediate git history rewriting from this pass alone.

If a provider secret was ever committed in an earlier history revision outside the current working tree, rotate it in the provider dashboard and then evaluate whether history rewriting is warranted.

## Rotation Recommendations

- No mandatory rotation was triggered by a confirmed exposed secret in this pass.
- Continue standard rotation hygiene for:
  - Supabase service role key
  - Meta app secret
  - GoHighLevel client secret
  - Upstash Redis token
  - Resend API key
  if any of them were ever shared outside approved secret stores.

## Final Status

Pass, with one cleanup action still pending:

- commit the existing `UPHEX-PREVIEW/` deletions so the tracked artifact is fully removed from the repo
