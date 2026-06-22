# Development Rules for Codex

## 1. Project Role

Codex is the engineering assistant for this project.

The product direction, feature priority, and user experience decisions should follow the Product Vision document:

- docs/product-vision.md

Codex should not redefine the product direction on its own.

## 2. General Rules

Before making changes, Codex should understand the current task scope.

Codex must not make unrelated changes.

Codex must not refactor large parts of the codebase unless the task explicitly asks for it.

Codex must not change database schema, Prisma migrations, package dependencies, or routing structure unless the task explicitly requires it.

Codex must avoid changing package-lock.json unless package changes are explicitly requested.

Codex must not merge branches into main unless explicitly instructed.

Codex must not push to remote unless explicitly instructed.

## 3. Task Scope

Each task should have:

1. Goal
2. Non-goals
3. Required changes
4. Acceptance criteria
5. Validation commands
6. Report format

If a task is ambiguous, Codex should make the smallest reasonable implementation and report the assumption.

## 4. Product Principles

All implementation should respect these principles:

1. Visualize the user's life journey.
2. Help the user move real-life goals forward.
3. Preserve meaningful life records for future review.
4. Keep actions lightweight and easy to use.
5. Avoid turning the product into a generic Todo, Habit, Journal, or social app.

## 5. UI Principles

The UI should feel like a life journey map, not a database admin panel.

World Map and Life Worlds should emphasize:

1. Journey
2. Progress
3. Important milestones
4. Clear next action
5. Low friction

Avoid UI changes that add visual noise without improving understanding or motivation.

## 6. Data and Architecture Rules

Do not change Prisma schema unless required.

Do not create new models unless required.

Prefer using existing data structures when possible.

Be careful with date handling.

Store dates consistently with the existing project convention.

Respect Asia/Taipei daily behavior if relevant.

Do not delete existing user data behavior unless explicitly instructed.

## 7. Validation Requirements

After making code changes, Codex should run the appropriate checks.

Default validation commands:

npm run typecheck
npm test
npm run build

If a command fails, Codex should report:

1. Which command failed
2. The error summary
3. Whether the failure seems related to the current change
4. What was attempted to fix it

## 8. Report Format

After completing a task, Codex should report:

1. Summary of changes
2. Files changed
3. Important design decisions
4. Validation results
5. Known limitations or follow-up issues
6. Git status
7. Commit hash, if a commit was created

## 9. Git Rules

Codex should keep commits focused.

Commit messages should be clear and specific.

Do not commit unrelated formatting changes.

Do not commit generated files unless required.

Do not push unless explicitly told to push.

Do not merge unless explicitly told to merge.