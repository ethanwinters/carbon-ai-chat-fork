/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * The built-in stop button and `instance.messaging.stop()` have to stay one path. The stop specs
 * cover the API side; this covers the button side, by driving the same custom event the Lit send
 * control fires on click and asserting it lands on the shared core action. Without this, restoring
 * the old view-layer reach-through into `MessageService` would pass the whole suite.
 */

import { act } from '@testing-library/react';

import {
  createBaseConfig,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from '../../test_helpers';
import { BusEventType } from '../../../src/types/events/eventBusTypes';
import { MessagesStatus } from '../../../src/types/messaging/MessagesState';
import { MessageResponseTypes } from '../../../src/types/messaging/Messages';
import type { PublicConfig } from '../../../src/types/config/PublicConfig';

const RESPONSE_ID = 'button-stopped-response';

/**
 * A host that hangs until aborted, then closes its response out the way the shipped examples do.
 */
function createConformingHangingConfig(): {
  config: PublicConfig;
  wasAborted: () => boolean;
} {
  let aborted = false;
  const config = createBaseConfig();
  config.messaging = {
    showStopButtonImmediately: true,
    customSendMessage: async (_message, { signal }, instance) => {
      await new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => {
          aborted = true;
          resolve();
        });
      });

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: RESPONSE_ID },
        complete_item: {
          streaming_metadata: { id: 'item-1', stream_stopped: true },
          response_type: MessageResponseTypes.TEXT,
          text: 'partial answer',
        },
      } as any);
    },
  };
  return { config, wasAborted: () => aborted };
}

function tick(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** The chat mounts into a shadow root, so finding its elements means descending through them. */
function findDeep(
  tagName: string,
  root: ParentNode = document
): Element | null {
  const direct = root.querySelector(tagName);
  if (direct) {
    return direct;
  }

  const candidates = Array.from(root.querySelectorAll('*'));
  for (const element of candidates) {
    const shadowRoot = (element as HTMLElement).shadowRoot;
    if (shadowRoot) {
      const found = findDeep(tagName, shadowRoot);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Fires the event the Lit send control emits when its stop button is clicked. Reaching through to the
 * button itself would couple this spec to that component's internals; the event is the contract
 * between the two packages.
 */
function clickStopButton() {
  const sendControl = findDeep('cds-aichat-input-send-control');

  if (!sendControl) {
    throw new Error(
      'Expected the input send control to be rendered before stopping.'
    );
  }

  sendControl.dispatchEvent(
    new CustomEvent('cds-aichat-input-stop-streaming', {
      bubbles: true,
      composed: true,
    })
  );
}

describe('the built-in stop button', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('drives the same core action instance.messaging.stop() does', async () => {
    const { config, wasAborted } = createConformingHangingConfig();
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);

    const stopStreaming = jest.spyOn(serviceManager.actions, 'stopStreaming');
    const stopEvents: unknown[] = [];
    instance.on({
      type: BusEventType.STOP_STREAMING,
      handler: (event) => stopEvents.push(event),
    });

    const sendPromise = instance.send('Test message');
    await tick();

    await act(async () => {
      clickStopButton();
      await tick();
    });
    await sendPromise;
    await tick();

    expect(stopStreaming).toHaveBeenCalledTimes(1);
    expect(wasAborted()).toBe(true);
    expect(stopEvents).toHaveLength(1);
    expect(instance.messaging.getMessagesState().status).toBe(
      MessagesStatus.READY
    );
    const stopped = instance.messaging.getMessage(RESPONSE_ID) as any;
    expect(stopped.output.generic[0].text).toBe('partial answer');
  });

  it('re-enables itself when the click raced the turn finishing on its own', async () => {
    // Nothing is left to stop, so no cancellation hides the button. Without the handler's `finally`
    // it would stay visible and permanently disabled.
    const config = createBaseConfig();
    config.messaging = {
      showStopButtonImmediately: true,
      customSendMessage: async () => {},
    };
    const { instance, store } = await renderChatAndGetInstanceWithStore(config);

    await instance.send('Test message');
    await tick();

    await act(async () => {
      clickStopButton();
      await tick();
    });

    expect(
      store.getState().assistantInputState.stopStreamingButtonState.isDisabled
    ).toBe(false);
  });
});
