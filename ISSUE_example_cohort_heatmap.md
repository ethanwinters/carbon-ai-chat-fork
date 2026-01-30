# Cohort Heatmap MCP App example (end‑to‑end)

## Summary

Add a **Cohort Heatmap** example that uses Carbon AI Chat as the MCP **host**, connected to the MCP Apps example server from `modelcontextprotocol/ext-apps`. This provides a tangible example for `mcp_app` rendering and is used to validate the full flow.

## Goals

- Demonstrate `mcp_app` response type working against a real MCP App server.
- Showcase inline + panel/workspace rendering in a visually rich app.
- Provide reproducible setup docs for internal/dev use.

## Non‑Goals

- Production‑grade server discovery or auth flows.
- Multiple example apps (Cohort Heatmap only for now).

## Target location

Add a new example workspace under **React** (preferred):

- `examples/react/mcp-app-cohort-heatmap/`
- workspace name: `@carbon/ai-chat-examples-react-mcp-app`

Optional follow‑up: a matching web‑components example.

## Implementation outline

### 0) Confirm transport (required)

Check the ext‑apps Cohort Heatmap example README and record the transport
it supports (HTTP/SSE vs stdio). The demo should default to HTTP/SSE **if available**.
If the example only supports stdio, document the local wrapper needed.

### 1) Example app wiring

Create a minimal example app that:

- Connects to the Cohort Heatmap MCP example server.
- Calls the tool that returns the UI resource.
- Translates MCP UI metadata into `mcp_app` response items.
- Sends those items into Carbon AI Chat.

### 2) MCP client integration (example scope)

- Use `@modelcontextprotocol/ext-apps` helpers where applicable.
- Choose transport based on the example server:
  - **HTTP/SSE** if the example server exposes it.
  - **stdio** only if running the server via a local process wrapper.
- Keep transport/connection logic in the example app (not the core library).

### 3) Response shaping

Construct and inject a `mcp_app` item with:

- `response_type: "mcp_app"`
- `resource_uri`
- `display_mode` (prefer `fullscreen` for the demo)
- `title` (e.g., "Cohort Heatmap")

### 4) CSP allowances

Configure CSP in the example to allow the Cohort Heatmap server’s domains (connect + resource).
Use the MCP metadata if present; otherwise document required domains.

### 5) Documentation

Add a README covering:

- Required local setup (clone ext‑apps repo, run Cohort Heatmap server).
- Environment variables for server URL/port.
- Start command for the example workspace.
- Expected result + screenshot.

## Acceptance criteria

- Example runs locally and renders the Cohort Heatmap app inside Carbon AI Chat.
- Demonstrates inline + panel/workspace behavior (at least one non‑inline mode).
- README includes full setup steps.

## Open questions

- Which transport does the Cohort Heatmap example expose by default (HTTP/SSE vs stdio)?
- Do we want the demo to open inline by default or in a panel?
