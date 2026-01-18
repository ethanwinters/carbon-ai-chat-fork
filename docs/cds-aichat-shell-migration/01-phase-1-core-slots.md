# Phase 1: Core Slots (Header, Messages, Input)

## Overview Context

This is Phase 1 of migrating AppShell.tsx to use `cds-aichat-shell`. See `00-overview.md` for complete project context.

**Goal**: Establish the foundation by integrating the main chat interface slots (header, messages, input) into the cds-aichat-shell structure.

## Phase 1 Objectives

1. Add new WriteableElementName entries for messages-before and messages-after slots
2. Initialize the new WriteableElements in loadServices.ts
3. Extract components from AssistantChat for use in slots
4. Integrate CdsAiChatShell into AppShell.tsx
5. Wire up header, messages, and input slots
6. Ensure focus and scroll management work correctly

## Key Architecture Changes

### Slot Mapping

```
Current AssistantChat Structure:
├── AssistantHeader
├── MessagesComponent
└── Input (with BEFORE_INPUT_ELEMENT)

New CdsAiChatShell Structure:
├── header slot → AssistantHeader
├── header-after slot → HEADER_BOTTOM_ELEMENT WriteableElement
├── messages-before slot → MESSAGES_BEFORE_ELEMENT WriteableElement (NEW)
├── messages slot → MessagesComponent
├── messages-after slot → MESSAGES_AFTER_ELEMENT WriteableElement (NEW)
├── input-before slot → BEFORE_INPUT_ELEMENT WriteableElement
├── input slot → Input component
├── input-after slot → AFTER_INPUT_ELEMENT WriteableElement (NEW)
└── footer slot → FOOTER_ELEMENT WriteableElement (NEW)
```

## Implementation Steps

### Step 1: Add New WriteableElementName Entries

**File**: `packages/ai-chat/src/types/instance/ChatInstance.ts`

Add to the `WriteableElementName` enum (around line 409):

```typescript
export enum WriteableElementName {
  // ... existing entries ...

  /**
   * An element that appears before the messages area.
   */
  MESSAGES_BEFORE_ELEMENT = "messagesBeforeElement",

  /**
   * An element that appears after the messages area.
   */
  MESSAGES_AFTER_ELEMENT = "messagesAfterElement",

  /**
   * An element that appears after the input field.
   */
  AFTER_INPUT_ELEMENT = "afterInputElement",

  /**
   * An element that appears in the footer area.
   */
  FOOTER_ELEMENT = "footerElement",
}
```

### Step 2: Initialize New WriteableElements

**File**: `packages/ai-chat/src/chat/services/loadServices.ts`

Update the writeableElements initialization (around line 90):

```typescript
serviceManager.writeableElements = {
  [WriteableElementName.AI_TOOLTIP_AFTER_DESCRIPTION_ELEMENT]:
    document.createElement("div"),
  [WriteableElementName.WELCOME_NODE_BEFORE_ELEMENT]:
    document.createElement("div"),
  [WriteableElementName.HEADER_BOTTOM_ELEMENT]: document.createElement("div"),
  [WriteableElementName.BEFORE_INPUT_ELEMENT]: document.createElement("div"),
  [WriteableElementName.MESSAGES_BEFORE_ELEMENT]: document.createElement("div"),
  [WriteableElementName.MESSAGES_AFTER_ELEMENT]: document.createElement("div"),
  [WriteableElementName.AFTER_INPUT_ELEMENT]: document.createElement("div"),
  [WriteableElementName.FOOTER_ELEMENT]: document.createElement("div"),
  [WriteableElementName.HOME_SCREEN_HEADER_BOTTOM_ELEMENT]:
    document.createElement("div"),
  [WriteableElementName.HOME_SCREEN_AFTER_STARTERS_ELEMENT]:
    document.createElement("div"),
  [WriteableElementName.HOME_SCREEN_BEFORE_INPUT_ELEMENT]:
    document.createElement("div"),
  [WriteableElementName.CUSTOM_PANEL_ELEMENT]: document.createElement("div"),
  [WriteableElementName.WORKSPACE_PANEL_ELEMENT]: document.createElement("div"),
};
```

### Step 3: Import CdsAiChatShell in AppShell.tsx

**File**: `packages/ai-chat/src/chat/AppShell.tsx`

Add import at the top:

```typescript
import CdsAiChatShell from "@carbon/ai-chat-components/es/react/chat-shell.js";
```

### Step 4: Extract Components from AssistantChat

The current `AssistantChat` component is monolithic. We need to extract its parts for use in slots:

**Key Components to Extract**:

1. **Header Section**: AssistantHeader + HEADER_BOTTOM_ELEMENT
2. **Messages Section**: MessagesComponent + new before/after WriteableElements
3. **Input Section**: BEFORE_INPUT_ELEMENT + Input component

**Note**: We don't need to create separate wrapper components yet. We can render these directly in the slots within AppShell.tsx.

### Step 5: Integrate CdsAiChatShell into AppShell.tsx

