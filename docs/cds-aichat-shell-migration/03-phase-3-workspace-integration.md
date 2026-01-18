# Phase 3: Workspace Integration

## Overview Context

This is Phase 3 of migrating AppShell.tsx to use `cds-aichat-shell`. See `00-overview.md` for complete project context.

**Prerequisites**:

- Phase 1 complete (header, messages, input slots working)
- Phase 2 complete (all panels wrapped with CdsAiChatPanel)

**Goal**: Integrate WorkspaceContainer into the workspace slot of cds-aichat-shell.

**Status:** ✅ Complete (workspace slot wired in AppShell; legacy cleanup deferred)

## Phase 3 Objectives

1. Understand workspace slot behavior in cds-aichat-shell
2. Wire WorkspaceContainer into the workspace slot
3. Configure workspace location (start/end)
4. Ensure workspace panel animations work correctly
5. Test workspace opening/closing behavior

## Workspace Slot Overview

The `cds-aichat-shell` provides a `workspace` slot that can be positioned at either the start or end of the chat interface. The shell handles:

- Layout management (side-by-side with messages)
- Animations (expand/contract)
- Responsive behavior
- Width calculations

**Key Props**:

- `showWorkspace` - Controls workspace visibility
- `workspaceLocation` - "start" or "end" positioning

## Implementation Steps

### Step 1: Update CdsAiChatShell Props in AppShell.tsx

**File**: `packages/ai-chat/src/chat/AppShell.tsx`

Update the CdsAiChatShell component (from Phase 1) to include workspace props:

```tsx
<CdsAiChatShell
  aiEnabled={theme.aiEnabled}
  showFrame={layout?.showFrame}
  roundedCorners={theme.corners === CornersType.ROUND}
  showWorkspace={workspacePanelState.isOpen}
  workspaceLocation={workspacePanelState.options.preferredLocation}
>
  {/* existing slots from Phase 1 */}

  {/* Add workspace slot */}
  <div slot="workspace">
    <WorkspaceContainer serviceManager={serviceManager} />
  </div>
</CdsAiChatShell>
```

### Step 2: Update Workspace State Management

The workspace state is managed in Redux. Ensure the state properly controls the shell's workspace visibility.

**Key State Properties**:

```typescript
interface WorkspacePanelState {
  isOpen: boolean;
  options: {
    preferredLocation: "start" | "end";
    disableAnimation: boolean;
  };
}
```

**State Selector** (already exists):

```typescript
const workspacePanelState = appState.workspacePanelState;
```

### Step 3: Handle Workspace Animations

The cds-aichat-shell handles workspace animations internally. However, we may need to:

1. **Remove custom animation CSS** that's now handled by the shell
2. **Update animation disable logic** if needed
3. **Test animation smoothness**

**CSS to Review/Remove**:

- `.cds-aichat--messages-and-input-container` transition styles
- `.cds-aichat--workspace-container-panel__open` styles
- Width transition animations

### Step 4: Update WorkspaceContainer Component

**File**: `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.tsx`

The WorkspaceContainer may need minor updates to work within the workspace slot:

1. **Remove wrapper divs** that are now handled by the shell
2. **Update CSS classes** to work with shell's structure
3. **Ensure proper height/width** behavior

**Current Structure** (needs review):

```tsx
<div className="cds-aichat--workspace-container-panel">
  {/* workspace content */}
</div>
```

**Potential New Structure**:

```tsx
{
  /* Content directly in slot, shell handles container */
}
<div className="cds-aichat--workspace-content">{/* workspace content */}</div>;
```

### Step 5: Update CSS for Workspace

**Files to Review**:

1. `packages/ai-chat/src/chat/components-legacy/AssistantChat.scss`
2. `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.scss`

**CSS Changes**:

- Remove layout styles now handled by shell
- Keep content-specific styles
- Update selectors to work with shell's DOM structure

**Example - Remove These**:

```scss
// REMOVE: Layout now handled by shell
.cds-aichat--non-header-container:has(
  .cds-aichat--workspace-container-panel__open
) {
  .cds-aichat--messages-and-input-container {
    inline-size: 25%;
    min-inline-size: 360px;
  }
}
```

### Step 6: Test Workspace Behavior

Comprehensive testing is critical for workspace integration:

**Test Cases**:

1. Open workspace from start location
2. Open workspace from end location
3. Close workspace
4. Switch workspace location while open
5. Resize window with workspace open
6. Test with different content in workspace
7. Test animation smoothness
8. Test with animation disabled
9. Test workspace with panels open
10. Test focus management with workspace

## Workspace Location Configuration

The workspace location can be configured via:

**Redux Action**:

```typescript
actions.setWorkspacePanelOptions({
  preferredLocation: "start" | "end",
  disableAnimation: boolean,
});
```

**User Preference**:
The location preference should persist across sessions if stored in browser storage.

## Integration with Messages Area

When workspace is open, the messages area should:

1. **Resize appropriately** - Shell handles this
2. **Maintain scroll position** - Verify this works
3. **Keep content readable** - Test minimum widths
4. **Animate smoothly** - Shell handles this

## Current State

- `AppShell.tsx` passes `showWorkspace` and `workspaceLocation` to `ChatShell`, rendering `WorkspaceContainer` in the `workspace` slot.
- Legacy `AssistantChat` still includes workspace rendering; per plan, cleanup is deferred.

## Files Touched

1. ✅ `packages/ai-chat/src/chat/AppShell.tsx` - workspace slot wired
2. ⏸️ `packages/ai-chat/src/chat/components-legacy/AssistantChat.tsx` - legacy workspace remains (cleanup later)

## Next

- Run Phase 2C verification (build + manual checks) to confirm workspace behavior.
- Schedule legacy cleanup/removal once verification passes.

3. ⚠️ `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.tsx` - Update for slot usage
4. ⚠️ `packages/ai-chat/src/chat/components-legacy/AssistantChat.scss` - Remove layout CSS
5. ⚠️ `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.scss` - Update CSS

## Testing Checklist

After implementing Phase 3:

- [ ] Workspace opens at start location
- [ ] Workspace opens at end location
- [ ] Workspace closes smoothly
- [ ] Workspace animations are smooth
- [ ] Messages area resizes correctly when workspace opens
- [ ] Messages area resizes correctly when workspace closes
- [ ] Scroll position maintained during workspace transitions
- [ ] Workspace content displays correctly
- [ ] Workspace location can be changed dynamically
- [ ] Animation disable option works
- [ ] Workspace works with panels open
- [ ] Focus management works with workspace
- [ ] Responsive behavior works correctly
- [ ] No layout shifts or glitches
- [ ] No console errors
- [ ] No visual regressions

## Known Challenges

1. **Layout Calculations**: Shell's layout may differ from custom implementation
2. **Animation Timing**: Workspace animations may need tuning
3. **Minimum Widths**: Ensure messages area doesn't get too narrow
4. **Content Overflow**: Workspace content must handle various sizes
5. **State Synchronization**: Ensure Redux state properly controls shell

## Workspace Slot Behavior

The cds-aichat-shell workspace slot has two rendering modes:

1. **Inline Mode** (default): Workspace appears side-by-side with messages
2. **Panel Mode**: Workspace appears as an overlay panel (mobile/narrow viewports)

The shell automatically switches between modes based on viewport width. Test both modes.

## Next Phase

After Phase 3 is complete and tested, proceed to Phase 4: CSS Cleanup (`04-phase-4-css-cleanup.md`)

## Rollback Plan

If Phase 3 causes issues:

1. Revert workspace slot changes in AppShell.tsx
2. Restore workspace rendering in AssistantChat.tsx
3. Restore original CSS
4. Document specific issues encountered
5. Consider alternative workspace integration approach
