# Design confirmation UX for MCP App `ui/open-link`

## Summary

Define the confirmation modal/prompt for `ui/open-link` requests coming from MCP Apps.
This is a design-only issue that specifies UX, copy, and behavior for allowlisted vs
non-allowlisted links.

## Goals

- Provide a clear confirmation UI for external link opens initiated by an MCP App.
- Define copy, CTA labels, and warning states for untrusted domains.
- Define behavior for allowlisted links vs untrusted links.

## Non-Goals

- Implementing the confirmation UI (handled by engineering).
- Defining allowlist logic or policy (handled in ISSUE_host_integration).

## Scope

- Modal layout, copy, and iconography.
- Optional “Don’t ask again” pattern (if desired).
- Accessibility requirements for the confirmation flow.

## Acceptance Criteria

- Design spec covers allowlisted vs non-allowlisted behavior.
- Copy is approved and ready for implementation.
- A11y considerations are documented (focus trapping, labels).
