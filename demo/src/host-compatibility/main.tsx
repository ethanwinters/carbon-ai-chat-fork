/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * Test harness for `tests/react-host-compatibility.spec.ts`. It loads the React
 * and web-component entries in the order `?order=` names, so each page load is
 * a fresh module graph and custom-element registry:
 *
 * - `react,wc`: React chat, then the web-component entry.
 * - `wc,react`: the web-component entry, then the React chat.
 */

import type { ChatInstance, PublicConfig } from '@carbon/ai-chat';
import React, { createContext, useContext, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface Harness {
  reactInstance?: ChatInstance;
  setTheme?: (theme: string) => void;
  loaded: string[];
}

declare global {
  interface Window {
    hostCompatibility: Harness;
  }
}

const harness: Harness = { loaded: [] };
window.hostCompatibility = harness;

const config: PublicConfig = {
  openChatByDefault: true,
  messaging: { customSendMessage: () => undefined },
};

const ThemeContext = createContext('none');

function Counter() {
  const theme = useContext(ThemeContext);
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      className="host-compat-udr"
      data-testid="host_compat_udr"
      onClick={() => setCount(count + 1)}>
      {theme}:{count}
    </button>
  );
}

/** Mounts the React chat and settles once it has rendered. */
async function mountReact() {
  const { ChatContainer } = await import('@carbon/ai-chat');
  let rendered: () => void;
  const done = new Promise<void>((resolve) => {
    rendered = resolve;
  });
  function Host() {
    const [theme, setTheme] = useState('light');
    harness.setTheme = setTheme;
    return (
      <ThemeContext.Provider value={theme}>
        <ChatContainer
          {...config}
          onBeforeRender={(instance) => {
            harness.reactInstance = instance;
          }}
          onAfterRender={() => rendered()}
          renderUserDefinedResponse={() => <Counter />}
        />
      </ThemeContext.Provider>
    );
  }
  createRoot(document.getElementById('root') as HTMLElement).render(<Host />);
  await done;
  harness.loaded.push('react');
}

async function loadWebComponents() {
  await import('@carbon/ai-chat/dist/es/web-components/cds-aichat-container/index.js');
  harness.loaded.push('wc');
}

async function run() {
  const params = new URLSearchParams(window.location.search);
  for (const step of (params.get('order') ?? 'react,wc').split(',')) {
    await (step === 'wc' ? loadWebComponents() : mountReact());
  }
}

run();
