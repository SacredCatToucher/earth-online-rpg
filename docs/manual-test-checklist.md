# Manual Test Checklist

Use this checklist after each Codex change to verify the core RPG Life journey:

`Main Quest -> Phase / Event Tree -> Daily Quest / Event -> Adventure Log -> World Map / Life Worlds -> Review`

Use a unique prefix such as `MT-YYYYMMDD-` for records created during testing. Do not use reset or demo-data actions on data that must be preserved.

> Current terminology: RPG Life does not yet have a separate persisted `Phase` type. Phase-like journey chapters are represented by parent/child Adventure Log events. Test the existing event tree without assuming formal Phase semantics.

## Quick Smoke Test (3-5 Minutes)

Run these checks after every Codex change. They are intentionally short and non-destructive; use the Full Manual Regression Checklist when the change affects a core workflow or persistence.

1. **Action:** Start the app and open `/`.
   **Expected:** The app starts without a fatal error and the Life Worlds overview appears first.
2. **Action:** Use the main navigation to open World Map, Adventure Log, Main Quests, and Daily Quests.
   **Expected:** Every enabled link opens the correct page without a crash or broken navigation state.
3. **Action:** Refresh the current core page directly in the browser.
   **Expected:** The same page reloads successfully and existing records or the intended empty state still render.
4. **Action:** On `/`, open one available Life World and then select **Back to Life Worlds**.
   **Expected:** The World route renders, its controls remain usable, and the overview returns without a full-page error.
5. **Action:** If mapped parent/child milestones exist, inspect one World route or Wider Journey.
   **Expected:** Backbone milestones stay on the primary path, related children branch away from it, and no child is incorrectly drawn through the primary path.
6. **Action:** On `/main-quests`, expand **Chart a new road**, then close it without submitting.
   **Expected:** The creation form opens and closes normally; existing Draft, Active, and Completed quest sections remain intact.
7. **Action:** Open an available Main Quest journey link; if no quest exists, verify the Main Quest empty state instead.
   **Expected:** The link reaches the correct Adventure Log branch, or the empty state gives usable guidance without crashing.
8. **Action:** On `/adventure-log`, open **+ Write journal entry** and close the dialog without saving, then try an existing search or clear action if data exists.
   **Expected:** The dialog and filters respond normally, no record is created, and the log or empty state remains readable.
9. **Action:** On `/daily-quests`, expand one **Edit quest** panel if available; otherwise inspect the empty definition state.
   **Expected:** Existing quest details populate correctly, or the empty state and Create Daily Quest form render without errors.
10. **Action:** Check the browser console and the visible layout at desktop or the viewport most affected by the change.
    **Expected:** There are no new uncaught errors, unusable controls, severe overlap, or obvious clipping related to the change.

# Full Manual Regression Checklist

## 1. Smoke Test

### Purpose

Confirm the application starts, its primary navigation works, and existing or empty data can render without a crash.

### Manual Actions

1. Start the application using the normal development or production command.
2. Open `/` in a browser.
3. Use the main navigation to visit:
   - `/` (World Map)
   - `/adventure-log`
   - `/main-quests`
   - `/daily-quests`
4. On each page, wait for the page to finish loading and check the browser console for uncaught errors.
5. Reload each core page directly with the browser refresh button.
6. If the current data set is empty, inspect every empty state and its available action links.
7. If data exists, note one visible record on each populated page, reload, and confirm it remains visible.

### Expected Results

- The application starts without a fatal error.
- The homepage opens on the Life Worlds overview.
- Every enabled navigation link opens the correct page without a crash.
- Direct refresh works on every core route.
- Empty states contain readable guidance and do not render broken controls.
- Existing data remains visible after reload.
- No page opens as an unrelated generic dashboard or global milestone route.

### Regression Notes

- Check both an empty data set and a populated data set when practical.
- Record broken navigation highlighting, hydration errors, repeated requests, or unexpected first-launch dialogs.
- A browser console warning is not automatically a failure, but capture it if it is new or related to the changed feature.

## 2. Main Quest Test

### Purpose

Verify that a long-term direction can be created, activated, progressed, completed, and revisited without breaking its Adventure Log or World context.

### Manual Actions

1. Open `/main-quests`.
2. Expand **Chart a new road**.
3. Create a Main Quest using a unique title, category, description, progress type, target, unit, and `DRAFT` status.
4. Optionally enable **Place root on World Map** when this test should cover mapping.
5. Confirm the new quest appears under **Directions not yet begun**.
6. Activate it with a valid start date.
7. Confirm it moves to **Current Campaign** and displays its category, description, root journey, start date, and progress.
8. Use **Update progress** to change its current value and save. This is the currently supported Main Quest edit operation.
9. Reload `/main-quests` and confirm the new progress persists.
10. Open **View journey** or **Open this journey** and confirm the correct Adventure Log root opens.
11. If safe for the test data, complete the Main Quest and accept the confirmation.
12. Confirm it leaves Current Campaign and appears under **Journeys already completed** with a completed date.
13. Reload the page and revisit its journey link.

### Expected Results

