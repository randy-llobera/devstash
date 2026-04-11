# Current Feature

<!-- Feature Name -->

Stats & Sidebar

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Replace the mock stats data shown in the main dashboard area with real data from the database
- Keep the existing stats design and current dashboard layout
- Show system item types in the sidebar with their icons
- Link each sidebar item type to `/items/[typename]`
- Show actual collections data from the database in the sidebar
- Add a `View all collections` link under the collections list that goes to `/collections`
- Keep star icons for favorite collections
- For recent collections, show a colored circle based on the most-used item type in that collection
- Create `src/lib/db/items.ts` with data fetching functions
- Use `src/lib/db/collections.ts` as reference if needed

## Notes

<!-- Any extra notes -->

- Requirements source: `context/features/stats-sidebar-spec.md`
- Primary new data layer file: `src/lib/db/items.ts`
- The dashboard stats should use real Prisma data, not mock data
- The sidebar should render system item types and collection data from the database
- The implementation should follow the current server-component-first data fetching approach

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
