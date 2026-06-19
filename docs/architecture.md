# Earth Online RPG Architecture

## Product center

Adventure Log, World Map, and categorized Main Quest progression are the core loop. Supporting systems emit durable events into the log and significant milestones into the map.

## Runtime architecture

Earth Online RPG is a local modular monolith: Next.js App Router renders the UI, route handlers expose application use cases, services own transactions and invariants, Prisma accesses SQLite, and a storage adapter owns files beneath `data/uploads`.

Business mutations return both the changed record and generated events. Completing a quest, for example, atomically updates progress, writes an EXP transaction, creates typed log events, unlocks matching rewards, and optionally creates a map location.

## Revised domain decisions

- Five editable onboarding skills are seeded once: Programming, Research, Writing, Fitness, and Language Learning. They have no protected status and can be renamed or deleted.
- Five editable Main Quest categories are seeded once: Career, Education, Health, Life, and Travel. Users may add, rename, reorder, or remove categories.
- At most one Main Quest may be active within each category. The service checks this invariant and SQLite enforces it with a partial unique index.
- Adventure Log event types are `QUEST_COMPLETED`, `ACHIEVEMENT_EARNED`, `REWARD_UNLOCKED`, `LEVEL_UP`, `LOCATION_CREATED`, `SKILL_MILESTONE`, and `MANUAL_JOURNAL_ENTRY`.
- Backup and restore are MVP capabilities. A versioned ZIP contains a manifest, a consistent SQLite snapshot, and uploaded files. Restore validates format and paths, stages extraction, and replaces data only after validation.

## Boundaries

- Route handlers validate with Zod and invoke services.
- Services are the only layer allowed to award EXP, change streaks, unlock rewards, or create system events.
- Repositories contain persistence queries and no product rules.
- Dates are stored in UTC; daily quest dates are calculated in the configured IANA timezone.
- User-authored memories use soft deletion. Attachment paths are generated and constrained to the data directory.

## Delivery plan

1. Foundation: project setup, schema, first-launch bootstrap, character setup, pixel primitives, storage boundaries, and backup/restore infrastructure.
2. Adventure Log: typed events, journal editor, attachments, timeline, search, and filters.
3. World Map: persistent nodes and edges, positioning, milestone details, and event integration.
4. Main Quests: editable categories, per-category active constraint, progress, and atomic completion orchestration.
5. Daily Quests and progression: schedules, timezone reset, history, streaks, EXP ledger, and level-up events.
6. Skills, achievements, and rewards: user-defined archives and milestone event generation.
7. Lightweight Todo and settings.
8. Hardening: restore recovery, upload validation, accessibility, responsive behavior, and end-to-end tests.
