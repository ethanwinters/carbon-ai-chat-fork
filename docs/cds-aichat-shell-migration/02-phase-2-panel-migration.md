# Phase 2: Panel Migration

## Quick Summary

**Status:** Phase 2A code complete ✅ | Phase 2B complete ✅ | Phase 2C (Testing & Verification) pending ⏳

**What was accomplished:**

- ✅ All 9 panel components refactored to remove OverlayPanel wrappers
- ✅ All 7 panels wrapped with CdsAiChatPanel in AppShell.tsx
- ✅ Panel priority system configured (90-30)
- ✅ Animation system configured (fade-in/out, slide-in/out)
- ✅ Event handlers properly connected

**What's next:**

- ⏳ Phase 2C: TypeScript build + manual verification
- ⏳ Animation and focus management verification
- 🔜 Transition to Phase 3 (workspace integration) after verification

**Files modified:** 10 files (9 panel components + AppShell.tsx)

---

## Overview Context

This is Phase 2 of migrating AppShell.tsx to use `cds-aichat-shell`. See `00-overview.md` for complete project context.

**Prerequisites**: Phase 1 must be complete (header, messages, and input slots working)

**Goal**: Migrate all panels to use `cds-aichat-panel` wrapper with the shell's built-in panel management system.

## Phase 2 Subphases

**Phase 2 has been broken into subphases (order updated):**

- ✅ **Phase 2A** - OverlayPanel Removal (COMPLETED)
  - All 9 panel components refactored
  - All panels wrapped with CdsAiChatPanel in AppShell.tsx
  - Panel priority and animation systems configured
  - See detailed completion status below

- ✅ **Phase 2B** - Full Slot Migration (COMPLETED)
  - See [`02b-phase-2b-full-slot-migration.md`](./02b-phase-2b-full-slot-migration.md)
  - Extract headers to use CdsAiChatPanel's header slot
  - Eliminate BasePanelComponent wrapper
  - Better separation of concerns

- 🧪 **Phase 2C** - Testing & Verification (REQUIRED, AFTER 2B)
  - See [`02c-phase-2c-testing-verification.md`](./02c-phase-2c-testing-verification.md)
  - Verify TypeScript compilation
  - Test all panels manually
  - Document any issues found

## Current Architecture

### Panel Structure

All panels now follow this pattern:

```tsx
<CdsAiChatPanel
  open={isOpen}
  priority={X}
  animationOnOpen="..."
  animationOnClose="..."
  onOpenStart={...}
  onOpenEnd={...}
  onCloseStart={...}
  onCloseEnd={...}
>
  <div slot="body">
    <PanelComponent isOpen={isOpen} {...props} />
  </div>
</CdsAiChatPanel>
```

### Responsibilities

**CdsAiChatPanel handles:**

- ✅ Visibility control (open/close state)
- ✅ Animation management (opening/closing animations)
- ✅ Panel stacking (z-index via priority)
- ✅ Animation events (openstart, openend, closestart, closeend)

**BasePanelComponent still handles:**

- Header rendering with complex config logic
- Focus trap management using `focus-trap-react`
- Event tracking (eventName, eventDescription)
- Panel container wrapper with className

**Note:** BasePanelComponent keeps `isOpen` prop for focus trap activation and event tracking, NOT for visibility control (CdsAiChatPanel handles that).

## Components Refactored (9 total)

1. ✅ **HydrationPanel** - Removed OverlayPanel wrapper, removed animation props
2. ✅ **DisclaimerPanel** - Removed OverlayPanel wrapper, removed animation props
3. ✅ **CustomPanel** - Removed OverlayPanel wrapper, removed animation props
4. ✅ **BodyAndFooterPanelComponent** - Removed OverlayPanel wrapper, kept BasePanelComponent
5. ✅ **ResponsePanel** - Updated to pass `isOpen` prop to BodyAndFooterPanelComponent
6. ✅ **HomeScreenContainer** - Removed OverlayPanel wrapper, removed animation props
7. ✅ **HomeScreenPanel** - Removed animation props passed to HomeScreenContainer
8. ✅ **IFramePanel** - Removed OverlayPanel wrapper, added `isOpen` prop to interface
9. ✅ **ViewSourcePanel** - Removed OverlayPanel wrapper, added `isOpen` prop to interface

