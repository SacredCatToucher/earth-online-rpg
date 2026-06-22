# Workflow

This file defines the working process for Earth Online RPG / RPG Life.

The goal is to make product thinking, specification writing, Codex implementation, and QA review repeatable.

The user should not need to remember every step manually. The workflow should guide the process.

---

## 1. Source of Truth

The repository docs are the source of truth for this project.

Important project documents:

* `docs/product-vision.md`
* `docs/development-rules.md`
* `docs/codex-task-template.md`
* `docs/decision-log.md`
* `docs/roadmap.md`
* `docs/qa-checklist.md`
* `docs/architecture.md`
* `docs/workflow.md`

ChatGPT conversations are useful for thinking and drafting, but important decisions should eventually be reflected in the repo docs.

---

## 2. ChatGPT Conversation Roles

This project uses four fixed ChatGPT conversations.

### 2.1 Product Strategy

Conversation name:

`RPG Life｜產品策略`

Purpose:

Decide whether an idea is worth doing.

Use this conversation for:

* Product direction
* Feature priority
* Whether an idea fits `docs/product-vision.md`
* Whether a feature is core, supporting, or should be delayed

Do not use this conversation to write Codex tasks.

---

### 2.2 Specification Writing

Conversation name:

`RPG Life｜規格整理`

Purpose:

Turn vague product ideas into feature specs.

Use this conversation for:

* Background
* Goal
* Non-goals
* User flow
* UI behavior
* Data impact
* Acceptance criteria

The output should be clear enough to later become a Codex task.

---

### 2.3 Codex Task Generation

Conversation name:

`RPG Life｜Codex 任務產生`

Purpose:

Generate small, concrete tasks that can be pasted directly into Codex.

Use this conversation for:

* Small implementation tasks
* Clear scope
* Explicit non-goals
* Validation commands
* Report format

Tasks should follow:

* `docs/codex-task-template.md`
* `docs/development-rules.md`
* `docs/product-vision.md`

Default Codex constraints:

* Keep the scope small.
* Do not change Prisma unless explicitly required.
* Do not change package dependencies unless explicitly required.
* Do not change `package-lock.json` unless explicitly required.
* Do not push unless explicitly instructed.
* Do not merge unless explicitly instructed.

---

### 2.4 QA / Review

Conversation name:

`RPG Life｜驗收與回顧`

Purpose:

Review Codex reports after implementation.

Use this conversation for:

* Scope review
* Development rules review
* Validation review
* Manual test planning
* Commit / push / merge decision support

Reviews should follow:

* `docs/qa-checklist.md`
* `docs/development-rules.md`
* `docs/product-vision.md`

---

## 3. GitHub Project Workflow

GitHub Issues and Project board are used to track work.

Project board:

`RPG Life Development`

Columns:

1. Backlog
2. Ready
3. In Progress
4. Review
5. Done

---

## 4. Meaning of Each Column

### Backlog

Ideas or work items that may be useful later.

An issue in Backlog is not ready for Codex yet.

Before moving an issue out of Backlog, clarify:

1. Why it matters
2. Whether it fits the product vision
3. Whether it supports the current roadmap
4. Whether it should be done now or later

---

### Ready

The issue is clear enough to become a Codex task.

Before moving an issue to Ready, there should be enough clarity about:

1. Goal
2. Scope
3. Non-goals
4. Acceptance criteria
5. Validation expectations

---

### In Progress

The task is currently being implemented by Codex or the user.

While an issue is In Progress:

1. Avoid starting too many other issues.
2. Keep the Codex task focused.
3. Do not expand the task unless necessary.
4. If the scope changes, record the reason.

---

### Review

Codex has completed the task and reported back.

Before moving an issue from Review to Done:

1. Review Codex's report.
2. Check scope.
3. Check validation results.
4. Perform manual testing.
5. Confirm whether docs need updates.
6. Confirm whether commit / push is safe.

Use:

* `docs/qa-checklist.md`

---

### Done

The work is complete and reviewed.

An issue can move to Done only after:

1. The implementation is accepted.
2. Validation is acceptable.
3. Manual testing is acceptable.
4. Git status is clean or expected.
5. Commit / push decisions are resolved.
6. Any necessary docs updates are completed.

---

## 5. Standard Development Flow

Use this flow for most product changes:

1. Discuss the idea in `RPG Life｜產品策略`.
2. If worth doing, turn it into a spec in `RPG Life｜規格整理`.
3. Create or update a GitHub Issue.
4. Move the Issue from Backlog to Ready.
5. Generate a Codex task in `RPG Life｜Codex 任務產生`.
6. Move the Issue to In Progress.
7. Give the task to Codex.
8. When Codex reports back, move the Issue to Review.
9. Review the report in `RPG Life｜驗收與回顧`.
10. Manually test the app.
11. Commit / push if safe.
12. Move the Issue to Done.
13. Update docs if the decision, roadmap, or architecture changed.

---

## 6. Docs Update Rule

Do not rely on memory.

At the end of every spec, Codex task, or QA review, ask:

1. Does `docs/decision-log.md` need an update?
2. Does `docs/roadmap.md` need an update?
3. Does `docs/architecture.md` need an update?
4. Does `docs/product-vision.md` need an update?
5. Does the related GitHub Issue need an update?

Most small UI tasks do not need major docs updates.

Important product decisions should be recorded in `docs/decision-log.md`.

Priority changes should be recorded in `docs/roadmap.md`.

Technical structure changes should be recorded in `docs/architecture.md`.

---

## 7. When to Use Figma or Excalidraw

Use Figma, Excalidraw, or a rough sketch when the task is mainly about UI structure.

Good cases:

1. World Map layout changes
2. Life Worlds visual direction
3. Quest detail page structure
4. First-minute onboarding flow
5. Navigation or information architecture

The sketch does not need to be beautiful.

A rough sketch is useful if it helps clarify:

1. What appears on screen
2. What the user clicks
3. What changes after interaction
4. What should feel more important

After sketching, convert it into a written UI spec before giving it to Codex.

---

## 8. Default Validation

For most code changes, Codex should run:

```bash
npm run typecheck
npm test
npm run build
```

If a command fails, Codex should report:

1. Which command failed
2. The error summary
3. Whether it is related to the current change
4. What was attempted to fix it

---

## 9. Git Rules

Default rules:

1. Do not push unless explicitly instructed.
2. Do not merge unless explicitly instructed.
3. Do not change Prisma unless explicitly required.
4. Do not change `package-lock.json` unless explicitly required.
5. Keep commits focused.
6. Keep branches clean.
7. Check `git status` before and after important steps.

---

## 10. Simple Rule

If unsure what to do next, follow this order:

1. Check `docs/roadmap.md`.
2. Pick one GitHub Issue from Backlog.
3. Discuss it in Product Strategy.
4. Turn it into a spec.
5. Move it to Ready.
6. Generate a small Codex task.
7. Implement.
8. Review.
9. Update docs if needed.
10. Move the Issue forward on the Project board.
