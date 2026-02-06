# CSS Custom Properties Organization

This document describes the organization of CSS custom properties across `@carbon/ai-chat` and `@carbon/ai-chat-components`.

## Overview

CSS custom properties have been reorganized to create a shared token system in `@carbon/ai-chat-components` that can be used by both packages. This provides a single source of truth for shared styling while maintaining package-specific customizations.

## Token Categories

### 1. Shared Tokens (in `@carbon/ai-chat-components`)

Located in `packages/ai-chat-components/src/globals/scss/`

#### Layout Tokens (`_tokens-layout.scss`)

Control structural layout, spacing, and sizing.

| Token                              | Default | Description                       |
| ---------------------------------- | ------- | --------------------------------- |
| `--cds-aichat-messages-max-width`  | `672px` | Maximum width for message content |
| `--cds-aichat-messages-min-width`  | `320px` | Minimum width for message content |
| `--cds-aichat-workspace-min-width` | `480px` | Minimum width for workspace panel |
| `--cds-aichat-history-width`       | `320px` | Width of history panel            |
| `--cds-aichat-card-max-width`      | `424px` | Maximum width for cards           |

#### Component Tokens (`_tokens-component.scss`)

Control component-specific styling like borders and radii.

| Token                                              | Default | Description                  |
| -------------------------------------------------- | ------- | ---------------------------- |
| `--cds-aichat-border-radius`                       | `0`     | Base border radius           |
| `--cds-aichat-card-border-radius`                  | `8px`   | Card border radius           |
| `--cds-aichat-rounded-modifier-radius`             | `8px`   | Base rounded modifier radius |
| `--cds-aichat-rounded-modifier-radius-start-start` | `8px`   | Top-left corner              |
| `--cds-aichat-rounded-modifier-radius-start-end`   | `8px`   | Top-right corner             |
| `--cds-aichat-rounded-modifier-radius-end-start`   | `8px`   | Bottom-left corner           |
| `--cds-aichat-rounded-modifier-radius-end-end`     | `8px`   | Bottom-right corner          |

#### Color Tokens (`_tokens-color.scss`)

Control theming and colors.

**Launcher Colors:**

- `--cds-aichat-launcher-color-background`
- `--cds-aichat-launcher-color-avatar`
- `--cds-aichat-launcher-color-background-hover`
- `--cds-aichat-launcher-color-background-active`
- `--cds-aichat-launcher-color-focus-border`
- `--cds-aichat-launcher-mobile-color-text`

**Launcher Expanded Message Colors:**

- `--cds-aichat-launcher-expanded-message-color-text`
- `--cds-aichat-launcher-expanded-message-color-background`
- `--cds-aichat-launcher-expanded-message-color-background-hover`
- `--cds-aichat-launcher-expanded-message-color-background-active`
- `--cds-aichat-launcher-expanded-message-color-focus-border`

**Unread Indicator Colors:**

- `--cds-aichat-unread-indicator-color-background`
- `--cds-aichat-unread-indicator-color-text`

### 2. Container-Specific Tokens (in `@carbon/ai-chat`)

Located in `packages/ai-chat/src/chat/styles/_chat-custom-properties.scss`

These are specific to the ChatContainer floating widget:

**Positioning:**

- `--cds-aichat-bottom-position` (default: `48px`)
- `--cds-aichat-right-position` (default: `32px`)
- `--cds-aichat-top-position` (default: `auto`)
- `--cds-aichat-left-position` (default: `auto`)

Note: RTL uses logical `inset-inline` placement while still reading the same `--cds-aichat-right-position` and `--cds-aichat-left-position` tokens. Override those tokens under `[dir="rtl"]` if you want mirrored placement.

**Sizing:**

- `--cds-aichat-width` (default: `min(380px, var(--cds-aichat-max-width))`)
- `--cds-aichat-height` (calculated)
- `--cds-aichat-max-width` (inherited)
- `--cds-aichat-max-height` (default: `640px`)
- `--cds-aichat-min-height` (calculated)

**Launcher (container-specific):**

