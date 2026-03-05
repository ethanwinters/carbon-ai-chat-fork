# Float Styles Mixin Pattern - Summary of Changes

## Overview

The float positioning styles have been refactored to follow the `@carbon/styles` mixin pattern, matching how Carbon Design System components like accordion, button, and other components structure their styles.

## Key Changes

### 1. File Naming and Structure

**Before:**

- `packages/ai-chat/src/chat/styles/_float.scss` - Direct class definitions
- `packages/ai-chat/src/scss/float.scss` - Public export

**After:**

- `packages/ai-chat/src/chat/styles/_chat-layout.scss` - Contains `@mixin float-positioning`
- `packages/ai-chat/src/scss/chat-layout.scss` - Public export with auto-include

### 2. Mixin Pattern Implementation

Following the Carbon accordion pattern, all float positioning styles are now wrapped in a mixin:

```scss
// _chat-layout.scss
@mixin float-positioning {
  .cds-aichat-float-open { ... }
  .cds-aichat-float-opening { ... }
  .cds-aichat-float-closing { ... }
  .cds-aichat-float-close { ... }
  .cds-aichat-float-mobile { ... }

  // Keyframes
  @keyframes cds-aichat-float-in { ... }
  @keyframes cds-aichat-float-in-mobile { ... }
  @keyframes cds-aichat-float-out { ... }
}
```

**Note:** Uses logical properties (`inset-inline-start`, `inset-inline-end`, `inset-block-start`, `inset-block-end`) for automatic RTL support without needing separate `[dir="rtl"]` rules.

### 3. Usage Patterns

#### Internal Usage (AppShellStyles.scss)

```scss
@use "./styles/chat-layout";

// Include the mixin to generate float classes
@include chat-layout.float-positioning;
```

#### External Usage - Option 1: Direct Import (Lazy Loading)

```scss
// Auto-generates classes via the mixin
@use "@carbon/ai-chat/scss/chat-layout.scss";
```

#### External Usage - Option 2: Explicit Mixin Include

```scss
@use "@carbon/ai-chat/scss/chat-layout";
@include chat-layout.float-positioning;
```

## Benefits

1. **Follows Carbon Patterns**: Matches `@carbon/styles` component architecture exactly
2. **Flexible Usage**: Supports both mixin inclusion and direct import
3. **Better Organization**: Layout-related styles grouped logically under `chat-layout`
4. **Future-Proof**: Can add more layout mixins to `_chat-layout.scss` as needed
5. **Clean Separation**: Clear distinction between internal and external usage
6. **Lazy Loading Support**: Direct SCSS import works seamlessly for lazy loading scenarios
7. **Automatic RTL Support**: Uses logical properties for built-in bidirectional text support

## Files Modified

### TASK-1-extract-float-styles.md

- Changed file name from `_float.scss` to `_chat-layout.scss`
- Wrapped all styles in `@mixin float-positioning`
- Updated public export to `chat-layout.scss` with auto-include
- Updated documentation to reflect mixin pattern

### TASK-2-update-components.md

- Added instructions to import `chat-layout` module
- Added instructions to include `@include chat-layout.float-positioning` in AppShellStyles.scss
- Updated troubleshooting section for mixin-based approach
- Updated notes to explain mixin pattern

### TASK-3-lazy-loading-chat-container.md

- Updated import from `float.scss` to `chat-layout.scss`
- Updated documentation to explain auto-generation via mixin
- Added notes about mixin pattern following Carbon conventions

### TASK-4-lazy-loading-chat-custom-element.md

- No changes needed (uses custom styling, not float classes)

## Comparison with Carbon Accordion Pattern

### Carbon Accordion Structure

```scss
@mixin accordion {
  .#{$prefix}--accordion { ... }
  .#{$prefix}--accordion__item { ... }
  .#{$prefix}--accordion__heading { ... }
  // ... more classes
}
```

### Our Float Positioning Structure

```scss
@mixin float-positioning {
  .cds-aichat-float-open { ... }
  .cds-aichat-float-opening { ... }
  .cds-aichat-float-closing { ... }
  // ... more classes
}
```

Both follow the same pattern:

- All component styles wrapped in a mixin
- Mixin can be included where needed
- Supports both internal and external usage
- Clean, modular architecture

## Migration Path

1. **Task 1**: Create `_chat-layout.scss` with `@mixin float-positioning`
2. **Task 2**: Include the mixin in `AppShellStyles.scss` and remove old widget styles
3. **Task 3**: Update lazy loading examples to import `chat-layout.scss`
4. **Task 4**: No changes (custom element uses user-defined styling)

## Testing Considerations

- Verify mixin generates correct classes when included
- Test internal usage in AppShellStyles.scss
- Test external usage in lazy loading scenarios
- Verify no SCSS compilation errors
- Confirm float classes appear in compiled CSS
- Test that animations and positioning work correctly

## Logical Properties for RTL Support

The implementation uses CSS logical properties instead of physical properties:

**Physical Properties (old approach):**

```scss
inset: top right bottom left;
[dir="rtl"] {
  inset-inline: right left;
}
```

**Logical Properties (new approach):**

```scss
inset-block-start: top;
inset-block-end: bottom;
inset-inline-end: right;
inset-inline-start: left;
// No [dir="rtl"] needed - automatically flips in RTL contexts
```

This eliminates the need for separate RTL rules and provides automatic bidirectional support.

## Future Enhancements

The `_chat-layout.scss` file can be extended with additional layout-related mixins:

```scss
// Future possibilities
@mixin float-positioning { ... }
@mixin inline-positioning { ... }
@mixin fullscreen-layout { ... }
```

This provides a clean, organized structure for all layout-related styles following Carbon Design System patterns.
