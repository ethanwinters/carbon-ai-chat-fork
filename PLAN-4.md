# PLAN-4 — B1: opt-in keep-alive (registry + re-attach + `onAttach`)

**Depends on:** PLAN-2 (disposal), PLAN-3 (grace timer). **Blocks:** nothing.
**Public API:** adds `keepAlive?: boolean` + `onAttach?(instance)` (additive). **Semver:** `feat`.

## Goal

When `keepAlive: true`, a host unmount/remount **reuses the live in-memory instance** (and its conversation) instead of booting a fresh one — fixing #1650 on both surfaces, including React 19 StrictMode. Default `false` (today's behavior). Becomes the default and the flag is removed in 2.0.

## Background (verified)

- Boot: `initServiceManagerAndInstance` (`src/chat/utils/chatBoot.ts:93-153`) → `createServiceManager` (`:105`); binds `serviceManager.container = container` (`:108`) + boot-container classes (`:111-120`).
- Conversation is in-memory volatile (`assistantMessageState` / `allMessagesByID` / `allMessageItemsByID`); `doHydrateChat` guards with `alreadyHydrated` (`src/chat/services/ChatActionsImpl.ts:264`), so reuse will not re-call `customLoadHistory`.
- React surface: portal into `container` with `key="stable-chat-instance"` (`src/react/ChatContainer.tsx:374-390`); `container`/`wrapper`/`currentInstance` state.
- WC surface: `cds-aichat-internal` owns the root (`ensureReactRoot :117-131`).
- Identity: `namespace` (`src/types/config/PublicConfig.ts:131-134`) — already required-unique per chat.

## Approach

### 1. Framework-agnostic registry module — new `src/chat/utils/keepAliveRegistry.ts`

Plain TS, `isBrowser()`-guarded. Maps `namespace → { serviceManager, refCount, disposeTimer }`.

