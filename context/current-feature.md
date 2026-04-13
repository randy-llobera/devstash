# Current Feature: Auth Setup - NextAuth + GitHub Provider

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Set up NextAuth v5 with the Prisma adapter and GitHub OAuth provider
- Use the split auth config pattern for edge compatibility
- Add the auth route handler exports for NextAuth
- Protect `/dashboard/*` routes with Next.js 16 proxy auth checks
- Redirect unauthenticated users to the default NextAuth sign-in page
- Extend the session type so `session.user.id` is available

## Notes

<!-- Any extra notes -->

- Spec source: `context/features/auth-phase-1-spec.md`
- Create these files: `src/auth.config.ts`, `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/proxy.ts`, `src/types/next-auth.d.ts`
- Use Context7 to verify the current NextAuth v5 config and edge-compatibility conventions before implementation
- Install `next-auth@beta` and `@auth/prisma-adapter`
- Keep the sign-in flow on NextAuth default pages for testing
- Required env vars: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- Test targets: `/dashboard` redirects to sign-in, GitHub sign-in works, and auth returns to `/dashboard`

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
