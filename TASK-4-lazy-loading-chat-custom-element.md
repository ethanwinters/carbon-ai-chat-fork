# Task 4: Create Lazy Loading ChatCustomElement Examples

## Overview

Create two new examples demonstrating lazy loading with ChatCustomElement:

1. `examples/react/lazy-loading-chat-custom-element` - React version
2. `examples/web-components/lazy-loading-chat-custom-element` - Web Components version

These examples show using a custom element container (not the float positioning) with lazy loading. The shell serves as the Suspense fallback with user-defined styling that matches the final custom element.

## Prerequisites

- Task 1 completed (float.scss created)
- Task 2 completed (AppShell.tsx updated)
- Understanding of React and Web Components
- Familiarity with custom element patterns

## Example 1: React Lazy Loading ChatCustomElement

### Directory Structure

```
examples/react/lazy-loading-chat-custom-element/
├── index.html
├── package.json
├── tsconfig.json
├── webpack.config.js
└── src/
    ├── App.tsx
    ├── ChatShellFallback.tsx
    └── customSendMessage.ts
```

### 1. Create `examples/react/lazy-loading-chat-custom-element/package.json`

**Base on:** `examples/react/custom-element/package.json`

```json
{
  "name": "@carbon/ai-chat-example-react-lazy-loading-chat-custom-element",
  "version": "1.0.0",
  "private": true,
  "description": "Example demonstrating lazy loading of ChatCustomElement with cds-aichat-shell as Suspense fallback",
  "license": "Apache-2.0",
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "@carbon/ai-chat": "workspace:*",
    "@carbon/ai-chat-components": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "css-loader": "^7.1.2",
    "html-webpack-plugin": "^5.6.3",
    "style-loader": "^4.0.0",
    "ts-loader": "^9.5.1",
    "typescript": "^5.6.3",
    "webpack": "^5.96.1",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.1.0"
  }
}
```

### 2. Create `examples/react/lazy-loading-chat-custom-element/index.html`

```html
<!-- 
  Copyright IBM Corp. 2025
  
  This source code is licensed under the Apache-2.0 license found in the
  LICENSE file in the root directory of this source tree.
 -->

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>@carbon/ai-chat - react - lazy loading chat custom element</title>
    <style>
      body {
        margin: 0;
        padding: 20px;
        font-family: "IBM Plex Sans", sans-serif;
      }

      .page-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        margin-bottom: 1rem;
      }

      .description {
        margin-bottom: 2rem;
        color: #525252;
      }

      .launch-button {
        padding: 12px 24px;
        font-size: 16px;
        background-color: #0f62fe;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: "IBM Plex Sans", sans-serif;
      }

      .launch-button:hover {
        background-color: #0353e9;
      }

      .launch-button:disabled {
        background-color: #c6c6c6;
        cursor: not-allowed;
      }

      /* Custom element styling - user controls size and position */
      .chat-custom-element {
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
      }
    </style>
  </head>
  <body>
    <div class="page-content">
      <h1>Lazy Loading ChatCustomElement Example</h1>
      <p class="description">
        This example demonstrates lazy loading ChatCustomElement with a custom
        container. The cds-aichat-shell serves as the Suspense fallback with
        user-defined styling. Click the button below to trigger the lazy load.
        The user controls the size and position via CSS classes.
      </p>
      <button class="launch-button" id="launch-chat">Launch Chat</button>
    </div>
    <div id="root"></div>
  </body>
</html>
```

### 3. Create `examples/react/lazy-loading-chat-custom-element/src/ChatShellFallback.tsx`

```tsx
/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { useEffect, useRef } from "react";
import "@carbon/ai-chat-components/es/components/chat-shell/index.js";

/**
 * Shell component that serves as Suspense fallback for custom element.
 * Uses custom styling (not float classes) to match the final ChatCustomElement.
 */
export function ChatShellFallback() {
  const shellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Create the shell element
    const shell = document.createElement("cds-aichat-shell") as HTMLElement;
    shell.setAttribute("show-frame", "");
    shell.setAttribute("rounded-corners", "");

    // Apply custom styling class - same as ChatCustomElement will use
    shell.className = "chat-custom-element";

    // Add loading message
    const loadingDiv = document.createElement("div");
    loadingDiv.setAttribute("slot", "messages");
    loadingDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #525252;
      font-family: 'IBM Plex Sans', sans-serif;
    `;
    loadingDiv.textContent = "Loading chat...";
    shell.appendChild(loadingDiv);

    document.body.appendChild(shell);
    shellRef.current = shell;

    return () => {
      if (shell && shell.parentNode) {
        shell.parentNode.removeChild(shell);
      }
    };
  }, []);

  return null;
}
```

### 4. Create `examples/react/lazy-loading-chat-custom-element/src/App.tsx`

```tsx
/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ChatShellFallback } from "./ChatShellFallback";
import { customSendMessage } from "./customSendMessage";

