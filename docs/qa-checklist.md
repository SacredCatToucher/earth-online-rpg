# QA Checklist

This file defines the review checklist for Codex changes in Earth Online RPG / RPG Life.

Use this checklist after Codex reports that a task is complete.

---

## 1. Scope Check

Confirm whether the change stayed within the assigned task.

Check:

1. Did Codex only change files related to the task?
2. Did Codex avoid unrelated refactors?
3. Did Codex avoid unrelated UI redesign?
4. Did Codex avoid changing Prisma schema unless explicitly required?
5. Did Codex avoid changing package dependencies unless explicitly required?
6. Did Codex avoid changing package-lock.json unless explicitly required?

If scope expanded, identify exactly where and why.

---

## 2. Product Vision Check

Confirm whether the change respects:

- docs/product-vision.md
- docs/roadmap.md
- docs/decision-log.md

Ask:

1. Does the change make the life journey more visible?
2. Does it help real-life progress?
3. Does it preserve meaningful records?
4. Does it keep interactions lightweight?
5. Does it avoid becoming a generic todo, habit, journal, or social feature?

---

## 3. Development Rules Check

Confirm whether Codex followed:

- docs/development-rules.md
- docs/codex-task-template.md

Check:

1. Did Codex report files changed?
2. Did Codex report important design decisions?
3. Did Codex report validation results?
4. Did Codex report known limitations?
5. Did Codex report git status?
6. Did Codex avoid pushing or merging unless instructed?

---

## 4. Validation Check

Default validation should include:

1. npm run typecheck
2. npm test
3. npm run build

If any command was skipped, ask why.

If any command failed, check:

1. Which command failed?
2. What was the error?
3. Is it related to the current change?
4. Was a fix attempted?
5. Is manual verification still safe?

---

## 5. Manual Testing Checklist

Depending on the task, manually test:

1. Page loads without crash.
2. Main navigation still works.
3. Existing data still appears.
4. New UI behavior works.
5. Empty states still make sense.
6. Completed states still make sense.
7. Active quest behavior still works.
8. World Map / Life Worlds still display correctly.
9. No obvious layout break on normal desktop width.
10. No obviously broken text size, spacing, or buttons.

---

## 6. Git Check

Before commit or push, confirm:

1. git status is clean or expected.
2. Only intended files changed.
3. Commit message is specific.
4. No unrelated generated files are included.
5. No merge was performed unless instructed.
6. No push was performed unless instructed.

---

## 7. Review Result

After review, classify the result as one of:

1. Safe to commit
2. Safe to push
3. Needs small fix before commit
4. Needs manual testing before decision
5. Needs rollback or larger correction

Also list:

1. What the user should manually test
2. Whether the change should be committed
3. Whether the change should be pushed
4. Whether the change should be merged