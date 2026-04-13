# Current Feature: Auth Credentials - Email/Password Provider

## Status

<!-- Not Started|In Progress|Completed -->
In Progress

## Goals

<!-- Goals & requirements -->
- Add email/password authentication with a Credentials provider.
- Add a password field to the `User` model via migration if it does not already exist.
- Update `auth.config.ts` with the Credentials provider placeholder for the split config pattern.
- Update `auth.ts` to override the Credentials provider with bcrypt-based validation.
- Create `POST /api/auth/register` for registration with validation, duplicate-user checks, password hashing, and user creation.
- Preserve existing GitHub OAuth behavior.

## Notes

<!-- Any extra notes -->
- Use `bcryptjs` for password hashing.
- Registration request fields: `name`, `email`, `password`, `confirmPassword`.
- Registration must validate matching passwords and return success/error responses.
- Split pattern detail:
  - `auth.config.ts` keeps `authorize: () => null` as a placeholder.
  - `auth.ts` contains the actual bcrypt validation logic.
- Verification targets:
  - Register via `POST /api/auth/register`.
  - Sign in via `/api/auth/signin`.
  - Confirm redirect to `/dashboard`.
  - Confirm GitHub OAuth still works.
- Reference: Auth.js Credentials provider docs at `https://authjs.dev/getting-started/authentication/credentials`.

## History

<!-- Keep this updated. Earliest to latest -->

- Initial Next.js and Tailwind CSS setup
- Dashboard UI Phase 1 completed with shadcn initialization, dark mode by default, a new /dashboard route, a full-width top bar with logo, centered search, and new item button, plus sidebar and main placeholder layout components
- Dashboard UI Phase 2 completed with a collapsible sidebar, mobile drawer navigation, type links, favorite and recent collections, a bottom user avatar area, and updated dashboard top bar and sidebar layout
- Dashboard UI Phase 3 completed with reusable dashboard components for stats, recent collections, pinned items, and 10 recent items using shadcn Card and Badge primitives with mock data
- Prisma 7 and Neon setup added with repo-level Prisma config, generated client output, full initial schema, and seed script for system item types
- Initial Prisma migration created and applied, migration status verified, Prisma client regenerated, and system item types seeded on the development database
- Seed development data completed with a demo user, system item types, and sample collections and items defined in `context/features/seed-spec.md`
- Dashboard collections completed with Prisma-backed recent collections in the dashboard server component, dominant-type border colors, item type icons, and shared UI helpers aligned to DB icon names and hex colors
- Dashboard items completed with Prisma-backed pinned and recent dashboard items, a temporary demo-user query scope until auth is implemented, item-type-driven card styling, hidden pinned section when no pinned items exist, and a new `typecheck` script in `package.json`
- Stats & sidebar completed with Prisma-backed dashboard stats, DB-driven system item types and sidebar collections, recent collection dominant-type color indicators, shared dashboard user lookup, and `View all collections` links wired to `/collections`
- Add Pro Badge to Sidebar completed with subtle shadcn badge styling for the `files` and `images` sidebar item types using uppercase `PRO`
- Dashboard accessibility quick wins completed with sidebar collections disclosure accessibility attributes, while intentionally leaving placeholder `#` links unchanged for upcoming route work
- Prisma 7 seed configuration completed by moving seed registration into `prisma.config.ts`, removing the legacy `package.json` Prisma seed block, and verifying both `npm run db:seed` and `npx prisma db seed` work on the dev database
- Auth Setup - NextAuth + GitHub Provider completed with Auth.js v5 GitHub OAuth, Prisma adapter setup, Next.js 16 proxy protection for `/dashboard`, session typing for `user.id`, and dashboard user lookup moved off the demo account
