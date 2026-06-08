# Tool Use and Research Warning

Codex must use available tools intelligently. Research official docs before changing code that depends on current SDKs/APIs such as Apple MapKit, SwiftUI, SwiftData, Supabase, PostHog, Sentry, XcodeGen, TestFlight, App Store Connect, Next.js, Vercel, Cloudflare, or other third-party platforms. Plan before coding. Use repo search before editing. Use shell to build/test. Use browser only when useful. Use computer use only for UI/Xcode/simulator verification when needed. Do not use tools for billing/payment pages or sensitive account areas.

If a tool is unavailable, say so. Do not pretend to have used it. Do not guess APIs or rules without verification when verification is available.

# Financial Safety Warning

Codex must never access, use, edit, add, remove, or view my payment methods or billing pages. Codex must never buy, subscribe, upgrade, start a paid trial, activate billing, enable paid APIs, create paid products, charge cards, refund payments, connect bank/payout accounts, or spend money.

For any action that could cost money, Codex must stop and wait until I write exactly:

`I approve this paid action.`

localtradings.com has no payments, no ads, no subscriptions, no premium gating, no paid API activation, no Stripe, no Apple In-App Purchases, no Google Play Billing, no billing tables, and no checkout. Codex may only provide manual instructions or safe free-tier setup guidance.

# Payment Safety Warning

localtradings.com has no payments, no ads, and no premium gating. Codex must not add payment SDKs, Stripe, Apple In-App Purchase, subscriptions, paid plans, upgrade buttons, billing tables, live checkout, refunds, payouts, or pricing changes unless I explicitly say:

`I approve this real payment/billing action.`

Any payment work must default to sandbox/test mode and planning only. Never commit live payment secrets, webhook secrets, App Store private keys, bank details, tax IDs, or card data.

# Database Safety Warning

Codex must never delete, reset, truncate, drop, wipe, overwrite, or destructively modify any database, table, schema, storage bucket, auth users, seed data, or production/staging data unless I explicitly say:

`I approve this destructive database action.`

Before any database operation, Codex must identify the target environment, database/project, affected tables, operation type, whether it is destructive, whether a backup exists, and whether RLS or service role keys are involved.

If anything is unknown, stop and ask. Treat unknown remote databases as production. Never run `supabase db reset`, `DROP`, `TRUNCATE`, or unsafe `DELETE/UPDATE` commands without explicit approval.

# Critical Database Safety Rules

## Absolute Rule

Never delete, reset, truncate, drop, wipe, overwrite, or destructively modify any database, table, schema, bucket, auth user list, storage object, production data, staging data, or seed data unless I explicitly request that exact destructive action in the current chat.

If there is any uncertainty, stop and ask before doing anything.

## Forbidden Actions Without Explicit Approval

Codex must NOT run or generate commands like these unless I explicitly approve them:

- `DROP DATABASE`
- `DROP SCHEMA`
- `DROP TABLE`
- `TRUNCATE`
- `DELETE FROM` without a safe `WHERE`
- `DELETE FROM` affecting all rows
- `UPDATE` without a safe `WHERE`
- `supabase db reset`
- `supabase db push --include-all`
- `supabase migration repair`
- `supabase db diff` followed by destructive migration
- `prisma migrate reset`
- `rails db:reset`
- `rails db:drop`
- `sequelize db:migrate:undo:all`
- deleting Supabase Storage buckets
- deleting Auth users
- deleting production rows
- replacing production seed data
- overwriting `.env`, `.env.production`, `.env.local`, `.xcconfig`, or config files containing real values
- running scripts that modify remote Supabase data unless approved

## Production and Remote Database Protection

Treat every remote database as production unless clearly proven otherwise.

Before touching any database, Codex must identify the environment, database/project, operation type, backup status, safe limits/WHERE clauses, and whether RLS or service role keys are involved.

If the environment is unknown, assume it is production and do not proceed.

## Migration Rules

Migrations must be additive by default.

Allowed without special approval:

- `CREATE TABLE`
- `CREATE INDEX`
- `ALTER TABLE ADD COLUMN`
- `ALTER TABLE ADD CONSTRAINT`
- `CREATE POLICY`
- `CREATE VIEW`
- adding non-destructive seed data
- safe inserts/upserts with natural keys

Requires explicit approval:

- dropping tables
- dropping columns
- renaming columns
- changing column types
- deleting records
- truncating records
- changing RLS policies in a way that exposes data
- disabling RLS
- deleting storage files
- modifying Auth users

## Supabase-Specific Rules

Never put the Supabase service role key in iOS apps, Swift files, `.xcconfig`, committed `.env`, frontend code, or public GitHub repositories.

The service role key may only be used in trusted local scripts or backend environments, and only when I explicitly approve the exact operation.

Never run seed/import scripts against a remote Supabase project unless I confirm the target project, environment, script name, expected tables affected, and whether the operation is insert-only, upsert, update, or delete.

## Data Deletion Rule

If a task requires deleting data, Codex must stop and show me the exact data, SQL/command/script, target environment, backup/rollback plan, safer alternative, and a confirmation prompt.

Do not proceed until I reply with:

`I approve this destructive database action.`

No other wording counts as approval.

## Safe SQL Rules

Every `UPDATE` or `DELETE` must have a specific `WHERE` clause, expected affected row count, and a preview/select query first.

