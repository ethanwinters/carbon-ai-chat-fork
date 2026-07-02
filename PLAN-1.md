# PLAN-1 — A1: debug-only re-boot warning

**Depends on:** nothing. **Blocks:** nothing. Independent — land any time.
**Public API:** none. **Semver:** internal (diagnostic only).

## Goal

When the chat boots more than once for the same `namespace` within a page session, emit a **one-time, debug-gated** `[Chat]` console warning telling the developer their host is unmounting/remounting the chat (React StrictMode, a changing `key`, a component defined inside render, or conditional rendering). With `keepAlive:false` (default) a remount discards the conversation; the warning points them at fixing the remount or setting `keepAlive:true`. Pure diagnostic — no behavior change.

## Background (verified)

- Boot happens in `initServiceManagerAndInstance` (`src/chat/utils/chatBoot.ts:93-153`); each boot calls `createServiceManager` (`:105`). A remount → new boot → new ServiceManager.
- `publicConfig` (and thus `publicConfig.debug` and `publicConfig.namespace`) is in scope there.
- Existing one-time module-flag pattern to mirror: `bootContainerRulesInstalled` (`chatBoot.ts:20`, used by `ensureBootContainerStyleRules` `:28-41`).
- Existing warning to mirror: `warnUnstableProp` (`src/chat/ChatAppEntry.tsx:144-159`) — gated on `config.public.debug`, deduped via a `Set`, emits `consoleWarn`.
- `consoleWarn` (`src/chat/utils/miscUtils.ts:69`) auto-prefixes `[Chat]`.

## Approach

1. Add module-level state near `bootContainerRulesInstalled` in `chatBoot.ts`:
   ```ts
   const bootDiagnosticsByNamespace = new Map<
     string,
     { count: number; warned: boolean; lastBootMs: number }
   >();
   const STRICTMODE_WINDOW_MS = 50;
   ```
2. In `initServiceManagerAndInstance`, right after `createServiceManager` (`:105`):
   - `const ns = publicConfig.namespace ?? "";`
   - Read/create the entry; capture `prevLastBootMs`; set `count++`, `lastBootMs = Date.now()`.
   - Warn only when **all** hold: `count >= 2` AND `publicConfig.debug` AND `!warned` AND `Date.now() - prevLastBootMs > STRICTMODE_WINDOW_MS`. Then set `warned = true`.
3. Message (sentence style; `consoleWarn` adds `[Chat]`):
   > The chat re-initialized for namespace "&lt;ns&gt;". Its host element was unmounted and remounted (React StrictMode, a changing `key`, a component defined inside render, or conditional rendering). Mount the chat once and keep it mounted — toggle visibility with CSS or the view API. To make a remount reuse the existing conversation, set `keepAlive: true`.
4. Keep it plain-module / framework-agnostic (no React).

## Edge cases

- **StrictMode first double** (dev): two boots within ~ms → suppressed by the window check. A genuine later remount (user interaction, seconds later) is outside the window → warns. Comment the heuristic as best-effort.
- **Multiple independent chats**: keyed by namespace, so distinct chats don't cross-trigger. Multiple default-`""` chats already collide on session storage (unsupported), so acceptable.
- Fires at most once per namespace per page session (`warned` flag).
- `Date.now()` is fine here (production code, not a workflow script).

## Tests (`tests/utils/spec/rebootWarning_spec.ts`, alongside `chatBoot_spec.ts`)

- `jest.spyOn(console, "warn")`. Two boots, same namespace, `debug:true`, spaced beyond the window (inject/advance time) → exactly one warning after the second boot.
- `debug:false` → zero warnings.
- Two boots within the window → zero warnings (StrictMode suppression).
- Further boots after the first warning → still only one (once-per-namespace).
- Optional integration: `<React.StrictMode><ChatContainer/></React.StrictMode>` with `debug` → the StrictMode double does NOT warn; a later manual remount does (reuse the `reporterStrict` harness pattern).

## Definition of done

- Behaves per tests; silent when `debug:false`.
- `npm run test --workspace=@carbon/ai-chat` green; `npm run build --workspace=@carbon/ai-chat` clean.
- No new public API.
