# Current Feature

<!-- Feature Name -->

Dashboard Items

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Replace the dummy pinned and recent item data shown in the main dashboard area with real data from the database
- Keep the existing dashboard design and current pinned and recent items layout
- Fetch items with Prisma from the Neon database instead of `src/lib/mock-data.ts`
- Create `src/lib/db/items.ts` with data fetching functions
- Fetch item data directly in the server component
- Derive each item card icon and border from the item type
- Display item type tags and the rest of the current item card content
- If there are no pinned items, do not render that section
- Update collection stats display

## Notes

<!-- Any extra notes -->

- Requirements source: `context/features/dashboard-items-spec.md`
- Primary new data layer file: `src/lib/db/items.ts`
- The dashboard should continue to render pinned and recent items in the main right-side area
- The main dashboard items sections should use real Prisma data, not mock data
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
- Dashboard items completed with Prisma-backed pinned and recent dashboard items, a temporary demo-user query scope until auth is implemented, item-type-driven card styling, hidden pinned section when no pinned items exist, and a new `typecheck` script in `package.json`
