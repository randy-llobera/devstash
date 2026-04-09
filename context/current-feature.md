# Current Feature

Seed Development Data

## Status

Completed

## Goals

- Overwrite the current seed file contents with a development seed implementation
- Seed a demo user with the exact credentials and flags defined in `context/features/seed-spec.md`
- Seed all system item types with the specified Lucide icon names, colors, and `isSystem: true`
- Seed sample collections and items for React Patterns, AI Workflows, DevOps, Terminal Commands, and Design Resources
- Use real URLs where the spec requires links
- Keep the seed data suitable for local development and demos

## Notes

- Requirements source: `context/features/seed-spec.md`
- Target file: `prisma/seed.ts`
- Demo user email: `demo@devstash.io`
- Demo user password must be hashed with `bcryptjs` using 12 rounds
- Demo user `emailVerified` should use the current date at seed time
- Collections and item counts must match the spec exactly
- Replace the existing seed file content instead of incrementally extending it

## History

<!-- Keep this updated. Earliest to latest -->

- Initial Next.js and Tailwind CSS setup
- Dashboard UI Phase 1 completed with shadcn initialization, dark mode by default, a new /dashboard route, a full-width top bar with logo, centered search, and new item button, plus sidebar and main placeholder layout components
- Dashboard UI Phase 2 completed with a collapsible sidebar, mobile drawer navigation, type links, favorite and recent collections, a bottom user avatar area, and updated dashboard top bar and sidebar layout
- Dashboard UI Phase 3 completed with reusable dashboard components for stats, recent collections, pinned items, and 10 recent items using shadcn Card and Badge primitives with mock data
- Prisma 7 and Neon setup added with repo-level Prisma config, generated client output, full initial schema, and seed script for system item types
- Initial Prisma migration created and applied, migration status verified, Prisma client regenerated, and system item types seeded on the development database
- Seed development data completed with a demo user, system item types, and sample collections and items defined in `context/features/seed-spec.md`
