# Phase 2C: Testing & Verification

## Overview

**Prerequisites:** Phase 2B must be complete (slot migration finished)

**Goal:** Verify that all panel refactoring works correctly through compilation checks and manual testing.

**Estimated Time:** 1-2 hours

## Objectives

1. Verify TypeScript compilation succeeds
2. Test all 7 panels manually
3. Verify animations work correctly
4. Test focus management
5. Verify panel stacking/priority
6. Document any issues found

## Phase 2A Recap

What was completed in Phase 2A:

- ✅ Removed OverlayPanel wrapper from 9 components
- ✅ Removed animation props from all panels
- ✅ Wrapped all 7 panels with CdsAiChatPanel in AppShell.tsx
- ✅ Configured priority system (90-30)
- ✅ Configured animations per panel type
- ✅ Added `isOpen` prop where needed

## Step 1: TypeScript Compilation Verification

### Task

Run TypeScript compilation to ensure no type errors exist.

### Commands

```bash
# From project root
npm run build

# Or just TypeScript check
npx tsc --noEmit
```

### Expected Result

- ✅ No TypeScript errors
- ✅ All imports resolve correctly
- ✅ All prop types match

### Common Issues to Check

- Missing `isOpen` props on panel components
- Incorrect prop types passed to CdsAiChatPanel
- Missing imports after refactoring
- Type mismatches in event handlers

### If Errors Found

Document each error with:

- File and line number
- Error message
- Proposed fix
- Whether it's blocking or can be deferred

## Step 2: Manual Panel Testing

### Testing Environment

- Use the demo app at `demo/`
- Test in both React and Web Components versions if possible
- Test in different browsers (Chrome, Firefox, Safari)

### Panel Testing Checklist

#### 2.1 HydrationPanel (Priority 90)

