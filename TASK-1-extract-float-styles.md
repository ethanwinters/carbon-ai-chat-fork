# Task 1: Extract Float Positioning Styles as Mixin

## Overview

Extract the ChatContainer float positioning styles from `AppShellStyles.scss` into a new reusable `_chat-layout.scss` module following the `@carbon/styles` mixin pattern. The styles will be wrapped in a `@mixin float-positioning` that can be included where needed, matching how Carbon components like accordion are structured.

## Prerequisites

- Understanding of SCSS/CSS
- Familiarity with Carbon Design System theming
- Understanding of the build process

## Files to Create

### 1. Create `packages/ai-chat/src/chat/styles/_chat-layout.scss`

This file will contain the float positioning mixin following the `@carbon/styles` component pattern (like accordion, button, etc.).

**Content:**

```scss
/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * Float positioning mixin for Carbon AI Chat floating widget mode.
 * Following @carbon/styles component patterns where styles are wrapped in mixins.
 *
 * These styles can be applied to both cds-aichat-shell (for lazy loading placeholders)
 * and the full ChatContainer to ensure consistent positioning and animations.
 *
 * Usage:
 * @use "@carbon/ai-chat/scss/chat-layout";
 * @include chat-layout.float-positioning;
 *
 * Classes generated:
 * - .cds-aichat-float-open - Base floating position
 * - .cds-aichat-float-opening - Opening animation state
 * - .cds-aichat-float-closing - Closing animation state
 * - .cds-aichat-float-close - Fully closed state
 * - .cds-aichat-float-mobile - Mobile-specific positioning
 */

@use "@carbon/styles/scss/motion";
@use "@carbon/layout";
@use "chat-theme";

@mixin float-positioning {
  /* ============================================================================
     FLOAT - BASE POSITIONING
     Fixed positioning for floating widget mode
     Uses logical properties for automatic RTL support
     ============================================================================ */

  .cds-aichat-float-open {
    position: fixed;
    z-index: chat-theme.$z-index;
    block-size: chat-theme.$height;
    inline-size: chat-theme.$width;
    inset-block-start: chat-theme.$top-position;
    inset-block-end: chat-theme.$bottom-position;
    inset-inline-end: chat-theme.$right-position;
    inset-inline-start: chat-theme.$left-position;
    max-block-size: chat-theme.$max-height;
    max-inline-size: chat-theme.$messages-max-width;
    min-block-size: chat-theme.$min-height;
  }

  /* ============================================================================
     FLOAT - OPENING ANIMATION
     Animation when chat is opening
     ============================================================================ */

  @media screen and (prefers-reduced-motion: reduce) {
    .cds-aichat-float-opening {
      animation: none;
    }
  }

  .cds-aichat-float-opening:not(.cds-aichat-float-mobile) {
    animation: cds-aichat-float-in motion.$duration-moderate-02
      motion.motion(entrance, expressive) both;
  }

  /* ============================================================================
     FLOAT - CLOSING ANIMATION
     Animation when chat is closing
     ============================================================================ */

  @media screen and (prefers-reduced-motion: reduce) {
    .cds-aichat-float-closing {
      animation: none;
    }
  }

  .cds-aichat-float-closing {
    animation: cds-aichat-float-out motion.$duration-fast-02
      motion.motion(exit, expressive) both;
  }

  /* ============================================================================
     FLOAT - CLOSED STATE
     Styles when chat is fully closed
     ============================================================================ */

  .cds-aichat-float-close {
    display: none;
    overflow: hidden;
    border: none;
    box-shadow: none;
  }

  /* ============================================================================
     FLOAT - MOBILE RESPONSIVE
     Mobile-specific positioning and animations
     ============================================================================ */

  .cds-aichat-float-mobile {
    position: fixed;
    z-index: chat-theme.$z-index;
    block-size: chat-theme.$height;
    inline-size: chat-theme.$width;
    inset-block-start: chat-theme.$top-position;
    inset-block-end: chat-theme.$bottom-position;
    inset-inline-end: chat-theme.$right-position;
    inset-inline-start: chat-theme.$left-position;
    max-block-size: chat-theme.$max-height;
    min-block-size: chat-theme.$min-height;
  }

  .cds-aichat-float-mobile.cds-aichat-float-opening {
    animation: cds-aichat-float-in-mobile motion.$duration-moderate-02
      motion.motion(entrance, expressive) both;
    inset-block-end: 1px;
    inset-inline-start: 1px;
  }

  /* ============================================================================
     FLOAT - KEYFRAME ANIMATIONS
     Animation definitions for opening and closing
     ============================================================================ */

  @keyframes cds-aichat-float-in {
    0% {
      inset-block-end: calc(
        chat-theme.$bottom-position - #{layout.$spacing-07}
      );
      opacity: 0;
    }

    100% {
      inset-block-end: chat-theme.$bottom-position;
      opacity: 1;
    }
  }

  @keyframes cds-aichat-float-in-mobile {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes cds-aichat-float-out {
    0% {
      opacity: 1;
    }

    100% {
      opacity: 0;
    }
  }
}
```

