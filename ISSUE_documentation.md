# MCP Apps documentation

## Summary

Document MCP Apps support in Carbon AI Chat, including `mcp_app` response type schema, lifecycle expectations, theming variables, and security notes.

## Goals

- Provide clear usage docs for host apps.
- Document the `mcp_app` schema and display modes.
- Publish theming mapping and CSS variable usage.
- Document security/A11y expectations.

## Target docs

- `docs/` (new section or page under MCP Apps / integrations)
- Update example READMEs (see ISSUE_example_cohort_heatmap)

## Content outline

1. **Overview**
   - What MCP Apps are and how Carbon AI Chat hosts them.
2. **Response type schema**
   - `mcp_app` fields (snake_case) + examples.
3. **Lifecycle**
   - `ui/initialize` → `initialized`
   - Tool input/result notifications
   - `resources/read` flow for `resource_uri` → `resource_html`
4. **Display modes**
   - Inline, fullscreen (panel), pip (workspace) mapping (TBD notes).
5. **Theming**
   - MVP variable mapping + how to extend.
6. **Security**
   - Sandbox proxy, CSP, permissions.
   - Tool visibility rules (`_meta.ui.visibility` enforcement for app calls).
   - How to host the sandbox proxy (separate origin + default hosted URL).
7. **Accessibility**
   - Focus handling, labels, announcements.

## Acceptance criteria

- Docs reference the new response type and component by name.
- Includes at least one JSON example for `mcp_app`.
- Links to Cohort Heatmap example (ISSUE_example_cohort_heatmap).

## Open questions

- Where should MCP Apps docs live in docs/ (new section vs existing MCP section)?
- Should we include a full mcp_app example with CSP/permissions, or keep it minimal?
- Do we want a short troubleshooting section (CSP errors, proxy not ready, init timeout)?
