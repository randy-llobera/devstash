# Current Feature

Dashboard Collections

## Status

Completed

## Goals

- Replace the dummy recent collections data shown in the main dashboard area with real data from the database
- Keep the existing dashboard design and current 6-card recent collections layout
- Fetch collections with Prisma from the Neon database instead of `src/lib/mock-data.ts`
- Fetch data directly in the server component
- Derive each collection card border color from the most-used content type in that collection
- Show small icons for all item types present in each collection
- Update the collection stats display
- Do not add the items list underneath yet

## Notes

- Requirements source: `context/features/dashboard-collections-spec.md`
- Primary new data layer file: `src/lib/db/collections.ts`
- The dashboard should continue to render recent collections in the main right-side area
- The main dashboard collections section should use real Prisma data, not mock data
- The implementation should follow the current server-component-first data fetching approach
- Reference screenshot: `context/screenshots/dashboard-ui-main.png`

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
