# MCP App Component Final (Lit + AppBridge)

## Summary

Port the MVP React AppRenderer wrapper to a native Lit implementation using
`@modelcontextprotocol/ext-apps` AppBridge. Remove the React runtime while
preserving the exact public API and behavior.

## Goals

- Replace the React wrapper with Lit + AppBridge.
- Preserve API/events/security behavior from ISSUE_component_mvp.
- Keep sandbox proxy flow and JSON‑RPC bridge unchanged (implementation swap only).

## Non‑goals

- Changing public API, event names, or behavior.
- Changing security/policy decisions (CSP, permissions, open‑link handling).
- Changing host integration, message schema, or MCP routing.

## Implementation outline

1. Implement AppRenderer/AppFrame behavior in Lit with AppBridge + PostMessageTransport.
2. Recreate sandbox proxy flow and JSON‑RPC bridge per ISSUE_component_mvp.
3. Preserve loading/timeout, events, and A11y behavior.
4. Use `@modelcontextprotocol/ext-apps` types/helpers to stay aligned with spec.
5. Remove React/ReactDOM + `@mcp-ui/client` dependencies and adjust build.

## References (behavioral spec)

- `ISSUE_component_mvp.md` — public API, events, security expectations, Storybook.
- `ISSUE_host_integration.md` — host responsibilities and open‑link allowlist.

## Acceptance criteria

- No React dependency remains in `@carbon/ai-chat-components`.
- `cds-aichat-mcp-app` behavior matches ISSUE_component_mvp (API + events + lifecycle).
- Storybook and tests still pass.

## Suggested test plan

- Run existing component tests and Storybook validation used by the MVP.
