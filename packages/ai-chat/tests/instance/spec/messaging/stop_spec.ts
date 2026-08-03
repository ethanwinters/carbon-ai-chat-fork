/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  createBaseConfig,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from '../../../test_helpers';
import { BusEventType } from '../../../../src/types/events/eventBusTypes';
import { MessagesStatus } from '../../../../src/types/messaging/MessagesState';
import { MessageResponseTypes } from '../../../../src/types/messaging/Messages';
import { PublicConfig } from '../../../../src/types/config/PublicConfig';

/**
 * Builds a config whose `customSendMessage` blocks until the abort signal fires, so a turn can be
 * held in flight while the test stops it. Mirrors the pattern in `send_spec.ts`.
 *
 * `closeOutOnAbort` decides which half of the stop contract the host honors. With it set, the host
 * behaves like the shipped examples: on abort it emits a final `complete_item` carrying what it
 * streamed, which is what finalizes the response. Without it, the host aborts and delivers nothing —
 * the non-conforming case the debug diagnostic exists to surface.
 */
function createHangingSendConfig(
  options: { closeOutOnAbort?: { responseID: string; text: string } } = {}
): {
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

      const closeOut = options.closeOutOnAbort;
      if (closeOut) {
        await instance.messaging.addMessageChunk({
          streaming_metadata: { response_id: closeOut.responseID },
          complete_item: {
            streaming_metadata: { id: 'item-1', stream_stopped: true },
            response_type: MessageResponseTypes.TEXT,
            text: closeOut.text,
          },
        } as any);
      }
    },
  };
  return { config, wasAborted: () => aborted };
}

