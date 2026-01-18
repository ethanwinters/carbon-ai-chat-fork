# Phase 2B: Full Slot Migration (Required)

## Overview

**Prerequisites:** Phase 2A must be complete (panel wrappers in place)

**Goal:** Refactor panels to use CdsAiChatPanel's header/body/footer slots directly, eliminating BasePanelComponent wrapper.

**Status:** ✅ Complete - Slot alignment implemented and ready for verification

**Estimated Time:** 4-6 hours

## Why Phase 2B?

### Current Architecture (Phase 2A/2B)

```tsx
<CdsAiChatPanel open={isOpen} priority={X}>
  <div slot="body">
    <BasePanelComponent>
      {" "}
      {/* Wrapper with Header + focus trap */}
      {/* Panel content */}
    </BasePanelComponent>
  </div>
</CdsAiChatPanel>
```

**Issues:**

- BasePanelComponent is a wrapper that doesn't leverage slots
- Header is nested inside body slot instead of using header slot
- Less separation of concerns
- More complex component hierarchy

### Target Architecture (Phase 2B)

```tsx
<CdsAiChatPanel open={isOpen} priority={X}>
  <div slot="header">
    <PanelHeader {...headerProps} />
  </div>
  <div slot="body">{/* Direct panel content */}</div>
  <div slot="footer">{/* Footer content if needed */}</div>
</CdsAiChatPanel>
```

**Benefits:**

- Proper use of CdsAiChatPanel's slot architecture
- Better separation of concerns (header/body/footer)
- Cleaner component hierarchy
- Eliminates BasePanelComponent wrapper
- More maintainable long-term

## Decision Point

### Readiness Check

Proceed when:

- ✅ Phase 2A refactors are merged and stable
- ✅ Team agrees slot alignment is required before testing (Phase 2C)
- ✅ 4-6 hours are available for focused refactor + quick smoke tests
- ✅ No critical defects are blocking panel flows

## Phase 2B Objectives

1. Create PanelHeader wrapper component
2. Extract focus trap logic from BasePanelComponent
3. Refactor ResponsePanel to use slots (header + body + footer)
4. Refactor IFramePanel to use slots (header + body)
5. Refactor ViewSourcePanel to use slots (header + body)
6. Update HomeScreenPanel (body slot only, no header)
7. Verify HydrationPanel and DisclaimerPanel (body slot only)
8. Handle CustomPanel slot usage
9. Implement focus management solution
10. Test all changes thoroughly

## Implementation Plan

### Step 1: Analyze BasePanelComponent

**File:** `packages/ai-chat/src/chat/components-legacy/BasePanelComponent.tsx`

**What it provides:**

1. **Header rendering** - Complex logic for title, displayName, overflow menus, etc.
2. **Focus trap** - Using `focus-trap-react` library
3. **Event tracking** - eventName, eventDescription props
4. **Panel container** - Wrapper div with className

**What needs extraction:**

- Header logic → New PanelHeader component
- Focus trap logic → Move to individual panels or CdsAiChatPanel
- Event tracking → Keep in panels or move to AppShell

### Step 2: Create PanelHeader Component

**File:** `packages/ai-chat/src/chat/components/PanelHeader.tsx` (new file)

**Purpose:** Reusable header component for panel header slot

**Interface:**

```typescript
interface PanelHeaderProps {
  // Title and display
  title?: string;
  displayName?: string;

  // Buttons
  showBackButton?: boolean;
  labelBackButton?: string;
  onClickBack?: () => void;

  showCloseButton?: boolean;
  hideCloseButton?: boolean;
  onClickClose?: () => void;

  showRestartButton?: boolean;
  onClickRestart?: () => void;
  isRestarting?: boolean;

  // AI Label
  showAiLabel?: boolean;

  // Overflow menu
  overflowItems?: string[];
  overflowClicked?: (index: number) => void;

  // Config
  enableChatHeaderConfig?: boolean;

  // Ref for focus management
  ref?: Ref<HasRequestFocus>;
}
```

**Implementation:**

