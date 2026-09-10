/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { ChatActionsImpl } from '../../../src/chat/services/ChatActionsImpl';
import { EventBus } from '../../../src/chat/events/EventBus';
import { ServiceManager } from '../../../src/chat/services/ServiceManager';
import {
  BusEvent,
  BusEventCustomRequestFooterSlot,
  BusEventType,
  MessageSendSource,
} from '../../../src/types/events/eventBusTypes';
import {
  HumanAgentMessageType,
  MessageInputType,
  MessageRequest,
} from '../../../src/types/messaging/Messages';

const createRequest = (text: string): MessageRequest => ({
  input: {
    message_type: MessageInputType.TEXT,
    text,
  },
});

/**
 * The narrowest store `ChatActionsImpl.send` reads through on the outbound path: the input slice it merges pending
 * structured data from, the human-agent slices the input selectors route on, and the two panels a send closes.
 */
const createServiceManagerStub = () => {
  const firedEvents: BusEvent[] = [];

  const state = {
    config: { public: {}, derived: {} },
    languagePack: {},
    assistantInputState: {
      pendingUploads: [] as unknown[],
      pendingStructuredData: null as unknown,
    },
    humanAgentState: {
      inputState: {
        pendingUploads: [] as unknown[],
        pendingStructuredData: null as unknown,
      },
      isConnecting: false,
      isReconnecting: false,
      isHumanAgentTyping: false,
    },
    persistedToBrowserStorage: {
      humanAgentState: { isSuspended: false, isConnected: false },
      homeScreenState: { isHomeScreenOpen: false },
    },
    responsePanelState: { isOpen: false },
  };

  const serviceManager = {
    store: {
      dispatch: jest.fn(),
      getState: () => state,
    },
    messageService: {
      send: jest.fn().mockResolvedValue(undefined),
    },
    fire: jest.fn(async (event: BusEvent) => {
      firedEvents.push(event);
    }),
  } as unknown as ServiceManager;

  return { serviceManager, firedEvents };
};

const footerEventsIn = (events: BusEvent[]) =>
  events.filter(
    (event) => event.type === BusEventType.CUSTOM_REQUEST_FOOTER_SLOT
  ) as BusEventCustomRequestFooterSlot[];

/**
 * `doSend` starts the footer fire without awaiting it, so the send resolves first. Await the chain's tail to reach
 * the point where every fire started so far has settled.
 */
const flushFooterFires = (chatActions: ChatActionsImpl) =>
  (chatActions as any).requestFooterFireChain as Promise<unknown>;

/**
 * A stub whose `fire` routes through a real EventBus, which refuses to start an event whose type is already running.
 * The jest.fn stub above cannot see that rule, so the concurrency case needs the real thing.
 */
const createServiceManagerStubWithRealBus = () => {
  const { serviceManager } = createServiceManagerStub();
  const eventBus = new EventBus();
  (serviceManager as any).fire = (event: BusEvent) =>
    eventBus.fire(event, {} as any);
  return { serviceManager, eventBus };
};

