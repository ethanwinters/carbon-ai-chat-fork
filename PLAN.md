# Plan: Fix Workspace Closing Layout Jump

## Problem

At the end of the workspace closing animation there is a visible jump. Three separate
async boundaries cause layout changes that should land atomically in one paint frame
but currently arrive in three:

1. **Sync** — `finishWorkspaceClosing()` removes CSS classes/attributes, releasing the
   `flex: 0 1 $messages-min-width` constraint on `.input-and-messages` while the
   workspace div is still in the DOM.
2. **Microtask** — Lit re-renders, removing the workspace div from the DOM.
3. **rAF** — ResizeObserver fires, `at-max-width` is applied.

The `workspace-closing` CSS class must stay alive until all three are ready, then
everything should land in a single render.

---

## Approach

Split `finishWorkspaceClosing()` into two phases:

- **Phase 1** runs where `finishWorkspaceClosing()` is today. It removes the workspace
  div from the DOM and clears attributes, but deliberately keeps `isContracting: true`
  so the `workspace-closing` class (and its flex constraints) stays active.
- **Phase 2** is a new public `finalizeClosing()` method, called by the shell from
  `updated()` after detecting the Phase 1 render completed. It synchronously computes
  `at-max-width`, clears all remaining state, and schedules one final render where
  everything lands together.

---

## Changes

### `workspace-manager.ts`

**Rename/split `finishWorkspaceClosing()`:**

Phase 1 (keep as `finishWorkspaceClosing`, strip the final full reset):

- `setShowWorkspaceContainer(false)` — queues Lit re-render to remove workspace div
- `hostElement.removeAttribute("workspace-in-panel")`
- `hostElement.removeAttribute("workspace-in-container")`
- `clearContractionTimers()` + reset tracking variables
- **Do not** call `setState({ isContracting: false, ... })` — `workspace-closing` class
  must stay alive until Phase 2

Phase 2 — new **public** `finalizeClosing()` method:

- Guard: `if (!this.state.isContracting) return;` (safe to call multiple times)
- `setState({ inPanel: false, contentVisible: true, containerVisible: false,
isCheckingExpansion: false, isExpanding: false, isCheckingContracting: false,
isContracting: false })` — this removes the `workspace-closing` class
- `requestHostUpdate()` — triggers the final render

### `shell.ts`

**In `syncWorkspacePanelState()`** (already called from `updated()`):

Detect the Phase 1 → Phase 2 transition by checking:

- `this.lastWorkspaceContainerVisible === true` — workspace was visible last render
- `workspaceState.containerVisible === false` — just removed this render
- `workspaceState.isContracting === true` — Phase 2 not yet run

When detected:

1. `const hostWidth = this.getBoundingClientRect().width` — forces a synchronous
   reflow against the freshly-committed DOM (workspace div is gone), giving the correct
   post-removal host width.
2. `const maxWidth = this.resizeObserverManager?.getMessagesMaxWidth() ?? 1056`
3. `const isAtMaxWidth = hostWidth < maxWidth`
4. If `this.inputAndMessagesAtMaxWidth !== isAtMaxWidth`, update it (no `requestUpdate`
   needed — `finalizeClosing` will trigger one).
5. `this.workspaceManager.finalizeClosing()` — clears `isContracting`, removes
   `workspace-closing` class, schedules final render.

---

## Resulting Sequence

```
finishWorkspaceClosing() [sync]
  → containerVisible: false, attributes removed, timers cleared
  → isContracting stays true (workspace-closing class stays)
  → requestHostUpdate() queued

Lit re-render [microtask]
  → workspace div removed from DOM
  → workspace-closing class still active → flex constraints still holding
  → updated() → syncWorkspacePanelState() detects Phase 1 state

syncWorkspacePanelState() [still microtask, same task]
  → getBoundingClientRect() forces reflow → correct host width
  → inputAndMessagesAtMaxWidth updated
  → finalizeClosing() called
      → isContracting: false → workspace-closing class removed
      → requestHostUpdate() queued

Final Lit render [microtask, before next paint]
  → workspace div already gone
  → workspace-closing constraints released
  → at-max-width correct
  → everything lands in one frame
```

---

## Edge Cases

- **Workspace re-opened during Phase 1 gap**: `handleShowWorkspaceEnabled` calls
  `setState({ isContracting: false })`, so `finalizeClosing()`'s guard returns early.
