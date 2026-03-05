# Task 5: Testing, Build Setup, and Documentation

## Overview

Set up build process to export float.scss, update package.json exports, create documentation, and perform comprehensive testing.

## Prerequisites

- Tasks 1-4 completed
- All examples built and tested individually
- Understanding of npm package exports and build processes

## Part 1: Build Process Setup

### 1. Update `packages/ai-chat/package.json` - Add SCSS Export

**Location:** Find the `exports` section in package.json

**Add the following wildcard export (like @carbon/ai-chat-components):**

```json
{
  "exports": {
    ".": {
      "types": "./dist/types/aiChatEntry.d.ts",
      "import": "./dist/es/aiChatEntry.js"
    },
    // ... existing exports ...
    "./scss/*": "./scss/*"
  },
  "files": [
    "dist/",
    "scss/"
    // ... existing files ...
  ]
}
```

**Explanation:**

- Wildcard export allows importing any SCSS file: `@use "@carbon/ai-chat/scss/float.scss"`
- Follows the same pattern as `@carbon/ai-chat-components`
- The `scss/` folder will be a symlink or copy pointing to `dist/scss/`

### 2. Update Build Script to Copy SCSS Files

**Check current build scripts in `packages/ai-chat/package.json`:**

Look for the `scripts` section and find the build command. You'll need to add a step to copy SCSS files.

**Option A: If using a build script file (e.g., `scripts/build.js`):**

Add to the build script:

```javascript
// Copy SCSS files to dist
fs.cpSync("src/scss", "dist/scss", { recursive: true });
```

**Option B: If using npm scripts directly:**

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "npm run build:js && npm run build:scss",
    "build:js": "... existing build command ...",
    "build:scss": "mkdir -p dist/scss && cp -r src/scss/* dist/scss/"
  }
}
```

**Option C: Create symlink (simpler for development):**

```json
{
  "scripts": {
    "postbuild": "ln -sf dist/scss scss || mklink /D scss dist\\scss"
  }
}
```

### 3. Update `.gitignore` (if needed)

**Add to `packages/ai-chat/.gitignore`:**

```
# Generated SCSS exports
/scss
```

This ignores the symlink/copy at the package root.

### 4. Verify Package Structure After Build

After running `npm run build`, the structure should be:

```
packages/ai-chat/
├── dist/
│   ├── es/
│   ├── types/
│   └── scss/
│       └── float.scss
├── scss/ (symlink to dist/scss)
├── src/
│   ├── chat/
│   │   └── styles/
│   │       └── _float.scss
│   └── scss/
│       └── float.scss (forwards from chat/styles)
└── package.json
```

## Part 2: Update Package Exports

### Update `packages/ai-chat/package.json`

**Complete exports section should include:**

```json
{
  "name": "@carbon/ai-chat",
  "version": "1.8.0-rc.0",
  "exports": {
    ".": {
      "types": "./dist/types/aiChatEntry.d.ts",
      "import": "./dist/es/aiChatEntry.js"
    },
    "./es-custom": {
      "types": "./dist/types/aiChatEntry.d.ts",
      "import": "./dist/es-custom/aiChatEntry.js"
    },
    "./server": {
      "types": "./dist/types/serverEntry.d.ts",
      "import": "./dist/es/serverEntry.js"
    },
    "./dist/es/web-components/cds-aichat-container/index.js": {
      "types": "./dist/types/aiChatEntry.d.ts",
      "import": "./dist/es/web-components/cds-aichat-container/index.js"
    },
    "./dist/es/web-components/cds-aichat-custom-element/index.js": {
      "types": "./dist/types/aiChatEntry.d.ts",
      "import": "./dist/es/web-components/cds-aichat-custom-element/index.js"
    },
    "./scss/*": "./scss/*",
    "./dist/es/": "./dist/es/",
    "./dist/es-custom/": "./dist/es-custom/"
  },
  "files": ["dist/", "scss/"]
}
```

**This allows:**

- `@use "@carbon/ai-chat/scss/float.scss"`
- Future SCSS files can be added without updating exports

## Part 3: Create Documentation

### 1. Create `packages/ai-chat/src/scss/README.md`

````markdown
# SCSS Exports

This directory contains SCSS modules that are exported for external use.

## float.scss

Float positioning styles for Carbon AI Chat floating widget mode. These styles can be applied to both `cds-aichat-shell` (for lazy loading placeholders) and the full ChatContainer to ensure consistent positioning and animations.

### Usage

```scss
@use "@carbon/ai-chat/scss/float.scss";
```
````

Or in JavaScript/TypeScript:

```javascript
import "@carbon/ai-chat/scss/float.scss";
```

### Available Classes

#### Base Positioning

- `.cds-aichat-float-open` - Base floating position (fixed, bottom-right by default)
- `.cds-aichat-float-close` - Fully closed state (hidden)

#### Animation States

- `.cds-aichat-float-opening` - Opening animation
- `.cds-aichat-float-closing` - Closing animation

#### Responsive

- `.cds-aichat-float-mobile` - Mobile-specific positioning

### Example: Lazy Loading with Shell Placeholder

```html
<!-- Initial shell placeholder -->
<cds-aichat-shell
  class="cds-aichat-float-open cds-aichat-float-opening"
  show-frame
  rounded-corners
