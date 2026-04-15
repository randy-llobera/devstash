# Current Feature: Rate Limiting for Auth

## Status

In Progress
<!-- Not Started|In Progress|Completed -->

## Goals

- Add rate limiting to auth-related API routes.
- Use Upstash Redis with `@upstash/ratelimit` for serverless-compatible limiting.
- Create a reusable rate limiting utility.
- Return `429 Too Many Requests` responses with appropriate error details.
- Display user-friendly rate limit errors on the frontend.
<!-- Goals & requirements -->

## Notes

- Protect these endpoints with the specified limits:
  - `/src/auth.ts/credentials`: 5 attempts per 15 minutes, keyed by IP + email.
  - `/api/auth/register`: 3 attempts per hour, keyed by IP.
  - `/api/auth/password/forgot`: 3 attempts per hour, keyed by IP.
  - `/api/auth/password/reset`: 5 attempts per 15 minutes, keyed by IP.
  - `/api/auth/verification/resend`: 3 attempts per 15 minutes, keyed by IP + email.
- Create `src/lib/rate-limit.ts` with an Upstash client and sliding window limiting.
- Extract IP from `x-forwarded-for` when available, otherwise fall back to the request source.
- Rate limit checks should return `{ success, remaining, reset }`.
- API errors should return JSON in the form `{ error: "Too many attempts. Please try again in X minutes." }`.
- Include a `Retry-After` header on `429` responses.
- Frontend should surface rate limit errors with a toast notification.
- Fail open if Upstash is unavailable.
- Login limiting may require a custom sign-in handler because of NextAuth credentials flow.
- Inspect any other auth route that should be protected and advise if needed.
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