- Creation produces one Main Quest and one correct root journey.
- Draft, Active, and Completed status displays match the performed actions.
- Activation does not create a duplicate quest or duplicate root.
- Progress accepts values from zero through the target and persists after reload.
- The active quest appears in Current Campaign and relevant Life World context.
- Completion preserves the quest and its journey instead of hiding or deleting them.
- Journey links open the matching Adventure Log entry.

### Regression Notes

- Only one Active Main Quest per category is currently allowed; verify the UI reports a useful error when attempting another.
- A general title/description Main Quest edit form is not currently exposed. Record that check as `N/A`; if such a form is introduced, edit the title and description, save, reload, and verify all linked views update.
- Verify invalid progress above the target is rejected without changing the stored value.
- Completing or leaving a quest inactive must not crash Main Quests, Adventure Log, or World Map pages.

## 3. Phase / Event Tree Test

### Purpose

Verify the current phase-like journey structure: Adventure Log child events remain ordered beneath the correct Main Quest root or parent event.

### Manual Actions

1. Create or choose a Main Quest with an Adventure Log root.
2. Open the quest's journey in `/adventure-log`.
3. On the root entry, select **+ Add child event**.
4. Create an ongoing child entry named with a unique `Phase 1` test title and confirm the root is selected as its parent.
5. Add a second child entry named `Phase 2` with a later start date.
6. Add a nested child event beneath Phase 1.
7. Reload `/adventure-log` and locate the same root branch.
8. Confirm Phase 1, Phase 2, and the nested child appear beneath the correct parents.
9. Complete Phase 1 using **Complete**, or edit it to Completed with a valid end date.
10. Leave Phase 2 Ongoing.
11. Reload and open `/main-quests` to inspect the active campaign's recent journey notes.
12. Edit a child event's details without changing its parent, save, and reload.

### Expected Results

- Child events render under the selected parent rather than as unrelated roots.
- Nested children remain under their immediate parent.
- Sibling and branch presentation remains stable and understandable after reload.
- Completed chapters remain visible with Completed status and dates.
- Ongoing chapters remain visible as Ongoing.
- The active Main Quest shows relevant recent child journey notes.
- Editing a child does not detach or move its descendants unexpectedly.

### Regression Notes

- “Phase” is a testing shorthand here; the UI should continue to use existing chapter/event language until formal Phase semantics exist.
- Verify the parent selector prevents selecting the entry itself or its descendants and does not allow circular trees.
- When dates are equal, do not assume manual drag ordering; record the displayed deterministic order.
- If reparenting is tested, confirm both the old and new parent branches refresh correctly.

## 4. Daily Quest Test

### Purpose

Verify recurring actions can be created, edited, paused, displayed on scheduled days, completed, and reloaded.

### Manual Actions

1. Open `/daily-quests`.
2. Create a Daily Quest with a unique title, description, at least one repeat day, and **Active quest** enabled.
3. Include the current weekday if the quest should appear in today's list.
4. Confirm it appears under **Daily Quest definitions** and, when scheduled today, in today's quest area.
5. Expand **Edit quest**.
6. Change the title, description, and repeat days; save.
7. Reload and confirm the edits persist.
8. Edit the quest again, disable **Active quest**, and save.
9. Confirm the definition remains visible but is not treated as a current ritual unless it was already completed today.
10. Reactivate it and include the current weekday.
11. Complete the Daily Quest for today.
12. Reload and confirm today's completed state remains visible and cannot be duplicated.

### Expected Results

- Creation adds one Daily Quest definition.
- Title, description, weekdays, and active state update after editing.
- Active scheduled quests appear in the correct current-day area.
- Paused quests remain in the definitions list without appearing as an active scheduled quest.
- Completion is visibly recorded and persists after reload.
- A second completion for the same quest date is prevented.

### Regression Notes

- Test near a weekday boundary only when timezone behavior is relevant; the configured timezone is `Asia/Taipei`.
- Verify selecting no repeat days produces a useful validation result rather than a broken record.
- Completion should not create unexpected Adventure Log or World Map content unless a future feature explicitly adds that behavior.

## 5. Adventure Log Test

### Purpose

Verify life events can be recorded, edited, completed, searched, linked into trees, mapped, and revisited without disappearing.

### Manual Actions

1. Open `/adventure-log`.
2. Select **+ Write journal entry**.
3. Create an Ongoing root entry with a unique title, start date, and description.
4. Confirm it appears as a root branch with the correct details and status.
5. Edit the entry, change its description, and save.
6. Add a child event and confirm the parent entry is selected.
7. Mark the child as **Place this memory on the World Map** and save.
8. Complete the root or child with a valid completion/end date.
9. Reload and confirm completed entries remain visible.
10. Search by the unique title and verify the matching branch appears.
11. Clear the search and test event-type and date filters when relevant.
12. Follow an Adventure Log link from Main Quests or World Map and confirm it reaches the correct entry.
13. With a filter that matches nothing, inspect the filtered empty state.

### Expected Results

- Entry title, description, dates, status, and parent context render correctly.
- Edits persist after reload.
- Child events remain associated with their selected parent or Main Quest root.
- Completed events stay available for review.
- Mapped events display the **World Map milestone** indicator.
- Search and filters return matching entries and preserve understandable branch context.
- Empty and no-results states render without a crash.

