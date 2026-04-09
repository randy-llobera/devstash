# Current Feature

Prisma + Neon PostgreSQL Setup

## Status

Completed

## Goals

- Set up Prisma ORM with Neon PostgreSQL
- Create the initial schema from the data models in context/project-overview.md
- Include NextAuth models: Account, Session, and VerificationToken
- Add appropriate indexes
- Configure cascade deletes where needed
- Use migrations only and do not push schema changes directly unless explicitly specified

## Notes

- Requirements source: context/features/database-spec.md
- Use Prisma 7 and account for its breaking changes
- Target Neon PostgreSQL serverless
- Use separate development and production database branches via DATABASE_URL
- Prisma docs: https://prisma.io/docs
- Prisma 7 upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Prisma Postgres quickstart: https://www.prisma.io/docs/getting-started/prisma-postgres/quickstart
- Phase 1 setup is complete
- Phase 2 schema and seed implementation is complete
- Initial migration has been created and applied on the development Neon branch
- System item types have been seeded

## History

<!-- Keep this updated. Earliest to latest -->

- Initial Next.js and Tailwind CSS setup
- Dashboard UI Phase 1 completed with shadcn initialization, dark mode by default, a new /dashboard route, a full-width top bar with logo, centered search, and new item button, plus sidebar and main placeholder layout components
- Dashboard UI Phase 2 completed with a collapsible sidebar, mobile drawer navigation, type links, favorite and recent collections, a bottom user avatar area, and updated dashboard top bar and sidebar layout
- Dashboard UI Phase 3 completed with reusable dashboard components for stats, recent collections, pinned items, and 10 recent items using shadcn Card and Badge primitives with mock data
- Prisma 7 and Neon setup added with repo-level Prisma config, generated client output, full initial schema, and seed script for system item types
- Initial Prisma migration created and applied, migration status verified, Prisma client regenerated, and system item types seeded on the development database
