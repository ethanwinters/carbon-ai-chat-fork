# AI Chat Components - Global SCSS

This directory contains the shared token system and global styles for `@carbon/ai-chat-components`.

## CSS Custom Properties Token System

The token system is organized into three categories, following Carbon Design System patterns:

### 1. Layout Tokens (`_tokens-layout.scss`)

Control structural layout, spacing, and sizing across components.

| Token                              | Default Value | Description                              |
| ---------------------------------- | ------------- | ---------------------------------------- |
| `--cds-aichat-messages-max-width`  | `672px`       | Maximum width for message content area   |
| `--cds-aichat-messages-min-width`  | `320px`       | Minimum width for message content area   |
| `--cds-aichat-workspace-min-width` | `480px`       | Minimum width for workspace panel        |
| `--cds-aichat-history-width`       | `320px`       | Width of history/conversation list panel |
| `--cds-aichat-card-max-width`      | `424px`       | Maximum width for card components        |

### 2. Component Tokens (`_tokens-component.scss`)

Control component-specific styling like borders and radii.

| Token                                              | Default Value  | Description                             |
| -------------------------------------------------- | -------------- | --------------------------------------- |
| `--cds-aichat-border-radius`                       | `0`            | Base border radius for components       |
| `--cds-aichat-card-border-radius`                  | `0.5rem` (8px) | Border radius for card components       |
| `--cds-aichat-rounded-modifier-radius`             | `0.5rem` (8px) | Base radius for rounded modifier system |
| `--cds-aichat-rounded-modifier-radius-start-start` | `0.5rem` (8px) | Top-left corner radius                  |
| `--cds-aichat-rounded-modifier-radius-start-end`   | `0.5rem` (8px) | Top-right corner radius                 |
| `--cds-aichat-rounded-modifier-radius-end-start`   | `0.5rem` (8px) | Bottom-left corner radius               |
| `--cds-aichat-rounded-modifier-radius-end-end`     | `0.5rem` (8px) | Bottom-right corner radius              |

### 3. Color Tokens (`_tokens-color.scss`)

Control theming and color customization across components.

#### Launcher Colors

| Token                                           | Default Value            | Description                |
| ----------------------------------------------- | ------------------------ | -------------------------- |
| `--cds-aichat-launcher-color-background`        | `$button-primary`        | Launcher button background |
| `--cds-aichat-launcher-color-avatar`            | `$text-on-color`         | Launcher avatar/icon color |
| `--cds-aichat-launcher-color-background-hover`  | `$button-primary-hover`  | Launcher hover state       |
| `--cds-aichat-launcher-color-background-active` | `$button-primary-active` | Launcher active state      |
| `--cds-aichat-launcher-color-focus-border`      | `$text-on-color`         | Launcher focus border      |
| `--cds-aichat-launcher-mobile-color-text`       | `$text-on-color`         | Launcher text on mobile    |

#### Launcher Expanded Message Colors

| Token                                                            | Default Value            | Description                   |
| ---------------------------------------------------------------- | ------------------------ | ----------------------------- |
| `--cds-aichat-launcher-expanded-message-color-text`              | `$text-on-color`         | Expanded message text         |
| `--cds-aichat-launcher-expanded-message-color-background`        | `$button-primary`        | Expanded message background   |
| `--cds-aichat-launcher-expanded-message-color-background-hover`  | `$button-primary-hover`  | Expanded message hover        |
| `--cds-aichat-launcher-expanded-message-color-background-active` | `$button-primary-active` | Expanded message active       |
| `--cds-aichat-launcher-expanded-message-color-focus-border`      | `$text-on-color`         | Expanded message focus border |

#### Unread Indicator Colors

| Token                                            | Default Value    | Description             |
| ------------------------------------------------ | ---------------- | ----------------------- |
| `--cds-aichat-unread-indicator-color-background` | `$support-error` | Unread badge background |
| `--cds-aichat-unread-indicator-color-text`       | `$text-on-color` | Unread badge text       |

## Internal/Computed Properties

Some CSS custom properties are set at runtime by JavaScript and are not defined in SCSS files:

- `--cds-aichat-header-height`: Set dynamically by the chat-shell component based on header content
- `--cds-aichat-homescreen-starter-index`: Set per-element for staggered home screen animations

These are documented but not included in the token files since they are computed values.

## File Structure

```
scss/
├── _config.scss                  # Utility functions for CSS custom properties
├── _tokens-layout.scss          # Layout dimension tokens
├── _tokens-component.scss       # Component styling tokens
├── _tokens-color.scss           # Color/theme tokens
├── _custom-properties.scss      # Exports all tokens as CSS custom properties
├── _modifiers.scss              # Data attribute modifier system (rounded, flush, etc.)
├── vars.scss                    # SCSS variable configuration
└── README.md                    # This file
```

## Usage

### In Component SCSS Files

```scss
@use "../../../globals/scss/config" as config;
@use "../../../globals/scss/tokens-layout" as layout;

.my-component {
  max-width: config.get-var("messages-max-width", layout.$messages-max-width);
}
```

### Importing All Custom Properties

To make all tokens available as CSS custom properties:

```scss
@use "@carbon/ai-chat-components/es/globals/scss/custom-properties";
```

This will inject all tokens into `:root` as CSS custom properties.

### Customizing Tokens

Consumers can override tokens by setting CSS custom properties:

```css
:root {
  --cds-aichat-messages-max-width: 800px;
  --cds-aichat-card-border-radius: 12px;
  --cds-aichat-launcher-color-background: #0f62fe;
}
```

Or by overriding SCSS variables before importing:

```scss
@use "@carbon/ai-chat-components/es/globals/scss/tokens-layout" with (
  $messages-max-width: 800px
);
```

## Relationship with @carbon/ai-chat

The `@carbon/ai-chat` package imports these shared tokens and adds container-specific tokens for the ChatContainer floating widget (positioning, z-index, etc.). This ensures a single source of truth for shared styling while allowing package-specific customization.
