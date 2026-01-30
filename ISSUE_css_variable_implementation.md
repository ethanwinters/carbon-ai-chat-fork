# Implement MCP Apps CSS variable mapping (post‑design)

## Summary

Implement the CSS variable mapping defined by the design team for MCP Apps theming. This consumes the mapping from the design issue and wires the values into `hostContext.styles.variables`.

Design source: `LINK DESIGN ISSUE HERE`

## Goals

- Implement the final MCP → Carbon token mapping.
- Ensure variables are set for all MCP standardized keys.
- Ensure all variables are exposed for customizations and documented (likely as new --cds-aichat-\* properties)
- Provide sensible fallbacks if any tokens are missing at runtime.
- Consolidate **all shared** `--cds-aichat-*` custom properties into
  `@carbon/ai-chat-components` and expose them for `@carbon/ai-chat` to import.
  ChatContainer‑specific variables remain in `@carbon/ai-chat`.

## Implementation notes

- Implement a single mapping function (e.g., `getMcpStyleVariables`) and keep it centralized.
- Prefer reading computed CSS variables from the chat root element.
- Use `light-dark()` if the design issue specifies theme‑aware values.
- Organize custom property definitions in a structure similar to `@carbon/styles`:
  https://github.com/carbon-design-system/carbon/tree/main/packages/styles
- Move existing shared definitions out of `@carbon/ai-chat` and into
  `@carbon/ai-chat-components`, then import them into `@carbon/ai-chat` as needed.

## Acceptance criteria

- All MCP standardized variables are present in `hostContext.styles.variables`.
- Values match the design mapping and update when theme changes.
- No console warnings for missing tokens in normal themes.
- All shared `--cds-aichat-*` variables are defined in `@carbon/ai-chat-components` and
  consumed by `@carbon/ai-chat` via imports.
- ChatContainer‑specific variables remain defined in `@carbon/ai-chat`.

## Existing `--cds-aichat-*` variables (current inventory)

### Keep in `@carbon/ai-chat` (ChatContainer‑specific)

These are specific to the ChatContainer element (floating widget positioning,
launcher state, or internal container sizing) and should **stay defined** in
`@carbon/ai-chat`:

- `--cds-aichat-bottom-position`
- `--cds-aichat-height`
- `--cds-aichat-left-position`
- `--cds-aichat-max-height`
- `--cds-aichat-max-width`
- `--cds-aichat-min-height`
- `--cds-aichat-right-position`
- `--cds-aichat-scrollbar-width`
- `--cds-aichat-top-position`
- `--cds-aichat-width`
- `--cds-aichat-z-index`
- `--cds-aichat-homescreen-starter-index`

### Move to `@carbon/ai-chat-components` (shared)

These appear across `packages/ai-chat/src` and/or `packages/ai-chat-components/src`
and should be centralized in the components package:

- `--cds-aichat-border-radius`
- `--cds-aichat-card-border-radius`
- `--cds-aichat-font-family`
- `--cds-aichat-header-height`
- `--cds-aichat-history-width`
- `--cds-aichat-messages-max-width`
- `--cds-aichat-messages-min-width`
- `--cds-aichat-rounded-modifier-radius`
- `--cds-aichat-rounded-modifier-radius-end-end`
- `--cds-aichat-rounded-modifier-radius-end-start`
- `--cds-aichat-rounded-modifier-radius-start-end`
- `--cds-aichat-rounded-modifier-radius-start-start`
- `--cds-aichat-workspace-min-width`
- `--cds-aichat-launcher-default-size`
- `--cds-aichat-launcher-position-bottom`
- `--cds-aichat-launcher-position-right`
- `--cds-aichat-launcher-extended-width`
- `--cds-aichat-launcher-color-background`
- `--cds-aichat-launcher-color-avatar`
- `--cds-aichat-launcher-color-background-hover`
- `--cds-aichat-launcher-color-background-active`
- `--cds-aichat-launcher-color-focus-border`
- `--cds-aichat-launcher-mobile-color-text`
- `--cds-aichat-launcher-expanded-message-color-text`
- `--cds-aichat-launcher-expanded-message-color-background`
- `--cds-aichat-launcher-expanded-message-color-background-hover`
- `--cds-aichat-launcher-expanded-message-color-background-active`
- `--cds-aichat-launcher-expanded-message-color-focus-border`
- `--cds-aichat-unread-indicator-color-background`
- `--cds-aichat-unread-indicator-color-text`
- `--cds-aichat-card-max-width`
