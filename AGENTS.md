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
