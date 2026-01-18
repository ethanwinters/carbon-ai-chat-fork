# Phase 4: CSS Cleanup and Migration

## Overview Context

This is Phase 4 of migrating AppShell.tsx to use `cds-aichat-shell`. See `00-overview.md` for complete project context.

**Prerequisites**:

- Phase 1 complete (header, messages, input slots working)
- Phase 2 complete (all panels wrapped with CdsAiChatPanel)
- Phase 3 complete (workspace integrated)

**Goal**: Clean up and migrate CSS to leverage cds-aichat-shell's built-in styles, removing unused custom styles.

## Phase 4 Objectives

1. Identify CSS now handled by cds-aichat-shell
2. Remove unused CSS from AssistantChat.scss
3. Remove unused CSS from AppShell.scss
4. Remove unused CSS from AppShellStyles.scss
5. Update resize observers to work with new structure
6. Verify visual consistency

## CSS Files to Review

1. **`packages/ai-chat/src/chat/AppShell.scss`** - Main app shell styles
2. **`packages/ai-chat/src/chat/AppShellStyles.scss`** - Additional app shell styles
3. **`packages/ai-chat/src/chat/components-legacy/AssistantChat.scss`** - Chat component styles
4. **`packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.scss`** - Workspace styles

## What cds-aichat-shell Handles

The shell component provides built-in styles for:

### Layout & Structure

- Main container layout
- Slot positioning and spacing
- Header/footer layout
- Messages area layout
- Input area layout
- Workspace side-by-side layout
- Panel overlay positioning

### Animations

- Panel open/close animations
- Workspace expand/contract animations
- Smooth transitions

### Responsive Behavior

- Mobile viewport adjustments
- Workspace panel mode (overlay on mobile)
- Breakpoint-based layout changes

### Theming

- AI theme integration
- Frame borders
- Rounded corners
- Color schemes

## CSS Audit Strategy

For each CSS file, categorize rules into:

1. **REMOVE** - Now handled by shell
2. **KEEP** - Content-specific styles still needed
3. **MIGRATE** - Needs to use shell's CSS variables
4. **REVIEW** - Unclear, needs testing

## Step 1: Audit AssistantChat.scss

**File**: `packages/ai-chat/src/chat/components-legacy/AssistantChat.scss`

### Styles to REMOVE (handled by shell):

```scss
// REMOVE: Layout now handled by shell
.cds-aichat--non-header-container {
  position: relative;
  display: flex;
  overflow: hidden;
  flex: 1 1 0%;
}

// REMOVE: Max width now handled by shell
.cds-aichat--widget--max-width
  .cds-aichat--messages-container__input-container {
  margin: auto;
  inline-size: 100%;
  max-inline-size: chat-theme.$messages-max-width;
}

// REMOVE: Container layout handled by shell
.cds-aichat--messages-and-input-container {
  position: relative;
  display: flex;
  flex-direction: column;
  inline-size: 100%;
  transition: inline-size motion.$duration-fast-02
    motion.motion(standard, productive);

  &--no-animation {
    transition: none;
  }
}

// REMOVE: Workspace layout handled by shell
.cds-aichat--non-header-container:has(
  .cds-aichat--workspace-container-panel__open
) {
  .cds-aichat--messages-and-input-container {
    inline-size: 25%;
    min-inline-size: 360px;
  }
}
```

### Styles to KEEP (content-specific):

```scss
// KEEP: Message-specific styles
.cds-aichat--messages-container__non-input-container {
  // Content styles
}

// KEEP: Input-specific styles
.cds-aichat--messages-container__input-container {
  // Content styles (not layout)
}
```

### Styles to MIGRATE (use shell variables):

```scss
// MIGRATE: Use shell's CSS variables
.some-component {
  // OLD:
  max-inline-size: 672px;

  // NEW:
  max-inline-size: var(--cds-aichat-messages-max-width, 672px);
}
```

## Step 2: Audit AppShell.scss

**File**: `packages/ai-chat/src/chat/AppShell.scss`

This file is minimal and mostly imports. Review for:

```scss
:host {
  block-size: 100%;

  @include layout.emit-layout-tokens;
  @include meta.load-css("./AppShellStyles");
}
```

**Action**: Keep as-is, but review AppShellStyles.scss

## Step 3: Audit AppShellStyles.scss

**File**: `packages/ai-chat/src/chat/AppShellStyles.scss`

This file likely contains widget-level styles. Review each rule:

### Widget Container Styles

```scss
// REVIEW: May need to update selectors for shell structure
.cds-aichat--widget {
  // Check if these conflict with shell styles
}

// REMOVE: Frame styles now handled by shell
.cds-aichat--widget--frameless {
  // Shell handles this via showFrame prop
}

// REMOVE: Rounded corners handled by shell
.cds-aichat--widget--rounded {
  // Shell handles this via roundedCorners prop
}
```

### Animation Styles

```scss
// REMOVE: Animations handled by shell/panel
.cds-aichat--widget--launched,
.cds-aichat--widget--closing {
  // Shell handles panel animations
}
```

### Width Breakpoints

```scss
// REVIEW: May still be needed for content
.cds-aichat--standard-width,
.cds-aichat--narrow-width,
.cds-aichat--wide-width {
  // Check if shell provides equivalent
}
```

## Step 4: Audit WorkspaceContainer.scss

**File**: `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.scss`

### Styles to REMOVE:

