# Host integration for MCP Apps in `@carbon/ai-chat`

## Summary

Wire MCP Apps end‑to‑end in `@carbon/ai-chat`: add the `mcp_app` response type,
rendering, panel/workspace routing, and host context plumbing. Depends on
ISSUE_component_mvp (integration) and ISSUE_component_final (release).

## Concepts you should know

- **MCP App view**: HTML UI referenced by a `ui://` `resource_uri`, rendered in a sandboxed iframe via the web component.
- **Resource resolution**: the host prefetches `resource_html` or provides `on_resources_read` so the component can resolve `resource_uri`.
- **Display modes**: `inline` (message), `fullscreen` (panel), `pip` (workspace).
- **Initialization**: the View sends `ui/initialize`; the host responds with context/capabilities and updates host context on resize/theme.

If unfamiliar, review https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html and https://github.com/modelcontextprotocol/ext-apps

## Ownership

We own MCP UI host plumbing here. Component = protocol plumbing; host = handlers + app state/routing. Concretely:

- `@carbon/ai-chat-components` manages iframe/protocol plumbing and invokes `resources/read` and `tools/call` via handlers.
- `@carbon/ai-chat` passes handlers, response metadata, and host context into the component.
- `@carbon/ai-chat` passes tool visibility metadata (or a tool registry) so the component can gate `tools/call`.
- The MCP App sandbox proxy asset is shipped by the component and hosted by the integrator.

## Flow

### 1) Message emitted (`response_type: "mcp_app"`)

When a tool response or `customSendMessage` emits `response_type: "mcp_app"`, the message enters the renderer.

Technical details:

- Response type name is `mcp_app`.
- `display_mode` is `inline | fullscreen | pip` and defaults to `inline`.
- If host-authored, `tool_call_id` and `tool_name` may be omitted and no tool notifications are sent unless the host provides them.
- Add the type and union wiring in `packages/ai-chat/src/types/messaging/Messages.ts`.
- Treat `mcp_app` as first‑class in `packages/ai-chat/src/chat/utils/messageUtils.ts`.

```ts
interface McpAppItem<
  TUserDefinedType = Record<string, unknown>,
> extends BaseGenericItem<TUserDefinedType> {
  response_type: MessageResponseTypes.MCP_APP;
  title: string; // required; panel/workspace header
  mcp_app_id: string; // stable id for view state + "Viewing" indicator
  aria_label?: string; // fallback to title
  fallback_text?: string; // text-only fallback for errors
  resource_uri?: string; // ui://... (optional when `resource_html` provided)
  tool_name?: string; // optional; analytics/labeling
  tool_call_id?: string; // optional; tool input/result routing
  resource_html?: string; // optional prefetched HTML
  display_mode?: "inline" | "fullscreen" | "pip"; // default: inline
}
```

### 2) Resolve app HTML

The component needs HTML to render. The host either prefetches it or provides a handler so the component can fetch it.

Technical details:

- Pass `on_resources_read` so the component can resolve `resource_uri` and manage `resource_html`, or
- prefetch `resource_html` and pass it directly.
- If `resource_html` is present, skip `resources/read`.
- If `resources/read` fails, render `inline_error` and use `fallback_text` if provided.

### 3) Render entry point + display mode

Render the app inline or as a preview that opens a panel/workspace, based on `display_mode`.

Technical details:

- **inline** renders in the message list.
- **fullscreen** and **pip** render a preview/tile; on click open panel/workspace.
- Preview/tile only renders for non‑inline modes.
- If the View does not declare a requested mode in `appCapabilities.availableDisplayModes`, fall back to `inline`.
- Workspace fallback to panel is handled by the shell when space is constrained.
- Integrate a response type under `packages/ai-chat/src/chat/components-legacy/responseTypes/mcpApp/` (or current equivalent): `McpAppMessage.tsx`, `McpAppInline.tsx`, `McpAppPreviewCard.tsx`.
- Wire into `MessageTypeComponent.tsx` and use component helpers for init/notifications (not raw `postMessage`).

### 4) Panel/workspace state + “Viewing”

Panel/workspace routing is owned by `@carbon/ai-chat` and must support open/close hooks.

Technical details:

- Add `McpAppPanelState` with `isOpen` and `messageItem: McpAppItem`.
- Add Redux actions `OPEN_MCP_APP_PANEL`, `CLOSE_MCP_APP_PANEL`, `SET_WORKSPACE_MCP_APP_ITEM`.
- Update reducers and app state in `packages/ai-chat/src/chat/store/reducerUtils.ts`, `packages/ai-chat/src/chat/store/reducers.ts`, `packages/ai-chat/src/types/state/AppState.ts`.
- Render a fullscreen panel in `packages/ai-chat/src/chat/AppShellPanels.tsx`.
- Render a workspace view in `packages/ai-chat/src/chat/AppShell.tsx`.
- Workspace pre open/close events must be cancellable; only emit post/did events after success.
- Workspace conflicts: opening a `pip` MCP App replaces the current workspace content.
- Preview/tile shows “Viewing” when the open panel/workspace matches `mcp_app_id`.
- For `pip`, set `workspace_id = mcp_app_id` and `is_open = true`.
- If `workspace_id` is undefined, do not show “Viewing”.
- Fullscreen “Viewing” is derived from MCP panel state.

### 5) Initialize + tool notifications

After the View sends `ui/initialize`, the host replies with context/capabilities and optionally sends tool notifications.

Technical details:

- Handle `mcp-app-initialize` by sending `McpUiInitializeResult`.
- Send `ui/notifications/tool-input` and `ui/notifications/tool-result` **if** `tool_call_id` is present.
- Send `ui/notifications/tool-input-partial` and `ui/notifications/tool-cancelled` when applicable.
- Store `appCapabilities.availableDisplayModes`; compute `hostContext.availableDisplayModes` as host∩app.
- If requested `display_mode` is unsupported, fall back to `inline`.
- Pass tool visibility metadata (or a tool registry) so the component can gate `tools/call`.

### 6) Event listeners and responsibilities

Attach listeners to `<cds-aichat-mcp-app>` and split responsibility between ai‑chat and host app callbacks.

Handled by `@carbon/ai-chat`:

- `mcp-app-initialize`: respond with `sendInitializeResult`.
- `mcp-app-initialized`: update UI state/loading.
- `mcp-app-size-changed`: update container sizing when flexible.
- `mcp-app-request-display-mode`: validate and apply supported mode.
- `mcp-app-sandbox-proxy-ready` / `mcp-app-sandbox-resource-ready`: internal wiring.
- `ui/resource-teardown`: send and await response before unmount.
- `mcp-app-open-link`: enforce allowlist + confirmation UX (ISSUE_open_link_confirmation_design).
- `mcp-app-notifications-message`: handle or forward (define in implementation).

Forwarded to host app callbacks/hooks:

- `mcp-app-message`.
- `mcp-app-update-model-context`.
- `mcp-app-tools-call` / `mcp-app-resources-read` if not handled by component handlers.

### 7) Host context creation + updates

Build host context once and update it on resize/theme/layout changes without remounting the iframe.

Technical details:

- Add `buildMcpHostContext` in `packages/ai-chat/src/chat/utils/mcpHostContext.ts`:
  `containerDimensions`, `locale`, `timeZone`, `userAgent`, `platform`,
  `deviceCapabilities`, `safeAreaInsets`, `theme`, `styles.variables` (deferred; see ISSUE_css_variable_implementation).
- Guard browser APIs for SSR (`typeof window !== "undefined"`).
- Read `safeAreaInsets` via a temporary element with `padding: env(safe-area-inset-*)`.
- Use `window.matchMedia`; default device capabilities to false if unavailable.
- Pass `hostContext` into `<cds-aichat-mcp-app>` and update it on theme/layout/resize.
- Call `sendHostContextChanged` with **partial** updates; avoid iframe recreation for style/size changes.
- Set `protocol_version` and `host_capabilities` from `@modelcontextprotocol/ext-apps` (per ISSUE_component_final).

### 8) Accessibility + error handling

Ensure accessible labels and predictable error states.

Technical details:

- Use `aria_label` if provided; fallback to `title`.
- Panel/workspace headers use `title`.
- On error/timeout, render `inline_error`
- Default timeout is 30s waiting for `ui/notifications/initialized` (component‑configurable).

## Acceptance criteria

- `mcp_app` appears in `MessageResponseTypes` and in the `GenericItem` union.
- A `mcp_app` item renders inline when `display_mode` is `inline` or omitted.
- A `mcp_app` item renders a preview/tile that opens a **panel** for `fullscreen`.
- A `mcp_app` item renders a preview/tile that opens **workspace** for `pip`.
- Errors render as inline error.
- Host apps can author `mcp_app` items directly.
- `hostContext` is created and passed to the MCP App component for every `mcp_app` response.
- Host context updates occur on resize and theme changes without full remount.