- `--cds-aichat-launcher-default-size` (default: `56px`)
- `--cds-aichat-launcher-position-bottom` (default: `48px`)
- `--cds-aichat-launcher-position-right` (default: `32px`)
- `--cds-aichat-launcher-extended-width` (default: `280px`)

**Miscellaneous:**

- `--cds-aichat-z-index` (default: `99999`)

### 3. Internal/Computed Properties

These are set at runtime by JavaScript and not defined in SCSS:

- `--cds-aichat-header-height` - Set dynamically by chat-shell component
- `--cds-aichat-homescreen-starter-index` - Set per-element for animations
- `--cds-aichat-scrollbar-width` - May be set based on browser scrollbar

## File Structure

### @carbon/ai-chat-components

```
src/globals/scss/
├── _config.scss                  # Utility functions
├── _tokens-layout.scss          # Layout tokens
├── _tokens-component.scss       # Component tokens
├── _tokens-color.scss           # Color tokens
├── _custom-properties.scss      # Exports all tokens
├── _modifiers.scss              # Modifier system
├── vars.scss                    # SCSS variables
└── README.md                    # Documentation
```

### @carbon/ai-chat

```
src/chat/styles/
├── _chat-config.scss            # Utility functions
├── _chat-custom-properties.scss # Container tokens + imports shared
├── _chat-theme.scss             # SASS variables
└── README.md                    # Documentation
```

## Usage

### For Component Developers

Import tokens in your SCSS:

```scss
@use "../../../globals/scss/config" as config;
@use "../../../globals/scss/tokens-layout" as layout;

.my-component {
  max-width: config.get-var("messages-max-width", layout.$messages-max-width);
}
```

### For Consumers

Override tokens via CSS:

```css
:root {
  --cds-aichat-messages-max-width: 800px;
  --cds-aichat-card-border-radius: 12px;
  --cds-aichat-launcher-color-background: #0f62fe;
}
```

Or via SCSS before importing:

```scss
@use "@carbon/ai-chat-components/es/globals/scss/tokens-layout" with (
  $messages-max-width: 800px
);
```

## Migration Notes

### No Breaking Changes

All CSS custom property names remain unchanged. The reorganization is internal and maintains full backwards compatibility.

### Import Changes

- `@carbon/ai-chat` now imports shared tokens from `@carbon/ai-chat-components`
- Component SCSS files updated to use new token structure
- All existing functionality preserved

## Benefits

1. **Single Source of Truth**: Shared tokens defined once, used everywhere
2. **Better Organization**: Clear categorization (layout, component, color)
3. **Improved Maintainability**: Easier to find and update tokens
4. **Reusability**: Components package tokens can be used independently
5. **Carbon Alignment**: Follows Carbon Design System patterns
6. **No Breaking Changes**: Consumers see no difference

## Documentation

- **Components Package**: `packages/ai-chat-components/src/globals/scss/README.md`
- **AI Chat Package**: `packages/ai-chat/src/chat/styles/README.md`
- **This Document**: High-level overview and reference

## Files Modified

### Created

- `packages/ai-chat-components/src/globals/scss/_config.scss`
- `packages/ai-chat-components/src/globals/scss/_tokens-layout.scss`
- `packages/ai-chat-components/src/globals/scss/_tokens-component.scss`
- `packages/ai-chat-components/src/globals/scss/_tokens-color.scss`
- `packages/ai-chat-components/src/globals/scss/_custom-properties.scss`
- `packages/ai-chat-components/src/globals/scss/README.md`

### Modified

- `packages/ai-chat-components/src/components/chat-shell/src/_variables.scss`
- `packages/ai-chat/src/chat/styles/_chat-custom-properties.scss`
- `packages/ai-chat/src/chat/styles/_chat-theme.scss`
- `packages/ai-chat/src/chat/styles/README.md`

## Testing

Both packages build successfully with no breaking changes:

- ✅ `@carbon/ai-chat-components` builds without errors
- ✅ `@carbon/ai-chat` builds without errors
- ✅ All CSS custom properties remain accessible
- ✅ No changes to component rendering