>
  <div slot="messages">Loading...</div>
</cds-aichat-shell>

<!-- Later, replace with full chat -->
<script>
  // ChatContainer automatically applies these same classes
  // ensuring seamless positioning match
</script>
```

### Customization

The float positioning uses CSS custom properties from the chat theme:

- `--cds-aichat-z-index` - Z-index for floating chat
- `--cds-aichat-height` - Chat height
- `--cds-aichat-width` - Chat width
- `--cds-aichat-top-position` - Top position
- `--cds-aichat-right-position` - Right position
- `--cds-aichat-bottom-position` - Bottom position
- `--cds-aichat-left-position` - Left position

### Browser Support

- Modern browsers with CSS custom properties support
- Respects `prefers-reduced-motion` for animations
- RTL (right-to-left) language support included

### Examples

See the lazy loading examples:

- [React Lazy Loading ChatContainer](../../../examples/react/lazy-loading-chat-container)
- [Web Components Lazy Loading ChatContainer](../../../examples/web-components/lazy-loading-chat-container)

````

### 2. Update Main `README.md` in Project Root

**Add a new section about lazy loading:**

```markdown
## Lazy Loading Examples

Carbon AI Chat supports lazy loading to reduce initial bundle size. See these examples:

### ChatContainer (Float Positioning)
- [React Lazy Loading ChatContainer](./examples/react/lazy-loading-chat-container)
- [Web Components Lazy Loading ChatContainer](./examples/web-components/lazy-loading-chat-container)

These examples show using `cds-aichat-shell` with float positioning classes as a Suspense fallback, then lazy loading the full ChatContainer.

### ChatCustomElement (Custom Positioning)
- [React Lazy Loading ChatCustomElement](./examples/react/lazy-loading-chat-custom-element)
- [Web Components Lazy Loading ChatCustomElement](./examples/web-components/lazy-loading-chat-custom-element)

These examples show using `cds-aichat-shell` with custom styling as a Suspense fallback, then lazy loading the full ChatCustomElement.

### Float Positioning Styles

The float positioning styles are now available as a separate import:

