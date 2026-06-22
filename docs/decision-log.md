# Decision Log

This file records important product and development decisions for Earth Online RPG / RPG Life.

The purpose is to keep decisions visible, reviewable, and reusable across ChatGPT, Codex, and future development work.

---

## 2026-06-22 — Define RPG Life as a life journey system

### Decision

Earth Online RPG / RPG Life is positioned as an RPG-style life navigation system.

It is not a traditional game, generic todo app, habit tracker, journal app, social platform, or leaderboard product.

### Reason

The core product value is to help the user visualize life as a long-term journey, move real-life goals forward, and preserve meaningful records for future review.

RPG is the presentation style, not the product itself.

### Impact

Future features should be evaluated by whether they help with:

1. Visualizing the user's life journey
2. Moving real-life goals forward
3. Preserving meaningful life records
4. Keeping interaction lightweight
5. Avoiding generic todo / habit / journal behavior

---

## 2026-06-22 — Use repo docs as the project source of truth

### Decision

Important product vision, development rules, Codex task templates, decisions, and roadmap should be stored in the repository under `docs/`.

### Reason

Chat conversations are useful for thinking, but they are unstable as long-term project memory.

The repository should become the stable source of truth for GPT, Codex, and the user.

### Impact

Before major product or development work, relevant documents under `docs/` should be checked or updated.

Future Codex tasks should reference:

- `docs/product-vision.md`
- `docs/development-rules.md`
- `docs/codex-task-template.md`