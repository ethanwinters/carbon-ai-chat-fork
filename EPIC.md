# Epic: MCP Apps support in Carbon AI Chat

## Summary

Implement MCP Apps end‑to‑end in Carbon AI Chat. This includes a new MCP App component in `@carbon/ai-chat-components`, host integration in `@carbon/ai-chat`, security + accessibility requirements, demo, tests, docs, and theming alignment.

## MCP Apps

MCP (Model Context Protocol) is a JSON‑RPC based protocol that allows a **host** (chat client in this case) to connect to MCP **servers** exposing tools/resources. The host discovers capabilities, invokes tools, and enforces security.

See https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html

## Final delivery goals

- **Component**: `cds-aichat-mcp-app` (Lit + AppBridge) shipped and release‑ready. See https://github.com/modelcontextprotocol/ext-apps
- **Host integration**: `mcp_app` response type in `@carbon/ai-chat` with panel/workspace routing + host context.
- **Security**: sandbox proxy + CSP + permissions enforcement.
- **A11y**: deterministic labeling and focus behavior for iframe content.
- **Example**: Cohort Heatmap MCP App example wired end‑to‑end.
- **Tests + Docs**: coverage for lifecycle, security, and usage.
- **Theming**: mapping + implementation of MCP CSS variables.

## Technical approach

### 1) Built first pass of web component

- Temporary MVP wrapper around `@mcp-ui/client` AppRenderer React component.
- Provides the **final public API** for `cds-aichat-mcp-app` so integration can proceed.
- React dependency is acceptable in feature branch; **not for release**.

### 2) Create new mcp app response type that uses the web component

- Add `mcp_app` response type to `@carbon/ai-chat`.
- Wire component into messages, panel/workspace, and host context updates.
- Handle open‑link allowlist + confirmation UX.

At this point we are unblocked for all demos, examples, theming, testing, etc. work.

### 3) Before any public release: Remove React dependency of web component

- Replace MVP internals with Lit + `@modelcontextprotocol/ext-apps` AppBridge.
- Remove React dependency and ship a production‑ready component.
- Preserve identical public API and events.