**Location**: Inside the main render, replace the current AssistantChat structure

**Current Structure** (around line 883-922):

```tsx
<HideComponent
  className="cds-aichat--assistant-container"
  hidden={hideAssistantChatContainer}
>
  <AssistantChat
  // ... props
  />
</HideComponent>
```

**New Structure**:

```tsx
<CdsAiChatShell
  aiEnabled={theme.aiEnabled}
  showFrame={layout?.showFrame}
  roundedCorners={theme.corners === CornersType.ROUND}
  showWorkspace={workspacePanelState.isOpen}
  workspaceLocation={workspacePanelState.options.preferredLocation}
>
  {/* header slot */}
  <div slot="header">
    <AssistantHeader
      onClose={onClose}
      onRestart={onRestart}
      headerDisplayName={headerDisplayName}
      onToggleHomeScreen={onToggleHomeScreen}
      includeWriteableElement={false}
    />
  </div>

  {/* header-after slot */}
  <div slot="header-after">
    <WriteableElement
      slotName={WriteableElementName.HEADER_BOTTOM_ELEMENT}
      id={`headerBottomElement${serviceManager.namespace.suffix}`}
      className="cds-aichat--header-bottom-element"
    />
  </div>

  {/* messages-before slot */}
  <div slot="messages-before">
    <WriteableElement
      slotName={WriteableElementName.MESSAGES_BEFORE_ELEMENT}
      id={`messagesBeforeElement${serviceManager.namespace.suffix}`}
      className="cds-aichat--messages-before-element"
    />
  </div>

  {/* messages slot */}
  <div slot="messages">
    <MessagesComponent
      ref={messagesRef}
      messageState={assistantMessageState}
      localMessageItems={messagesToArray(
        assistantMessageState.localMessageIDs,
        allMessageItemsByID,
      )}
      requestInputFocus={requestInputFocus}
      assistantName={publicConfig.assistantName}
      intl={intl}
      onEndHumanAgentChat={showConfirmEndChat}
      locale={publicConfig.locale || "en"}
      useAITheme={theme.aiEnabled}
      carbonTheme={theme.derivedCarbonTheme}
    />
  </div>

  {/* messages-after slot */}
  <div slot="messages-after">
    <WriteableElement
      slotName={WriteableElementName.MESSAGES_AFTER_ELEMENT}
      id={`messagesAfterElement${serviceManager.namespace.suffix}`}
      className="cds-aichat--messages-after-element"
    />
  </div>

  {/* input-before slot */}
  <div slot="input-before">
    <WriteableElement
      slotName={WriteableElementName.BEFORE_INPUT_ELEMENT}
      id={`beforeInputElement${serviceManager.namespace.suffix}`}
      className="cds-aichat--before-input-element"
    />
  </div>

  {/* input slot */}
  <div slot="input">
    <Input
      ref={inputRef}
      languagePack={languagePack}
      serviceManager={serviceManager}
      disableInput={shouldDisableInput()}
      disableSend={shouldDisableSend()}
      isInputVisible={inputState.fieldVisible}
      onSendInput={onSendInput}
      onUserTyping={onUserTyping}
      showUploadButton={inputState.allowFileUploads}
      disableUploadButton={showUploadButtonDisabled}
      allowedFileUploadTypes={inputState.allowedFileUploadTypes}
      allowMultipleFileUploads={inputState.allowMultipleFileUploads}
      pendingUploads={inputState.files}
      onFilesSelectedForUpload={onFilesSelectedForUpload}
      placeholder={languagePack[agentDisplayState.inputPlaceholderKey]}
      isStopStreamingButtonVisible={
        inputState.stopStreamingButtonState.isVisible
      }
      isStopStreamingButtonDisabled={
        inputState.stopStreamingButtonState.isDisabled
      }
      maxInputChars={config.public.input?.maxInputCharacters}
      trackInputState
    />
  </div>

  {/* input-after slot */}
  <div slot="input-after">
    <WriteableElement
      slotName={WriteableElementName.AFTER_INPUT_ELEMENT}
      id={`afterInputElement${serviceManager.namespace.suffix}`}
      className="cds-aichat--after-input-element"
    />
  </div>

  {/* footer slot */}
  <div slot="footer">
    <WriteableElement
      slotName={WriteableElementName.FOOTER_ELEMENT}
      id={`footerElement${serviceManager.namespace.suffix}`}
      className="cds-aichat--footer-element"
    />
  </div>

  {/* workspace slot - Phase 3 */}
  <div slot="workspace">
    <WorkspaceContainer serviceManager={serviceManager} />
  </div>
</CdsAiChatShell>;

{
  /* Modals rendered outside shell */
}
{
  showEndChatConfirmation && (
    <EndHumanAgentChatModal
      onConfirm={confirmHumanAgentEndChat}
      onCancel={hideConfirmEndChat}
    />
  );
}
{
  humanAgentState.showScreenShareRequest && <RequestScreenShareModal />;
}
```

### Step 6: Update Refs and Helper Functions

You'll need to extract refs and helper functions from AssistantChat:

