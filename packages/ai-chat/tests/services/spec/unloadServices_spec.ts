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
  renderChatAndGetInstance,
  renderChatAndGetInstanceWithStore,
  setupBeforeEach,
  setupAfterEach,
} from '../../test_helpers';
import { MessageResponseTypes } from '../../../src/types/messaging/Messages';

describe('ChatInstance.destroy / unloadServices', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('exposes destroy alongside destroySession', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    expect(typeof instance.destroy).toBe('function');
    expect(typeof instance.destroySession).toBe('function');
  });

  it('tears down every service on destroy', async () => {
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());

    const clearBus = jest.spyOn(serviceManager.eventBus, 'clear');
    const stopWatching = jest.spyOn(
      serviceManager.themeWatcherService,
      'stopWatching'
    );
    const disposeMessages = jest.spyOn(
      serviceManager.messageService,
      'dispose'
    );
    const clearUpserts = jest.spyOn(
      serviceManager.messageUpsertCoordinator,
      'clearAll'
    );

    instance.destroy();

    expect(clearBus).toHaveBeenCalledTimes(1);
    expect(stopWatching).toHaveBeenCalledTimes(1);
    expect(disposeMessages).toHaveBeenCalledTimes(1);
    expect(clearUpserts).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — a second destroy tears nothing down again and does not throw', async () => {
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());

    const clearBus = jest.spyOn(serviceManager.eventBus, 'clear');

    instance.destroy();
    expect(clearBus).toHaveBeenCalledTimes(1);

    expect(() => instance.destroy()).not.toThrow();
    expect(clearBus).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes every captured store subscription on teardown', async () => {
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());

    // Boot registers five store subscriptions: four from loadServices (copy-to-session-storage,
    // fire-state-change, refresh-localization, and the theme watcher) plus the messages-state
    // reduction registered by `attachMessagesStateTracking`. The exposed serviceManager shares the
    // same `storeUnsubscribers` array as the live manager, so mutate it in place to wrap each
    // handle (reassigning would only swap this copy's reference).
    const handles = serviceManager.storeUnsubscribers;
    expect(handles).toHaveLength(5);
    const wrapped = handles.map((unsubscribe) => jest.fn(unsubscribe));
    handles.length = 0;
    handles.push(...wrapped);

    instance.destroy();

    wrapped.forEach((unsubscribe) =>
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    );
  });

  it('clears a pending stop diagnostic so no warning fires after teardown', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const config = createBaseConfig();
      config.debug = true;
      config.messaging = {
        customSendMessage: async (_message, { signal }) => {
          await new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve());
          });
        },
      };

      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      const sendPromise = instance.messaging.send('Test message');
      await new Promise((resolve) => setTimeout(resolve, 50));

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

      // The armed handle is only reachable on the actions instance, and asserting on it is what
      // proves a diagnostic was actually pending when destroy ran.
      const pending = (serviceManager.actions as any)
        .stoppedStreamDiagnosticTimeouts as Set<unknown>;
      expect(pending.size).toBe(1);

      instance.destroy();
      expect(pending.size).toBe(0);

      // Past the diagnostic's own deadline: a cleared timer cannot blame the host's
      // customSendMessage for a chat that no longer exists.
      await new Promise((resolve) => setTimeout(resolve, 2500));

      expect(
        warn.mock.calls.some(([message]) =>
          String(message).includes('still streaming after')
        )
      ).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });
});
