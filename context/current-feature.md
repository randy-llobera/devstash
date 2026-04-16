# Current Feature

## Status

<!-- Not Started|In Progress|Completed -->

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

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
- Auth Credentials - Email/Password Provider completed with Auth.js Credentials split-config setup, bcrypt-backed password validation, a new `POST /api/auth/register` route, and preserved GitHub OAuth support
- Auth UI - Sign In, Register & Sign Out completed with custom route-grouped auth pages, server-rendered auth shells plus client form components, reusable user avatar handling, a shadcn dropdown menu for sidebar sign-out, and a Sonner success toast after registration redirect
- Email Verification on Register completed with Resend-backed verification emails, hashed verification tokens, a resend verification endpoint, and credentials sign-in blocked until `emailVerified` is set
- Toggle Email Verification completed with an `EMAIL_VERIFICATION_ENABLED` env flag, auth flow gating for registration and credentials sign-in, and auth UI updates that hide resend verification when disabled
- Forgot Password Flow completed with a sign-in reset link, password reset request and reset routes, a reset-password auth page and form, and shared `VerificationToken` reuse for reset tokens
- Profile Page completed with a protected `/profile` route, server-rendered account and usage data, client-side profile info and stats sections, password and delete-account modals backed by profile API routes, sidebar profile navigation, and shared avatar/date helpers
- Rate Limiting for Auth completed with Upstash Redis sliding-window limits for credentials login, register, forgot-password, reset-password, and verification resend flows, shared `429` responses with `Retry-After`, and auth UI messaging that shows the wait time before retry
- Items List View completed with a protected dynamic `/items/[type]` route, type-filtered Prisma-backed item queries, a shared dashboard item card abstraction, and an items-page-specific grid/list presentation that keeps the current theme while matching the approved reference direction
- Vitest unit testing setup completed with Node-based test config, scripts for run/watch/coverage, colocated utility tests, and workflow/docs updated to keep unit coverage focused on server actions and utilities
- Items listing layout updated to use 3 columns on large screens while keeping the existing responsive 1-column and 2-column behavior on smaller breakpoints
- Item Drawer completed with a right-side sheet detail view opened from dashboard and items list cards, auth-scoped item detail fetching via `/api/items/[id]`, shared drawer state in the dashboard shell, loading states for on-click fetches, and shared sheet width overrides to support the wider drawer layout
- Item Drawer Edit Mode completed with inline editing in the existing drawer, a Zod-validated `updateItem` server action, Prisma-backed tag replacement, the shadcn CLI `Textarea` component, cache refresh after save, and focused unit coverage for the new action
- Item Delete Functionality completed with a drawer delete server action, shadcn confirmation dialog, success toast and local drawer state cleanup after deletion, plus test script renaming to `test`, `test:watch`, and `test:coverage`
- Item Create completed with a shadcn `Dialog` flow opened from the top bar, type-specific create fields for snippets, prompts, commands, notes, and links, a Zod-validated `createItem` server action, a Prisma-backed `createItem` query, success toast plus refresh behavior, and focused unit coverage for the new action
- Code Editor completed with a shared Monaco-based editor for snippets and commands in create and drawer flows, macOS-style header controls with copy and language display, read-only and edit support, fluid height capped at 400px, and utility coverage for language/item-type mapping