// Lazy load the ChatCustomElement
const ChatCustomElement = lazy(() =>
  import("@carbon/ai-chat").then((module) => ({
    default: module.ChatCustomElement,
  })),
);

function App() {
  const [showChat, setShowChat] = useState(false);

  // Setup button click handler
  React.useEffect(() => {
    const button = document.getElementById("launch-chat");
    const handleClick = () => {
      setShowChat(true);
      if (button) {
        button.setAttribute("disabled", "true");
        button.textContent = "Loading...";
      }
    };

    button?.addEventListener("click", handleClick);
    return () => button?.removeEventListener("click", handleClick);
  }, []);

  if (!showChat) {
    return null;
  }

  return (
    <Suspense fallback={<ChatShellFallback />}>
      <ChatCustomElement
        className="chat-custom-element"
        messaging={{ customSendMessage }}
        injectCarbonTheme="white"
        openChatByDefault={true}
        layout={{
          showFrame: false,
          customProperties: {
            "messages-max-width": `max(60vw, 672px)`,
          },
        }}
      />
    </Suspense>
  );
}

const root = createRoot(document.querySelector("#root") as Element);
root.render(<App />);
```

### 5. Copy `customSendMessage.ts` from custom-element example

```bash
cp examples/react/custom-element/src/customSendMessage.ts examples/react/lazy-loading-chat-custom-element/src/
```

### 6. Copy `tsconfig.json` and `webpack.config.js` from custom-element example

```bash
cp examples/react/custom-element/tsconfig.json examples/react/lazy-loading-chat-custom-element/
cp examples/react/custom-element/webpack.config.js examples/react/lazy-loading-chat-custom-element/
```

## Example 2: Web Components Lazy Loading ChatCustomElement

### Directory Structure

```
examples/web-components/lazy-loading-chat-custom-element/
├── index.html
├── package.json
├── tsconfig.json
├── webpack.config.js
└── src/
    ├── main.ts
    └── customSendMessage.ts
```

### 1. Create `examples/web-components/lazy-loading-chat-custom-element/package.json`

**Base on:** `examples/web-components/custom-element/package.json`

```json
{
  "name": "@carbon/ai-chat-example-web-components-lazy-loading-chat-custom-element",
  "version": "1.0.0",
  "private": true,
  "description": "Example demonstrating lazy loading of cds-aichat-custom-element with cds-aichat-shell placeholder",
  "license": "Apache-2.0",
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "@carbon/ai-chat": "workspace:*",
    "@carbon/ai-chat-components": "workspace:*",
    "lit": "^3.2.1"
  },
  "devDependencies": {
    "css-loader": "^7.1.2",
    "html-webpack-plugin": "^5.6.3",
    "style-loader": "^4.0.0",
    "ts-loader": "^9.5.1",
    "typescript": "^5.6.3",
    "webpack": "^5.96.1",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.1.0"
  }
}
```

### 2. Create `examples/web-components/lazy-loading-chat-custom-element/index.html`

```html
<!-- 
  Copyright IBM Corp. 2025
  
  This source code is licensed under the Apache-2.0 license found in the
  LICENSE file in the root directory of this source tree.
 -->

<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta charset="utf-8" />
    <title>
      @carbon/ai-chat - web components - lazy loading chat custom element
    </title>
    <style>
      body {
        margin: 0;
        padding: 20px;
        font-family: "IBM Plex Sans", sans-serif;
      }

      .page-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        margin-bottom: 1rem;
      }

      .description {
        margin-bottom: 2rem;
        color: #525252;
      }

      .launch-button {
        padding: 12px 24px;
        font-size: 16px;
        background-color: #0f62fe;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: "IBM Plex Sans", sans-serif;
      }

      .launch-button:hover {
        background-color: #0353e9;
      }

      .launch-button:disabled {
        background-color: #c6c6c6;
        cursor: not-allowed;
      }

      /* Custom element styling - user controls size and position */
      .chat-custom-element {
        height: 100vh;
        width: 100vw;
      }
    </style>
  </head>
  <body>
    <div class="page-content">
      <h1>Lazy Loading Chat Custom Element Example (Web Components)</h1>
      <p class="description">
        This example demonstrates lazy loading cds-aichat-custom-element with a
        custom container. The cds-aichat-shell serves as a loading placeholder
        with user-defined styling. Click the button below to trigger the lazy
        load. The user controls the size and position via CSS classes.
      </p>
      <button class="launch-button" id="launch-chat">Launch Chat</button>
    </div>
    <my-app></my-app>
  </body>
</html>
```

### 3. Create `examples/web-components/lazy-loading-chat-custom-element/src/main.ts`

```typescript
/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "@carbon/ai-chat-components/es/components/chat-shell/index.js";

import { CarbonTheme, type PublicConfig } from "@carbon/ai-chat";
import { html, LitElement, css } from "lit";
import { customElement, state } from "lit/decorators.js";

