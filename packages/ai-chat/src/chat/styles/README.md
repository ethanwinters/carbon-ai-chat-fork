# AI Chat Styles

This directory contains the styling configuration for the `@carbon/ai-chat` package (ChatContainer floating widget).

## CSS Custom Properties Organization

CSS custom properties are now organized across two packages:

### Shared Tokens (in `@carbon/ai-chat-components`)

The following tokens are defined in `@carbon/ai-chat-components/src/globals/scss/` and are shared across both packages:

- **Layout Tokens** (`_tokens-layout.scss`): Layout dimensions and spacing
  - `--cds-aichat-messages-max-width`
  - `--cds-aichat-messages-min-width`
  - `--cds-aichat-workspace-min-width`
  - `--cds-aichat-history-width`
  - `--cds-aichat-card-max-width`

- **Component Tokens** (`_tokens-component.scss`): Component styling
  - `--cds-aichat-border-radius`
  - `--cds-aichat-card-border-radius`
  - `--cds-aichat-rounded-modifier-radius` (and 4 directional variants)

- **Color Tokens** (`_tokens-color.scss`): Theme colors
  - Launcher colors (11 variables)
  - Unread indicator colors (2 variables)

### Container-Specific Tokens (in `@carbon/ai-chat`)

The following tokens are specific to the ChatContainer floating widget and are defined in this package:

- **Positioning**: `bottom-position`, `right-position`, `top-position`, `left-position`
- **Sizing**: `width`, `height`, `max-width`, `max-height`, `min-height`
- **Launcher**: `launcher-default-size`, `launcher-position-bottom`, `launcher-position-right`, `launcher-extended-width`
- **Misc**: `z-index`

### Internal/Computed Properties

Some properties are set at runtime by JavaScript and are not defined in SCSS:

- `--cds-aichat-header-height`: Set dynamically by the chat-shell component
- `--cds-aichat-homescreen-starter-index`: Set per-element for staggered animations

## Files in this Directory

- `_chat-config.scss`: Utility functions for working with CSS custom properties
- `_chat-custom-properties.scss`: Defines container-specific CSS custom properties and imports shared tokens
- `_chat-theme.scss`: SASS variables that reference CSS custom properties for use in component styles
- `README.md`: This file

## Usage

To use these styles in a component:

```scss
@use "../../styles/chat-theme" as theme;

.my-component {
  max-width: theme.$messages-max-width;
  border-radius: theme.$card-border-radius;
}
```

The `chat-theme` module provides SASS variables that reference the CSS custom properties, allowing for easy customization while maintaining type safety and IDE support.