- [ ] Opens automatically on app load when history exists
- [ ] Shows loading indicator
- [ ] Fades in smoothly
- [ ] Fades out when hydration complete
- [ ] Blocks interaction with other panels while open
- [ ] Focus trap works (can't tab out)

**How to Test:**

1. Clear browser storage
2. Send a message
3. Refresh the page
4. Observe hydration panel

#### 2.2 DisclaimerPanel (Priority 80)

- [ ] Opens on first use
- [ ] Shows disclaimer content
- [ ] Fades in smoothly
- [ ] Accept button works
- [ ] Fades out when accepted
- [ ] Doesn't show again after acceptance
- [ ] Focus trap works

**How to Test:**

1. Clear browser storage
2. Load app
3. Observe disclaimer panel
4. Click accept
5. Refresh and verify it doesn't show again

#### 2.3 HomeScreenPanel (Priority 70)

- [ ] Opens when no messages exist
- [ ] Shows conversation starters
- [ ] Fades in smoothly
- [ ] Clicking starter sends message and closes panel
- [ ] Fades out when message sent
- [ ] Can be toggled open/closed
- [ ] Input field works

**How to Test:**

1. Clear browser storage
2. Load app (after disclaimer)
3. Observe home screen
4. Click a conversation starter
5. Toggle home screen open/closed

#### 2.4 CustomPanel (Priority 60)

- [ ] Opens when custom panel triggered
- [ ] Slides in from bottom smoothly
- [ ] Shows custom panel content
- [ ] Close button works
- [ ] Slides out to bottom when closed
- [ ] Focus trap works
- [ ] Back button works if applicable

**How to Test:**

1. Trigger a custom panel (depends on demo configuration)
2. Observe animation
3. Test close button
4. Test back button if present

#### 2.5 ResponsePanel (Priority 50)

- [ ] Opens when clicking "View details" on a message
- [ ] Slides in from right smoothly
- [ ] Shows message body and footer content
- [ ] Back button works
- [ ] Slides out to right when closed
- [ ] Focus trap works
- [ ] Header shows correct title

**How to Test:**

1. Send a message that has expandable content
2. Click to expand/view details
3. Observe animation
4. Test back button
5. Test close button

#### 2.6 IFramePanel (Priority 40)

- [ ] Opens when iframe content triggered
- [ ] Slides in from bottom smoothly
- [ ] Shows iframe content correctly
- [ ] Back button works
- [ ] Slides out to bottom when closed
- [ ] Focus trap works
- [ ] Header shows correct title

**How to Test:**

1. Trigger iframe content (depends on demo configuration)
2. Observe animation
3. Verify iframe loads
4. Test back button
5. Test close button

#### 2.7 ViewSourcePanel (Priority 30)

- [ ] Opens when clicking citation/source
- [ ] Slides in from bottom smoothly
- [ ] Shows source text with highlighting
- [ ] Back button works
- [ ] Slides out to bottom when closed
- [ ] Focus trap works
- [ ] Header shows correct title

**How to Test:**

1. Send a message with citations
2. Click a citation
3. Observe animation
4. Verify source text displays
5. Test back button
6. Test close button

## Step 3: Animation Verification

### Animation Types to Verify

#### Fade Animations

- **Panels:** HydrationPanel, DisclaimerPanel, HomeScreenPanel
- **Check:**
  - [ ] Smooth fade in (no flashing)
  - [ ] Smooth fade out (no flashing)
  - [ ] Appropriate duration (not too fast/slow)
  - [ ] No visual glitches

#### Slide-from-Right Animation

- **Panels:** ResponsePanel
- **Check:**
  - [ ] Smooth slide in from right
  - [ ] Smooth slide out to right
  - [ ] Appropriate duration
  - [ ] No visual glitches
  - [ ] Doesn't push other content

#### Slide-from-Bottom Animation

- **Panels:** CustomPanel, IFramePanel, ViewSourcePanel
- **Check:**
  - [ ] Smooth slide in from bottom
  - [ ] Smooth slide out to bottom
  - [ ] Appropriate duration
  - [ ] No visual glitches
  - [ ] Doesn't push other content

### Animation Issues to Watch For

- Flashing or flickering during transitions
- Content visible before animation starts
- Animation too fast or too slow
- Multiple animations conflicting
- Content jumping or shifting

## Step 4: Focus Management Testing

### Focus Trap Verification

For each panel, verify:

- [ ] Focus moves to panel when it opens
- [ ] Tab key cycles through focusable elements in panel
- [ ] Shift+Tab cycles backwards
- [ ] Can't tab out of panel to background content
- [ ] Escape key closes panel (if applicable)
- [ ] Focus returns to appropriate element when panel closes

### Back Button Focus

- [ ] Back button receives focus when panel opens
- [ ] Back button is keyboard accessible
- [ ] Clicking back button closes panel
- [ ] Enter/Space on back button works

### Close Button Focus

- [ ] Close button is keyboard accessible
- [ ] Clicking close button closes panel
- [ ] Enter/Space on close button works

## Step 5: Panel Stacking Verification

### Priority System Test

Test that panels stack correctly according to priority:

**Test Scenario 1: Multiple Panels**

1. Open HomeScreenPanel (priority 70)
2. Trigger CustomPanel (priority 60)
3. Verify CustomPanel appears UNDER HomeScreen
4. Close HomeScreen
5. Verify CustomPanel is now visible

**Test Scenario 2: High Priority Blocks Low Priority**

1. Open ResponsePanel (priority 50)
2. Try to open ViewSourcePanel (priority 30)
3. Verify ViewSource appears UNDER Response
4. Close Response
5. Verify ViewSource is now visible

**Test Scenario 3: Disclaimer Blocks Everything**

1. Clear storage to trigger disclaimer
2. Try to interact with other panels
3. Verify disclaimer (priority 80) blocks all interaction

### Stacking Issues to Watch For

- Lower priority panels appearing on top
- Panels not blocking interaction correctly
- Z-index conflicts
- Panels appearing behind main content

## Step 6: Issue Documentation

### Issue Tracking Template

For each issue found, document:

```markdown
## Issue #X: [Brief Description]

**Panel:** [Panel Name]
**Priority:** [High/Medium/Low]
**Type:** [Animation/Focus/Stacking/Functionality]

**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Browser/Environment:**

- Browser: [Chrome/Firefox/Safari]
- Version: [Version number]
- OS: [macOS/Windows/Linux]

**Proposed Fix:**
[Suggested solution if known]

**Workaround:**
[Temporary workaround if available]
```

### Issue Categories

**High Priority (Blocking):**

- Panel doesn't open/close
- TypeScript compilation errors
- Focus trap completely broken
- Critical animation failures

**Medium Priority (Should Fix):**

- Animation glitches
- Focus management issues
- Incorrect stacking order
- Performance problems

**Low Priority (Nice to Have):**

- Minor animation timing issues
- Cosmetic problems
- Edge case behaviors

## Step 7: Results Summary

### Success Criteria

Phase 2B is complete when:

- [ ] TypeScript compilation succeeds with no errors
- [ ] All 7 panels open and close correctly
- [ ] All animations work smoothly
- [ ] Focus management works as expected
- [ ] Panel stacking follows priority system
- [ ] All high-priority issues are resolved
- [ ] Medium-priority issues are documented for future work

### Deliverables

1. **Test Results Document** - Summary of all testing performed
2. **Issue List** - Documented issues with priority and proposed fixes
3. **Updated Code** - Any fixes applied during testing
4. **Recommendations** - Suggestions for Phase 2C or Phase 3

## Next Phase

After Phase 2B is complete:

- **If issues found:** Proceed to Phase 2C (Issue Resolution)
- **If no major issues:** Proceed to Phase 3 (Workspace Integration) or Phase 2C (Full Slot Migration)

## Rollback Plan

If critical issues are found that can't be quickly resolved:

1. Document all issues thoroughly
2. Consider reverting to pre-Phase 2A state
3. Re-evaluate approach
4. Plan alternative implementation strategy
