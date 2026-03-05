# Task 2: Update Components to Use Float Styles

## Overview

Update `AppShell.tsx` to replace the old internal widget classes with the new public float classes, and update `AppShellStyles.scss` to include the `@mixin float-positioning` following the `@carbon/styles` pattern. Since the old classes were internal implementation details, we can replace them directly without backward compatibility concerns.

## Prerequisites

- Task 1 must be completed (float.scss created and imported)
- Understanding of React and TypeScript
- Familiarity with classnames library

## Files to Modify

### 1. Update `packages/ai-chat/src/chat/AppShell.tsx`

**Location:** Lines 450-466

**Current Code:**

```tsx
<ChatShell
  data-testid={PageObjectId.CHAT_WIDGET}
  className={cx("cds-aichat--widget", {
    "cds-aichat--widget--default-element": !useCustomHostElement,
    "cds-aichat--widget--launched": !closing,
    "cds-aichat--widget--closing": closing,
    "cds-aichat--widget--closed": !open,
    "cds-aichat--widget--max-width":
      chatWidthBreakpoint === ChatWidthBreakpoint.WIDE &&
      layout.hasContentMaxWidth,
    [WIDTH_BREAKPOINT_NARROW]:
      chatWidthBreakpoint === ChatWidthBreakpoint.NARROW,
    [WIDTH_BREAKPOINT_STANDARD]:
      chatWidthBreakpoint === ChatWidthBreakpoint.STANDARD,
    [WIDTH_BREAKPOINT_WIDE]:
      chatWidthBreakpoint === ChatWidthBreakpoint.WIDE,
  })}
  ref={(el) => {
    widgetContainerRef.current = el;
    animationContainerRef.current = el;
  }}
```

**Updated Code:**

```tsx
<ChatShell
  data-testid={PageObjectId.CHAT_WIDGET}
  className={cx("cds-aichat--widget", {
    // New public float classes (replacing old internal widget classes)
    "cds-aichat-float-open": !useCustomHostElement && open,
    "cds-aichat-float-opening": !useCustomHostElement && !closing && open,
    "cds-aichat-float-closing": !useCustomHostElement && closing,
    "cds-aichat-float-close": !useCustomHostElement && !open,
    "cds-aichat-float-mobile": !useCustomHostElement && isMobileViewport,
    // Width breakpoint classes (keep these)
    "cds-aichat--widget--max-width":
      chatWidthBreakpoint === ChatWidthBreakpoint.WIDE &&
      layout.hasContentMaxWidth,
    [WIDTH_BREAKPOINT_NARROW]:
      chatWidthBreakpoint === ChatWidthBreakpoint.NARROW,
    [WIDTH_BREAKPOINT_STANDARD]:
      chatWidthBreakpoint === ChatWidthBreakpoint.STANDARD,
    [WIDTH_BREAKPOINT_WIDE]:
      chatWidthBreakpoint === ChatWidthBreakpoint.WIDE,
  })}
  ref={(el) => {
    widgetContainerRef.current = el;
    animationContainerRef.current = el;
  }}
```

**Explanation of Changes:**

- **REMOVED** old internal classes: `cds-aichat--widget--default-element`, `cds-aichat--widget--launched`, `cds-aichat--widget--closing`, `cds-aichat--widget--closed`
- **ADDED** new public float classes:
  - `cds-aichat-float-open` - Base floating position when chat is open
  - `cds-aichat-float-opening` - Opening animation state
  - `cds-aichat-float-closing` - Closing animation state
  - `cds-aichat-float-close` - Fully closed state
  - `cds-aichat-float-mobile` - Mobile-specific positioning
- **KEPT** width breakpoint classes (these are still needed)

### 2. Update AppShellStyles.scss to Include the Mixin

**Location:** After imports section in `packages/ai-chat/src/chat/AppShellStyles.scss`

**Add the mixin include:**