```tsx
import React, { forwardRef, Ref } from "react";
import { Header } from "../components-legacy/header/Header";
import { useSelector } from "../hooks/useSelector";
import { useLanguagePack } from "../hooks/useLanguagePack";
import { AppState } from "../../types/state/AppState";
import { HasRequestFocus } from "../../types/utilities/HasRequestFocus";
import { MinimizeButtonIconType } from "../../types/config/PublicConfig";

export const PanelHeader = forwardRef<HasRequestFocus, PanelHeaderProps>(
  (props, ref) => {
    const {
      title,
      displayName,
      showBackButton = true,
      labelBackButton,
      onClickBack,
      showCloseButton = true,
      hideCloseButton = false,
      onClickClose,
      showRestartButton,
      onClickRestart,
      isRestarting = false,
      showAiLabel,
      overflowItems,
      overflowClicked,
      enableChatHeaderConfig = false,
    } = props;

    const languagePack = useLanguagePack();
    const derivedHeaderConfig = useSelector(
      (state: AppState) => state.config.derived.header,
    );
    const isRestartingGlobal = useSelector(
      (state: AppState) => state.isRestarting,
    );

    // Resolve header config (custom vs. global)
    const hasCustomTitle = title !== undefined && title !== null;
    const shouldUseConfigChrome = enableChatHeaderConfig && !hasCustomTitle;

    let headerTitleText: string | undefined;
    let headerDisplayName: string | undefined;

    if (shouldUseConfigChrome) {
      headerTitleText = derivedHeaderConfig?.title ?? undefined;
      headerDisplayName = derivedHeaderConfig?.name ?? undefined;
    } else if (hasCustomTitle) {
      headerDisplayName = title ?? undefined;
    } else if (displayName) {
      headerDisplayName = displayName;
    }

    return (
      <Header
        ref={ref}
        title={headerTitleText}
        displayName={headerDisplayName}
        showBackButton={showBackButton}
        labelBackButton={
          labelBackButton ?? languagePack.general_returnToAssistant
        }
        onClickBack={onClickBack}
        showCloseButton={showCloseButton}
        hideCloseButton={hideCloseButton}
        onClickClose={onClickClose}
        showRestartButton={showRestartButton}
        onClickRestart={onClickRestart}
        isRestarting={isRestarting || isRestartingGlobal}
        showAiLabel={showAiLabel}
        overflowItems={overflowItems}
        overflowClicked={overflowClicked}
        closeButtonLabel={languagePack.launcher_isOpen}
        overflowMenuTooltip={languagePack.header_overflowMenu_options}
        overflowMenuAriaLabel={languagePack.components_overflow_ariaLabel}
        restartButtonLabel={languagePack.buttons_restart}
        aiSlugLabel={languagePack.ai_slug_label}
        aiSlugTitle={languagePack.ai_slug_title}
        aiSlugDescription={languagePack.ai_slug_description}
        minimizeButtonIconType={
          derivedHeaderConfig?.minimizeButtonIconType ??
          MinimizeButtonIconType.MINIMIZE
        }
      />
    );
  },
);

PanelHeader.displayName = "PanelHeader";
```

### Step 3: Create PanelFocusTrap Component

**File:** `packages/ai-chat/src/chat/components/PanelFocusTrap.tsx` (new file)

**Purpose:** Reusable focus trap wrapper for panels

**Implementation:**

```tsx
import React, { useEffect, useRef, ReactNode } from "react";
import FocusTrap from "focus-trap-react";
import { IS_MOBILE } from "../utils/browserUtils";

interface PanelFocusTrapProps {
  active: boolean;
  children: ReactNode;
  onDeactivate?: () => void;
  initialFocus?: () => HTMLElement | undefined;
}

export const PanelFocusTrap: React.FC<PanelFocusTrapProps> = ({
  active,
  children,
  onDeactivate,
  initialFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <FocusTrap
      active={active}
      containerElements={
        containerRef.current ? [containerRef.current] : undefined
      }
      focusTrapOptions={{
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: !IS_MOBILE,
        preventScroll: true,
        tabbableOptions: {
          getShadowRoot: true,
        },
        fallbackFocus: initialFocus,
        onDeactivate,
      }}
    >
      <div ref={containerRef} tabIndex={-1}>
        {children}
      </div>
    </FocusTrap>
  );
};
```

### Step 4: Refactor ResponsePanel

**File:** `packages/ai-chat/src/chat/panels/ResponsePanel.tsx`

**Current structure:**

```tsx
<BodyAndFooterPanelComponent>
  {/* Uses BasePanelComponent internally */}
</BodyAndFooterPanelComponent>
```

**New structure:**

