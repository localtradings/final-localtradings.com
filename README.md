# localtradings.com

Learning-first trading education platform built with Next.js App Router,
TypeScript, Tailwind CSS, MDX, and Supabase.

## Source of truth

Implementation follows the cleaned package in the parent workspace:

- Stitch references drive visuals
- normalized docs drive routes, scope, behavior, and file ownership
- excluded routes such as Community, wallet, notifications, and standalone settings do not ship in v1

## Route groups

- `(marketing)` for `/`, `/learn`, `/backtesting`, `/about`, `/help`
- `(auth)` for `/sign-in`, `/sign-up`
- `(product)` for `/app/*`

## Content model

- `src/content/modules` for module metadata
- `src/content/lessons` for MDX lesson bodies
- `src/content/quizzes` for quiz definitions
- `src/content/help` for MDX help content
- `src/content/marketing` for structured public copy

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase values
3. Run `npm install`
4. Run `npm run dev`

Product routes can render in demo mode without Supabase env values, but sign-in,
sign-up, profile persistence, feedback storage, and protected auth flow require
real Supabase configuration.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Database

Initial schema is in `supabase/migrations/0001_initial.sql` and creates:

- `profiles`
- `quiz_attempts`
- `feedback`

Apply that migration to the target Supabase project before testing persistence.