```scss
/* ============================================================================
   IMPORTS & SETUP
   ============================================================================ */

@use "sass:meta";
@use "@carbon/styles/scss/themes";
@use "@carbon/layout";
@use "@carbon/styles/scss/theme";
@use "@carbon/styles/scss/motion";
@use "@carbon/styles/scss/type";
@use "@carbon/styles/scss/utilities/ai-gradient" as *;
@use "./styles/chat-theme";
@use "./styles/chat-layout"; // Add this import

@use "./styles";
@use "./components/imports" as components;
@use "./components-legacy/imports" as legacyComponents;

/* ... existing Carbon theme integration ... */

/* ============================================================================
   FLOAT POSITIONING
   Floating widget positioning and animations (following @carbon/styles pattern)
   ============================================================================ */

@include chat-layout.float-positioning; // Add this include

/* ... rest of file ... */
```

### 3. Remove Old Widget Styles from AppShellStyles.scss

**Location:** Lines 153-252 in `packages/ai-chat/src/chat/AppShellStyles.scss`

**Remove these sections:**

```scss
/* ============================================================================
   WIDGET - STATE MANAGEMENT
   Widget states, animations, and transitions
   ============================================================================ */

/* Closed state */
.cds-aichat--widget.cds-aichat--widget--closed {
  overflow: hidden;
}

.cds-aichat--widget.cds-aichat--widget--default-element.cds-aichat--widget--closed {
  display: none;
}

.cds-aichat--widget.cds-aichat--widget.cds-aichat--widget--closed,
.cds-aichat--ai-theme
  .cds-aichat--widget.cds-aichat--widget.cds-aichat--widget--closed {
  border: none;
  box-shadow: none;
}

/* Launch animation */
@media screen and (prefers-reduced-motion: reduce) {
  .cds-aichat--widget.cds-aichat--widget--launched.cds-aichat--widget--default-element {
    animation: none;
  }
}

.cds-aichat--widget.cds-aichat--widget--launched.cds-aichat--widget--default-element:not(
    .cds-aichat--is-phone
  ) {
  animation: cds-aichat-widget-in motion.$duration-moderate-02
    motion.motion(entrance, expressive) both;
}

/* Close animation */
@media screen and (prefers-reduced-motion: reduce) {
  .cds-aichat--widget.cds-aichat--widget--closing.cds-aichat--widget--default-element {
    animation: none;
  }
}

.cds-aichat--widget.cds-aichat--widget--closing.cds-aichat--widget--default-element {
  animation: cds-aichat-widget-out motion.$duration-fast-02
    motion.motion(exit, expressive) both;
}

/* ============================================================================
   WIDGET - POSITIONING
   Default positioning for floating widget mode
   ============================================================================ */

.cds-aichat--widget.cds-aichat--widget--default-element {
  position: fixed;
  z-index: chat-theme.$z-index;
  block-size: chat-theme.$height;
  inline-size: chat-theme.$width;
  inset: chat-theme.$top-position chat-theme.$right-position
    chat-theme.$bottom-position chat-theme.$left-position;
  max-block-size: chat-theme.$max-height;
  max-inline-size: chat-theme.$messages-max-width;
  min-block-size: chat-theme.$min-height;
}

.cds-aichat--container--render[dir="rtl"]
  .cds-aichat--widget.cds-aichat--widget--default-element {
  inset-inline: chat-theme.$right-position chat-theme.$left-position;
}

/* ============================================================================
   WIDGET - RESPONSIVE (MOBILE)
   Mobile and phone-specific styles
   ============================================================================ */

.cds-aichat--is-phone:not(.cds-aichat--container-disable-mobile-enhancements)
  .cds-aichat--widget {
  position: fixed;
  z-index: chat-theme.$z-index;
  block-size: chat-theme.$height;
  inline-size: chat-theme.$width;
  inset: chat-theme.$top-position chat-theme.$right-position
    chat-theme.$bottom-position chat-theme.$left-position;
  max-block-size: chat-theme.$max-height;
  min-block-size: chat-theme.$min-height;

  &.cds-aichat--widget--launched.cds-aichat--widget--default-element {
    animation: cds-aichat-widget-in-mobile motion.$duration-moderate-02
      motion.motion(entrance, expressive) both;
    inset-block-end: 1px;
    inset-inline-start: 1px;
  }
}

.cds-aichat--is-phone[dir="rtl"]:not(
    .cds-aichat--container-disable-mobile-enhancements
  )
  .cds-aichat--widget {
  inset-inline: chat-theme.$right-position chat-theme.$left-position;
}
```