```scss
// REMOVE: Layout handled by shell workspace slot
.cds-aichat--workspace-container-panel {
  // Position, size, transitions handled by shell
}

// REMOVE: Open state handled by shell
.cds-aichat--workspace-container-panel__open {
  // Shell manages open state
}
```

### Styles to KEEP:

```scss
// KEEP: Workspace content styles
.cds-aichat--workspace-content {
  // Internal content styling
}
```

## Step 5: Update Resize Observers

**File**: `packages/ai-chat/src/chat/AppShell.tsx`

The resize observer logic may need updates:

### Current Implementation (around line 510-545):

```typescript
const handleResize = useCallback(() => {
  const container = widgetContainerRef.current;
  if (!container) {
    return;
  }

  const height = container.offsetHeight;
  const width = container.offsetWidth;
  let appChatWidthBreakpoint: ChatWidthBreakpoint;
  if (width >= 672 + 16 + 16) {
    appChatWidthBreakpoint = ChatWidthBreakpoint.WIDE;
  } else if (width >= 360) {
    appChatWidthBreakpoint = ChatWidthBreakpoint.STANDARD;
  } else {
    appChatWidthBreakpoint = ChatWidthBreakpoint.NARROW;
  }

  serviceManager.store.dispatch(actions.setAppStateValue("chatWidth", width));
  serviceManager.store.dispatch(actions.setAppStateValue("chatHeight", height));
  serviceManager.store.dispatch(
    actions.setAppStateValue("chatWidthBreakpoint", appChatWidthBreakpoint),
  );
}, [serviceManager]);
```

**Action**:

1. Verify this still works with shell structure
2. Update container reference if needed
3. Test breakpoint calculations

### Header Resize Observer

The header resize observer in AssistantChat may need updates:

**Current** (AssistantChat.tsx, line 100-118):

```typescript
if (this.headerRef.current) {
  this.headerResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const height = entry.contentRect.height;
      const container = entry.target.closest(".cds-aichat--widget--content");
      if (container) {
        (container as HTMLElement).style.setProperty(
          "--cds-aichat--header-height",
          `${height}px`,
        );
      }
    }
  });
  this.headerResizeObserver.observe(this.headerRef.current);
}
```

**Action**:

1. Check if shell provides header height variable
2. Update selector if needed
3. Verify CSS variable usage

## Step 6: CSS Variable Migration

The shell may provide CSS variables that should be used:

### Shell CSS Variables (check documentation):

```css
--cds-aichat-messages-max-width
--cds-aichat-header-height
--cds-aichat-input-height
--cds-aichat-workspace-width
/* etc. */
```

**Action**: Replace hardcoded values with shell variables where available

## Step 7: Visual Regression Testing

After CSS cleanup, perform visual regression testing:

### Test Scenarios:

1. **Layout**
   - [ ] Header displays correctly
   - [ ] Messages area sized correctly
   - [ ] Input area positioned correctly
   - [ ] Workspace layout correct (start/end)

2. **Spacing**
   - [ ] Padding/margins consistent
   - [ ] No unexpected gaps
   - [ ] Content not cut off

3. **Responsive**
   - [ ] Mobile viewport works
   - [ ] Tablet viewport works
   - [ ] Desktop viewport works
   - [ ] Breakpoint transitions smooth

4. **Theming**
   - [ ] Light theme correct
   - [ ] Dark theme correct
   - [ ] AI theme correct
   - [ ] Frame borders correct
   - [ ] Rounded corners correct

5. **Animations**
   - [ ] Panel animations smooth
   - [ ] Workspace animations smooth
   - [ ] No animation glitches

## Files to Modify

1. ✅ `packages/ai-chat/src/chat/components-legacy/AssistantChat.scss` - Remove layout CSS
2. ✅ `packages/ai-chat/src/chat/AppShellStyles.scss` - Remove shell-handled CSS
3. ✅ `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.scss` - Remove layout CSS
4. ⚠️ `packages/ai-chat/src/chat/AppShell.tsx` - Update resize observers if needed
5. ⚠️ `packages/ai-chat/src/chat/components-legacy/AssistantChat.tsx` - Update resize observer if needed

## CSS Cleanup Checklist

- [ ] Identified all CSS handled by shell
- [ ] Removed duplicate layout styles
- [ ] Removed duplicate animation styles
- [ ] Removed duplicate theming styles
- [ ] Updated CSS variables to use shell's
- [ ] Updated resize observers
- [ ] Tested all viewports
- [ ] Tested all themes
- [ ] Tested all animations
- [ ] No visual regressions
- [ ] No console warnings about CSS
- [ ] CSS file sizes reduced

## Known Challenges

1. **Selector Specificity**: Shell styles may conflict with existing styles
2. **CSS Variables**: May need to map old variables to new shell variables
3. **Resize Observers**: May need to observe different elements
4. **Custom Themes**: Custom theme CSS may need updates
5. **Third-party Styles**: External styles may conflict

## Documentation Updates

After CSS cleanup, update:

1. **Style guide** - Document which CSS is now handled by shell
2. **Component docs** - Update styling examples
3. **Migration guide** - Document CSS changes for users

## Next Phase

After Phase 4 is complete and tested, proceed to Phase 5: Final Testing & Verification (`05-phase-5-final-testing.md`)

## Rollback Plan

If Phase 4 causes visual issues:

1. Revert CSS changes
2. Document specific visual regressions
3. Identify conflicting styles
4. Consider more gradual CSS migration
5. Update shell component if needed