```javascript
import "@carbon/ai-chat/scss/float.scss";
````

This allows you to apply consistent float positioning to both the shell placeholder and the full chat. See [float.scss documentation](./packages/ai-chat/src/scss/README.md) for details.

````

### 3. Create Example READMEs

Create README.md files for each of the 4 examples (content from previous tasks):
- `examples/react/lazy-loading-chat-container/README.md`
- `examples/web-components/lazy-loading-chat-container/README.md`
- `examples/react/lazy-loading-chat-custom-element/README.md`
- `examples/web-components/lazy-loading-chat-custom-element/README.md`

## Part 4: Comprehensive Testing

### Build Testing Checklist

- [ ] Run `npm run build` in `packages/ai-chat` - no errors
- [ ] Verify `dist/scss/float.scss` exists
- [ ] Verify `scss/` symlink or folder exists at package root
- [ ] Verify float.scss is importable: `@use "@carbon/ai-chat/scss/float.scss"`
- [ ] Check all TypeScript compilation succeeds
- [ ] Verify SCSS compiles without errors
- [ ] Test import in a sample project

### Example Testing - All 4 Examples

For each example:
- [ ] `npm install` succeeds
- [ ] `npm start` runs without errors
- [ ] Button click triggers lazy load
- [ ] Shell appears as Suspense fallback
- [ ] Full chat loads successfully
- [ ] Positioning matches between shell and chat
- [ ] Chat is fully functional
- [ ] No console errors
- [ ] Mobile viewport works correctly

### Visual Regression Testing

- [ ] Shell and chat match in size
- [ ] Shell and chat match in position
- [ ] No layout shift during transition
- [ ] Animations work correctly
- [ ] Rounded corners match (where applicable)
- [ ] Float positioning works (ChatContainer examples)
- [ ] Custom positioning works (ChatCustomElement examples)

### Cross-Browser Testing

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance Testing

#### Bundle Size Analysis
```bash
# Check bundle sizes
cd examples/react/lazy-loading-chat-container
npm run build
# Analyze dist/ folder sizes

# Compare with non-lazy version
cd ../basic
npm run build
# Compare sizes
````

Expected results:

- Initial bundle should be significantly smaller with lazy loading
- Shell component should be lightweight
- Full chat loads only when needed

#### Load Time Testing

- [ ] Measure time to first shell render
- [ ] Measure time to full chat load
- [ ] Verify lazy loading improves initial page load
- [ ] Test on slow 3G connection

## Part 5: Update CHANGELOG

### Update `CHANGELOG.md`

Add entry for the new features:

```markdown
## [Unreleased]

### Added

- New `float.scss` module with reusable float positioning classes
- Float positioning classes: `cds-aichat-float-open`, `cds-aichat-float-opening`, `cds-aichat-float-closing`, `cds-aichat-float-close`, `cds-aichat-float-mobile`
- SCSS wildcard export: `@carbon/ai-chat/scss/*` (e.g., `@use "@carbon/ai-chat/scss/float.scss"`)
- Four new lazy loading examples demonstrating shell placeholder pattern:
  - React lazy loading ChatContainer example
  - Web Components lazy loading ChatContainer example
  - React lazy loading ChatCustomElement example
  - Web Components lazy loading ChatCustomElement example

### Changed

- Replaced internal widget positioning classes with public float classes
- Float positioning styles now available as separate import

### Deprecated

- Internal widget classes (`cds-aichat--widget--default-element`, etc.) replaced with public float classes
```

## Testing Commands Summary

```bash
# Build main package
cd packages/ai-chat
npm run build

# Verify SCSS export
ls -la dist/scss/
ls -la scss/

# Test React ChatContainer lazy loading
cd ../../examples/react/lazy-loading-chat-container
npm install
npm start

# Test Web Components ChatContainer lazy loading
cd ../../examples/web-components/lazy-loading-chat-container
npm install
npm start

# Test React ChatCustomElement lazy loading
cd ../../examples/react/lazy-loading-chat-custom-element
npm install
npm start

# Test Web Components ChatCustomElement lazy loading
cd ../../examples/web-components/lazy-loading-chat-custom-element
npm install
npm start
```

## Success Criteria

- [ ] All builds complete without errors
- [ ] All 4 examples run successfully
- [ ] Float.scss is importable as `@carbon/ai-chat/scss/float.scss`
- [ ] Wildcard export `./scss/*` works correctly
- [ ] Documentation is complete and accurate
- [ ] Shell and chat positioning match perfectly
- [ ] Lazy loading reduces initial bundle size
- [ ] No visual regressions
- [ ] Cross-browser compatibility verified
- [ ] Performance improvements measurable
- [ ] Build process copies SCSS files correctly
- [ ] Package exports are configured correctly

## Notes

- The float.scss module is now a public API
- Wildcard export `./scss/*` follows same pattern as `@carbon/ai-chat-components`
- Examples demonstrate best practices for lazy loading
- Shell placeholder pattern reduces initial load time
- Both float and custom positioning patterns are supported
- Build process must copy SCSS files to dist for external use
- Symlink or copy at package root enables clean imports

## Completion

Once all tests pass, documentation is complete, and build process is verified, the implementation is ready for review and merge.
