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
  setupAfterEach,
  setupBeforeEach,
} from '../../../test_helpers';
import { BusEventType } from '../../../../src/types/events/eventBusTypes';
import { MessagesStatus } from '../../../../src/types/messaging/MessagesState';
import { MessageResponseTypes } from '../../../../src/types/messaging/Messages';

describe('ChatInstance.messaging.getMessagesState / getMessage', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('exposes getMessagesState and getMessage as functions', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    expect(typeof instance.messaging.getMessagesState).toBe('function');
    expect(typeof instance.messaging.getMessage).toBe('function');
  });

  it('returns an empty, ready snapshot before any message is sent', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    const snapshot = instance.messaging.getMessagesState();

    expect(snapshot.messages).toEqual([]);
    expect(snapshot.status).toBe(MessagesStatus.READY);
    expect(snapshot.error).toBeNull();
  });

  it('reflects an added message in both getMessagesState and getMessage', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    await instance.messaging.addMessage({
      id: 'public-message-1',
      output: {
        generic: [
          { response_type: MessageResponseTypes.TEXT, text: 'hi there' },
        ],
      },
    });

    const snapshot = instance.messaging.getMessagesState();
    const viaGetMessage = instance.messaging.getMessage('public-message-1');

    expect(snapshot.messages.map((message) => message.id)).toContain(
      'public-message-1'
    );
    expect(viaGetMessage).toBeDefined();
    expect(viaGetMessage).toBe(
      snapshot.messages.find((message) => message.id === 'public-message-1')
    );
    expect(instance.messaging.getMessage('does-not-exist')).toBeUndefined();
  });

  it('fires MESSAGES_STATE_CHANGE when a message is added', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    const events: any[] = [];
    instance.on({
      type: BusEventType.MESSAGES_STATE_CHANGE,
      handler: (event) => {
        events.push(event);
      },
    });

    const before = instance.messaging.getMessagesState();

    await instance.messaging.addMessage({
      id: 'event-message-1',
      output: {
        generic: [
          { response_type: MessageResponseTypes.TEXT, text: 'event test' },
        ],
      },
    });

    expect(events.length).toBeGreaterThan(0);
    const lastEvent = events[events.length - 1];
    expect(lastEvent.type).toBe(BusEventType.MESSAGES_STATE_CHANGE);
    expect(lastEvent.newState).toBeDefined();
    expect(
      lastEvent.newState.messages.map((message: any) => message.id)
    ).toContain('event-message-1');
    expect(lastEvent.newState).toBe(instance.messaging.getMessagesState());

    // Identity, not just presence: `previousState` has to be the snapshot that was current before the
    // change, and consecutive events have to chain. Asserting only `toBeDefined` would pass even if
    // both fields pointed at the same object.
    expect(events[0].previousState).toBe(before);
    expect(events[0].previousState).not.toBe(events[0].newState);
    events.slice(1).forEach((event, index) => {
      expect(event.previousState).toBe(events[index].newState);
    });
  });

  it('does not fire MESSAGES_STATE_CHANGE for a change with no messaging effect', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    const events: any[] = [];
    instance.on({
      type: BusEventType.MESSAGES_STATE_CHANGE,
      handler: (event) => {
        events.push(event);
      },
    });

    // Unlike changeView (which can trigger the welcome-message flow on a fresh chat and
    // legitimately touch messaging state), this toggles a persisted flag with no messaging effect.
    instance.updateAssistantUnreadIndicatorVisibility(true);

    expect(events).toHaveLength(0);
  });

  it('does not extend getState()/PublicChatState with message data', async () => {
    const instance = await renderChatAndGetInstance(createBaseConfig());

    const messagesStateEvents: any[] = [];
    const stateChangeEvents: any[] = [];
    instance.on([
      {
        type: BusEventType.MESSAGES_STATE_CHANGE,
        handler: (event) => messagesStateEvents.push(event),
      },
      {
        type: BusEventType.STATE_CHANGE,
        handler: (event) => stateChangeEvents.push(event),
      },
    ]);

    await instance.messaging.addMessage({
      id: 'independence-check',
      output: {
        generic: [
          { response_type: MessageResponseTypes.TEXT, text: 'independent' },
        ],
      },
    });

    expect(messagesStateEvents.length).toBeGreaterThan(0);
    // isMessageLoadingCounter is legitimately shared between the two events (addMessage ends the
    // loading indicator), so STATE_CHANGE may also fire — but its PublicChatState payload must
    // never carry a `messages` field; that surface is MESSAGES_STATE_CHANGE-only.
    stateChangeEvents.forEach((event) => {
      expect(event.newState).not.toHaveProperty('messages');
      expect(event.previousState).not.toHaveProperty('messages');
    });
  });

  describe('declared no-op stubs', () => {
    // stop() is implemented — see stop_spec.ts. These two remain shape-only until #1823 and #1827.
    it('exposes regenerate and clearError without throwing', async () => {
      const instance = await renderChatAndGetInstance(createBaseConfig());

      await expect(
        instance.messaging.regenerate({ messageID: 'anything' })
      ).resolves.toBeUndefined();
      expect(() => instance.messaging.clearError()).not.toThrow();
    });
  });
});