- `acquire(namespace): ServiceManager | undefined` — return a live entry, `refCount++`, cancel any pending `disposeTimer`.
- `register(namespace, serviceManager)` — store a freshly-created SM (refCount 1).
- `release(namespace, graceMs, dispose)` — `refCount--`; at 0, start `disposeTimer` that runs `dispose()` (→ PLAN-2 `unloadServices`) + evicts; cancel on a later `acquire`. (This is PLAN-3's primitive, generalized.)
- Concurrent same-namespace `acquire` while another live mount holds refCount → `consoleError` dev-error (fan-out, not sequential remount — unsupported).
- No storage, no React. Survives the future React→Lit migration.

### 2. Reuse-or-create in boot (`chatBoot.ts`)

In `initServiceManagerAndInstance`, gate on `publicConfig.keepAlive`:

- If `keepAlive` and `registry.acquire(ns)` returns an SM → **reuse it** (skip `createServiceManager`, skip hydration — `alreadyHydrated` is already true). Then run **re-attach** (below).
- Else create as today, and when `keepAlive`, `registry.register(ns, sm)`.

### 3. Re-attach to the NEW mount (the primary risk)

A remount creates a new `container` (new portal div / new shadow root). Reuse must:

- Re-point `serviceManager.container = container` (`chatBoot.ts:108`) + re-apply boot-container classes (`:111-120`); update `mainWindow`/`appWindow`/`customHostElement`.
- Re-render the existing React tree into the new container (React: ensure the portal targets the reused SM's tree; WC: `ensureReactRoot` into the new shadow root).
- Restore focus/scroll where appropriate; ensure the old shadow root isn't left orphaned.
- Reconcile DOM that the SM created (writeable-element slots, markdown plugin hosts) against the reused SM's existing `writeableElements` — no duplicates.
- Keep React-specific bits in `ChatContainer.tsx` thin (future-proofing). **Test this hard.**

### 4. Reconnection callback — `onAttach` (resolves the reconnect fork)

- `onBeforeRender`/`onAfterRender` stay **boot-once** (awaitable first-render gates) — NOT re-fired on reuse.
- Add `onAttach?(instance): void` to `PublicConfig`, fired on **every** mount/attach (first boot and each reuse), synchronous, cross-surface. Hands the current host component the (same) instance to capture / drive imperative calls.
- Reuse returns the SAME instance object, so a consumer doing `setInstance(instance)` sees a stable reference → no `[chatInstance]`-effect churn (the reporter's exact trigger disappears).
- Docs guidance: register event handlers in an effect with `instance.off` cleanup (or via `onAttach` returning cleanup), NOT inside `onBeforeRender` — handlers registered there persist on the reused instance and go stale. The framework should also clear **consumer-registered** handlers on detach (PLAN-2 `eventBus.clear()`); ensure the chat's OWN internal handlers are re-established on re-attach if cleared.

### 5. Detach / dispose lifecycle

- On unmount/detach with `keepAlive`: `registry.release(ns, GRACE_MS, () => unloadServices(sm))`.
  - Remount within grace → `acquire` cancels disposal (reuse).
  - Past grace → disposed + evicted (no leak).
- `instance.destroy()` (PLAN-2) → dispose immediately + evict, skipping grace.
- `keepAlive:false` → never register; dispose immediately on unmount (PLAN-2 path). Outcome unchanged, no leak.

### 6. Public config (`PublicConfig.ts`)

- `keepAlive?: boolean` — JSDoc: opt-in; reuse the in-memory instance across host remounts so the conversation survives; to reset use `restartConversation()`/`destroySession()`; **temporary — becomes the default and is removed in 2.0**. `@category Config`.
- `onAttach?(instance: ChatInstance): void` — JSDoc: fired on every mount (including keep-alive re-attach); use to capture the instance / (re)wire host integration. Distinct from `onBeforeRender` (boot-once). `@category Config`.

## Edge cases / risks

- **DOM re-attach** is the crux (focus, scroll, shadow root, slotted writeable elements, markdown plugin hosts). Test explicitly.
- **StrictMode**: with `keepAlive`, the double-mount `acquire`s the same SM twice within the grace window → `bootCount===1`, same instance (vs 2 today). Verify refCount math survives mount→unmount→mount.
- **Stale consumer handlers** across reuse — mitigated by clearing consumer handlers on detach + `onAttach` re-wire guidance; ensure the chat's own internal handlers survive/re-establish.
- **Concurrent same-namespace** mounts → dev-error (fan-out unsupported).
- **`keepAlive` does NOT override an explicit `instance.destroySession()`** a consumer calls on unmount — that still tears down the session (their bug, not ours).
- **Grace value**: small default (e.g. a few seconds), tunable constant — long enough for StrictMode + route transitions, short enough to release memory.

## Tests

Reuse `remountPersistence_spec.tsx` + the `refactorRemount` / `reporterStrict` harness patterns.

- `keepAlive` + `<React.StrictMode>` → `bootCount===1`, same `serviceManager`; `onAttach` fired each mount with the same instance; `onBeforeRender` fired once.
- `key`-change / component-in-render / conditional-render remount with `keepAlive` → `assistantMessageState.messageIDs` preserved; re-attach renders into the new container; input focusable; no orphaned shadow root; no duplicated writeable-element slots.
- Grace eviction: remount within grace → reuse; past grace (advance timers) → disposed, zero leaked listeners; next mount is a cold boot (calls `customLoadHistory`).
- `keepAlive:false` (default) → fresh instance each mount + full disposal (no leaked listeners).
- Concurrent same-namespace mount → dev-error.
- Reuse does NOT re-call `customLoadHistory` (spy).

## Definition of done

- `keepAlive:true` survives StrictMode + structural remounts on both surfaces with the conversation intact and a clean re-attach.
- `keepAlive:false` unchanged in outcome (now leak-free).
- `onAttach` + `keepAlive` documented (temporary flag noted; boot-once contract preserved).
- Tests green; build clean; `examples/react/basic` StrictMode smoke passes.
