# Codex Task Template

Use this template when asking Codex to work on this project.

Before starting, read:

- docs/product-vision.md
- docs/development-rules.md
- docs/architecture.md, if relevant

---

## Task Title

Write a short title here.

---

## Goal

Describe the specific goal of this task.

This task should only focus on one clear improvement.

---

## Background

Explain the current product or technical context.

Mention why this change matters to the Earth Online RPG / RPG Life experience.

---

## Non-goals

This task should not include:

1. Unrelated UI redesign
2. Database schema changes, unless explicitly required
3. Prisma migration changes, unless explicitly required
4. Package dependency changes, unless explicitly required
5. Large refactors
6. Push or merge operations

Add any task-specific non-goals here.

---

## Required Changes

1. Change item one.
2. Change item two.
3. Change item three.

Keep this list concrete and limited.

---

## Acceptance Criteria

The task is complete when:

1. The requested behavior works.
2. The change respects docs/product-vision.md.
3. The change respects docs/development-rules.md.
4. No unrelated files are changed.
5. The UI remains usable and readable.
6. Existing behavior is not broken.

Add task-specific acceptance criteria here.

---

## Validation

Run the appropriate checks.

Default commands:

npm run typecheck
npm test
npm run build

Report the result of each command.

If a command fails, explain:

1. Which command failed
2. The error summary
3. Whether it seems related to this task
4. What was attempted to fix it

---

## Report Back

After finishing, report:

1. Summary of changes
2. Files changed
3. Important implementation decisions
4. Validation results
5. Known limitations or follow-up issues
6. Git status
7. Commit hash, if a commit was created

---

## Git Instructions

Do not push unless explicitly instructed.

Do not merge unless explicitly instructed.

Only create a commit if explicitly instructed.