## Panel Priority & Animation Configuration

**Priority System (higher = on top):**

- HydrationPanel: 90 (highest - blocks everything during load)
- DisclaimerPanel: 80 (must be accepted before use)
- HomeScreenPanel: 70 (initial screen)
- CustomPanel: 60 (user panels)
- ResponsePanel: 50 (detailed views)
- IFramePanel: 40 (embedded content)
- ViewSourcePanel: 30 (source views)

**Animation Mapping:**

- Fade animations: HydrationPanel, DisclaimerPanel, HomeScreenPanel
- Slide-from-right: ResponsePanel
- Slide-from-bottom: CustomPanel, IFramePanel, ViewSourcePanel

## Phase 2 Objectives

1. Understand the panel priority system
2. Wrap all 7 panels with CdsAiChatPanel
3. Configure animations for each panel type
4. Update event handlers to use cds-aichat-panel events
5. Test all panel transitions and interactions

## Panel Inventory

Current panels in AppShell.tsx:

1. **HydrationPanel** - Shows loading state during history hydration
2. **DisclaimerPanel** - Shows disclaimer on first use
3. **HomeScreenPanel** - Shows home screen with conversation starters
4. **CustomPanel** - Custom user-defined panels
5. **ResponsePanel** - Shows detailed message responses
6. **IFramePanel** - Shows iframe content
7. **ViewSourcePanel** - Shows source code/data

## CdsAiChatPanel Props Reference

```typescript
interface CdsAiChatPanelProps {
  open: boolean; // Controls panel visibility
  priority: number; // Stacking order (higher = on top)
  fullWidth?: boolean; // Takes full width of container
  showChatHeader?: boolean; // Shows chat header in panel
  showFrame?: boolean; // Shows border frame
  animationOnOpen?: string; // Animation class for opening
  animationOnClose?: string; // Animation class for closing
  inert?: boolean; // Makes panel non-interactive

  // Events
  onOpenStart?: () => void; // Fired when opening animation starts
  onOpenEnd?: () => void; // Fired when opening animation ends
  onCloseStart?: () => void; // Fired when closing animation starts
  onCloseEnd?: () => void; // Fired when closing animation ends
}
```

## Panel Priority System

Panels with higher priority values appear on top of lower priority panels. We need to determine the correct stacking order.

**Recommended Priority Values**:

```
Priority 100: CatastrophicErrorPanel (highest - must be on top)
Priority 90:  HydrationPanel (blocks everything during load)
Priority 80:  DisclaimerPanel (must be accepted before use)
Priority 70:  HomeScreenPanel (initial screen)
Priority 60:  CustomPanel (user panels)
Priority 50:  ResponsePanel (detailed views)
Priority 40:  IFramePanel (embedded content)
Priority 30:  ViewSourcePanel (source views)
Priority 0:   Default/base content
```

**Note**: These values should be discussed and adjusted based on actual UX requirements.

## Animation Mapping

The shell supports these animation types:

- `slide-in-from-bottom` / `slide-out-to-bottom`
- `slide-in-from-top` / `slide-out-to-top`
- `slide-in-from-left` / `slide-out-to-left`
- `slide-in-from-right` / `slide-out-to-right`
- `fade-in` / `fade-out`

**Current Panel Animations** (to be mapped):

- Most panels currently use custom CSS animations
- Need to identify current animation behavior for each panel
- Map to closest shell animation type

## Implementation Steps

### Step 1: Import CdsAiChatPanel

**File**: `packages/ai-chat/src/chat/AppShell.tsx`

Add import:

```typescript
import CdsAiChatPanel from "@carbon/ai-chat-components/es/react/panel.js";
```

### Step 2: Wrap HydrationPanel

**Current Structure** (around line 768-783):