import { customSendMessage } from "./customSendMessage";

const config: PublicConfig = {
  messaging: {
    customSendMessage,
  },
  layout: {
    showFrame: false,
    customProperties: {
      "messages-max-width": `max(60vw, 672px)`,
    },
  },
  openChatByDefault: true,
  injectCarbonTheme: CarbonTheme.WHITE,
};

@customElement("my-app")
export class Demo extends LitElement {
  static styles = css`
    .chat-custom-element {
      height: 100vh;
      width: 100vw;
    }
  `;

  @state()
  accessor showChat = false;

  @state()
  accessor isLoading = false;

  connectedCallback() {
    super.connectedCallback();

    // Setup button click handler
    const button = document.getElementById("launch-chat");
    button?.addEventListener("click", () => this.loadChat());
  }

  async loadChat() {
    this.isLoading = true;

    // Update button immediately
    const button = document.getElementById("launch-chat");
    if (button) {
      button.setAttribute("disabled", "true");
      button.textContent = "Loading...";
    }

    // Dynamically import the custom element component
    await import("@carbon/ai-chat/dist/es/web-components/cds-aichat-custom-element/index.js");

    this.showChat = true;
    this.isLoading = false;
  }

  renderShellFallback() {
    return html`
      <cds-aichat-shell show-frame rounded-corners class="chat-custom-element">
        <div
          slot="messages"
          style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #525252;
          font-family: 'IBM Plex Sans', sans-serif;
        "
        >
          Loading chat...
        </div>
      </cds-aichat-shell>
    `;
  }

  renderChat() {
    return html`
      <cds-aichat-custom-element
        .messaging=${config.messaging}
        .layout=${config.layout}
        .openChatByDefault=${config.openChatByDefault}
        .injectCarbonTheme=${config.injectCarbonTheme}
        class="chat-custom-element"
      ></cds-aichat-custom-element>
    `;
  }

  render() {
    if (this.isLoading) {
      return this.renderShellFallback();
    }

    return this.showChat ? this.renderChat() : html``;
  }
}
```

### 4. Copy `customSendMessage.ts` from custom-element example

```bash
cp examples/web-components/custom-element/src/customSendMessage.ts examples/web-components/lazy-loading-chat-custom-element/src/
```

### 5. Copy `tsconfig.json` and `webpack.config.js` from custom-element example

```bash
cp examples/web-components/custom-element/tsconfig.json examples/web-components/lazy-loading-chat-custom-element/
cp examples/web-components/custom-element/webpack.config.js examples/web-components/lazy-loading-chat-custom-element/
```

## Testing Checklist

### React Example Testing

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm start`
- [ ] Verify no shell appears initially
- [ ] Click "Launch Chat" button
- [ ] Verify shell appears as Suspense fallback with custom styling
- [ ] Verify shell has rounded corners and frame
- [ ] Verify full ChatCustomElement replaces shell seamlessly
- [ ] Verify chat is functional (can send messages)
- [ ] Verify NO float classes are applied (custom element uses user CSS)
- [ ] Test on mobile viewport

### Web Components Example Testing

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm start`
- [ ] Verify no shell appears initially
- [ ] Click "Launch Chat" button
- [ ] Verify shell appears while loading with custom styling
- [ ] Verify shell has rounded corners and frame
- [ ] Verify full custom element replaces shell seamlessly
- [ ] Verify chat is functional (can send messages)
- [ ] Verify NO float classes are applied (custom element uses user CSS)
- [ ] Test on mobile viewport

### Visual Verification

- [ ] Shell and full chat match in size and position
- [ ] Transition from shell to chat is smooth
- [ ] User-defined CSS classes control positioning (not float classes)
- [ ] Rounded corners match between shell and chat
- [ ] No layout shift when switching from shell to chat
- [ ] Loading state is clear and professional

## Build Commands

```bash
# React example
cd examples/react/lazy-loading-chat-custom-element
npm install
npm start
# Open http://localhost:8080

# Web Components example
cd examples/web-components/lazy-loading-chat-custom-element
npm install
npm start
# Open http://localhost:8080
```

## Key Differences from ChatContainer Examples

1. **No Float Classes**: Custom elements don't use float positioning classes
2. **User-Controlled Styling**: Size and position are controlled via user-provided CSS classes
3. **Same Shell Pattern**: Shell serves as Suspense fallback, styled by user
4. **Full Control**: User has complete control over the container appearance

## Notes

- Custom elements give users full control over positioning and sizing
- The shell should match the styling of the final custom element container
- No float classes are used - all styling is user-defined
- The shell serves as the Suspense fallback, appearing only while loading
- Both shell and full chat use the same user-provided CSS class for consistency

## Next Phase

After completing this task, proceed to **TASK-5-testing-documentation.md** for final testing and documentation updates.
