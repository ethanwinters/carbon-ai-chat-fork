# SCSS Exports

This directory contains SCSS modules that are exported for external use.

## chat-layout.scss

Float positioning styles for Carbon AI Chat floating widget mode. These styles can be applied to both `cds-aichat-shell` (for lazy loading placeholders) and the full ChatContainer to ensure consistent positioning and animations.

### Usage

**Option 1: Direct import (auto-generates classes)**

For lazy loading scenarios where you need the float classes immediately available:

```scss
@use "@carbon/ai-chat/scss/chat-layout.scss";
```

Or in JavaScript/TypeScript:

```javascript
import "@carbon/ai-chat/scss/chat-layout.scss";
```

This automatically includes the mixin and generates all float positioning classes.

**Option 2: Include the mixin explicitly**

For more control or to avoid duplicate includes:

```scss
@use "@carbon/ai-chat/scss/chat-layout";
@include chat-layout.float-positioning;
```

This gives you access to the mixin without auto-generating classes, useful if you want to customize or conditionally include the styles.

### Available Classes

#### Base Positioning

- `.cds-aichat-float-open` - Base floating position (fixed, bottom-right by default)
- `.cds-aichat-float-close` - Fully closed state (hidden)

#### Animation States

- `.cds-aichat-float-opening` - Opening animation
- `.cds-aichat-float-closing` - Closing animation

#### Responsive

- `.cds-aichat-float-mobile` - Mobile-specific positioning

### Example: Lazy Loading with Shell Placeholder

```html
<!-- Initial shell placeholder -->
<cds-aichat-shell
  class="cds-aichat-float-open cds-aichat-float-opening"
  show-frame
  rounded-corners
>
  <div slot="messages">Loading...</div>
</cds-aichat-shell>

<!-- Later, replace with full chat -->
<script>
  // ChatContainer automatically applies these same classes
  // ensuring seamless positioning match
</script>
```

### Customization

The float positioning uses CSS custom properties from the chat theme:

- `--cds-aichat-z-index` - Z-index for floating chat
- `--cds-aichat-height` - Chat height
- `--cds-aichat-width` - Chat width
- `--cds-aichat-top-position` - Top position
- `--cds-aichat-right-position` - Right position
- `--cds-aichat-bottom-position` - Bottom position
- `--cds-aichat-left-position` - Left position

### Browser Support

- Modern browsers with CSS custom properties support
- Respects `prefers-reduced-motion` for animations
- RTL (right-to-left) language support via CSS logical properties

### Examples

See the lazy loading examples:

- [React Lazy Loading ChatContainer](../../../examples/react/lazy-loading-chat-container)
- [Web Components Lazy Loading ChatContainer](../../../examples/web-components/lazy-loading-chat-container)
- [React Lazy Loading ChatCustomElement](../../../examples/react/lazy-loading-chat-custom-element)
- [Web Components Lazy Loading ChatCustomElement](../../../examples/web-components/lazy-loading-chat-custom-element)