```tsx
<HydrationPanel
  serviceManager={serviceManager}
  headerDisplayName={headerDisplayName}
  shouldOpen={shouldShowHydrationPanel}
  isHydrated={isHydratingComplete}
  useHomeScreenVersion={useHomeScreenVersion}
  languagePack={languagePack}
  onClose={onClose}
  onOpenStart={() => onPanelOpenStart(false)}
  onCloseStart={onPanelCloseStart}
  onOpenEnd={onPanelOpenEnd}
  onCloseEnd={() => {
    onHydrationPanelClose();
    onPanelCloseEnd(false);
  }}
/>
```

**New Structure**:

```tsx
<CdsAiChatPanel
  open={shouldShowHydrationPanel}
  priority={90}
  fullWidth={true}
  showChatHeader={true}
  animationOnOpen="fade-in"
  animationOnClose="fade-out"
  onOpenStart={() => onPanelOpenStart(false)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => {
    onHydrationPanelClose();
    onPanelCloseEnd(false);
  }}
>
  <div slot="body">
    <HydrationPanel
      serviceManager={serviceManager}
      headerDisplayName={headerDisplayName}
      isHydrated={isHydratingComplete}
      useHomeScreenVersion={useHomeScreenVersion}
      languagePack={languagePack}
      onClose={onClose}
    />
  </div>
</CdsAiChatPanel>
```

**Note**: Remove `shouldOpen`, `onOpenStart`, `onOpenEnd`, `onCloseStart`, `onCloseEnd` props from HydrationPanel itself - these are now handled by CdsAiChatPanel.

### Step 3: Wrap DisclaimerPanel

**Current Structure** (around line 796-810):

```tsx
<DisclaimerPanel
  serviceManager={serviceManager}
  shouldOpen={showDisclaimer}
  disclaimerHTML={publicConfig.disclaimer?.disclaimerHTML}
  disclaimerAcceptButtonRef={disclaimerRef}
  onAcceptDisclaimer={onAcceptDisclaimer}
  onClose={onClose}
  onOpenStart={() => onPanelOpenStart(false)}
  onCloseStart={onPanelCloseStart}
  onOpenEnd={onPanelOpenEnd}
  onCloseEnd={() => onPanelCloseEnd(false)}
/>
```

**New Structure**:

```tsx
<CdsAiChatPanel
  open={showDisclaimer}
  priority={80}
  fullWidth={true}
  showChatHeader={true}
  animationOnOpen="fade-in"
  animationOnClose="fade-out"
  onOpenStart={() => onPanelOpenStart(false)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(false)}
>
  <div slot="body">
    <DisclaimerPanel
      serviceManager={serviceManager}
      disclaimerHTML={publicConfig.disclaimer?.disclaimerHTML}
      disclaimerAcceptButtonRef={disclaimerRef}
      onAcceptDisclaimer={onAcceptDisclaimer}
      onClose={onClose}
    />
  </div>
</CdsAiChatPanel>
```

### Step 4: Wrap HomeScreenPanel

**Current Structure** (around line 839-860):

```tsx
<HomeScreenPanel
  onPanelOpenStart={() => onPanelOpenStart(false)}
  onPanelOpenEnd={onPanelOpenEnd}
  onPanelCloseStart={onPanelCloseStart}
  onPanelCloseEnd={() => onPanelCloseEnd(false)}
  onClose={onClose}
  onSendBotInput={(text: string) =>
    onSendInput(text, MessageSendSource.HOME_SCREEN_INPUT)
  }
  onSendButtonInput={onSendHomeButtonInput}
  onRestart={onRestart}
  showHomeScreen={showHomeScreen}
  isHydrationAnimationComplete={isHydrationAnimationComplete}
  homeScreenInputRef={homeScreenInputRef}
  onToggleHomeScreen={onToggleHomeScreen}
  requestFocus={requestFocus}
/>
```

**New Structure**:

```tsx
<CdsAiChatPanel
  open={showHomeScreen && isHydrationAnimationComplete}
  priority={70}
  fullWidth={true}
  showChatHeader={true}
  animationOnOpen="fade-in"
  animationOnClose="fade-out"
  onOpenStart={() => onPanelOpenStart(false)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(false)}
>
  <div slot="body">
    <HomeScreenPanel
      onClose={onClose}
      onSendBotInput={(text: string) =>
        onSendInput(text, MessageSendSource.HOME_SCREEN_INPUT)
      }
      onSendButtonInput={onSendHomeButtonInput}
      onRestart={onRestart}
      homeScreenInputRef={homeScreenInputRef}
      onToggleHomeScreen={onToggleHomeScreen}
      requestFocus={requestFocus}
    />
  </div>
</CdsAiChatPanel>
```

### Step 5: Wrap CustomPanel

**Current Structure** (around line 784-792):

```tsx
<CustomPanel
  panelRef={customPanelRef}
  onClose={onClose}
  onClickRestart={onRestart}
  onPanelOpenStart={() => onPanelOpenStart(true)}
  onPanelOpenEnd={onPanelOpenEnd}
  onPanelCloseStart={onPanelCloseStart}
  onPanelCloseEnd={() => onPanelCloseEnd(true)}
/>
```

**New Structure**:

```tsx
<CdsAiChatPanel
  open={customPanelState.isOpen}
  priority={60}
  fullWidth={true}
  showChatHeader={true}
  animationOnOpen="slide-in-from-bottom"
  animationOnClose="slide-out-to-bottom"
  onOpenStart={() => onPanelOpenStart(true)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(true)}
>
  <div slot="body">
    <CustomPanel
      panelRef={customPanelRef}
      onClose={onClose}
      onClickRestart={onRestart}
    />
  </div>
</CdsAiChatPanel>
```

### Step 6: Wrap ResponsePanel

**Current Structure** (around line 812-838):

```tsx
<ResponsePanel
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
  onPanelOpenStart={() => onPanelOpenStart(true)}
  onPanelOpenEnd={onPanelOpenEnd}
  onPanelCloseStart={onPanelCloseStart}
  onPanelCloseEnd={() => {
    onPanelCloseEnd(true);
    serviceManager.store.dispatch(actions.setResponsePanelContent(null, false));
  }}
/>
```

**New Structure**:

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
  <div slot="body">
    <ResponsePanel
      responsePanelRef={responsePanelRef}
      isMessageForInput={responsePanelState.isMessageForInput}
      localMessageItem={responsePanelState.localMessageItem}
      requestFocus={requestFocus}
      onClose={onClose}
      onClickRestart={onRestart}
      onClickBack={() =>
        serviceManager.store.dispatch(actions.setResponsePanelIsOpen(false))
      }
    />
  </div>
</CdsAiChatPanel>
```

### Step 7: Wrap IFramePanel

**Current Structure** (around line 861-871):

```tsx
<IFramePanel
  serviceManager={serviceManager}
  isOpen={iFramePanelState.isOpen}
  panelRef={iframePanelRef}
  onOpenStart={() => onPanelOpenStart(true)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(true)}
  onClickClose={onClose}
  onClickRestart={onRestart}
/>
```

**New Structure**:

```tsx
<CdsAiChatPanel
  open={iFramePanelState.isOpen}
  priority={40}
  fullWidth={true}
  showChatHeader={true}
  animationOnOpen="slide-in-from-bottom"
  animationOnClose="slide-out-to-bottom"
  onOpenStart={() => onPanelOpenStart(true)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(true)}
>
  <div slot="body">
    <IFramePanel
      serviceManager={serviceManager}
      panelRef={iframePanelRef}
      onClickClose={onClose}
      onClickRestart={onRestart}
    />
  </div>
</CdsAiChatPanel>
```

### Step 8: Wrap ViewSourcePanel

**Current Structure** (around line 872-882):

```tsx
<ViewSourcePanel
  serviceManager={serviceManager}
  isOpen={viewSourcePanelState.isOpen}
  panelRef={viewSourcePanelRef}
  onOpenStart={() => onPanelOpenStart(true)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(true)}
  onClickClose={onClose}
  onClickRestart={onRestart}