**These are now replaced by the `@mixin float-positioning` included above.**

### 4. Verify Mobile Viewport Detection

**Check:** Ensure `isMobileViewport` is available in the component scope.

**Location:** Around line 100-150 in AppShell.tsx

Look for:

```tsx
const isMobileViewport = useMobileViewportLayout();
```

If the variable name is different, adjust the class name condition accordingly.

## Testing Checklist

### Build Testing

- [ ] Run `npm run build` in `packages/ai-chat` - no errors
- [ ] Verify TypeScript compilation succeeds
- [ ] Check that SCSS compiles without errors
- [ ] Verify mixin is properly included in AppShellStyles.scss
- [ ] Verify old widget classes are removed from compiled CSS
- [ ] Verify new float classes are present in compiled CSS

### Functional Testing

- [ ] Test existing ChatContainer examples still work
- [ ] Verify float positioning is applied correctly
- [ ] Test opening animation works
- [ ] Test closing animation works
- [ ] Test mobile responsive behavior
- [ ] Verify ChatCustomElement is NOT affected (should not have float classes)

### Visual Testing

- [ ] Open browser dev tools and inspect the ChatShell element
- [ ] Verify new float classes are present
- [ ] Verify old widget classes are NOT present
- [ ] Check that positioning matches previous behavior
- [ ] Verify animations trigger correctly

## Testing Commands

```bash
# Build the package
cd packages/ai-chat
npm run build

# Run existing examples to verify behavior
cd ../../examples/react/basic
npm install
npm start

# Open browser to http://localhost:8080
# Inspect the chat widget element classes
```

## Expected Class Output

When chat is **opening** (not using custom element):

```html
<cds-aichat-shell
  class="
  cds-aichat--widget
  cds-aichat-float-open
  cds-aichat-float-opening
  ...
"
></cds-aichat-shell>
```

When chat is **closing**:

```html
<cds-aichat-shell
  class="
  cds-aichat--widget
  cds-aichat-float-open
  cds-aichat-float-closing
  ...
"
></cds-aichat-shell>
```

When chat is **closed**:

```html
<cds-aichat-shell
  class="
  cds-aichat--widget
  cds-aichat-float-close
  ...
"
></cds-aichat-shell>
```

When using **ChatCustomElement** (custom host element):

```html
<cds-aichat-shell
  class="
  cds-aichat--widget
  (NO float classes - useCustomHostElement is true)
  ...
"
></cds-aichat-shell>
```

## Troubleshooting

### Issue: Float classes not appearing

- Verify `@use "./styles/chat-layout"` is imported in AppShellStyles.scss
- Verify `@include chat-layout.float-positioning` is present
- Check that the build completed successfully
- Clear browser cache and rebuild

### Issue: Animations not working

- Check browser console for CSS errors
- Verify keyframes are defined in the mixin
- Verify mixin is properly included
- Test with `prefers-reduced-motion: no-preference`

### Issue: Mobile classes not applying

- Verify `isMobileViewport` variable name matches the actual hook usage
- Check mobile viewport detection logic
- Test on actual mobile device or use browser dev tools mobile emulation

### Issue: Old widget classes still appearing

- Verify you removed the old styles from AppShellStyles.scss
- Clear build cache and rebuild
- Check that you're testing the newly built version

## Notes

- Old internal widget classes are completely replaced with new public float classes
- The float styles are now generated via `@mixin float-positioning` following `@carbon/styles` patterns
- The mixin is included in AppShellStyles.scss for internal use
- External users can include the mixin or import the auto-generated classes
- The new float classes are designed to be used externally (e.g., on cds-aichat-shell for lazy loading)
- ChatCustomElement behavior is unchanged (no float classes applied)
- Mobile detection should use existing viewport detection logic

## Next Phase

After completing this task and verifying all tests pass, proceed to **TASK-3-lazy-loading-chat-container.md** to create the lazy loading examples.