```tsx
<PanelFocusTrap active={isOpen}>
  <PanelHeader
    title={panelOptions?.title}
    showBackButton={true}
    onClickBack={onClickBack}
    onClickClose={onClose}
    showAiLabel={false}
    showRestartButton={false}
  />
  <div className="cds-aichat--response-panel__body">
    <BodyWithFooterComponent
      localMessageItem={localMessageItem}
      fullMessage={originalMessage}
      isMessageForInput={isMessageForInput}
      requestFocus={requestFocus}
      renderMessageComponent={renderMessageComponent}
    />
  </div>
</PanelFocusTrap>
```

**In AppShell.tsx:**

```tsx
<CdsAiChatPanel
  open={responsePanelState.isOpen}
  priority={50}
  fullWidth={false}
  showChatHeader={true}
  animationOnOpen="slide-in-from-right"
  animationOnClose="slide-out-to-right"
  onOpenStart={() => onPanelOpenStart(true)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => {
    onPanelCloseEnd(true);
    serviceManager.store.dispatch(actions.setResponsePanelContent(null, false));
  }}
>
  <ResponsePanel
    slot="body"  {/* Note: slot attribute on component */}
    responsePanelRef={responsePanelRef}
    isOpen={responsePanelState.isOpen}
    isMessageForInput={responsePanelState.isMessageForInput}
    localMessageItem={responsePanelState.localMessageItem}
    requestFocus={requestFocus}
    onClose={onClose}
    onClickRestart={onRestart}
    onClickBack={() =>
      serviceManager.store.dispatch(actions.setResponsePanelIsOpen(false))
    }
  />
</CdsAiChatPanel>
```

### Step 5: Refactor IFramePanel

**Similar pattern to ResponsePanel:**

- Extract header to PanelHeader component
- Wrap content in PanelFocusTrap
- Place in appropriate slots in AppShell.tsx

### Step 6: Refactor ViewSourcePanel

**Similar pattern to ResponsePanel:**

- Extract header to PanelHeader component
- Wrap content in PanelFocusTrap
- Place in appropriate slots in AppShell.tsx

### Step 7: Update HomeScreenPanel

**HomeScreenPanel doesn't need a header**, so:

- Just wrap content in PanelFocusTrap if needed
- Place directly in body slot
- No header slot needed

### Step 8: Verify Simple Panels

**HydrationPanel and DisclaimerPanel:**

- Already simple (no BasePanelComponent)
- Verify they work correctly in body slot
- Add PanelFocusTrap if needed

### Step 9: Handle CustomPanel

**CustomPanel is special:**

- Custom panels may have their own headers
- Need to support both header slot and no header
- May need conditional slot usage based on panel config

### Step 10: Testing

After each panel refactoring:

1. Verify TypeScript compilation
2. Test panel opens/closes
3. Test animations
4. Test focus trap
5. Test header buttons (back, close, restart)
6. Test keyboard navigation

## Implementation Order

Execute refactoring in this order to minimize dependencies:

1. ✅ Create PanelHeader component
2. ✅ Create PanelFocusTrap component
3. ✅ Refactor IFramePanel (simplest, standalone)
4. ✅ Refactor ViewSourcePanel (similar to IFrame)
5. ✅ Refactor ResponsePanel (more complex, has footer)
6. ✅ Update HomeScreenPanel (no header needed)
7. ✅ Verify HydrationPanel (already simple)
8. ✅ Verify DisclaimerPanel (already simple)
9. ✅ Handle CustomPanel (most complex)
10. ✅ Remove BasePanelComponent (no longer needed)
11. ✅ Remove BodyAndFooterPanelComponent (no longer needed)
12. ✅ Full testing pass

## Success Criteria

Phase 2B is complete when:

- [ ] PanelHeader component created and working
- [ ] All 7 panels refactored to use slots
- [ ] BasePanelComponent removed (or reduced to legacy-only usage)
- [ ] BodyAndFooterPanelComponent removed (or reduced to legacy-only usage)
- [ ] TypeScript compilation succeeds
- [ ] All panels smoke-tested and working
- [ ] Focus management works correctly via shell handling
- [ ] Animations work correctly
- [ ] No regressions from Phase 2B

## Rollback Plan

If Phase 2B causes issues:

1. Revert to Phase 2B state (keep git commits separate)
2. Document issues encountered
3. Consider alternative approach
4. May need to keep BasePanelComponent after all

## Next Phase

After Phase 2B is complete:

- Proceed to Phase 3: Workspace Integration

## Notes

- This is a significant refactoring
- Take time to test thoroughly after each panel
- Keep git commits small and focused
- Don't hesitate to rollback if issues arise
- The Phase 2B implementation is functional - slot alignment is required before Phase 2C testing