describe('custom request footer slot', () => {
  it('fires once per sent message with the request as payload', async () => {
    const { serviceManager, firedEvents } = createServiceManagerStub();
    const chatActions = new ChatActionsImpl(serviceManager);
    const message = createRequest('what is the weather?');

    await chatActions.send(message, MessageSendSource.MESSAGE_INPUT, {}, true);
    await flushFooterFires(chatActions);

    const footerEvents = footerEventsIn(firedEvents);
    expect(footerEvents).toHaveLength(1);
    expect(footerEvents[0].data.message).toBe(message);
    expect(footerEvents[0].data.message.input.text).toBe(
      'what is the weather?'
    );
    const [, , localMessageID] = (
      serviceManager.messageService.send as jest.Mock
    ).mock.calls[0];
    expect(footerEvents[0].data.slotName).toBe(
      `request-footer-${localMessageID}`
    );
  });

  it('sends the message even when a handler rejects', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const { serviceManager, eventBus } = createServiceManagerStubWithRealBus();
    const chatActions = new ChatActionsImpl(serviceManager);
    const seen: string[] = [];
    let failNext = true;

    eventBus.on({
      type: BusEventType.CUSTOM_REQUEST_FOOTER_SLOT,
      handler: async (event: any) => {
        if (failNext) {
          failNext = false;
          throw new Error('the host footer blew up');
        }
        seen.push(event.data.message.input.text);
      },
    });

    await chatActions.send(
      createRequest('hello'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );

    expect(serviceManager.messageService.send).toHaveBeenCalledTimes(1);

    // And the next send still fires: the chain recovers from a rejected tail.
    await chatActions.send(
      createRequest('again'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );
    await flushFooterFires(chatActions);

    expect(seen).toEqual(['again']);
    errorSpy.mockRestore();
  });

  it('does not wait for a handler that never settles', async () => {
    const { serviceManager, eventBus } = createServiceManagerStubWithRealBus();
    const chatActions = new ChatActionsImpl(serviceManager);

    eventBus.on({
      type: BusEventType.CUSTOM_REQUEST_FOOTER_SLOT,
      handler: (): Promise<void> => new Promise<void>(() => undefined),
    });

    // Both sends resolve even though the first handler never does.
    await chatActions.send(
      createRequest('hello'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );
    await chatActions.send(
      createRequest('again'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );

    expect(serviceManager.messageService.send).toHaveBeenCalledTimes(2);
  });

  it('hands the host a frozen message', async () => {
    const { serviceManager, firedEvents } = createServiceManagerStub();
    const chatActions = new ChatActionsImpl(serviceManager);

    await chatActions.send(
      createRequest('hello'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );

    await flushFooterFires(chatActions);

    expect(Object.isFrozen(footerEventsIn(firedEvents)[0].data.message)).toBe(
      true
    );
  });

  it('gives each message its own slot name', async () => {
    const { serviceManager, firedEvents } = createServiceManagerStub();
    const chatActions = new ChatActionsImpl(serviceManager);

    await chatActions.send(
      createRequest('first'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );
    await chatActions.send(
      createRequest('second'),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );

    await flushFooterFires(chatActions);

    const [first, second] = footerEventsIn(firedEvents);
    expect(first.data.slotName).not.toBe(second.data.slotName);
  });

  it('survives sends that overlap', async () => {
    const { serviceManager, eventBus } = createServiceManagerStubWithRealBus();
    const chatActions = new ChatActionsImpl(serviceManager);
    const seen: string[] = [];

    eventBus.on({
      type: BusEventType.CUSTOM_REQUEST_FOOTER_SLOT,
      handler: async (event: any) => {
        await Promise.resolve();
        seen.push(event.data.message.input.text);
      },
    });

    await Promise.all([
      chatActions.send(
        createRequest('first'),
        MessageSendSource.MESSAGE_INPUT,
        {},
        true
      ),
      chatActions.send(
        createRequest('second'),
        MessageSendSource.MESSAGE_INPUT,
        {},
        true
      ),
      chatActions.send(
        createRequest('third'),
        MessageSendSource.MESSAGE_INPUT,
        {},
        true
      ),
    ]);

    await flushFooterFires(chatActions);

    expect(seen).toEqual(['first', 'second', 'third']);
  });

  it('fires nothing for a silent message', async () => {
    const { serviceManager, firedEvents } = createServiceManagerStub();
    const chatActions = new ChatActionsImpl(serviceManager);

    await chatActions.send(
      createRequest('hello'),
      MessageSendSource.MESSAGE_INPUT,
      { silent: true },
      true
    );

    await flushFooterFires(chatActions);

    expect(footerEventsIn(firedEvents)).toHaveLength(0);
  });

  it('fires nothing for a message typed to a human agent', async () => {
    const { serviceManager, firedEvents } = createServiceManagerStub();
    const chatActions = new ChatActionsImpl(serviceManager);
    const message = createRequest('hello');
    message.input.agent_message_type = HumanAgentMessageType.FROM_USER;

    await chatActions.send(message, MessageSendSource.MESSAGE_INPUT, {}, true);

    await flushFooterFires(chatActions);

    expect(footerEventsIn(firedEvents)).toHaveLength(0);
  });

  it('fires nothing for a message with no bubble content', async () => {
    const { serviceManager, firedEvents } = createServiceManagerStub();
    const chatActions = new ChatActionsImpl(serviceManager);

    await chatActions.send(
      createRequest(''),
      MessageSendSource.MESSAGE_INPUT,
      {},
      true
    );

    await flushFooterFires(chatActions);

    expect(footerEventsIn(firedEvents)).toHaveLength(0);
  });
});