## Files to Modify

### 2. Update `packages/ai-chat/src/chat/styles/index.scss`

**Add the forward for the new chat-layout module:**

```scss
@forward "chat-config";
@forward "chat-keyframes";
@forward "chat-theme";
@forward "chat-layout"; // Add this line
```

### 3. Update `packages/ai-chat/src/chat/AppShellStyles.scss`

**Location:** Lines 153-252

**Changes:**

1. The float styles are now imported via the styles index
2. Remove the old widget positioning styles (they'll be replaced in Task 2)

**Remove these sections (lines 153-252):**

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

**These are now replaced by the float.scss styles.**

### 4. Create Public Export File `packages/ai-chat/src/scss/chat-layout.scss`

This file will be the public entry point that gets copied to the build output. It forwards the mixin and auto-includes it for direct imports (lazy loading scenarios).

**Content:**

```scss
/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * Public export of chat layout styles including float positioning.
 *
 * Usage Option 1 - Include the mixin:
 * @use "@carbon/ai-chat/scss/chat-layout";
 * @include chat-layout.float-positioning;
 *
 * Usage Option 2 - Direct import (auto-generates classes for lazy loading):
 * @use "@carbon/ai-chat/scss/chat-layout.scss";
 */

@forward "../chat/styles/chat-layout";

// Auto-include for direct imports (lazy loading scenarios)
@use "../chat/styles/chat-layout";
@include chat-layout.float-positioning;
```

## Testing Checklist

- [ ] Verify `packages/ai-chat/src/chat/styles/_chat-layout.scss` is created with `@mixin float-positioning`
- [ ] Verify `packages/ai-chat/src/scss/chat-layout.scss` is created
- [ ] Verify `packages/ai-chat/src/chat/styles/index.scss` forwards chat-layout
- [ ] Verify old widget styles are removed from `AppShellStyles.scss`
- [ ] Verify mixin is included in `AppShellStyles.scss`
- [ ] Run build to ensure no SCSS compilation errors
- [ ] Verify existing ChatContainer still works (will be updated in Task 2)
- [ ] Test that mixin can be imported externally

## Build Commands

```bash
# From project root
cd packages/ai-chat
npm run build

# Check for any SCSS compilation errors
```

## Notes

- The `_chat-layout.scss` file lives in `src/chat/styles/` alongside other style modules
- Follows `@carbon/styles` mixin pattern (like accordion, button, etc.)
- The public export `src/scss/chat-layout.scss` forwards the mixin and auto-includes it
- Build process (Task 5) will copy `src/scss/` to `dist/scss/` for external use
- The new float classes will be applied in Task 2
- Internal usage: `@use "./styles/chat-layout"; @include chat-layout.float-positioning;`
- External usage for lazy loading: `@use "@carbon/ai-chat/scss/chat-layout.scss";`
- External usage with mixin: `@use "@carbon/ai-chat/scss/chat-layout"; @include chat-layout.float-positioning;`

## Next Phase

After completing this task, proceed to **TASK-2-update-components.md** to update the React components to use these new classes.
