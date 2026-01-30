# MCP Apps testing & conformance

## Summary

Add automated tests and fixtures for MCP Apps support across `@carbon/ai-chat` and `@carbon/ai-chat-components`. Focus on protocol conformance, rendering behavior, and error handling.

## Goals

- Validate JSON‑RPC handling (allowlist methods, error cases).
- Exercise sandbox proxy flow (web host).
- Verify response routing for `mcp_app` across inline/panel/workspace.
- Cover lifecycle events (initialize, initialized, tool input/result).

## Test plan

### Unit tests

**Component (`cds-aichat-mcp-app`)**

- Parses `ui/initialize` and emits `mcp-app-initialize` (host responds via helper).
- Emits correct CustomEvents for each allowed method.
- Rejects/ignores unknown method names or invalid JSON‑RPC envelopes.
- Applies CSP defaults when `ui_meta.csp` is missing.
- `loading → ready` when `ui/notifications/initialized` received.

**Response type (`mcp_app`)**

- `renderAsUserDefinedMessage` returns false for `mcp_app`.
- Inline rendering path works with a minimal `mcp_app` item.
- Panel/workspace open/close actions update store correctly.
- Error path renders `inline_error`.

### Integration tests

- Web sandbox proxy flow: proxy ready → resource ready → initialize.
- Workspace fallback to panel when insufficient width (if reproducible in test env).
- Host context updates do not remount iframe.

### Fixtures

- Golden JSON‑RPC messages for:
  - `ui/initialize` request
  - `tools/call`
  - `resources/read`
  - `ui/request-display-mode`
  - malformed payloads
- Minimal `mcp_app` response item fixtures.

## Acceptance criteria

- Tests cover at least one inline, one panel, and one workspace render.
- JSON‑RPC allowlist enforced in tests.
- CSP default path verified.

## Open questions

- Which test environment should validate the sandbox proxy flow (Playwright or similar), or is jsdom enough?
- Are snapshot tests acceptable for preview card/inline render, or only behavioral tests?
