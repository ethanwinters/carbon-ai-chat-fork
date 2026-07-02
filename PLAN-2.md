# PLAN-2 — A3: real teardown (`unloadServices()` + `ChatInstanceImpl.destroy()`)

**Depends on:** nothing. **Blocks:** PLAN-3, PLAN-4 (both reuse this disposal).
**Public API:** adds `instance.destroy()` (additive). **Semver:** `feat`.

## Goal

Give the chat a real teardown so an unmount stops leaking. Today the ServiceManager, its store subscriptions, event-bus handlers, message service, and human-agent service are orphaned on unmount. Add an **exhaustive, idempotent** `unloadServices(serviceManager)` plus a public `instance.destroy()`, and dispose on unmount. This is the "dispose" half that PLAN-3 defers and PLAN-4 ref-counts.

## Background (verified)

- `createServiceManager` (`src/chat/services/loadServices.ts:38-136`) calls `store.subscribe(...)` five times (`:59-79`) — `copyToSessionStorage`, `fireStateChangeEvent`, `refreshLocalizationOnChange`, a theme-original tracker, and the theme subscription — and **discards every unsubscribe handle**. `store.subscribe` returns a real `() => listeners.delete(listener)` (`src/chat/store/appStore.ts:149-154`).
- `EventBus` already has `off()` and `clear()` (`src/chat/services/EventBus.ts`, `clear()` ~`:255`).
- `ThemeWatcherService.stopWatching()` exists (`src/chat/services/ThemeWatcherService.ts:114`).
- `MessageService` holds AbortControllers (`src/chat/services/MessageService.ts:200,474`) with no dispose.
- Human-agent service created in boot (`chatBoot.ts:130`).
- Current unmount cleanup: `src/chat/ChatAppEntry.tsx:350-354` (`useOnMount` return) removes window/document listeners + `themeWatcherService.stopWatching()` only.
- `ChatInstanceImpl` (`src/chat/instance/ChatInstanceImpl.ts`) — `destroySession` at ~`:357` (conversation-level; keep it separate from instance-level `destroy`).
- `AGENTS.md` already references `unloadServices()` / `ChatInstanceImpl.destroy()` that don't exist (drift to fix).

## Approach

1. **Capture unsubscribers.** Add `storeUnsubscribers: Array<() => void>` to `ServiceManager` (`ServiceManager.ts`, near `restartCount:154`). In `loadServices.ts`, push each `store.subscribe(...)` return (all five, `:59-79`) into it.
2. **`MessageService.dispose()`.** Abort all outstanding AbortControllers and clear the queue (reuse existing `clearCurrentQueueItem` / the controller map at `:200,474`). Idempotent.
3. **`unloadServices(serviceManager)` in `loadServices.ts`:**
   - Call + clear `storeUnsubscribers`.
   - `serviceManager.eventBus.clear()`.
   - `serviceManager.themeWatcherService?.stopWatching()`.
   - `serviceManager.messageService?.dispose()`.
   - `serviceManager.messageUpsertCoordinator?.clearAll()`.
   - Human-agent teardown: if a chat is active, **quiet-end** it (mirror the quiet-end used by `applyConfigChangesDynamically`); else detach listeners. Null-guard.
   - Null cross-refs (`instance`, `mainWindow`, `appWindow`, `container`, `customHostElement`).
   - Safe to call twice (idempotent); must not throw if partially initialized.
4. **`ChatInstanceImpl.destroy()`** (near `destroySession`) → `unloadServices(serviceManager)`. Public, additive. JSDoc: disposes the instance + services immediately; distinct from `destroySession` (which only clears the conversation/session). `@category Instance`.
5. **Dispose on unmount.** In `ChatAppEntry.tsx:350-354` cleanup, after existing listener removal, dispose. Structure the call through a single `detach(serviceManager)` entrypoint so PLAN-3/PLAN-4 can intercept it (defer / ref-count). **In PLAN-2 alone**, `detach` = immediate `unloadServices` (correct for `keepAlive:false`, the default).
6. **Fix `AGENTS.md` / `src/types/AGENTS.md`** so the documented `unloadServices`/`destroy` now exist and match.

## Edge cases / risks

- **Idempotency is critical.** A post-teardown store dispatch or a MessageService abort firing against a disposed store must not throw. The store listener loop swallows listener exceptions (`appStore.ts:138-144`), but service callbacks must null-guard.
- **StrictMode churn** (keepAlive:false): boot → dispose → boot. Correct but wasteful; acceptable (default outcome unchanged, just no longer leaks). PLAN-4 removes the churn for `keepAlive:true`.
- **Human-agent quiet teardown** must NOT surface a user-facing "agent ended" message — use the silent end path.

## Tests (`tests/services/spec/unloadServices_spec.ts`)

- Boot via `initServiceManagerAndInstance`; after `unloadServices`: store listener count = 0 (spy on `subscribe` or add a test-only getter), `eventBus` handler map empty, theme observer disconnected, outstanding MessageService controllers aborted, `messageUpsertCoordinator` cleared.
- Idempotent: call `unloadServices` twice → no throw.
- `instance.destroy()` routes to `unloadServices`.
- Regression: `<React.StrictMode><ChatContainer/></React.StrictMode>` (keepAlive:false) → after settle, exactly one live ServiceManager and the discarded first instance leaves zero store listeners.

## Definition of done

- `unloadServices` + `MessageService.dispose` + `instance.destroy` implemented, exhaustive + idempotent.
- Unmount disposes (keepAlive:false path) with no leaked listeners.
- AGENTS.md drift fixed.
- Tests green; build clean.
