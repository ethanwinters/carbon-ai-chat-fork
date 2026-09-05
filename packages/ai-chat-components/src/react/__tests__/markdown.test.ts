/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** Slot names the stubbed element reports as already delegated. */
let mockDelegatedSlotNames: string[] = [];

// The real `<cds-aichat-markdown>` drags the decorated Lit component tree
// through Babel, which this suite has no transform for — and none of it is
// under test here. The wrapper's contract with the element is two event names
// and one getter, so the stub implements exactly that. The element's side of
// the same contract (which names the getter reports, and that `customRenderers`
// claims are excluded from them) is proved against the real element in a real
// browser: see `describe('plugin-host handshake with a late subscriber')` in
// `src/components/markdown/__tests__/markdown.test.ts`.
jest.mock('../../components/markdown/src/markdown', () => {
  // `globalThis.` qualified because jest.mock factories may not close over
  // out-of-scope identifiers.
  class MarkdownStub extends globalThis.HTMLElement {
    get delegatedPluginSlotNames(): string[] {
      return [...mockDelegatedSlotNames];
    }
  }
  if (!globalThis.customElements.get('cds-aichat-markdown')) {
    globalThis.customElements.define('cds-aichat-markdown', MarkdownStub);
  }
  return { __esModule: true, default: MarkdownStub };
});

import Markdown from '../markdown';

/**
 * The wrapper's half of the late-subscriber handshake (#2271).
 *
 * `cds-aichat-markdown-plugin-host-mount` fires once per live host and is
 * never replayed. The wrapper subscribes in a passive effect, so a slot
 * claimed before that effect ran would never get the `<slot>` forwarder its
 * hoisted host needs — and that forwarder is the only thing crossing the
 * element's shadow boundary. The wrapper therefore seeds from
 * `delegatedPluginSlotNames` after subscribing.
 */
describe('<Markdown> plugin slot forwarders', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    mockDelegatedSlotNames = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderMarkdown() {
    // `createElement` rather than JSX: this package's TS build compiles the
    // test suites too, under the automatic JSX runtime, so a JSX file here
    // needs a `React` import the build then rejects as unused.
    act(() => {
      root.render(createElement(Markdown, { markdown: 'Hi' }));
    });
    const element = container.querySelector('cds-aichat-markdown');
    expect(element).not.toBeNull();
    return element as HTMLElement;
  }

  /** Forwarders the wrapper rendered into the element's light DOM. */
  function forwarderNames(element: HTMLElement) {
    return Array.from(element.querySelectorAll('slot')).map((slot) =>
      slot.getAttribute('name')
    );
  }

  function dispatchMount(
    element: HTMLElement,
    detail: { slotName: string; element?: HTMLElement }
  ) {
    act(() => {
      element.dispatchEvent(
        new CustomEvent('cds-aichat-markdown-plugin-host-mount', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: { isInline: false, ...detail },
        })
      );
    });
  }

  it('renders a forwarder for a slot claimed before it subscribed', () => {
    mockDelegatedSlotNames = ['cds-test-slot-a'];

    const element = renderMarkdown();

    // The mount event for this slot fired before the effect existed. Without
    // the seed there is nothing to render a forwarder from, and the hoisted
    // host stays stranded outside the shadow slot for good.
    expect(forwarderNames(element)).toEqual(['cds-test-slot-a']);
    // `name` gathers the hoisted host out of the container's light DOM;
    // `slot` assigns the forwarder itself into the element's shadow slot.
    // Both halves are load-bearing.
    expect(element.querySelector('slot')?.getAttribute('slot')).toBe(
      'cds-test-slot-a'
    );
  });

  it('renders no forwarder when nothing was claimed', () => {
    expect(forwarderNames(renderMarkdown())).toEqual([]);
  });

  it('still hears mount events that arrive after it subscribed', () => {
    const element = renderMarkdown();

    dispatchMount(element, { slotName: 'cds-test-slot-b' });

    expect(forwarderNames(element)).toEqual(['cds-test-slot-b']);
  });

  it('renders one forwarder when a slot is both seeded and announced', () => {
    mockDelegatedSlotNames = ['cds-test-slot-c'];
    const element = renderMarkdown();

    // A container re-announcing a slot the seed already covered. Also the
    // shape React StrictMode produces, where the effect subscribes twice and
    // therefore seeds twice.
    dispatchMount(element, { slotName: 'cds-test-slot-c' });

    expect(forwarderNames(element)).toEqual(['cds-test-slot-c']);
  });

  it('never forwards a customRenderers host', () => {
    const element = renderMarkdown();

    // A live-element mount is a `customRenderers` host the element keeps
    // writing to. Forwarding it would hold the named slot occupied and
    // suppress its fallback once the callback returns null.
    dispatchMount(element, {
      slotName: 'cds-test-slot-d',
      element: document.createElement('div'),
    });

    expect(forwarderNames(element)).toEqual([]);
  });
});