- **`finalizeClosing()` called multiple times**: Guard at top handles this.
- **Shell disconnected during gap**: `disconnect()` cleans up independently of
  `finalizeClosing()` being called.
- **`initializeImmediateClosing()` path**: Calls `finishWorkspaceClosing()` directly —
  same Phase 1 runs, shell detects and calls `finalizeClosing()` normally.

---

## Questions

1. **`finishWorkspaceClosing` has a third caller not mentioned in Edge Cases.**
   `finishWorkspaceContraction` (line 595) calls it directly when it determines no
   contraction happened. Does this path share the same Phase 1 → shell detects → Phase 2
   flow, or does it have different timing/visual expectations that need a separate edge
   case entry?

2. **Is the `initializeImmediateClosing` two-render behavior acceptable?**
   Currently "immediate" closing finishes in one synchronous call. After the split it
   becomes Phase 1 (sync) → Lit render (microtask) → Phase 2 (microtask) → final render
   (microtask) — two renders instead of one, but both land before the next paint. Is the
   "immediate" path expected to be strictly single-render, or is "before next paint"
   sufficient?

3. **ResizeObserver double-update: design intent confirmation.**
   Phase 2 synchronously computes and sets `inputAndMessagesAtMaxWidth` via
   `getBoundingClientRect()`. After the final render the ResizeObserver will also fire
   (it observes `input-and-messages` expanding), potentially setting
   `inputAndMessagesAtMaxWidth` again. Is the intent that the ResizeObserver callback
   is a redundant no-op here (same value), or does Phase 2's explicit computation need
   to _replace_ the ResizeObserver path for the closing case?

---

## Answers

### 1. `finishWorkspaceContraction` — the third caller

This path **shares the same Phase 1 → shell detects → Phase 2 flow** without needing a separate edge case entry.

`finishWorkspaceContraction` has two branches:

- `!sawMovement` path (line 589–595): Sets `isContracting: true`, disconnects the observer, then calls `finishWorkspaceClosing()`. This is functionally identical to `initializeImmediateClosing()` — same two lines, same call order. The existing `initializeImmediateClosing` edge case already covers it.
- `sawMovement` path (line 596–611): Delegates to `startFinalContractionPolling()`, which eventually calls `finishWorkspaceClosing()` when width stabilizes. By that point the animation has already run — no special timing applies.

**Recommendation**: Broaden the `initializeImmediateClosing` edge case note to read something like: "`finishWorkspaceContraction(!sawMovement)` and `initializeImmediateClosing` both follow the same Phase 1 → Phase 2 flow." No separate entry needed for the contraction path.

---

### 2. `initializeImmediateClosing` two-render — acceptable

**"Before next paint" is sufficient.** The two-render behavior is fine for three reasons:

1. Both renders are microtasks — they both land before the browser's next paint frame, so the visual outcome is indistinguishable from a single render.
2. The `workspace-closing` flex constraints remain active between the two renders, so the intermediate committed state looks identical to the pre-commit batched state today.
3. "Immediate" in `initializeImmediateClosing` means _skip the contraction animation/polling_, not _render atomically_. A one-frame, two-microtask close is still instant from the user's perspective.

Note: today `initializeImmediateClosing` does call `setState` twice synchronously (`isContracting: true` then the full reset in `finishWorkspaceClosing`), but Lit batches them because neither render has committed yet. After the split, the first render must commit before `updated()` runs — so the two renders are genuinely sequential. The visual result is the same.

---

### 3. ResizeObserver double-update — redundant no-op, by design

**The ResizeObserver fires after the final render but is a no-op for the closing case.** This is intentional and correct:

1. Phase 2 calls `getBoundingClientRect()` synchronously before the final render, forcing a reflow against the DOM with the workspace div already gone. This gives the correct post-removal host width and sets `inputAndMessagesAtMaxWidth`.
2. The final render runs: `workspace-closing` constraints release, `input-and-messages` expands, `at-max-width` is applied.
3. The ResizeObserver fires and measures the now-expanded element. The guard `if (this.inputAndMessagesAtMaxWidth !== isAtMaxWidth)` sees no change (Phase 2 already set the same value) and skips the extra `requestUpdate`.

Phase 2's explicit computation is necessary to get `at-max-width` correct **in the same final render** rather than one render later. The ResizeObserver is not replaced — it remains the standard ongoing update path for future resizes and acts as a correctness safety net. No special handling of the ResizeObserver for the closing case is needed.
