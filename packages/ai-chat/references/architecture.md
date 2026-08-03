# architecture.md — `@carbon/ai-chat` layer boundaries

Load this when working across the React/Lit boundary (custom-element host, shadow DOM, slot projection), or when editing anything under the framework-agnostic core (`src/chat/{services,store,events,instance,schema,sdk}/`). Routine React or store work doesn't need it.

Two boundaries run through this package, and they are enforced differently:

| Boundary | Separates | Enforced by |
| --- | --- | --- |
| [React/Lit](#the-boundary) | the Lit custom-element host from the React tree it mounts | convention + the shadow-root handshake |
| [SDK](#sdk-boundary) | the framework-agnostic core from the view and boot layers | an ESLint fence + an import-graph spec |

## The boundary

```
React API (ChatContainer, ChatCustomElement)
    ↓
Lit Custom Element Host (@carbonElement decorator)
    ↓
Shadow Root (encapsulation boundary)
    ↓
React Portal Mount Point (.cds-aichat--react-app div)
    ↓
React Application Components
```

## How it works

1. **Lit host**: [`ChatContainerReact`](../src/react/ChatContainer.tsx#L40) is a Lit custom element decorated with `@carbonElement("cds-aichat-react")`.
2. **React wrapper**: [`createComponent()`](../src/react/ChatContainer.tsx#L60) from `@lit/react` wraps the Lit host for React consumers.
3. **Shadow DOM setup**: the Lit host creates a shadow root and emits `"shadow-ready"` in [`firstUpdated()`](../src/react/ChatContainer.tsx#L52).
4. **React portal**: [`ChatContainer`](../src/react/ChatContainer.tsx#L183) waits for shadow root, creates a mount div, and portals the React app into it.
5. **Extensibility**: user-defined content crosses the boundary via slots, never direct shadow DOM manipulation.

## When to work in each layer

| Layer | Files | Concerns |
| --- | --- | --- |
| Lit | [src/react/ChatContainer.tsx](../src/react/ChatContainer.tsx), [src/react/ChatCustomElement.tsx](../src/react/ChatCustomElement.tsx) | Custom element registration & lifecycle, shadow DOM setup, slot projection, global style injection |
| React | everything else under [src/](../src) | Application logic, state, UI components, store integration, service orchestration |

## Common patterns

**Passing data into shadow DOM** — the Lit host receives props; the React portal reads from the host:

```typescript
<cds-aichat-react .config=${config} />

const config = wrapperElement.config;
```

**Passing content out via slots** — React creates a slotted element; the Lit host projects it:

```typescript
const element = document.createElement('div');
element.setAttribute('slot', 'user-defined-response');
wrapper.appendChild(element);

<slot name="user-defined-response"></slot>
```

## Debugging across the boundary

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Shadow root not ready | `"shadow-ready"` listener attached after the event fired, or event never emitted | Verify the listener is attached before the host's `firstUpdated()`; check the browser console for shadow DOM errors |
| React not rendering | Mount div missing, or portal created before shadow root was ready | Verify `.cds-aichat--react-app` exists in the shadow root; check React DevTools; confirm the portal is gated on `"shadow-ready"` |
| Slots not projecting | Slot name mismatch, element appended to shadow root instead of the host wrapper, or element added after Lit's render | Match the `slot` attribute to the `<slot name="…">`; append to the wrapper, not the shadow root; create the element before the Lit host renders |

## SDK boundary

`src/chat/{services,store,events,instance,schema,sdk}/` must stay framework-agnostic — no React, no Lit, no view-layer imports — so it can be lifted out as the headless `@carbon/ai-chat/sdk` entry point in 2.x without a rewrite.

**What `sdk/` is.** The internal headless lifecycle layer plus the curated state stores (`valueStore.ts`, `slotStates.ts`, `messagesState.ts`, `toSnapshotMessage.ts`), behind the `sdk/index.ts` barrel. `acquireChatSDK(config)` resolves to a `HeadlessChatInstance` — the core `ChatInstance` extended with the lifecycle members only the acquiring owner holds (`release()`, `updateConfig()`). Shells call `acquireChatForShell` instead, which adds the `adopted` flag and the `ServiceManager` their boot needs. Nothing is exported yet: the barrel is not in `package.json#exports` or the rollup inputs, and publishing it is its own work.

**What belongs on the other side.** Anything only the shipped app's boot needs — container CSS, config defaults, the accidental-remount diagnostic — lives in `src/chat/boot/`. That is shell territory and off-limits to the fenced directories, which is why the fence bans importing it.

**`src/chat/utils/` is deliberately not fenced.** It legitimately mixes core and view utilities; the graph spec's transitive walk covers whatever of it the barrel actually reaches.

Two mechanical guards, and the gap between them is the point:

| Guard | Catches | Blind to |
| --- | --- | --- |
| **ESLint fence** — `eslintConfig.overrides` in the root [package.json](../../../package.json) | Direct `react` / `react-dom` / `lit` / `@lit/react` imports, any `@carbon/ai-chat-components` import (Lit rides in through it), and any import of a view or boot directory (`components/`, `components-legacy/`, `hooks/`, `providers/`, `contexts/`, `hocs/`, `AppShell*`, `utils-react/`, `boot/`) | `@tiptap/*`, which it never lists — even a direct Tiptap import passes. Anything indirect, since it is per-file and non-transitive. Any file outside the six fenced directories, which is why the graph spec covers `src/chat/utils/` and `src/types/` |
| **Import-graph spec** — [tests/sdk/spec/sdkBoundary_spec.ts](../tests/sdk/spec/sdkBoundary_spec.ts) | Walks every module transitively reachable from `sdk/index.ts` and fails on any runtime `react` / `react-dom` / `lit` / `@lit/react` / `@tiptap/*` import, any import (even type-only) of a view or boot module, or a type-only react-ish import outside a small, intentionally-shrinking allowlist | Bare packages it doesn't name — the spec treats `@carbon/web-components` as out of scope, so a runtime import of it rides in. And it only sees what the barrel reaches |

A runtime `@carbon/ai-chat-components` import is verified by resolution, not banned. The walker maps the specifier to the sibling package's source and follows it, so a framework-free leaf rides in — a per-component defs.js, globals/utils/uuid.js, prompt-line/json-utils.js — while any module that pulls React, Lit, or Tiptap at runtime is flagged at the file that pulls it. A specifier that resolves to no source fails, because the walker can't prove it framework-free. Inside the component package only that runtime rule applies. The allowlist covers ai-chat public-types files that unavoidably carry a `ReactNode`-shaped callback today; adding to it is a regression, not a fix.

If you are adding a file to a fenced directory and need something from the view layer, the dependency is pointing the wrong way — invert it (pass a callback in, or move the shared piece down) rather than widening the fence.

## References

- Lit host: [src/react/ChatContainer.tsx#L40](../src/react/ChatContainer.tsx#L40)
- React wrapper: [src/react/ChatCustomElement.tsx#L137](../src/react/ChatCustomElement.tsx#L137)
- `@carbonElement` decorator and base classes: [`@carbon/ai-chat-components`](../../ai-chat-components/AGENTS.md)

## Related guidance

- [packages/ai-chat/AGENTS.md](../AGENTS.md) — package overview
- [packages/ai-chat-components/AGENTS.md](../../ai-chat-components/AGENTS.md) — Lit component authoring
- [services.md](services.md) — wiring a service inside the fenced core
- [tests.md](tests.md) — writing the specs, including the boundary spec
