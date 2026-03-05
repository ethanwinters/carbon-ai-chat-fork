# Task 3: Create Lazy Loading ChatContainer Examples

## Overview

Create two new examples demonstrating lazy loading with ChatContainer:

1. `examples/react/lazy-loading-chat-container` - React version
2. `examples/web-components/lazy-loading-chat-container` - Web Components version

Both examples will use `cds-aichat-shell` as the Suspense fallback while the full ChatContainer lazy loads. The shell will have the same float positioning classes as the full chat for seamless transition.

## Prerequisites

- Task 1 completed (float.scss created)
- Task 2 completed (AppShell.tsx updated)
- Understanding of React and Web Components
- Familiarity with dynamic imports and Suspense

## Example 1: React Lazy Loading ChatContainer

### Directory Structure

```
examples/react/lazy-loading-chat-container/
├── index.html
├── package.json
├── tsconfig.json
├── webpack.config.js
└── src/
    ├── App.tsx
    ├── ChatShellFallback.tsx
    └── customSendMessage.ts
```

### 1. Create `examples/react/lazy-loading-chat-container/package.json`

**Base on:** `examples/react/basic/package.json`

```json
{
  "name": "@carbon/ai-chat-example-react-lazy-loading-chat-container",
  "version": "1.0.0",
  "private": true,
  "description": "Example demonstrating lazy loading of ChatContainer with cds-aichat-shell as Suspense fallback",
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

### 2. Create `examples/react/lazy-loading-chat-container/index.html`

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
    <title>@carbon/ai-chat - react - lazy loading chat container</title>
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
    </style>
  </head>
  <body>
    <div class="page-content">
      <h1>Lazy Loading ChatContainer Example</h1>
      <p class="description">
        This example demonstrates lazy loading the full ChatContainer. The
        cds-aichat-shell serves as the Suspense fallback with matching float
        positioning. Click the button below to trigger the lazy load.
      </p>
      <button class="launch-button" id="launch-chat">Launch Chat</button>
    </div>
    <div id="root"></div>
  </body>
</html>
```

### 3. Create `examples/react/lazy-loading-chat-container/src/ChatShellFallback.tsx`

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
import "@carbon/ai-chat/dist/es/scss/chat-layout.scss";

/**
 * Shell component that serves as Suspense fallback.
 * Uses the same float classes as ChatContainer for seamless transition.
 * The chat-layout.scss import auto-generates the float positioning classes.
 */
