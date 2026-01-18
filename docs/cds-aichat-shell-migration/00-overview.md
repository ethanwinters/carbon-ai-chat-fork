# cds-aichat-shell Migration Overview

## Project Goal

Refactor `AppShell.tsx` to use the `cds-aichat-shell` React wrapper as the main structural container, replacing the current custom layout implementation. This migration will leverage the component library's built-in slot system and panel management for better modularity and maintainability.

## High-Level Architecture Changes

### Current Structure

```
AppShell.tsx
└── Custom layout divs
    ├── AssistantChat (monolithic component)
    │   ├── AssistantHeader
    │   ├── MessagesComponent
    │   ├── Input
    │   └── WorkspaceContainer
    └── Various Panels (custom implementation)
```

### Target Structure

```
AppShell.tsx
└── CdsAiChatShell (web component wrapper)
    ├── header slot → AssistantHeader
    ├── header-after slot → HEADER_BOTTOM_ELEMENT
    ├── messages-before slot → MESSAGES_BEFORE_ELEMENT (new)
    ├── messages slot → MessagesComponent
    ├── messages-after slot → MESSAGES_AFTER_ELEMENT (new)
    ├── input-before slot → BEFORE_INPUT_ELEMENT
    ├── input slot → Input component
    ├── workspace slot → WorkspaceContainer
    └── CdsAiChatPanel wrappers for all panels
```

## Key Architectural Decisions

1. **Slot-Based Architecture**: Use `cds-aichat-shell`'s slot system for layout management
2. **Panel Management**: Wrap all panels with `cds-aichat-panel` for consistent behavior
3. **WriteableElements**: Add new slots for `messages-before` and `messages-after`
4. **Component Extraction**: Split monolithic `AssistantChat` into focused slot components
5. **Animation System**: Use `cds-aichat-panel`'s built-in animation system
6. **Incremental Migration**: Implement in phases to maintain stability

## Implementation Phases

### Phase 1: Core Slots (Header, Messages, Input)

**Goal**: Establish the foundation by integrating the main chat interface slots

**Key Files**:

- `packages/ai-chat/src/types/instance/ChatInstance.ts` - Add new WriteableElementName entries
- `packages/ai-chat/src/chat/services/loadServices.ts` - Initialize new WriteableElements
- `packages/ai-chat/src/chat/AppShell.tsx` - Integrate CdsAiChatShell
- `packages/ai-chat/src/chat/components-legacy/AssistantChat.tsx` - Extract components

**Deliverables**:

- New WriteableElementName entries for MESSAGES_BEFORE and MESSAGES_AFTER
- Header, messages, and input slots properly wired up
- Focus and scroll management working with new structure

### Phase 2: Panel Migration

**Goal**: Migrate all panels to use `cds-aichat-panel` wrapper

**Key Files**:

- All panel components in `packages/ai-chat/src/chat/panels/`
- `packages/ai-chat/src/chat/AppShell.tsx` - Update panel rendering

**Deliverables**:

- All 7 panels wrapped with CdsAiChatPanel
- Panel priorities configured
- Animation system integrated
- Event handlers updated to use cds-aichat-panel events

### Phase 3: Workspace Integration

**Goal**: Integrate WorkspaceContainer into the workspace slot

**Key Files**:

- `packages/ai-chat/src/chat/components-legacy/WorkspaceContainer.tsx`
- `packages/ai-chat/src/chat/AppShell.tsx`

**Deliverables**:

- WorkspaceContainer in workspace slot
- Location configuration (start/end) working
- Panel animations functioning correctly

### Phase 4: CSS Cleanup

**Goal**: Remove unused CSS and migrate styles to leverage cds-aichat-shell

**Key Files**:

- `packages/ai-chat/src/chat/AppShell.scss`
- `packages/ai-chat/src/chat/components-legacy/AssistantChat.scss`
- `packages/ai-chat/src/chat/AppShellStyles.scss`

**Deliverables**:

- Unused CSS removed
- Styles migrated to use shell's CSS variables
- Resize observers updated

### Phase 5: Testing & Verification

**Goal**: Comprehensive testing and final cleanup

**Deliverables**:

- All functionality verified
- No regressions
- Documentation updated
- TypeScript types updated

## Component Library References

### CdsAiChatShell

- **Location**: `packages/ai-chat-components/src/components/chat-shell/src/cds-aichat-shell.ts`
- **React Wrapper**: `packages/ai-chat-components/src/react/chat-shell.ts`
- **Key Props**: `aiEnabled`, `showFrame`, `roundedCorners`, `showWorkspace`, `workspaceLocation`

### CdsAiChatPanel

- **Location**: `packages/ai-chat-components/src/components/chat-shell/src/cds-aichat-panel.ts`
- **React Wrapper**: `packages/ai-chat-components/src/react/panel.ts`
- **Key Props**: `open`, `priority`, `fullWidth`, `showChatHeader`, `animationOnOpen`, `animationOnClose`
- **Events**: `onOpenStart`, `onOpenEnd`, `onCloseStart`, `onCloseEnd`

## Available Slots in cds-aichat-shell

1. **header** - Main header content
2. **header-after** - Content below header (new line)
3. **messages-before** - Content before messages area
4. **messages** - Main messages area
5. **messages-after** - Content after messages area
6. **input-before** - Content before input field
7. **input** - Input field area
8. **input-after** - Content after input field
9. **workspace** - Workspace panel content
10. **footer** - Footer content

## New WriteableElements Required

```typescript
enum WriteableElementName {
  // ... existing entries ...
  MESSAGES_BEFORE_ELEMENT = "messagesBeforeElement",
  MESSAGES_AFTER_ELEMENT = "messagesAfterElement",
  AFTER_INPUT_ELEMENT = "afterInputElement",
  FOOTER_ELEMENT = "footerElement",
}
```

## Migration Strategy

1. **Start Fresh Per Phase**: Each phase begins with a new task and empty context
2. **Phase Documentation**: Each phase has its own detailed markdown file
3. **Context Refresh**: Phase documents include all necessary context from overview
4. **Incremental Testing**: Test after each phase before moving to next
5. **Rollback Safety**: Each phase is independently testable and reversible

## Success Criteria

- [ ] All slots properly populated with correct components
- [ ] All panels using cds-aichat-panel wrapper
- [ ] Focus management working correctly
- [ ] Scroll behavior maintained
- [ ] Workspace panel animations smooth
- [ ] All WriteableElements in correct slots
- [ ] CSS cleaned up and optimized
- [ ] No visual regressions
- [ ] No functional regressions
- [ ] TypeScript types updated

## Next Steps

Start with Phase 1 by reading `docs/cds-aichat-shell-migration/01-phase-1-core-slots.md`
