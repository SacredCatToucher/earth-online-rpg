# Roadmap

This file tracks the development direction for Earth Online RPG / RPG Life.

The roadmap should stay practical and small. Each item should help the product become more useful as a life journey system.

---

## Current Product Loop

The current core loop is:

Main Quest → Phase → Daily Action → Event → Progress → Review

The product should keep improving this loop before expanding into large new systems.

---

## Current Priorities

### 1. Improve Life Worlds / World Map experience

Goal:

Make the World Map feel more like a life journey and less like a plain data view.

Possible tasks:

1. Improve visual hierarchy of Life Worlds overview.
2. Make each Life World feel more distinct.
3. Make the current active journey clearer.
4. Improve milestone readability.
5. Make the next meaningful action easier to notice.

Notes:

This should mostly be UI-level work.

Avoid Prisma schema changes unless clearly necessary.

---

### 2. Improve quest progress feedback

Goal:

When the user completes or advances something, the app should give stronger feedback that life has moved forward.

Possible tasks:

1. Add clearer completion states.
2. Improve visual feedback after completing a phase or quest.
3. Make progress changes more visible on the map.
4. Improve empty or completed-state messages.

Notes:

This should support motivation without becoming shallow gamification.

Avoid making level, title, or vanity achievement the main reward.

---

### 3. Make Main Quest progress easier to update

Goal:

The user should be able to update important quests with less friction.

Possible tasks:

1. Make active Main Quest actions easier to access.
2. Improve phase creation and update flow.
3. Reduce clicks needed to advance a quest.
4. Improve forms where text is too small or visually weak.

Notes:

This should make real-life goal tracking easier, not heavier.

---

### 4. Improve first-minute experience

Goal:

A new or returning user should not see an empty, confusing world.

Possible tasks:

1. Provide better default sample content.
2. Let the user quickly create 3 important life events.
3. Improve empty states for World Map and Life Worlds.
4. Guide the user toward creating the first Main Quest.

Notes:

The first minute should communicate the product fantasy:

"Your life is a journey that can be seen and continued."

---

### 5. Improve long-term review

Goal:

The app should help the user look back and feel the continuity of their life journey.

Possible tasks:

1. Improve review surfaces.
2. Make completed quests and past events easier to revisit.
3. Add better timeline or archive views.
4. Connect historical events to Main Quests and Life Worlds more clearly.

Notes:

This should support reflection, not just logging.

---

## Later Ideas

These ideas may be useful later, but should not distract from the current loop.

1. Character skill panel
2. Achievements
3. Side quests
4. Better daily quest completion loop
5. Export / backup improvements
6. Figma-based UI redesign
7. More RPG-style world visuals
8. Better onboarding

---

## Not Now

These should be delayed unless the product direction changes.

1. Social features
2. Multiplayer
3. Leaderboards
4. Public profiles
5. Competitive ranking
6. Heavy RPG stats and combat systems
7. Large database redesigns
8. Major dependency changes without clear need

---

## Roadmap Rule

Before starting a new feature, ask:

1. Does this improve the current core loop?
2. Does this make the life journey more visible?
3. Does this help real-life progress?
4. Does this preserve meaningful records?
5. Does this reduce or increase friction?

If the answer is unclear, the feature should be discussed in the product strategy conversation before becoming a Codex task.