/>
```

**New Structure**:

```tsx
<CdsAiChatPanel
  open={viewSourcePanelState.isOpen}
  priority={30}
  fullWidth={true}
  showChatHeader={true}
  animationOnOpen="slide-in-from-bottom"
  animationOnClose="slide-out-to-bottom"
  onOpenStart={() => onPanelOpenStart(true)}
  onOpenEnd={onPanelOpenEnd}
  onCloseStart={onPanelCloseStart}
  onCloseEnd={() => onPanelCloseEnd(true)}
>
  <div slot="body">
    <ViewSourcePanel
      serviceManager={serviceManager}
      panelRef={viewSourcePanelRef}
      onClickClose={onClose}
      onClickRestart={onRestart}
    />
  </div>
</CdsAiChatPanel>
```

### Step 9: Refactor Panel Components

Each panel component needs to be refactored to remove animation/lifecycle props that are now handled by CdsAiChatPanel:

**Props to Remove from Panel Components**:

- `shouldOpen` - Visibility now controlled by CdsAiChatPanel's `open` prop
- `onOpenStart` - Now handled by CdsAiChatPanel
- `onOpenEnd` - Now handled by CdsAiChatPanel
- `onCloseStart` - Now handled by CdsAiChatPanel
- `onCloseEnd` - Now handled by CdsAiChatPanel

**Props to Keep**:

- Content-specific props (data, refs, callbacks)
- `isOpen` only when required for BasePanelComponent focus trap/event tracking
- `onClose` - User action to close
- `onClickRestart` - User action to restart
- `onClickBack` - User action to go back

## Progress Status

### Completed ✅

1. ✅ `packages/ai-chat/src/chat/AppShell.tsx` - Wrapped all 7 panels with CdsAiChatPanel
   - Added CdsAiChatPanel import
   - Wrapped HydrationPanel (priority 90, fade animations)
   - Wrapped CustomPanel (priority 60, slide-from-bottom, with custom panel events)
   - Wrapped DisclaimerPanel (priority 80, fade animations)
   - Wrapped ResponsePanel (priority 50, slide-from-right)
   - Wrapped HomeScreenPanel (priority 70, fade animations)
   - Wrapped IFramePanel (priority 40, slide-from-bottom)
   - Wrapped ViewSourcePanel (priority 30, slide-from-bottom)
   - Added DEFAULT_CUSTOM_PANEL_CONFIG_OPTIONS import for custom panel cleanup

2. ✅ `packages/ai-chat/src/chat/panels/HydrationPanel.tsx` - Refactored
   - Removed OverlayPanel wrapper
   - Removed animation props (shouldOpen, onOpenStart, onOpenEnd, onCloseStart, onCloseEnd)
   - Removed unused imports (OverlayPanel, AnimationInType, AnimationOutType, PageObjectId)
   - Removed unused serviceManager prop

3. ✅ `packages/ai-chat/src/chat/panels/DisclaimerPanel.tsx` - Refactored
   - Removed OverlayPanel wrapper
   - Removed animation props (shouldOpen, onOpenStart, onOpenEnd, onCloseStart, onCloseEnd)
   - Removed unused imports (OverlayPanel, AnimationInType, AnimationOutType, PageObjectId)
   - Removed unused serviceManager prop

4. ✅ `packages/ai-chat/src/chat/components-legacy/panels/CustomPanel.tsx` - Refactored
   - Removed OverlayPanel wrapper
   - Removed animation props from interface
   - Removed animation logic (openAnimation, closeAnimation, disableAnimation)
   - Removed unused imports (OverlayPanel, AnimationInType, AnimationOutType, PageObjectId, BusEventType, DEFAULT_CUSTOM_PANEL_CONFIG_OPTIONS)
   - Event firing moved to AppShell.tsx wrapper

5. ✅ `packages/ai-chat/src/chat/panels/CustomPanel.tsx` - Refactored
   - Removed animation props (onPanelOpenStart, onPanelOpenEnd, onPanelCloseStart, onPanelCloseEnd)
   - Props now handled by CdsAiChatPanel wrapper in AppShell.tsx

### Verification Outstanding ⏳

All panel refactors are landed. Remaining work is verification and follow-up:

- Run TypeScript/build check (`npm run build` or `npx tsc --noEmit`) to confirm no regressions (see [`02c-phase-2c-testing-verification.md`](./02c-phase-2c-testing-verification.md)).
- Execute the manual panel test checklist in `02c-phase-2c-testing-verification.md` and log findings.
- Pay attention to animation timing, stacking, and focus trap behavior now that CdsAiChatPanel controls visibility.
- Prepare to proceed to slot migration (Phase 2B) before final verification.

## Architecture Notes (for future refinement)

- CdsAiChatPanel provides `header`, `body`, and `footer` slots. BasePanelComponent currently encapsulates header, focus trap, and event tracking; future Phase 2C work can extract the header into slots for cleaner separation.
- BasePanelComponent still expects `isOpen` to drive focus trap and event tracking; visibility is handled by CdsAiChatPanel.

## Testing Checklist

After implementing Phase 2:

- [ ] All panels open with correct animations
- [ ] All panels close with correct animations
- [ ] Panel stacking order is correct (higher priority on top)
- [ ] Disclaimer panel blocks interaction until accepted
- [ ] Home screen panel displays correctly
- [ ] Hydration panel shows during history load
- [ ] Custom panels open and close correctly
- [ ] Response panel shows message details
- [ ] IFrame panel displays embedded content
- [ ] View source panel shows source data
- [ ] Panel transitions are smooth
- [ ] No animation glitches or flashing
- [ ] Focus management works with panels
- [ ] Back buttons work correctly
- [ ] Close buttons work correctly
- [ ] No console errors
- [ ] No visual regressions

## Known Challenges

1. **Animation Timing**: Shell animations may differ from current custom animations
2. **Panel Stacking**: Priority values may need adjustment based on UX testing

## Phase 2 Status - Slot Migration Pending

OverlayPanel removal and CdsAiChatPanel integration are finished; next required steps are Phase 2B slot migration followed by Phase 2C testing/verification.

### ✅ Completed Work

**All 7 panels successfully refactored:**

1. ✅ **HydrationPanel** - OverlayPanel removed, animation props removed
2. ✅ **DisclaimerPanel** - OverlayPanel removed, animation props removed
3. ✅ **CustomPanel** - OverlayPanel removed, animation props removed
4. ✅ **BodyAndFooterPanelComponent** - OverlayPanel removed, animation props removed
5. ✅ **ResponsePanel** - Animation props removed, uses BodyAndFooterPanelComponent
6. ✅ **HomeScreenContainer** - OverlayPanel removed, animation props removed
7. ✅ **HomeScreenPanel** - Animation props removed, uses HomeScreenContainer
8. ✅ **IFramePanel** - OverlayPanel removed, animation props removed, `isOpen` prop added
9. ✅ **ViewSourcePanel** - OverlayPanel removed, animation props removed, `isOpen` prop added

### Phase 2B Progress 🚧

- ✅ `PanelHeader` component added to drive header slot content using existing header config
- ✅ Response, IFrame, and ViewSource panels migrated to CdsAiChatPanel header/body slots
- ✅ Custom panel migrated to slots; header/back/close handled via PanelHeader; body renders custom content
- ✅ Hydration panel now uses shell header slot (PanelHeader) with body-only content
- ✅ BasePanelComponent removed entirely (Response, IFrame, ViewSource, Custom)
- ✅ BodyAndFooterPanelComponent removed; ResponsePanel now renders body/footer content directly via shell slots
- ✅ All panels now rendered inside `CdsAiChatShell` via the `panels` slot
- ⚠️ Remaining panels still use legacy structure (Disclaimer, HomeScreen)

**AppShell.tsx updates:**

- ✅ All 7 panels wrapped with CdsAiChatPanel
- ✅ Panel priority system configured (90, 80, 70, 60, 50, 40, 30)
- ✅ Panel animations configured (fade-in/out, slide-in/out)
- ✅ Event handlers properly wired to CdsAiChatPanel

### 🏗️ Current Architecture

**Panels now use this structure:**

```tsx
<CdsAiChatPanel
  open={isOpen}
  priority={X}
  animationOnOpen="..."
  animationOnClose="..."
