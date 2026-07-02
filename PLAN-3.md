# PLAN-3 — A2: deferred/cancelable teardown at the element boundary

**Depends on:** PLAN-2 (`unloadServices`). **Blocks:** PLAN-4 (shares the grace timer).
**Public API:** none. **Semver:** internal.

## Goal

Stop a **transient** disconnect from tearing the chat down. Today `cds-aichat-internal.disconnectedCallback` synchronously `root.unmount()`s (and, after PLAN-2, would synchronously dispose). Defer teardown by a tick and cancel it if the element reconnects (DOM move, StrictMode host remount). Provide a small, reusable "schedule dispose, cancel on reconnect" primitive that PLAN-4 generalizes into the namespace registry.

## Background (verified)

- `src/web-components/cds-aichat-container/cds-aichat-internal.tsx:133-136`:
  ```ts
  disconnectedCallback(): void { this.root?.unmount(); super.disconnectedCallback(); }
  ```
  No `connectedCallback` re-init guard; `updated()` (`:82-91`) re-renders on reconnect + prop-change → a fresh boot (old ServiceManager orphaned).
- The root is created once and reused (`ensureReactRoot` `:117-131`; `this.root` / `this.reactContainer`).
- Custom elements receive `disconnectedCallback`/`connectedCallback` synchronously on DOM moves and framework churn.

## Approach

1. In `cds-aichat-internal.tsx`, add a private `#pendingTeardown?: ReturnType<typeof setTimeout>` and a small `TEARDOWN_DEFER_MS` (0 or one animation frame — must be cancelable, so `setTimeout`, not `queueMicrotask`).
2. `disconnectedCallback`: schedule instead of unmounting synchronously:
   ```ts
   this.#pendingTeardown = setTimeout(() => {
     detach(this.serviceManager); // PLAN-2 dispose entrypoint (PLAN-4 overrides to ref-count)
     this.root?.unmount();
     this.root = undefined;
     this.reactContainer = undefined;
     this.#pendingTeardown = undefined;
   }, TEARDOWN_DEFER_MS);
   super.disconnectedCallback();
   ```
3. `connectedCallback`: if `#pendingTeardown` is set, `clearTimeout` + null it — the element reconnected, keep the live root/instance. Do NOT create a second root: `ensureReactRoot` reuses `this.root`/`this.reactContainer` while set, so simply not nulling them until the deferred teardown runs preserves them.
4. Factor the defer/cancel into a tiny reusable helper so PLAN-4's registry timer can subsume it (one "schedule dispose with cancel-on-reattach" primitive).

## Interaction with PLAN-2 & PLAN-4

- The deferred callback is where PLAN-2's disposal runs, so a **real** removal still fully disposes (no leak) — just one tick later.
- With `keepAlive:true` (PLAN-4), the timer's action becomes the registry's ref-counted eviction, not an unconditional `unloadServices`. Structure so PLAN-4 swaps the callback body.
- **Must ship with PLAN-2 wired here.** Adding synchronous disposal to `disconnectedCallback` WITHOUT this defer would make transient detaches strictly more destructive than today; the defer is what makes disposal safe on this surface.

## React-surface note

This helps the **WC surface** (Lit owns the root). The React `ChatContainer` portal is React-owned; its transient-remount resilience comes from PLAN-4's namespace registry (which sits above React's reconciler), not from this defer. Keep this step WC-scoped.

## Tests (`tests/web-components/spec/wcDeferredTeardown_spec.ts`)

- Register `cds-aichat-container`, append to `document.body`, boot, capture `serviceManager` (via `exposeServiceManagerForTesting`).
- `remove()` then immediately re-append (synchronously, before the timer) → same `serviceManager`/root persists; `bootCount` stays 1; no `unloadServices`.
- `remove()` then advance timers → teardown ran: root unmounted, `unloadServices` called.
- Rapid connect/disconnect cycles → single pending handle, no double-teardown.

## Definition of done

- Transient WC detach+reattach preserves the instance; a real removal disposes one tick later.
- Tests green; build clean.