Before any update/delete, generate a preview query:

```sql
SELECT * FROM table_name WHERE condition;
```

# Financial Account and Payment Access Safety Rules

## Absolute Rule

Codex must never access, use, edit, create, test, connect, authorize, subscribe, upgrade, purchase, pay, charge, refund, transfer, withdraw, or spend money using any of my accounts.

This includes personal accounts, business accounts, developer accounts, cloud accounts, payment accounts, bank accounts, app store accounts, and subscription accounts.

Codex must not perform any action that could cost money unless I explicitly approve the exact action in the current chat.

## Required Approval Phrase

For any action that could cost money, Codex must stop and wait until I write exactly:

`I approve this paid action.`

No other wording counts as approval.

## Forbidden Without Explicit Approval

Codex must NOT buy, subscribe, upgrade, start a paid trial, activate billing, add/edit/remove/view payment methods, use Apple Pay/Google Pay/PayPal/Stripe live mode, connect bank or payout accounts, create/pay/refund invoices, change pricing or tax settings, enable paid APIs or cloud services, upgrade paid service plans, create real paid products/subscriptions, deploy anything that can charge users, or deploy anything that can charge me.

## Account Access Rule

Codex must not log in to, open, modify, or configure billing/payment pages for any service. Codex may only provide instructions for me to do these manually.

Billing/payment pages include Apple Developer billing, App Store Connect agreements/banking/tax, Supabase billing, Vercel billing, Cloudflare billing, Google Cloud billing, AWS billing, Azure billing, OpenAI billing, PostHog billing, Sentry billing, Stripe dashboard, PayPal dashboard, RevenueCat dashboard, bank portals, credit card portals, and subscription management pages.

## Payment Method Protection

Codex must never request, read, store, print, log, copy, screenshot, or use card data, CVV, expiration dates, billing addresses, bank details, payment credentials, Stripe live keys, webhook signing secrets, App Store Connect API private keys, tax IDs, payout information, or invoices containing sensitive billing data.

If payment information appears in a file, screenshot, terminal output, browser page, or tool response, Codex must ignore it and must not repeat it.

## Free-Tier Safety Rule

Codex may use or configure free-tier services only if doing so does not require adding a payment method, activating billing, starting a paid trial, or risking automatic charges.

If a free tier requires a credit card or can auto-upgrade/auto-charge, Codex must stop and ask first.

## Cloud and API Cost Rule

Codex must treat AI APIs, map/geocoding APIs, email/SMS APIs, push notifications, cloud functions, hosting, database upgrades, storage/CDN bandwidth, analytics overages, monitoring overages, build minutes, image generation APIs, OCR APIs, and scraping/search APIs as potentially paid.

Before enabling any of these, Codex must state the service name, billing requirement, free tier, payment method requirement, possible charges, disable path, and safer free alternative, then wait for approval.

## Safe Allowed Actions

Codex may write setup instructions, create checklists, create placeholder config keys, write documentation for manual key setup, write sandbox/test-only code with no real billing, explain pricing from public docs, and warn about possible costs.

Codex must not actually perform paid actions.

# Codex Tool, Research, Planning, and Debugging Rules

Codex must use the best available tools, skills, plugins, and workflows only when useful for the task. Do not use tools randomly. Use tools to improve accuracy, verify assumptions, test behavior, debug issues, inspect UI, and reduce mistakes.

Before implementing work that depends on current APIs, frameworks, SDKs, Apple rules, Supabase, PostHog, Sentry, MapKit, TestFlight, Xcode, SwiftUI, Vercel, Cloudflare, Next.js, or third-party packages, research or verify current official documentation first when browser/web access is available.

Prefer official/primary sources first: Apple Developer documentation, Supabase documentation, OpenAI/Codex documentation, PostHog documentation, Sentry documentation, Vercel documentation, Cloudflare documentation, official GitHub repositories, package README/release notes, and trusted issue discussions only when official docs are insufficient.

For any non-trivial task, plan before coding. Include goal, files to create/modify, technical approach, data/schema impact, privacy/security impact, tool usage, tests, risks/blockers, and what is explicitly out of scope.

Before writing code, check likely crashes, missing config, offline behavior, empty data, long text, private-data leakage, bad database records, Release/build breakage, test breakage, App Store/TestFlight problems, accidental costs, and accidental data deletion.

Use browser/web research when API behavior may have changed, package version matters, platform documentation is needed, debugging an external dependency, or checking current best practices. Do not browse for purely local code changes that can be resolved by reading the repo.

Use computer use only when needed for UI or GUI-only verification. Do not use computer use for sensitive billing, payment, banking, private key, password, or account-payment flows.

Use shell/terminal for reading files, running tests, building the app, checking git status, running generators, searching the repo, verifying generated files, and checking package resolution. Before risky shell commands, run `git status --short`.

# AGENTS.md

## Repo rules

- Build for `localtradings.com`
- Treat the current code as the source of truth
- Keep docs aligned with the current repo, not old planning files
- Keep public and product shells separate
- Keep route files thin and move real UI into `src/features`
- Keep long copy and lesson/help bodies in `src/content`
- Do not document or build future ideas until they exist in code

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MDX
- Supabase

## Important note

This repo targets Next.js 16. Use the actual installed framework behavior in the
workspace instead of relying on older App Router assumptions.
