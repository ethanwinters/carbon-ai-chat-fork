---
status: proposed
comments-by: 2026-08-13
date: 2026-08-06
deciders: '@carbon-design-system/carbon-ai-chat-developers'
consulted:
informed:
epic: https://github.com/carbon-design-system/carbon-ai-chat/issues/2030
discussion:
supersedes:
superseded-by:
---

# ADR-0005: `ChatInstance` survives the split as the composition of both halves

## Context and problem statement

[ADR-0002](0002-core-react-wrapper-headless-sdk-split.md) splits the package into a conversation layer and a view layer, and [ADR-0023](0023-sdk-prefixed-seam-types.md) names the two halves. Between them they record one assumption neither can check: that `ChatViewInstance` is a **sibling** of `ChatSDKInstance` rather than a subtype, with `ChatInstance` composing the two.

That shape only works if the instance member set actually partitions. If enough members belong to both halves, the sibling cut is decoration — the fallback is `ChatViewInstance extends ChatSDKInstance` with `ChatInstance` as a two-parent alias that decomposes nothing.

This record walks the member list and returns the verdict. The surface is 23 public members: three declared on `ChatInstance` itself, three inherited from `EventHandlers`, and seventeen from the local `ChatActions` interface (`instance/ChatInstance.ts:28` and `:60`). Two members were flagged in advance as likely straddlers: `updateCatastrophicErrorPanel`, whose error-state write is conversation work and whose panel presentation is view work, and `getState`, which bundles conversation and view fields in one return.

## Considered options

**A. `ChatInstance` survives as the composition of two sibling halves — chosen.**

`ChatInstance extends ChatSDKInstance, ChatViewInstance`, keeping every member it has today. Shell hosts see no import-line change and no member-by-member change. The type is already a two-parent composition (`extends EventHandlers, ChatActions`), so this re-cuts existing parents rather than introducing an unfamiliar shape.

The partition walk below is what qualifies this option rather than merely preferring it. It holds — with one member group assigned rather than split, one straddler resolved by refinement, and one member left on the composition alone.

**B. Retire the bare `ChatInstance` name — rejected.** Deprecate it in 1.x, delete it in 2.0.0, and make every host name the half it wants. It is the most honest statement of the split: no type spans the seam, so nobody holds one by accident. Rejected because it charges every shell host an import-line edit for a type whose member set does not change, and shell hosts are the majority. A rename with no behavior behind it is the least defensible break available.

**C. `ChatViewInstance extends ChatSDKInstance`, with `ChatInstance` as a redundant alias — rejected, and the standing fallback.** The view half as a subtype, and `ChatInstance` declared as a two-parent alias that adds nothing over `ChatViewInstance`. Same surviving name, far less work, and no partition needed — which is exactly why it was the fallback if the walk failed. Rejected because the walk succeeded: a host holding `ChatViewInstance` would also receive the entire conversation surface, so the seam would exist only in the docs. It stays the answer if a future member genuinely cannot be assigned.

**D. Keep `ChatInstance` as the name of the lean conversation half — rejected.** Let the existing name narrow to the conversation surface and give the view half a new name. No new name for the common case, and the SDK gets the good name. Rejected because it is the one option that breaks silently at scale: every shell host keeps compiling against `ChatInstance` until it touches a view member, then gets errors member by member with no import-line signal that anything moved. A break with no single edit site is the worst kind.

## Decision outcome

The instance member set partitions. `ChatInstance` survives as `extends ChatSDKInstance, ChatViewInstance` and keeps every member it has today.

**The classification.** Of 23 public members, 8 are conversation, 12 are view, 1 straddles and splits cleanly, 1 sits on the composition alone, and 1 is `@internal` and never reaches the published types:

| Half | Members |
| --- | --- |
| Conversation | `messaging`, `destroySession`, `serviceDesk` |
| Conversation, root spelling removed at 2.0.0 | `send`, `restartConversation` — [ADR-0009](0009-conversation-verbs-on-instance-messaging.md) moves both under `messaging` |
| View | `requestFocus`, `changeView`, `writeableElements`, `input`, `customPanels`, `scrollToMessage`, `doAutoScroll`, `updateIsMessageLoadingCounter`, `updateIsChatLoadingCounter`, `updateInputFieldVisibility`, `updateInputIsDisabled`, `updateAssistantUnreadIndicatorVisibility` |
| Conversation, split on the instance argument | the event bus `on` / `off` / `once` — declared over `ChatSDKInstance`, restated over the composed instance |
| Straddles, split by refinement | `updateCatastrophicErrorPanel` |
| On the composition only | `getState` — deprecated in 1.x, gone at 2.0.0 |
| `@internal`, not published | `serviceManager` |

Four members in that table already carry `@deprecated` tags today — `updateInputFieldVisibility`, `updateInputIsDisabled`, `updateAssistantUnreadIndicatorVisibility`, and the root `restartConversation`. The classification describes where they sit, not whether they survive.

**One member straddles, and it splits.** `updateCatastrophicErrorPanel` writes an error state that is conversation work and presents a panel that is view work. Each half declares its own version — the parameter widens contravariantly — and `ChatInstance` restates the combined one. It composes under `tsc --strict`. The restatement is mandatory, not stylistic: two parents declaring the same member with different types cannot be extended together at all, so every straddling member must be restated on the composed type.

**`getState` needs no half.** It is declared directly on `ChatInstance` today, on neither parent, and the split can leave it there. Nothing is lost by doing so: no code path hands out a bare `ChatSDKInstance` in 1.x — the shells hand out the composition and the config binds every callback to it — and by 2.0.0 the member is gone ([ADR-0004](0004-per-field-scoped-stores.md)). Splitting it would mean minting two public state half-types whose intersection is `PublicChatState`, to serve a member that is deprecated on arrival and never reaches either half's own surface.