### Regression Notes

- End date before start date should be rejected.
- System-created events should not expose unsupported manual rewrite actions.
- Removing milestone status should remove only the journal-created map location, not unrelated records.
- If attachments are in scope, verify allowed files remain linked after reload and rejected files show a useful error.

## 6. World Map / Life Worlds Test

### Purpose

Verify the journey overview groups mapped milestones into the correct Life Worlds and renders explicit Main Quest roads or rootless journey paths with related branches.

### Manual Actions

1. Open `/`.
2. Confirm the Life Worlds overview appears before any individual World route.
3. Confirm empty seeded categories are hidden unless they have mapped milestones or an Active Main Quest.
4. Open a Life World containing mapped explicit Main Quest roots.
5. Confirm only Main Quest root nodes form the prominent **Main road** in chronological order.
6. Confirm mapped child and nested child events branch below or away from their parents using visually secondary routes.
7. Select a root node and a branch node; verify each story panel shows the correct title, date, description, Adventure Log link, and **Continues from** context when available.
8. Confirm Frontier and Uncharted render, with Uncharted extending from the final main-road root.
9. Select **Back to Life Worlds**.
10. Open **Wider Journey** when unmatched mapped milestones exist.
11. Confirm parentless/rootlike milestones form a **Journey path**, while mapped children and nested children render as **Related milestone** branches.
12. Confirm children are not included in the primary Journey path and Uncharted extends from its final backbone node.
13. Return to the overview and refresh `/`; confirm local World selection resets to the overview.
14. Check a World with no mapped locations and an Active Main Quest, plus the fully empty map state when available.
15. Repeat the key checks at desktop and narrow/mobile widths.

### Expected Results

- Life Worlds overview loads first and each World can be entered and exited.
- Mapped Main Quest roots and their descendants appear in the correct category World.
- Explicit root chronology uses **Main road** language.
- Rootless fallback chronology uses **Journey path** or neutral milestone language, never Main road.
- Real parent/child connections render as secondary related branches.
- Standalone unmatched milestones appear in Wider Journey.
- Empty/no-map states provide usable guidance and do not crash.
- Refresh behavior is predictable and does not persist stale local selection.

### Regression Notes

- Do not interpret every child event as a formal Side Quest or Phase.
- Dense branch trees may overlap and deep trees may compress near the bottom; record severe or newly introduced cases.
- Frontier currently follows the latest chronological mapped location and may be a related branch.
- Verify duplicate titles do not cause links or details to open the wrong record.

## 7. Reset / Demo Data Test

### Purpose

Define future acceptance checks for Testing Tools v1. These controls are not implemented by this documentation task and must not be simulated through direct database edits.

### Manual Actions (Future Only)

When **Clear All Data** and **Reset Demo Data** are implemented:

1. Back up any data that must be preserved and open the future Testing Tools UI.
2. Confirm **Clear All Data** and **Reset Demo Data** are visible only in a clearly labeled developer/testing area.
3. Select **Clear All Data**.
4. Cancel the confirmation once and verify nothing changes.
5. Repeat the action and confirm it.
6. Visit every core page and inspect its empty state.
7. Reload the application and confirm cleared test data does not return.
8. Select **Reset Demo Data**.
9. Cancel the confirmation once and verify no demo records are created.
10. Repeat the action and confirm it.
11. Verify the generated data includes:
    - 1 Active Main Quest
    - At least 2 phase-like child events
    - At least 1 Completed phase-like event
    - At least 1 Active/Ongoing phase-like event
    - At least 1 Daily Quest
    - At least 1 Adventure Log event
    - Visible World Map and Life Worlds content
    - A visible Main Quest -> phase/event -> map relationship
12. Follow the generated Main Quest into its Adventure Log tree and corresponding World.
13. Run **Reset Demo Data** again and confirm the result does not grow through unlimited duplication.
14. Reload every core page and confirm the reset data persists and remains internally linked.

### Expected Results (Future Only)

- Both destructive/rebuilding operations require explicit confirmation.
- Canceling either confirmation performs no mutation.
- Clear removes the intended test data and leaves stable empty states.
- Reset creates a coherent, reviewable demo journey with the required coverage.
- Repeated reset is idempotent or replaces a known demo data set instead of duplicating it indefinitely.
- Main Quest, event tree, Daily Quest, Adventure Log, and World Map references remain consistent.

### Regression Notes

- Mark this entire section `N/A - Testing Tools not implemented` until the tools exist.
- Never run Clear against valuable user data without a verified backup and clear environment labeling.
- Future implementation must define exactly which settings, attachments, and user records Clear owns before this checklist is activated.
- This checklist does not authorize `clearData()`, `seedDemoData()`, reset APIs, schema changes, or seed-script changes.

## Test Record

After completing the applicable sections, record:

- Commit or change under test:
- Environment and browser:
- Data state: empty / existing / demo
- Sections passed:
- Sections skipped and reason:
- Regressions found:
- Screenshots or console errors:
- Final result: pass / pass with known limitations / fail