/** Lets the send pipeline start before the test acts on it. */
function tick(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ChatInstance.messaging.stop', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('exposes stop as a function', async () => {
    const { instance } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());

    expect(typeof instance.messaging.stop).toBe('function');
  });

  it('fires the abort signal and lets the pending send resolve rather than reject', async () => {
    const { config, wasAborted } = createHangingSendConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const sendPromise = instance.send('Test message');
    await tick();

    await instance.messaging.stop();

    await expect(sendPromise).resolves.toBeUndefined();
    expect(wasAborted()).toBe(true);
  });

  it('fires STOP_STREAMING for a programmatic stop, not just a button click', async () => {
    const { config } = createHangingSendConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const events: any[] = [];
    instance.on({
      type: BusEventType.STOP_STREAMING,
      handler: (event) => {
        events.push(event);
      },
    });

    const sendPromise = instance.send('Test message');
    await tick();

    await instance.messaging.stop();
    await sendPromise;

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(BusEventType.STOP_STREAMING);
  });

  it('keeps the partial content the host closed out with and returns to READY', async () => {
    const responseID = 'stopped-response';
    const { config } = createHangingSendConfig({
      closeOutOnAbort: { responseID, text: 'partial answer' },
    });
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);

    const sendPromise = instance.send('Test message');
    await tick();

    await instance.messaging.addMessageChunk({
      streaming_metadata: { response_id: responseID },
      partial_item: {
        streaming_metadata: { id: 'item-1' },
        response_type: MessageResponseTypes.TEXT,
        text: 'partial answer',
      },
    });

    expect(serviceManager.messagesState.getMessagesState().status).toBe(
      MessagesStatus.STREAMING
    );

    const messagesStateEvents: any[] = [];
    instance.on({
      type: BusEventType.MESSAGES_STATE_CHANGE,
      handler: (event) => messagesStateEvents.push(event),
    });

    await instance.messaging.stop();
    await sendPromise;
    await tick();

    // The stop has to be observable through the event, not only by polling the getter.
    expect(messagesStateEvents.length).toBeGreaterThan(0);
    const lastStateEvent = messagesStateEvents[messagesStateEvents.length - 1];
    expect(lastStateEvent.newState.status).toBe(MessagesStatus.READY);
    expect(lastStateEvent.newState).toBe(instance.messaging.getMessagesState());

    const stopped = instance.messaging.getMessage(responseID);
    expect((stopped as any).output.generic[0].text).toBe('partial answer');
    expect(instance.messaging.getMessagesState().status).toBe(
      MessagesStatus.READY
    );
    // Set by the host on its closing chunk, which is what drives the "Response stopped" marker.
    expect(
      (stopped as any).output.generic[0].streaming_metadata.stream_stopped
    ).toBe(true);
  });

  it('leaves the response streaming when the host aborts without closing it out', async () => {
    // The other half of the contract is the host's. Stopping fires the abort and nothing more, so a
    // host that delivers no final chunk leaves its response mid-stream — asserted here rather than
    // papered over, because a framework-side close-out would race the host's own.
    const { config } = createHangingSendConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const sendPromise = instance.send('Test message');
    await tick();

    const responseID = 'never-closed-response';
    await instance.messaging.addMessageChunk({
      streaming_metadata: { response_id: responseID },
      partial_item: {
        streaming_metadata: { id: 'item-1' },
        response_type: MessageResponseTypes.TEXT,
        text: 'partial answer',
      },
    });

    await instance.messaging.stop();
    await sendPromise;
    await tick();

    expect(instance.messaging.getMessagesState().status).toBe(
      MessagesStatus.STREAMING
    );
  });

  it('warns in debug mode when the host aborts without closing the response out', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { config } = createHangingSendConfig();
      config.debug = true;
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const sendPromise = instance.send('Test message');
      await tick();

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: 'never-closed-response' },
        partial_item: {
          streaming_metadata: { id: 'item-1' },
          response_type: MessageResponseTypes.TEXT,
          text: 'partial answer',
        },
      });

      await instance.messaging.stop();
      await sendPromise;
      await tick(2500);

      expect(
        warn.mock.calls.some(([message]) =>
          String(message).includes('still streaming after')
        )
      ).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  it('stays silent when the host does close the response out', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const responseID = 'closed-response';
      const { config } = createHangingSendConfig({
        closeOutOnAbort: { responseID, text: 'partial answer' },
      });
      config.debug = true;
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const sendPromise = instance.send('Test message');
      await tick();

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        partial_item: {
          streaming_metadata: { id: 'item-1' },
          response_type: MessageResponseTypes.TEXT,
          text: 'partial',
        },
      });

      await instance.messaging.stop();
      await sendPromise;
      await tick(2500);

      expect(
        warn.mock.calls.some(([message]) =>
          String(message).includes('still streaming after')
        )
      ).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  it('coalesces concurrent stops into one cancellation', async () => {
    const { config } = createHangingSendConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const events: any[] = [];
    instance.on({
      type: BusEventType.STOP_STREAMING,
      handler: (event) => {
        events.push(event);
      },
    });

    const sendPromise = instance.send('Test message');
    await tick();

    // Overlapping callers must share the cancellation. Firing STOP_STREAMING twice concurrently is
    // rejected by the event bus as reentrant, so an un-coalesced second call rejects.
    await expect(
      Promise.all([instance.messaging.stop(), instance.messaging.stop()])
    ).resolves.toBeDefined();
    await sendPromise;

    expect(events).toHaveLength(1);
  });

  it('is a silent no-op when no turn is active', async () => {
    const { instance } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());

    const stopEvents: any[] = [];
    const messagesStateEvents: any[] = [];
    instance.on([
      {
        type: BusEventType.STOP_STREAMING,
        handler: (event) => stopEvents.push(event),
      },
      {
        type: BusEventType.MESSAGES_STATE_CHANGE,
        handler: (event) => messagesStateEvents.push(event),
      },
    ]);

    await expect(instance.messaging.stop()).resolves.toBeUndefined();

    expect(stopEvents).toHaveLength(0);
    expect(messagesStateEvents).toHaveLength(0);
  });

  it('lets a queued message behind the stopped turn still send', async () => {
    const sent: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstSendGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const config = createBaseConfig();
    config.messaging = {
      showStopButtonImmediately: true,
      customSendMessage: async (message: any, { signal }: any) => {
        const text = message?.input?.text ?? '';
        sent.push(text);
        if (sent.length === 1) {
          await new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve());
            firstSendGate.then(resolve);
          });
        }
      },
    };

    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const firstSend = instance.send('first');
    await tick();
    const secondSend = instance.send('second');

    await instance.messaging.stop();
    releaseFirst();
    await Promise.all([firstSend, secondSend]);

    expect(sent).toContain('first');
    expect(sent).toContain('second');
  });

  it('keeps the turn promoted by a stop stoppable in its own right', async () => {
    const aborted: string[] = [];
    const config = createBaseConfig();
    config.messaging = {
      showStopButtonImmediately: true,
      customSendMessage: async (message: any, { signal }: any) => {
        const text = message?.input?.text ?? '';
        await new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => {
            aborted.push(text);
            resolve();
          });
        });
      },
    };

    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const events: any[] = [];
    instance.on({
      type: BusEventType.STOP_STREAMING,
      handler: (event) => {
        events.push(event);
      },
    });

    const firstSend = instance.send('first');
    await tick();
    const secondSend = instance.send('second');
    await tick();

    // Cancelling the first turn promotes the second, so the second stop has to reach a turn that is
    // genuinely in flight rather than a queue slot the first stop already emptied.
    await instance.messaging.stop();
    await tick();
    await instance.messaging.stop();
    await tick();

    expect(aborted).toEqual(['first', 'second']);
    expect(events).toHaveLength(2);

    await Promise.all([firstSend, secondSend]);
  });

  it('returns to READY after stopping a turn that never began streaming', async () => {
    // A turn with no stream has nothing for the host to close out, so cancellation alone settles it.
    const { config } = createHangingSendConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const sendPromise = instance.send('Test message');
    await tick();

    await instance.messaging.stop();
    await sendPromise;

    expect(instance.messaging.getMessagesState().status).toBe(
      MessagesStatus.READY
    );
  });

  it('drives the same core path the built-in stop button uses', async () => {
    const { config, wasAborted } = createHangingSendConfig();
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);

    const stopStreaming = jest.spyOn(serviceManager.actions, 'stopStreaming');

    const sendPromise = instance.send('Test message');
    await tick();

    // The button handler in Input.tsx calls this exact action, so asserting stop() routes through
    // it is what keeps the two paths from diverging.
    await instance.messaging.stop();
    await sendPromise;

    expect(stopStreaming).toHaveBeenCalledTimes(1);
    expect(wasAborted()).toBe(true);
  });
});