**The event bus splits on its instance argument, and its enum can split too.** The handler is typed over the base `BusEvent`, not over a per-family union, so the event family appears only in the descriptor's `type` property. Narrow that property per half — a defaulted type parameter on `TypeAndHandler` — and the conversation half accepts only conversation event types, statically, while `ChatInstance` restates the full enum. Verified under `tsc --strict` at the real signature, array form and chaining included. It is additive: the halves are new types, and today's hosts see no change.

This record does not do that walk. Which events belong to which half is its own membership question — what this record did for the 23 members, a sibling record does for the event enum, and nothing in the mechanism forces it to wait for 2.0.0. Until that record lands, the conversation half carries the full enum — restated on the composition — and a headless consumer may subscribe to a view event and never receive one.

What does split is what the handler is handed. Give the handler an instance type parameter, and the conversation half can declare `on` over `ChatSDKInstance` while the composition restates it over `ChatInstance`. A full-package host's handler then still receives every member it has today. Verified under `tsc --strict`. Without that refinement the bus would quietly narrow every event handler in the product — the same break option D would have caused.

**No member moves because of the partition.** The split relocates nothing and deprecates nothing. Three members do leave `ChatInstance` at 2.0.0, each by a sibling record rather than by this one: `getState` ([ADR-0004](0004-per-field-scoped-stores.md)), and the root spellings of `send` and `restartConversation` ([ADR-0009](0009-conversation-verbs-on-instance-messaging.md)). Through 1.x the composed type is a superset of today's surface.

`ChatViewInstance` stays exported. Nothing is declared as one — the shells hand out `ChatInstance` and the SDK hands out `ChatSDKInstance` — but it is the documented name for the view half, and an unexported half makes the composition unreadable in the API reference.

### Consequences

The seam is real rather than nominal. A member added to either half is forced to declare which one it belongs to, and the composed type is what shells keep handing out.

The costs, taken knowingly:

**A straddling member is declared three times.** Once per half, once on the composition. The compiler enforces the restatement — a missing one fails the build — but it does not enforce that the composed version is the _right_ combination, so a widened parameter can drift from what either half meant. One member pays this today; every future straddler pays it too.

**View events stay subscribable from the conversation half for now — by choice, not necessity.** `on('view:change')` is available to a headless consumer that can never receive it, until the event-enum walk narrows the accepted types. That is an interim state carried by a documentation note, and the sibling record that classifies the events is what removes it.

**The conversation half is not free of view flavor.** `destroySession(keepOpenState?)` takes a view-flavored argument, and `send(message, { silent })` describes its option in terms of what the UI shows. Both were classified conversation because the action is conversation work, but the seam is not perfectly clean and a future record may want to revisit either signature.

**A future member may not partition.** The walk succeeded on today's surface, not on all possible surfaces. If a member arrives that genuinely cannot be assigned or split, option C is the fallback, and the surviving names do not change.

### For consumers

**The split changes nothing.** No import updates and no member moves because of the partition, in 1.x or in 2.0.0.

Three members do leave `ChatInstance` at 2.0.0, each decided by a sibling record rather than by this one. [ADR-0004](0004-per-field-scoped-stores.md) replaces `getState()` with per-field stores. [ADR-0009](0009-conversation-verbs-on-instance-messaging.md) moves `send` and `restartConversation` under `messaging`, removing the root spellings. All three are deprecated in 1.x first, so your editor flags them before anything disappears. None of it is a consequence of the split — the classification above describes where those members sit while they exist.

```ts
import { MessageState, ViewType, type ChatInstance } from '@carbon/ai-chat';

// unchanged across the split
async function useChat(instance: ChatInstance) {
  const answer = await callYourBackend();
  // conversation half
  await instance.messaging.upsertMessage(
    answer.id,
    MessageState.COMPLETE,
    () => answer
  );
  instance.changeView(ViewType.MAIN_WINDOW); // view half
  const { activeResponseId, input } = instance.getState(); // both halves
}
```

Callbacks keep receiving the composed instance too, because the full-package config binds the callback instance type to `ChatInstance` — see [ADR-0023](0023-sdk-prefixed-seam-types.md). So a callback that reaches for a view member keeps working:

```ts
async function customSendMessage(request, options, instance: ChatInstance) {
  instance.updateIsMessageLoadingCounter('increase'); // view member, still reachable
  const answer = await callYourBackend(request);
  await instance.messaging.upsertMessage(
    answer.id,
    MessageState.COMPLETE,
    () => answer
  );
}
```

The narrower half appears only if you adopt the headless SDK, which is new surface. There the view members are absent, and the event bus is present with view events that never fire. `getState()` does not appear at all: the SDK ships no earlier than 2.0.0, and `getState()` is gone by then — state is read through the per-field stores instead ([ADR-0004](0004-per-field-scoped-stores.md)). That is why it sits on the composition alone above, and never on a half.

## More information

- [ADR-0023](0023-sdk-prefixed-seam-types.md) — the seam vocabulary and the curried callback types this record's consumer story depends on.
- [ADR-0002](0002-core-react-wrapper-headless-sdk-split.md) — the package split these halves belong to.
- [ADR-0004](0004-per-field-scoped-stores.md) — the per-field read model, which deprecates `getState()` independently of this split.
- Sibling record, forthcoming: the event-enum walk — which events belong to which half, over the descriptor signature verified here.