>
  <div slot="body">
    <PanelComponent isOpen={isOpen} {...props} />
  </div>
</CdsAiChatPanel>
```

**Where PanelComponent contains:**

- BasePanelComponent (provides Header, focus trap, event tracking)
- Panel-specific content

### 🔍 Key Discovery: Slot Architecture Opportunity

**BasePanelComponent currently provides:**

1. Header rendering with complex config logic
2. Focus trap management using `focus-trap-react`
3. Event tracking (eventName, eventDescription)
4. Panel container wrapper

**CdsAiChatPanel provides slots:**

- `header` - For panel header content
- `body` - For main panel body content
- `footer` - For panel footer content

**Opportunity:** BasePanelComponent's Header could be extracted and placed directly in the `header` slot for better separation of concerns.

### ⚠️ Remaining Work for Phase 2

1. **Complete slot migration (Phase 2B)** - Move BasePanelComponent header/body/footer into CdsAiChatPanel slots and remove the wrapper.
2. **Verify TypeScript compilation (Phase 2C)** - Ensure no type errors post-migration.
3. **Test panel functionality (Phase 2C)** - All panels open/close correctly.
4. **Test animations** - Verify smooth transitions.
5. **Test focus management** - Ensure focus trap works.
6. **Test panel stacking** - Verify priority system works.

### 📋 Phase 2B Plan: Full Slot Migration (Required)

**Scope:** Refactor panels to use CdsAiChatPanel slots directly

**Benefits:**

- Eliminates BasePanelComponent wrapper
- Better separation of concerns (header/body/footer)
- Cleaner component hierarchy
- More maintainable code

**Required Changes:**

1. Create PanelHeader wrapper component
2. Extract Header logic from BasePanelComponent
3. Refactor each panel to use slots:
   ```tsx
   <CdsAiChatPanel open={isOpen} priority={X}>
     <div slot="header">
       <PanelHeader {...headerProps} />
     </div>
     <div slot="body">{/* Direct panel content */}</div>
     <div slot="footer">{/* Footer content if needed */}</div>
   </CdsAiChatPanel>
   ```
4. Implement focus management solution
5. Update all 7 panels
6. Comprehensive testing

**Estimated Effort:** 4-6 hours

**Risk:** Medium (requires careful handling of focus trap and header config logic)

### 🎯 Recommendation

**For Phase 2:**

- Complete slot migration (Phase 2B), then run build + manual verification (Phase 2C)
- Document current state and known issues
- Ensure all panels are functional before moving to Phase 3

### 📝 Next Immediate Steps

1. Execute slot migration (header/body/footer into slots; remove BasePanelComponent wrapper where applicable)
2. Run TypeScript compilation to check for errors
3. Test each panel in the demo app
4. Verify animations work correctly
5. Document any issues found

## Notes for Future Implementation

- The refactoring pattern is consistent: remove OverlayPanel wrapper, remove animation props, clean up imports
- **BasePanelComponent keeps `isOpen` prop** - it's used for focus trap activation and event tracking, NOT for visibility control (CdsAiChatPanel handles visibility)
- Event firing for custom panels moved to AppShell.tsx wrapper for better separation of concerns
- Animation configuration is now declarative via CdsAiChatPanel props rather than imperative via callbacks
- Shared components (BodyAndFooterPanelComponent, HomeScreenContainer) require more careful refactoring as they're used by multiple panels
- **Future optimization**: CdsAiChatPanel has header/body/footer slots that could be leveraged to split BasePanelComponent's header from body content for better separation of concerns

## Next Phase

After Phase 2 is complete and tested, proceed to Phase 3: Workspace Integration (`03-phase-3-workspace-integration.md`)

## Rollback Plan

If Phase 2 causes issues:

1. Revert panel wrapping changes in AppShell.tsx
2. Restore original panel component props
3. Document specific issues encountered
4. Consider alternative animation approach