**Refs needed in AppShell**:

- `messagesRef` - for MessagesComponent
- `inputRef` - for Input component

**Helper functions needed**:

- `requestInputFocus()` - focus management
- `shouldDisableInput()` - input state logic
- `shouldDisableSend()` - send button state logic
- `onFilesSelectedForUpload()` - file upload handler
- `showConfirmEndChat()` - human agent chat modal
- `hideConfirmEndChat()` - hide modal
- `confirmHumanAgentEndChat()` - confirm end chat
- `messagesToArray()` - message memoization

### Step 7: Update Focus Management

The `requestFocus()` function in AppShell needs to be updated to work with the new structure:

```typescript
const requestFocus = useCallback(
  () => {
    try {
      if (shouldAutoFocus && !IS_MOBILE) {
        if (showDisclaimer) {
          if (disclaimerRef.current) {
            doFocusRef(disclaimerRef);
          }
        } else if (showHomeScreen) {
          if (homeScreenInputRef.current) {
            homeScreenInputRef.current.takeFocus();
          }
        } else if (iFramePanelState.isOpen) {
          iframePanelRef.current?.requestFocus();
        } else if (viewSourcePanelState.isOpen) {
          viewSourcePanelRef.current?.requestFocus();
        } else if (customPanelState.isOpen) {
          customPanelRef.current?.requestFocus();
        } else if (responsePanelState.isOpen) {
          responsePanelRef.current?.requestFocus();
        } else if (inputRef.current) {
          // Updated: direct input ref instead of botChatRef
          inputRef.current.takeFocus();
        }
      }
    } catch (error) {
      consoleError("An error occurred in MainWindow.requestFocus", error);
    }
  },
  [
    /* dependencies */
  ],
);
```

### Step 8: Update Scroll Management

The scroll functions need to reference messagesRef directly:

```typescript
const doAutoScroll = useCallback((options?: AutoScrollOptions) => {
  messagesRef.current?.doAutoScroll(options);
}, []);

const getMessagesScrollBottom = useCallback(() => {
  return messagesRef.current?.getContainerScrollBottom() ?? 0;
}, []);

const doScrollToMessage = useCallback((messageID: string, animate = true) => {
  messagesRef.current?.doScrollToMessage(messageID, animate);
}, []);
```

### Step 9: Handle Error State

For catastrophic errors caught in AssistantChat, we should use the existing CatastrophicErrorPanel that's already rendered in AppShell. The error state management should remain at the AppShell level where it already exists.

## Implementation Clarifications

Based on discussion with the team:

1. **HideComponent**: Remove the HideComponent wrapper - CdsAiChatShell handles visibility internally
2. **AssistantChat.tsx**: Keep the file for reference until Phase 5 cleanup
3. **Modals**: Render EndHumanAgentChatModal and RequestScreenShareModal outside CdsAiChatShell
4. **WorkspaceContainer**: Include in workspace slot now - CdsAiChatShell has `showWorkspace` and `workspaceLocation` props
5. **Error Handling**: Use existing CatastrophicErrorPanel in AppShell - it's already set up as a panel

## Files to Modify

1. ✅ `packages/ai-chat/src/types/instance/ChatInstance.ts` - Add WriteableElementName entries
2. ✅ `packages/ai-chat/src/chat/services/loadServices.ts` - Initialize WriteableElements
3. ✅ `packages/ai-chat/src/chat/AppShell.tsx` - Integrate CdsAiChatShell and wire up slots
4. ⚠️ `packages/ai-chat/src/chat/components-legacy/AssistantChat.tsx` - Extract logic (keep file for reference)

## Testing Checklist

After implementing Phase 1:

- [ ] Chat interface renders correctly
- [ ] Header displays with correct content
- [ ] Messages area scrolls properly
- [ ] Input field accepts text and sends messages
- [ ] WriteableElements appear in correct slots
- [ ] Focus management works (tab through interface)
- [ ] Scroll to message functionality works
- [ ] Auto-scroll on new messages works
- [ ] File upload button appears and functions
- [ ] Stop streaming button works
- [ ] Human agent banner displays correctly
- [ ] Workspace panel shows/hides correctly
- [ ] Workspace location (start/end) works
- [ ] No console errors
- [ ] No visual regressions

## Known Challenges

1. **AssistantChat Complexity**: The component has significant logic that needs to be carefully extracted
2. **Ref Management**: Multiple refs need to be properly wired through the new structure
3. **Focus Trap**: May need adjustment to work with cds-aichat-shell
4. **CSS Classes**: Some existing CSS may need updates to work with new DOM structure
5. **Modals**: EndHumanAgentChatModal and RequestScreenShareModal need to remain functional

## Next Phase

After Phase 1 is complete and tested, proceed to Phase 2: Panel Migration (`02-phase-2-panel-migration.md`)

## Rollback Plan

If Phase 1 causes issues:

1. Revert changes to AppShell.tsx
2. Keep new WriteableElementName entries (they won't hurt)
3. Document issues encountered
4. Reassess approach
