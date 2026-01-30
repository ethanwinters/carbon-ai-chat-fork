# MCP App Component MVP (React AppRenderer wrapper)

## Summary

Ship a **temporary MVP** of `cds-aichat-mcp-app` by wrapping the React-based
`@mcp-ui/client` **AppRenderer** inside a Lit component
(https://github.com/MCP-UI-Org/mcp-ui). This unblocks integration
work in `@carbon/ai-chat` and downstream docs/tests, but **will not ship** due to
React 17/18/19 compatibility requirements.

This MVP must preserve the **final public API** so we can swap the internals later without breaking any demo, example, etc work we are doing.

## Concepts you should know

This issue assumes familiarity with:

- **MCP App view**: HTML provided by a server that runs in an iframe.
- **Sandbox proxy**: a required cross‑origin iframe that injects the app HTML via `srcdoc`.
- **JSON‑RPC over postMessage**: how the View and host exchange MCP messages.
- **`resources/read`**: how the host fetches the app’s HTML content.
- **`ui/initialize` handshake**: View initializes, host replies with context/capabilities.

If any of these are unfamiliar, review https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html and https://github.com/modelcontextprotocol/ext-apps

## Goals

- Provide a working `cds-aichat-mcp-app` using AppRenderer under the hood.
- Match the final component API (props/events) used by `@carbon/ai-chat`.
- Unblock integration, Storybook, docs, and testing work.

## Non-Goals

- Shipping to production.
- Removing React dependency (handled in ISSUE_component_final).

## Decisions

- MVP is **internal only** and **not released** because of the different ways we mount apps in React 17/18/19.
- The public API must match the final version exactly.
- Use our sandbox proxy (not the one bundled in `@mcp-ui/client`).

## Dependencies

- **Direct:** `@mcp-ui/client` (React AppRenderer).
- **Transitive:** `@modelcontextprotocol/ext-apps` via `@mcp-ui/client`.

## Key constraints

- AppRenderer is React-only; the wrapper must embed React into Lit.
- AppRenderer expects `toolName`; when unavailable, pass a placeholder and require
  `resource_uri`/`resource_html` so AppRenderer does not attempt MCP discovery.
- Use the **ext-apps sandbox proxy message names**; do not use the MCP-UI proxy HTML.

## Implementation outline

### 1) Wrapper strategy

- Use a Lit web component that mounts a React root inside its shadow/root.
- Render AppRenderer with props mapped from our `cds-aichat-mcp-app` API.

#### Public API

> Properties/attributes may be refined during implementation; keep them snake_case for consistency with the response type.

Required:

- `sandbox_proxy_url: string` (URL to the sandbox proxy HTML on a different origin)

Optional:

- `resource_uri?: string` (ui:// resource identifier; used with `on_resources_read`)
- `resource_html?: string` (prefetched HTML for immediate render; bypasses `resources/read`)
- `title: string` (required; iframe title + panel/workspace header)
- `aria_label?: string` (explicit a11y label for iframe)
- `display_mode?: "inline" | "fullscreen" | "pip"` (host presentation hint; default `inline`)
- `host_context?: McpUiHostContext` (context passed to the View after `ui/initialize`)
- `host_capabilities?: McpUiHostCapabilities` (capabilities passed to the View after `ui/initialize`)
- `protocol_version?: string` (MCP Apps protocol version string)
- `tool_info?: { tool_name?: string; tool_call_id?: string }` (tool context for analytics + notifications)
- `ui_meta?: { csp?: McpUiCsp; permissions?: string[]; domain?: string; prefers_border?: boolean }` (UI metadata for CSP/permissions/border)
- `ready_strategy?: "initialized"` (ready event strategy; placeholder for future)
- `on_tools_call?: (payload) => Promise<Result>` (handler for View `tools/call` requests)
- `on_resources_read?: (payload) => Promise<Result>` (handler for View `resources/read` requests)
- `init_timeout_ms?: number` (init timeout in ms; default 30000)

Notes:

- `sandbox_proxy_url` must point to a static HTML file served from a **different origin**
  than the host app (required by the MCP Apps web sandbox model).
- Provide **either** `resource_uri` or `resource_html` (or both).
- If `resource_html` is missing, `resource_uri` is required and the component must
  resolve it via `on_resources_read`.
- If `resource_html` is provided, the component can render immediately and may
  still use `resource_uri` for diagnostics/logging.
- If both `resource_uri` and `resource_html` are missing, emit `mcp-app-error`
  and render an error state.
- `_meta.ui.prefersBorder` from MCP maps to `ui_meta.prefers_border`.

### 2) API mapping

Map our props → AppRenderer props:

- `resource_uri` → `toolResourceUri`
- `resource_html` → `html`
- `sandbox_proxy_url` → `sandbox.url` (ensure URL object)
- `tool_name` → `toolName` (required by AppRenderer)
- `tool_input`/`tool_result` (if present) → AppRenderer `toolInput`/`toolResult`
- `host_context` → AppRenderer `hostContext`
- `ui_meta.csp` → `sandbox.csp`

### 3) Event mapping

- Wire AppRenderer callbacks to our CustomEvents (`mcp-app-*`).
- Ensure `mcp-app-open-link` is forwarded (ai-chat owns allowlist/confirmation).

### 4) Sandbox proxy

- Use **our** proxy HTML (from ISSUE_component_final spec) that speaks
  `ui/notifications/sandbox-*` methods.
- Do **not** use `@mcp-ui/client` proxy HTML (message names differ).

## Events (must match final)

**From View → Host (emitted as CustomEvents):**

- `mcp-app-initialize`
- `mcp-app-initialized`
- `mcp-app-size-changed`
- `mcp-app-tools-call`
- `mcp-app-resources-read`
- `mcp-app-open-link`
- `mcp-app-message`
- `mcp-app-request-display-mode`
- `mcp-app-update-model-context`
- `mcp-app-ping`
- `mcp-app-notifications-message`

**From Host → View (helpers exposed by component):**

- `sendInitializeResult(payload)`
- `sendToolInput(payload)`
- `sendToolInputPartial(payload)`
- `sendToolResult(payload)`
- `sendToolCancelled(payload)`
- `sendHostContextChanged(payload)`
- `sendResourceTeardown(payload)`

## Security expectations (MVP)

- Enforce `postMessage` origin checks (proxy origin and/or expected app origin).
- Validate JSON‑RPC payload shape and method allowlist; drop unknown methods.
- CSP **must** be applied even if `resource_html` is untrusted.
- Deny permissions not explicitly requested by the MCP metadata.
- Do not open links automatically; emit `mcp-app-open-link` and require host approval.
- Reject `tools/call` from the View unless the tool’s `_meta.ui.visibility` includes `"app"`.
  The host app must provide this visibility metadata to the component.

## Storybook (required)

Create a Storybook entry for `cds-aichat-mcp-app` using the MVP wrapper:

- Use a fixture `resource_html` (static HTML file) to render the app.
- Provide mock `on_resources_read` / `on_tools_call` handlers that return fixture data.
- Serve the sandbox proxy HTML via Storybook static assets and point
  `sandbox_proxy_url` to it. (In Storybook, this may be same‑origin; document that
  the production requirement is **cross‑origin**.)

## Acceptance criteria

- `cds-aichat-mcp-app` renders via AppRenderer with correct event mapping.
- The public API matches the final component API.
- Storybook story demonstrates a working MCP App using mocks.
