# PLAN — Survive a parent re-mount in `@carbon/ai-chat` (opt-in keep-alive)

## How to use these documents

- **This file is the overview.** Each implementation step has its own detail file with rationale, exact edits, tests, and a definition of done:
  - [PLAN-1.md](PLAN-1.md) — **A1** debug re-boot warning (independent)
  - [PLAN-2.md](PLAN-2.md) — **A3** real teardown / `unloadServices()` + `instance.destroy()` (foundational)
  - [PLAN-3.md](PLAN-3.md) — **A2** deferred/cancelable teardown at the custom-element boundary (grace mechanism)
  - [PLAN-4.md](PLAN-4.md) — **B1** opt-in keep-alive registry + re-attach + `onAttach` (the fix)
- **Dependency order:** `PLAN-2 → PLAN-3 → PLAN-4`. `PLAN-1` is independent and can land any time.
- **Scope:** this is a substantial follow-on to the "no unneeded re-renders" work. Recommend a dedicated branch/PR rather than bundling into that one. Package: `packages/ai-chat`.
- Line references were captured against the `web-component-prop-change-fix` branch and may drift by a few lines — treat them as signposts, confirm before editing.

## Context

Issue [#1650](https://github.com/carbon-design-system/carbon-ai-chat/issues/1650): a consumer's cleanup —

```tsx
useEffect(() => {
  /* connect websocket */
  return () => {
    sessionStorage.clear();
    chatInstance?.destroySession();
  };
}, [chatInstance]);
```

— fired when their chat-hosting component **re-mounted** (a props refactor / React 19 StrictMode), destroying the session and aborting the in-flight request ("Conversation restarted"). Investigation (verified with Jest repros on this branch, `main`, and `v1.7.0`) established:

- A parent **re-render** does NOT blow up the chat — already handled (reference reconciliation, memoized tree, `key="stable-chat-instance"`, web-component `deepChanged`). Toggling props keeps `bootCount=1`, instance stable.
- A parent **re-mount** DOES: the chat boots a fresh instance and **loses the conversation** (messages are volatile; a cold boot shows welcome/home). React 19 StrictMode double-mounts, so this even bites on first load (`bootCount=2` verified). React can't be stopped from unmounting us — so the fix is to **keep the instance alive across the unmount and re-attach it on remount**.

## Verified problems on re-mount

1. **Conversation is volatile.** Messages live in `assistantMessageState` / `allMessagesByID` / `allMessageItemsByID` (`src/types/state/AppState.ts`); NOT persisted. Only `persistedToBrowserStorage` (view / launcher / disclaimers / home-screen flags) is written to sessionStorage (`src/chat/store/subscriptions.ts` `copyToSessionStorage`). On boot, `HistoryService.loadHistory` (`src/chat/services/HistoryService.ts:43-71`) returns `null` unless `messaging.customLoadHistory` is configured → `ChatActionsImpl.ts:282` shows welcome. **A remount is destructive by default.**
2. **ServiceManager + subscriptions leak on unmount.** The five `store.subscribe(...)` calls (`src/chat/services/loadServices.ts:59-79`) discard their unsubscribe handles; there is no `unloadServices()` / `instance.destroy()`. The only unmount cleanup (`src/chat/ChatAppEntry.tsx:350-354`) removes window listeners + `themeWatcherService.stopWatching()`. (`AGENTS.md` documents an `unloadServices()` / `ChatInstanceImpl.destroy()` that do not exist — doc/code drift to fix.)
3. **No transient-disconnect resilience.** WC surface: `cds-aichat-internal.tsx:133-136` `disconnectedCallback` immediately `root.unmount()`s. React surface: the portal unmounts immediately (`ChatContainer.tsx:374`). No defer / reconnect handling anywhere.

## Decision

**Ship the fix now as opt-in; make it the default and remove the flag in 2.0.**

- Keep-alive is gated behind a new **`keepAlive?: boolean` (default `false`)** on `PublicConfig`. `keepAlive: true` enables reuse across host remounts.
- Default-off ⇒ **purely additive, non-breaking** (`feat`): no existing consumer's behavior changes, and keep-alive can be validated in the wild before it becomes default.
- **2.0:** make keep-alive unconditional and remove the `keepAlive` flag. Its JSDoc must say so from day one (temporary; becomes default / removed in 2.0).
- **A1 and A3 apply regardless of `keepAlive`:** A1 (debug warning) helps default consumers discover accidental remounts and points them at `keepAlive`; A3 (teardown) fixes the existing leak for everyone — **immediate** disposal when `keepAlive:false`, **grace-deferred** disposal when `keepAlive:true`.
- **Identity = `namespace`** (`src/types/config/PublicConfig.ts:131-134`) — already required-unique per chat for multi-chat pages, so it is a ready-made key. The single default-`""` chat is the only unkeyed case, and there is exactly one of it, so no collision.

## Architecture constraints (must hold in every step)

The maintainer intends to eventually reduce React in `@carbon/ai-chat` to a thin wrapper (like `@carbon/ai-chat-components`), with the core as framework-agnostic Lit/web-components. That migration is **out of scope here**, but nothing in this work may obstruct it:

1. **Framework-agnostic lifecycle.** The keep-alive registry + grace-period dispose live in a new plain-TS module (namespace → `ServiceManager`), reachable from `chatBoot.ts`. No React in it.
2. **Anchor attach/detach at the custom-element boundary.** The Lit host owns the React root (WC: `cds-aichat-internal`); keep the React `ChatContainer` portal bits thin and swappable. Do NOT build keep-alive state machines inside React hooks (`ChatAppEntry`).
3. **Reconnection is a cross-surface config callback, not a React ref/context.** `onBeforeRender` / `onAfterRender` stay **boot-once** (they are awaitable first-render gates). Add a small **`onAttach?(instance)`** config callback that fires on every mount to hand the (same) instance to the current host component. Works identically on both surfaces, now and after the migration. (This resolves the reconnection fork — see PLAN-4.)

## Non-goal — never persist conversation text to browser storage

Conversation content is **never** written to browser storage, by design: message text can contain credentials / PII, and sessionStorage/localStorage outlive a logout and leak on shared machines. This already holds today (only non-content UI state is persisted). Keep-alive is **in-memory only** (a JS module registry) and upholds it. Keep-alive is therefore an **in-session** mechanism — it survives React remounts (the #1650 case) but intentionally NOT a full page reload. Cross-reload restore stays the consumer's responsibility via `messaging.customLoadHistory`. **Do not add message persistence to browser storage.**

## Steps at a glance

| Step                | What                                                                         | Depends on     | Public API?                              |
| ------------------- | ---------------------------------------------------------------------------- | -------------- | ---------------------------------------- |
| [PLAN-1](PLAN-1.md) | A1 — debug re-boot warning                                                   | —              | no                                       |
| [PLAN-2](PLAN-2.md) | A3 — `unloadServices()` + `ChatInstanceImpl.destroy()`; fix the unmount leak | —              | `+ instance.destroy()` (additive)        |
| [PLAN-3](PLAN-3.md) | A2 — deferred/cancelable teardown at the element boundary                    | PLAN-2         | no                                       |
| [PLAN-4](PLAN-4.md) | B1 — opt-in keep-alive registry, re-attach, `onAttach`                       | PLAN-2, PLAN-3 | `+ keepAlive?`, `+ onAttach?` (additive) |

## Critical files (aggregate)

- `src/chat/utils/chatBoot.ts` — A1 boot counter; B1 reuse-or-create in `initServiceManagerAndInstance`.
- `src/chat/services/loadServices.ts` — capture subscribe handles; add `unloadServices()`.
- `src/chat/services/ServiceManager.ts` — `storeUnsubscribers` field; `destroy`/container-rebind plumbing.
- `src/chat/services/MessageService.ts` — add `dispose()` (abort controllers).
- `src/chat/instance/ChatInstanceImpl.ts` — add `destroy()`.
- `src/chat/ChatAppEntry.tsx` — wire teardown/attach into `useOnMount` cleanup (`:350-354`).
- `src/web-components/cds-aichat-container/cds-aichat-internal.tsx` — A2 defer/cancel; registry attach on reconnect.
- `src/react/ChatContainer.tsx` — B1 registry integration + portal re-attach (thin).
- `src/types/config/PublicConfig.ts` — `keepAlive?` (temporary) + `onAttach?(instance)`.
- `AGENTS.md` / `src/types/AGENTS.md` — fix `unloadServices`/`destroy` drift; document keep-alive lifecycle.

## Global verification

- `npm run test --workspace=@carbon/ai-chat`
- `npm run build --workspace=@carbon/ai-chat`
- Visual smoke: `examples/react/basic` under `<React.StrictMode>` — with `keepAlive`, remount and confirm the conversation persists and the input re-attaches (focusable, no orphaned shadow root).
- Existing investigation harnesses to reuse as templates: `tests/config/spec/remountPersistence_spec.tsx` (scratch — see Cleanup), plus the `refactorRemount` / `reporterStrict` patterns described in the step files.

## Cleanup

An untracked scratch spec `packages/ai-chat/tests/config/spec/remountPersistence_spec.tsx` landed during planning. Remove it, or fold its "remount loses the conversation" assertion into the PLAN-4 keep-alive tests.
