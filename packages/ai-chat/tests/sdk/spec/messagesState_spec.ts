/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { waitFor } from '@testing-library/react';

import {
  createBaseConfig,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from '../../test_helpers';
import { attachMessagesStateTracking } from '../../../src/chat/sdk/messagesState';
import { BusEventType } from '../../../src/types/events/eventBusTypes';
import { MessagesStatus } from '../../../src/types/messaging/MessagesState';
import { MessageErrorState } from '../../../src/types/messaging/LocalMessageItem';
import { MessageResponseTypes } from '../../../src/types/messaging/Messages';
import actions from '../../../src/chat/store/actions';

describe('attachMessagesStateTracking', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('is idempotent: a second attach on the same manager returns the same object', async () => {
    const { serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());

    const first = serviceManager.messagesState;
    const second = attachMessagesStateTracking(serviceManager);

    expect(second).toBe(first);
  });

  it('registers exactly one app-store subscription, captured for teardown', () => {
    // Against a stub rather than a booted chat: boot has already attached, so re-attaching there only
    // exercises the idempotency early-return the test above already covers, and says nothing about
    // what a *first* attach registers.
    const unsubscribe = jest.fn();
    const subscribe = jest.fn().mockReturnValue(unsubscribe);
    const serviceManager = {
      store: {
        subscribe,
        getState: (): any => ({
          allMessagesByID: {},
          allMessageItemsByID: {},
          assistantMessageState: {
            localMessageIDs: [] as string[],
            messageIDs: [] as string[],
            activeResponseId: null,
            isMessageLoadingCounter: 0,
            inFlightRequestCounter: 0,
            isHydratingCounter: 0,
          },
        }),
      },
      storeUnsubscribers: [] as (() => void)[],
      eventBus: { fireSync: jest.fn() },
    } as any;

    attachMessagesStateTracking(serviceManager);

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(serviceManager.storeUnsubscribers).toHaveLength(1);
    expect(serviceManager.storeUnsubscribers[0]).toBe(unsubscribe);
  });

  describe('messages', () => {
    it('strips internal fields from seeded history', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.insertHistory([
        {
          message: {
            id: 'req-1',
            input: { text: 'hi', message_type: 'text' } as any,
          },
          time: new Date().toISOString(),
        },
        {
          message: {
            id: 'resp-1',
            output: {
              generic: [
                { response_type: MessageResponseTypes.TEXT, text: 'hello' },
              ],
            },
          },
          time: new Date().toISOString(),
        },
      ]);

      const messages = serviceManager.messagesState.getMessagesState().messages;
      expect(messages.map((message) => message.id)).toEqual([
        'req-1',
        'resp-1',
      ]);

      const request = messages.find((message) => message.id === 'req-1');
      const response = messages.find((message) => message.id === 'resp-1');

      expect(request).not.toHaveProperty('ui_state_internal');
      expect(response).not.toHaveProperty('ui_state_internal');
      expect((response as any).output.generic[0].text).toBe('hello');
    });

    it('orders a send and its response oldest first', async () => {
      let sentRequestID: string;
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: async (
          request: any,
          _options: any,
          chatInstance: any
        ) => {
          sentRequestID = request.id;
          await chatInstance.messaging.addMessage({
            id: 'round-trip-response',
            output: {
              generic: [
                { response_type: MessageResponseTypes.TEXT, text: 'hello' },
              ],
            },
          });
        },
      };
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.send('a message');

      expect(
        serviceManager.messagesState
          .getMessagesState()
          .messages.map((message) => message.id)
      ).toEqual([sentRequestID, 'round-trip-response']);
    });

    it('keeps unrelated messages reference-stable across an unrelated CHANGE_STATE dispatch', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.insertHistory([
        {
          message: {
            id: 'stable-req',
            input: { text: 'hi', message_type: 'text' } as any,
          },
          time: new Date().toISOString(),
        },
      ]);

      const before = serviceManager.messagesState.getMessagesState().messages;

      // An unrelated CHANGE_STATE dispatch deep-clones the whole tree (reducers.ts CHANGE_STATE),
      // handing allMessagesByID/assistantMessageState fresh-but-equal references — the derivation
      // must fall back to a content compare rather than rebuild.
      store.dispatch(actions.changeState({ chatWidth: 999 } as any));

      expect(serviceManager.messagesState.getMessagesState().messages).toBe(
        before
      );
    });

    it('keeps other turns reference-stable while one response streams', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'unrelated-response',
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: 'unrelated' },
          ],
        },
      });

      const beforeStreaming =
        serviceManager.messagesState.getMessagesState().messages;
      const unrelatedBefore = beforeStreaming.find(
        (message) => message.id === 'unrelated-response'
      );

      const responseID = 'streaming-response';
      const chunks = ['Hello ', 'world', '!'];
      for (const text of chunks) {
        // eslint-disable-next-line no-await-in-loop
        await instance.messaging.addMessageChunk({
          streaming_metadata: { response_id: responseID },
          partial_item: {
            streaming_metadata: { id: 'item-1' },
            response_type: MessageResponseTypes.TEXT,
            text,
          },
        });

        const unrelatedNow = serviceManager.messagesState
          .getMessagesState()
          .messages.find((message) => message.id === 'unrelated-response');
        expect(unrelatedNow).toBe(unrelatedBefore);
      }
    });
  });

  describe('items that never render', () => {
    // A `pause` and a silent `user_defined` are instructions, not content: neither is ever given a
    // local message item, so they live only on the stored message. They are still part of the host's
    // own message, and whether a sibling happens to render must not decide if they survive. Each
    // case waits for the sibling to land first — `receive` does not await `processMessageResponse`,
    // so reading before it does would pass for the wrong reason.

    it('keeps a pause item beside a rendered sibling, in the order the host sent them', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'paused-response',
        output: {
          generic: [
            { response_type: MessageResponseTypes.PAUSE, time: 1 },
            { response_type: MessageResponseTypes.TEXT, text: 'after' },
          ],
        },
      } as any);
      await waitFor(() =>
        expect(
          store.getState().assistantMessageState.localMessageIDs
        ).toHaveLength(1)
      );

      const response = serviceManager.messagesState.getMessage(
        'paused-response'
      ) as any;
      expect(
        response.output.generic.map((item: any) => item.response_type)
      ).toEqual([MessageResponseTypes.PAUSE, MessageResponseTypes.TEXT]);
      expect(response.output.generic[1].text).toBe('after');
    });

    it('keeps a silent user_defined item beside a rendered sibling', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'silent-mixed-response',
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.USER_DEFINED,
              user_defined: { silent: true },
            },
            { response_type: MessageResponseTypes.TEXT, text: 'visible' },
          ],
        },
      } as any);
      await waitFor(() =>
        expect(
          store.getState().assistantMessageState.localMessageIDs
        ).toHaveLength(1)
      );

      const response = serviceManager.messagesState.getMessage(
        'silent-mixed-response'
      ) as any;
      expect(
        response.output.generic.map((item: any) => item.response_type)
      ).toEqual([MessageResponseTypes.USER_DEFINED, MessageResponseTypes.TEXT]);
      expect(response.output.generic[1].text).toBe('visible');
    });

    it('keeps a response whose every item is hidden', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'all-hidden-response',
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.USER_DEFINED,
              user_defined: { silent: true, payload: 'kept' },
            },
          ],
        },
      } as any);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        store.getState().assistantMessageState.localMessageIDs
      ).toHaveLength(0);
      const response = serviceManager.messagesState.getMessage(
        'all-hidden-response'
      ) as any;
      expect(response.output.generic).toHaveLength(1);
      expect(response.output.generic[0].user_defined.payload).toBe('kept');
    });

    it('materializes the streamed item and keeps a pause the final response carries', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      const responseID = 'paused-stream';
      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        partial_item: {
          streaming_metadata: { id: 'item-1' },
          response_type: MessageResponseTypes.TEXT,
          text: 'streamed',
        },
      });

      // Mid-stream the stored `output.generic` is still the empty placeholder, so the local item is
      // the only source of content.
      expect(
        (serviceManager.messagesState.getMessage(responseID) as any).output
          .generic[0].text
      ).toBe('streamed');

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        final_response: {
          id: responseID,
          output: {
            generic: [
              { response_type: MessageResponseTypes.PAUSE, time: 1 },
              {
                streaming_metadata: { id: 'item-1' },
                response_type: MessageResponseTypes.TEXT,
                text: 'streamed final',
              },
            ],
          },
        },
      } as any);
      await waitFor(() =>
        expect(
          (
            store.getState().allMessageItemsByID[`${responseID}-item-1`]
              .item as any
          ).text
        ).toBe('streamed final')
      );

      const finalized = serviceManager.messagesState.getMessage(
        responseID
      ) as any;
      expect(
        finalized.output.generic.map((item: any) => item.response_type)
      ).toEqual([MessageResponseTypes.PAUSE, MessageResponseTypes.TEXT]);
      expect(finalized.output.generic[1].text).toBe('streamed final');
    });
  });

  describe('status', () => {
    it('is STREAMING while a response is mid-stream', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: 'streaming-status' },
        partial_item: {
          streaming_metadata: { id: 'item-1' },
          response_type: MessageResponseTypes.TEXT,
          text: 'partial',
        },
      });

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.STREAMING
      );
    });

    it('returns to READY once the response finalizes', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      const responseID = 'finalize-status';
      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        partial_item: {
          streaming_metadata: { id: 'item-1' },
          response_type: MessageResponseTypes.TEXT,
          text: 'partial',
        },
      });
      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.STREAMING
      );

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        final_response: {
          id: responseID,
          output: {
            generic: [
              {
                response_type: MessageResponseTypes.TEXT,
                text: 'partial done',
              },
            ],
          },
        },
      } as any);

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.READY
      );
    });
  });

  describe('error', () => {
    it('reports a catastrophic error and takes precedence over a message error', async () => {
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: async () => {
          throw new Error('backend exploded');
        },
      };
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.send('a message').catch(() => {});
      expect(
        serviceManager.messagesState.getMessagesState().error
      ).toMatchObject({
        kind: 'message',
      });

      instance.updateCatastrophicErrorPanel({
        isOpen: true,
        title: 'Catastrophic',
        bodyText: 'Cannot recover',
      });

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.ERROR
      );
      expect(serviceManager.messagesState.getMessagesState().error).toEqual({
        kind: 'catastrophic',
        title: 'Catastrophic',
        bodyText: 'Cannot recover',
      });
    });

    it('maps RETRYING on the latest request to SUBMITTED, not ERROR', async () => {
      // RETRYING is written by the human-agent send path when the service desk has not confirmed
      // yet, and like every error state it lands on the request, not the response.
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.send('a message');
      const { messageIDs } = store.getState().assistantMessageState;
      const requestID = messageIDs[messageIDs.length - 1];

      store.dispatch(
        actions.setMessageErrorState(requestID, MessageErrorState.RETRYING)
      );

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.SUBMITTED
      );
      expect(serviceManager.messagesState.getMessagesState().error).toBeNull();
    });

    it('reports ERROR when a real customSendMessage rejection fails the turn', async () => {
      // The failure path production actually takes: nothing marks the *response* failed, so a
      // response-keyed lookup alone reports READY while the request carries FAILED.
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: async () => {
          throw new Error('backend exploded');
        },
      };
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.send('a message').catch(() => {});

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.ERROR
      );
      const error = serviceManager.messagesState.getMessagesState().error;
      expect(error).toMatchObject({
        kind: 'message',
        errorState: MessageErrorState.FAILED,
      });
      // The named turn is one the host can find in the snapshot.
      const named = instance.messaging.getMessage((error as any).messageID);
      expect(named).toBeDefined();
    });

    it('clears the error once a later turn supersedes the failed one', async () => {
      let shouldFail = true;
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: async () => {
          if (shouldFail) {
            throw new Error('backend exploded');
          }
        },
      };
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.send('first').catch(() => {});
      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.ERROR
      );

      shouldFail = false;
      await instance.send('second');

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.READY
      );
      expect(serviceManager.messagesState.getMessagesState().error).toBeNull();
    });

    it('reports a failed silent request, which stays in the snapshot', async () => {
      // `history.silent` hides a turn from the transcript; it does not remove it from the
      // conversation. A host that sent one still needs to hear that it failed.
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: async () => {
          throw new Error('backend exploded');
        },
      };
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.send('quiet message', { silent: true }).catch(() => {});

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.ERROR
      );
      const { error } = serviceManager.messagesState.getMessagesState();
      expect(
        instance.messaging
          .getMessagesState()
          .messages.some((message) => message.id === (error as any).messageID)
      ).toBe(true);
    });
  });

  describe('status while a request is in flight', () => {
    /** A host that never settles, so a turn can be observed mid-flight. */
    function createHangingConfig(loadingTimeoutSecs?: number) {
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: () => new Promise<void>(() => {}),
      };
      if (loadingTimeoutSecs !== undefined) {
        config.messaging.messageLoadingIndicatorTimeoutSecs =
          loadingTimeoutSecs;
      }
      return config;
    }

    it('reports SUBMITTED as soon as a request is in flight', async () => {
      // Not after the silent-loading delay elapses: that timer decides whether to draw a spinner,
      // which is a different question from whether a request is outstanding.
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createHangingConfig());

      instance.send('a message');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.SUBMITTED
      );
    });

    it('reports SUBMITTED even when the loading indicator is disabled', async () => {
      // With the timer off, the loading counter never rises at all, so a derivation keyed to it
      // would report READY for the entire turn.
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createHangingConfig(0));

      instance.send('a message');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.SUBMITTED
      );
    });

    it('counts every queued request, and stopping one leaves the rest in flight', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createHangingConfig());

      instance.send('first');
      instance.send('second');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        store.getState().assistantMessageState.inFlightRequestCounter
      ).toBe(2);
      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.SUBMITTED
      );

      // stop() cancels the active turn only — the queued message behind it still sends — so the
      // conversation is legitimately still SUBMITTED afterwards.
      await instance.messaging.stop();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        store.getState().assistantMessageState.inFlightRequestCounter
      ).toBe(1);
      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.SUBMITTED
      );
    });

    it('does not fall back to SUBMITTED once the stream has produced content', async () => {
      // The window between the last chunk and `customSendMessage` resolving: every item reports
      // `isDone`, so the turn is no longer STREAMING, but the request is still in flight. Falling
      // through to SUBMITTED there contradicts what it documents ("no content has appeared yet")
      // and flashes any host indicator keyed to it at the tail of every streamed turn.
      const responseID = 'stream-then-hang';
      const config = createBaseConfig();
      config.messaging = {
        customSendMessage: async (
          _request: any,
          _options: any,
          chatInstance: any
        ) => {
          await chatInstance.messaging.addMessageChunk({
            streaming_metadata: { response_id: responseID },
            partial_item: {
              streaming_metadata: { id: 'item-1' },
              response_type: MessageResponseTypes.TEXT,
              text: 'hello ',
            },
          });
          await chatInstance.messaging.addMessageChunk({
            streaming_metadata: { response_id: responseID },
            complete_item: {
              streaming_metadata: { id: 'item-1' },
              response_type: MessageResponseTypes.TEXT,
              text: 'hello world',
            },
          } as any);
          // Never settles: holds the request in flight after the stream has finished.
          return new Promise<void>(() => {});
        },
      };

      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(config);

      const seen: MessagesStatus[] = [];
      const handler = (event: any) => seen.push(event.newState.status);
      instance.on({ type: BusEventType.MESSAGES_STATE_CHANGE, handler });

      instance.messaging.send('a message');
      await new Promise((resolve) => setTimeout(resolve, 100));
      instance.off({ type: BusEventType.MESSAGES_STATE_CHANGE, handler });

      // The turn really is still outstanding — this is the gap, not a settled request.
      expect(
        store.getState().assistantMessageState.inFlightRequestCounter
      ).toBe(1);
      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.READY
      );

      const streamingAt = seen.indexOf(MessagesStatus.STREAMING);
      expect(streamingAt).toBeGreaterThanOrEqual(0);
      expect(seen.slice(streamingAt)).not.toContain(MessagesStatus.SUBMITTED);
    });

    it('drains the counter back to zero when every request is cancelled', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createHangingConfig());

      instance.send('first');
      instance.send('second');
      await new Promise((resolve) => setTimeout(resolve, 50));

      await instance.messaging.restartConversation();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        store.getState().assistantMessageState.inFlightRequestCounter
      ).toBe(0);
      expect(serviceManager.messagesState.getMessagesState().status).toBe(
        MessagesStatus.READY
      );
    });
  });

  describe('snapshot isolation from the store', () => {
    it('hands out content the store does not share, after a stopped stream', async () => {
      // Reducers build streamed items unfrozen, and the snapshot reconstructs a streaming response
      // from them. Handing those objects out directly would let a consumer write straight into store
      // state — and into every cached snapshot built from it.
      const config = createBaseConfig();
      config.messaging = {
        showStopButtonImmediately: true,
        customSendMessage: async (_message: any, { signal }: any) => {
          await new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve());
          });
        },
      };
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(config);

      instance.send('a message');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const responseID = 'isolated-response';
      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        partial_item: {
          streaming_metadata: { id: 'item-1' },
          response_type: MessageResponseTypes.TEXT,
          text: 'streamed text',
        },
      } as any);

      await instance.messaging.stop();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const snapshotItem = (instance.messaging.getMessage(responseID) as any)
        .output.generic[0];
      const storeItem = Object.values(
        store.getState().allMessageItemsByID
      ).find((item: any) => item.fullMessageID === responseID) as any;

      expect(storeItem).toBeDefined();
      expect(snapshotItem).not.toBe(storeItem.item);
      expect(Object.isFrozen(snapshotItem)).toBe(true);
      expect(() => {
        snapshotItem.text = 'mutated';
      }).toThrow();
      expect(Object.isFrozen(storeItem.item)).toBe(false);
    });
  });

  describe('getMessage', () => {
    it('looks up a single message by id', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'lookup-me',
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: 'found me' },
          ],
        },
      });

      const found = serviceManager.messagesState.getMessage('lookup-me');
      expect(found).toBeDefined();
      expect((found as any).output.generic[0].text).toBe('found me');

      expect(
        serviceManager.messagesState.getMessage('no-such-id')
      ).toBeUndefined();
    });

    it('stops resolving a message once it is removed from the conversation', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'transient',
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: 'bye' }],
        },
      });
      expect(
        serviceManager.messagesState.getMessage('transient')
      ).toBeDefined();

      await instance.messaging.removeMessages(['transient']);

      expect(
        serviceManager.messagesState.getMessage('transient')
      ).toBeUndefined();
    });
  });

  describe('streaming content', () => {
    it('accumulates partial_item chunks into the public snapshot', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      const responseID = 'accumulating-response';
      const chunks = ['Hello ', 'world', '!'];
      let expected = '';
      for (const text of chunks) {
        // eslint-disable-next-line no-await-in-loop
        await instance.messaging.addMessageChunk({
          streaming_metadata: { response_id: responseID },
          partial_item: {
            streaming_metadata: { id: 'item-1' },
            response_type: MessageResponseTypes.TEXT,
            text,
          },
        });
        expected += text;

        const streaming = serviceManager.messagesState
          .getMessagesState()
          .messages.find((message) => message.id === responseID);
        expect((streaming as any).output.generic[0].text).toBe(expected);
      }

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseID },
        final_response: {
          id: responseID,
          output: {
            generic: [
              { response_type: MessageResponseTypes.TEXT, text: 'final text' },
            ],
          },
        },
      } as any);

      const finalized = serviceManager.messagesState
        .getMessagesState()
        .messages.find((message) => message.id === responseID);
      expect((finalized as any).output.generic[0].text).toBe('final text');
    });
  });

  describe('snapshot integrity', () => {
    it('returns the same snapshot object until something in it changes', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      const first = serviceManager.messagesState.getMessagesState();
      expect(serviceManager.messagesState.getMessagesState()).toBe(first);

      await instance.messaging.addMessage({
        id: 'snapshot-response',
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: 'new' }],
        },
      });

      const second = serviceManager.messagesState.getMessagesState();
      expect(second).not.toBe(first);
      expect(serviceManager.messagesState.getMessagesState()).toBe(second);
    });

    it('keeps the error object reference-stable across unrelated dispatches', async () => {
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      instance.updateCatastrophicErrorPanel({
        isOpen: true,
        title: 'Catastrophic',
        bodyText: 'Cannot recover',
      });
      const firstError = serviceManager.messagesState.getMessagesState().error;
      expect(firstError).not.toBeNull();

      store.dispatch(actions.changeState({ chatWidth: 999 } as any));

      expect(serviceManager.messagesState.getMessagesState().error).toBe(
        firstError
      );
    });

    it('freezes the snapshot layers it creates', async () => {
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.addMessage({
        id: 'frozen-response',
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: 'frozen' },
          ],
        },
      });

      const snapshot = serviceManager.messagesState.getMessagesState();
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.messages)).toBe(true);

      const response = snapshot.messages.find(
        (message) => message.id === 'frozen-response'
      ) as any;
      expect(Object.isFrozen(response)).toBe(true);
      expect(Object.isFrozen(response.output)).toBe(true);
      expect(Object.isFrozen(response.output.generic)).toBe(true);
    });
  });
});
