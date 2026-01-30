# Design mapping for MCP Apps CSS variables

## Summary

Create a **design‑approved mapping** from MCP Apps standardized CSS custom properties to Carbon tokens (or raw values). These variables control the **look and feel** of embedded MCP Apps (colors, typography, spacing, radii, shadows). The host passes the mapped values to apps so they visually align with Carbon AI Chat.

Reference on how these variables are used by MCP Apps:

- https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html#theming

## Goals

- Provide a mapping table for each MCP standardized variable.
- Define fallbacks where Carbon tokens are missing.
- Document light/dark behavior and any `light-dark()` usage.

## Deliverables

- A mapping table with columns for **MCP App** and **Carbon variable or raw value**.
- Notes on any variables that need new tokens or custom values.

## Mapping table (to be filled by design)

> **Design fills in the second column** (“Carbon variable or raw value”).

### Background colors

| MCP App                        | Carbon variable or raw value |
| ------------------------------ | ---------------------------- |
| `--color-background-primary`   |                              |
| `--color-background-secondary` |                              |
| `--color-background-tertiary`  |                              |
| `--color-background-inverse`   |                              |
| `--color-background-ghost`     |                              |
| `--color-background-info`      |                              |
| `--color-background-danger`    |                              |
| `--color-background-success`   |                              |
| `--color-background-warning`   |                              |
| `--color-background-disabled`  |                              |

### Text colors

| MCP App                  | Carbon variable or raw value |
| ------------------------ | ---------------------------- |
| `--color-text-primary`   |                              |
| `--color-text-secondary` |                              |
| `--color-text-tertiary`  |                              |
| `--color-text-inverse`   |                              |
| `--color-text-info`      |                              |
| `--color-text-danger`    |                              |
| `--color-text-success`   |                              |
| `--color-text-warning`   |                              |
| `--color-text-disabled`  |                              |
| `--color-text-ghost`     |                              |

### Border colors

| MCP App                    | Carbon variable or raw value |
| -------------------------- | ---------------------------- |
| `--color-border-primary`   |                              |
| `--color-border-secondary` |                              |
| `--color-border-tertiary`  |                              |
| `--color-border-inverse`   |                              |
| `--color-border-ghost`     |                              |
| `--color-border-info`      |                              |
| `--color-border-danger`    |                              |
| `--color-border-success`   |                              |
| `--color-border-warning`   |                              |
| `--color-border-disabled`  |                              |

### Ring colors

| MCP App                  | Carbon variable or raw value |
| ------------------------ | ---------------------------- |
| `--color-ring-primary`   |                              |
| `--color-ring-secondary` |                              |
| `--color-ring-inverse`   |                              |
| `--color-ring-info`      |                              |
| `--color-ring-danger`    |                              |
| `--color-ring-success`   |                              |
| `--color-ring-warning`   |                              |

### Typography — family

| MCP App       | Carbon variable or raw value |
| ------------- | ---------------------------- |
| `--font-sans` |                              |
| `--font-mono` |                              |

### Typography — weight

| MCP App                  | Carbon variable or raw value |
| ------------------------ | ---------------------------- |
| `--font-weight-normal`   |                              |
| `--font-weight-medium`   |                              |
| `--font-weight-semibold` |                              |
| `--font-weight-bold`     |                              |

### Typography — text size

| MCP App               | Carbon variable or raw value |
| --------------------- | ---------------------------- |
| `--font-text-xs-size` |                              |
| `--font-text-sm-size` |                              |
| `--font-text-md-size` |                              |
| `--font-text-lg-size` |                              |

### Typography — heading size

| MCP App                   | Carbon variable or raw value |
| ------------------------- | ---------------------------- |
| `--font-heading-xs-size`  |                              |
| `--font-heading-sm-size`  |                              |
| `--font-heading-md-size`  |                              |
| `--font-heading-lg-size`  |                              |
| `--font-heading-xl-size`  |                              |
| `--font-heading-2xl-size` |                              |
| `--font-heading-3xl-size` |                              |

### Typography — text line height

| MCP App                      | Carbon variable or raw value |
| ---------------------------- | ---------------------------- |
| `--font-text-xs-line-height` |                              |
| `--font-text-sm-line-height` |                              |
| `--font-text-md-line-height` |                              |
| `--font-text-lg-line-height` |                              |

### Typography — heading line height

| MCP App                          | Carbon variable or raw value |
| -------------------------------- | ---------------------------- |
| `--font-heading-xs-line-height`  |                              |
| `--font-heading-sm-line-height`  |                              |
| `--font-heading-md-line-height`  |                              |
| `--font-heading-lg-line-height`  |                              |
| `--font-heading-xl-line-height`  |                              |
| `--font-heading-2xl-line-height` |                              |
| `--font-heading-3xl-line-height` |                              |

### Border radius

| MCP App                | Carbon variable or raw value |
| ---------------------- | ---------------------------- |
| `--border-radius-xs`   |                              |
| `--border-radius-sm`   |                              |
| `--border-radius-md`   |                              |
| `--border-radius-lg`   |                              |
| `--border-radius-xl`   |                              |
| `--border-radius-full` |                              |

### Border width

| MCP App                  | Carbon variable or raw value |
| ------------------------ | ---------------------------- |
| `--border-width-regular` |                              |

### Shadows

| MCP App             | Carbon variable or raw value |
| ------------------- | ---------------------------- |
| `--shadow-hairline` |                              |
| `--shadow-sm`       |                              |
| `--shadow-md`       |                              |
| `--shadow-lg`       |                              |