export function ChatShellFallback() {
  const shellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Create the shell element
    const shell = document.createElement("cds-aichat-shell") as HTMLElement;
    shell.setAttribute("show-frame", "");
    shell.setAttribute("rounded-corners", "");

    // Apply float classes - same as ChatContainer will use
    shell.classList.add("cds-aichat-float-open", "cds-aichat-float-opening");

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

### 4. Create `examples/react/lazy-loading-chat-container/src/App.tsx`

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

// Lazy load the ChatContainer
const ChatContainer = lazy(() =>
  import("@carbon/ai-chat").then((module) => ({
    default: module.ChatContainer,
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
      <ChatContainer
        messaging={{ customSendMessage }}
        injectCarbonTheme="white"
        openChatByDefault={true}
      />
    </Suspense>
  );
}

const root = createRoot(document.querySelector("#root") as Element);
root.render(<App />);
```

### 5. Copy `customSendMessage.ts` from basic example

```bash
cp examples/react/basic/src/customSendMessage.ts examples/react/lazy-loading-chat-container/src/
```

### 6. Copy `tsconfig.json` and `webpack.config.js` from basic example

```bash
cp examples/react/basic/tsconfig.json examples/react/lazy-loading-chat-container/
cp examples/react/basic/webpack.config.js examples/react/lazy-loading-chat-container/
```

## Example 2: Web Components Lazy Loading ChatContainer

### Directory Structure

```
examples/web-components/lazy-loading-chat-container/
├── index.html
├── package.json
├── tsconfig.json
├── webpack.config.js
└── src/
    ├── main.ts
    └── customSendMessage.ts
```

### 1. Create `examples/web-components/lazy-loading-chat-container/package.json`

**Base on:** `examples/web-components/basic/package.json`

```json
{
  "name": "@carbon/ai-chat-example-web-components-lazy-loading-chat-container",
  "version": "1.0.0",
  "private": true,
  "description": "Example demonstrating lazy loading of cds-aichat-container with cds-aichat-shell placeholder",
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

### 2. Create `examples/web-components/lazy-loading-chat-container/index.html`

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
      @carbon/ai-chat - web components - lazy loading chat container
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
    </style>
  </head>
  <body>
    <div class="page-content">
      <h1>Lazy Loading Chat Container Example (Web Components)</h1>
      <p class="description">
        This example demonstrates lazy loading the full cds-aichat-container.
        The cds-aichat-shell serves as a loading placeholder with matching float
        positioning. Click the button below to trigger the lazy load.
      </p>
      <button class="launch-button" id="launch-chat">Launch Chat</button>
    </div>
    <my-app></my-app>
  </body>
</html>
```

### 3. Create `examples/web-components/lazy-loading-chat-container/src/main.ts`

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
import "@carbon/ai-chat/dist/es/scss/chat-layout.scss";

import { CarbonTheme, type PublicConfig } from "@carbon/ai-chat";
import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

import { customSendMessage } from "./customSendMessage";

const config: PublicConfig = {
  messaging: {
    customSendMessage,
  },
  injectCarbonTheme: CarbonTheme.WHITE,
  openChatByDefault: true,
};

@customElement("my-app")
export class Demo extends LitElement {
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

    // Dynamically import the container component
    await import("@carbon/ai-chat/dist/es/web-components/cds-aichat-container/index.js");

    this.showChat = true;
    this.isLoading = false;
  }

  renderShellFallback() {
    return html`
      <cds-aichat-shell
        show-frame
        rounded-corners
        class="cds-aichat-float-open cds-aichat-float-opening"
      >
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
      <cds-aichat-container
        .messaging=${config.messaging}
        .injectCarbonTheme=${config.injectCarbonTheme}
        .openChatByDefault=${config.openChatByDefault}
      ></cds-aichat-container>
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

### 4. Copy `customSendMessage.ts` from basic example

```bash
cp examples/web-components/basic/src/customSendMessage.ts examples/web-components/lazy-loading-chat-container/src/
```

### 5. Copy `tsconfig.json` and `webpack.config.js` from basic example

```bash
cp examples/web-components/basic/tsconfig.json examples/web-components/lazy-loading-chat-container/
cp examples/web-components/basic/webpack.config.js examples/web-components/lazy-loading-chat-container/
```

## Testing Checklist

### React Example Testing

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm start`
- [ ] Verify no shell appears initially
- [ ] Click "Launch Chat" button
- [ ] Verify shell appears as Suspense fallback with float positioning
- [ ] Verify shell has rounded corners and frame
- [ ] Verify full ChatContainer replaces shell seamlessly
- [ ] Verify chat is functional (can send messages)
- [ ] Test opening/closing animations
- [ ] Test on mobile viewport

### Web Components Example Testing

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm start`
- [ ] Verify no shell appears initially
- [ ] Click "Launch Chat" button
- [ ] Verify shell appears while loading with float positioning
- [ ] Verify shell has rounded corners and frame
- [ ] Verify full container replaces shell seamlessly
- [ ] Verify chat is functional (can send messages)
- [ ] Test opening/closing animations
- [ ] Test on mobile viewport

### Visual Verification

- [ ] Shell and full chat match in size and position
- [ ] Transition from shell to chat is smooth
- [ ] Float classes are applied correctly to both
- [ ] Rounded corners match between shell and chat
- [ ] No layout shift when switching from shell to chat
- [ ] Loading state is clear and professional

## Build Commands

```bash
# React example
cd examples/react/lazy-loading-chat-container
npm install
npm start
# Open http://localhost:8080

# Web Components example
cd examples/web-components/lazy-loading-chat-container
npm install
npm start
# Open http://localhost:8080
```

## Notes

- The shell serves as the Suspense fallback, appearing only while loading
- Shell uses the same float classes that ChatContainer will apply
- The `chat-layout.scss` import auto-generates float classes via the mixin
- This ensures seamless positioning and size matching
- The lazy loading pattern reduces initial bundle size
- Button click triggers the lazy load, showing shell during load time
- The mixin pattern follows `@carbon/styles` conventions (like accordion, button, etc.)

## Next Phase

After completing this task, proceed to **TASK-4-lazy-loading-chat-custom-element.md** to create the custom element lazy loading examples.
