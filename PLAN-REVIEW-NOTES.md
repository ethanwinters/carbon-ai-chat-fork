# PLAN review — working notes (decisions + verified corrections)

Scratch file for the keep-alive plan review. Decisions get baked into PLAN\*.md once all questions are answered (do not edit PLAN files mid-questioning). Delete when done.

## Locked decisions

- **Q1 — Re-attach architecture: REFRAME to "cache SM, rebuild tree."** PLAN-4 step 3's "reuse the live React tree, re-point into new container" is infeasible on the React surface (host remount unmounts ChatContainer's createPortal subtree; React can't relocate a live fiber tree). New design: on keepAlive unmount, cache the live ServiceManager in the registry instead of disposing; on remount SKIP boot — reassign `serviceManager.container` to the new div + re-apply boot classes ([chatBoot.ts:108-120](packages/ai-chat/src/chat/utils/chatBoot.ts#L108)), rehydrate from store (no reboot), re-slot `writeableElements` via the onBeforeRenderOverride path, re-apply focus/scroll from state. React tree is rebuilt cheaply against the reused SM, NOT physically moved. Applies to both surfaces.

## Verified corrections to bake into PLAN files

- **C16 (PLAN-2):** FOUR `store.subscribe` calls, not five ([loadServices.ts:59-79](packages/ai-chat/src/chat/services/loadServices.ts#L59)); "theme-original tracker" is a plain `let`, not a subscription. Capture 4 handles; test expects 4 removed.
- **C18 (PLAN-2):** `EventBus` is at [chat/events/EventBus.ts](packages/ai-chat/src/chat/events/EventBus.ts) (off:200, clear:255), not `chat/services/EventBus.ts`.
- **C24 (PLAN-2) CONTRADICTED:** `applyConfigChangesDynamically` is in [dynamicConfigUpdates.ts:54](packages/ai-chat/src/chat/utils/dynamicConfigUpdates.ts#L54), not ChatActionsImpl; its `endChat(true,true,false)` SHOWS the agent-left message. No silent path to mirror — need a genuinely silent end (see Q3).
- **C27 (PLAN-3) CONTRADICTED:** `updated()` re-renders the SAME reused root; no fresh boot, no orphaned SM. Sub-bug: disconnectedCallback leaves `this.root` set → later `.render()` on unmounted root; PLAN-3 must null `this.root`+`this.reactContainer` only when a real teardown fires, not when cancelled.
- **C32 (PLAN-4):** `onBeforeRender`/`onAfterRender` are per-surface props ([ChatContainer.ts:367,376](packages/ai-chat/src/types/component/ChatContainer.ts#L367) + WC wrapper), NOT PublicConfig. Boot-once behavior accurate. (drives Q2)
- **C9 (PLAN.md Decision):** `namespace` is optional (`namespace?: string`, [PublicConfig.ts:139](packages/ai-chat/src/types/config/PublicConfig.ts#L139)), not "required-unique"; 30-char limit. Registry keys on `namespace ?? ""`; default-"" case already handled.
- **C10a (PLAN-1):** "bootCount" is a test-only concept, not a source symbol. Drop that framing.
- **Public API / src/types/AGENTS.md bar (PLAN-2/PLAN-4):** `instance.destroy()` must be declared on public [ChatInstance.ts:481](packages/ai-chat/src/types/instance/ChatInstance.ts#L481) (not just impl) with `@category Instance` + a titled `@example`. keepAlive/onAttach need `@category Config` + property JSDoc (tagging = Q4). PublicConfig already re-exported from aiChatEntry/serverEntry, so no new export needed.
- **Hydration guards (PLAN-4):** primary re-entry guard is store-level `isHydrated` in `changeView` ([ChatActionsImpl.ts:1802](packages/ai-chat/src/chat/services/ChatActionsImpl.ts#L1802)) + `hydrationPromise` memo; `alreadyHydrated`:264 is secondary. Don't attribute skip-hydration to alreadyHydrated alone.
- **WC real-remount (PLAN-4):** "reuse into a new shadow root via ensureReactRoot" is infeasible for a genuine remount (new element instance, fresh this.root/reactContainer). Reuse works via element-instance reparent (PLAN-3 path) or a holder outliving the element.
- **Doc-fix target (PLAN-2 step 6):** the drift is in `packages/ai-chat/AGENTS.md` + `references/services.md` (now issue #1681), NOT root/`src-types` AGENTS.md.

## Open questions

- [x] Q1 — re-attach architecture → cache SM, rebuild tree
- [ ] Q2 — onAttach placement
- [ ] Q3 — human-agent teardown behavior
- [ ] Q4 — keepAlive JSDoc tagging
- [ ] Q5 — eventBus clear-on-detach scope
