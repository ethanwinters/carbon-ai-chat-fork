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
} from '../../../test_helpers';
import {
  MessageResponse,
  MessageResponseTypes,
} from '../../../../src/types/messaging/Messages';
import { MessageState } from '../../../../src/types/config/MessagingConfig';
import { BusEventType } from '../../../../src/types/events/eventBusTypes';

function textResponse(id: string, text: string): MessageResponse {
  return {
    id,
    output: {
      generic: [{ response_type: MessageResponseTypes.TEXT, text }],
    },
  };
}

function userDefinedResponse(
  id: string,
  payload: Record<string, unknown>
): MessageResponse {
  return {
    id,
    output: {
      generic: [
        {
          response_type: MessageResponseTypes.USER_DEFINED,
          user_defined: payload,
        },
      ],
    },
  };
}

describe('ChatInstance.messaging.upsertMessage', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should expose upsertMessage as a function on instance.messaging', async () => {
    const config = createBaseConfig();
    const instance = await renderChatAndGetInstance(config);
    expect(typeof instance.messaging.upsertMessage).toBe('function');
  });

  describe('store integration', () => {
    it('inserts a brand-new message via upsert', async () => {
      const config = createBaseConfig();
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.upsertMessage(
        'upsert-1',
        MessageState.COMPLETE,
        () => textResponse('upsert-1', 'hello')
      );

      const state = store.getState();
      expect(state.allMessagesByID['upsert-1']).toBeDefined();
      expect(
        (state.allMessagesByID['upsert-1'] as any).output.generic[0].text
      ).toBe('hello');
    });

    it('updates the stored message text on a follow-up COMPLETE upsert', async () => {
      const config = createBaseConfig();
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.upsertMessage('u2', MessageState.STREAMING, () =>
        textResponse('u2', 'v1')
      );
      await instance.messaging.upsertMessage('u2', MessageState.COMPLETE, () =>
        textResponse('u2', 'v2')
      );

      const state = store.getState();
      expect((state.allMessagesByID['u2'] as any).output.generic[0].text).toBe(
        'v2'
      );
    });
  });

  describe('pre:receive / receive firing predicate', () => {
    it('fires pre:receive and receive on undefined → COMPLETE', async () => {
      const config = createBaseConfig();
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const preReceive = jest.fn();
      const receive = jest.fn();
      instance.on([
        { type: BusEventType.PRE_RECEIVE, handler: preReceive },
        { type: BusEventType.RECEIVE, handler: receive },
      ]);

      await instance.messaging.upsertMessage('u3', MessageState.COMPLETE, () =>
        textResponse('u3', 'done')
      );

      expect(preReceive).toHaveBeenCalledTimes(1);
      expect(receive).toHaveBeenCalledTimes(1);
    });

    it('does not fire on STREAMING; fires once on the final COMPLETE', async () => {
      const config = createBaseConfig();
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const preReceive = jest.fn();
      const receive = jest.fn();
      instance.on([
        { type: BusEventType.PRE_RECEIVE, handler: preReceive },
        { type: BusEventType.RECEIVE, handler: receive },
      ]);

      await instance.messaging.upsertMessage('u4', MessageState.STREAMING, () =>
        textResponse('u4', 'a')
      );
      await instance.messaging.upsertMessage('u4', MessageState.STREAMING, () =>
        textResponse('u4', 'ab')
      );
      expect(preReceive).not.toHaveBeenCalled();
      expect(receive).not.toHaveBeenCalled();

      await instance.messaging.upsertMessage('u4', MessageState.COMPLETE, () =>
        textResponse('u4', 'abc')
      );

      expect(preReceive).toHaveBeenCalledTimes(1);
      expect(receive).toHaveBeenCalledTimes(1);
    });

    it('does not fire when upserting COMPLETE onto an already-COMPLETE message produced by addMessage', async () => {
      const config = createBaseConfig();
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage(textResponse('u5', 'v1'));

      const preReceive = jest.fn();
      const receive = jest.fn();
      instance.on([
        { type: BusEventType.PRE_RECEIVE, handler: preReceive },
        { type: BusEventType.RECEIVE, handler: receive },
      ]);

      await instance.messaging.upsertMessage('u5', MessageState.COMPLETE, () =>
        textResponse('u5', 'v2')
      );

      expect(preReceive).not.toHaveBeenCalled();
      expect(receive).not.toHaveBeenCalled();
    });
  });

  describe('USER_DEFINED_RESPONSE event integration', () => {
    it('fires USER_DEFINED_RESPONSE with the state from the upsert call', async () => {
      const config = createBaseConfig();
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const handler = jest.fn();
      instance.on({
        type: BusEventType.USER_DEFINED_RESPONSE,
        handler,
      });

      await instance.messaging.upsertMessage('u6', MessageState.STREAMING, () =>
        userDefinedResponse('u6', { foo: 'bar' })
      );

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe(BusEventType.USER_DEFINED_RESPONSE);
      expect(event.data.state).toBe(MessageState.STREAMING);
    });

    it('populates state on USER_DEFINED_RESPONSE fired from addMessage with MessageState.COMPLETE', async () => {
      const config = createBaseConfig();
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const handler = jest.fn();
      instance.on({
        type: BusEventType.USER_DEFINED_RESPONSE,
        handler,
      });

      await instance.messaging.addMessage(
        userDefinedResponse('u7', { foo: 'bar' })
      );

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.data.state).toBe(MessageState.COMPLETE);
    });

    it('does NOT re-fire USER_DEFINED_RESPONSE when the item is deep-equal across upserts', async () => {
      const config = createBaseConfig();
      const { instance } = await renderChatAndGetInstanceWithStore(config);

      const handler = jest.fn();
      instance.on({
        type: BusEventType.USER_DEFINED_RESPONSE,
        handler,
      });

      const payload = { foo: 'bar' };
      await instance.messaging.upsertMessage('u8', MessageState.STREAMING, () =>
        userDefinedResponse('u8', payload)
      );
      expect(handler).toHaveBeenCalledTimes(1);

      // Same payload again — coordinator should detect that LocalMessageItem reference
      // was reused and suppress the event.
      await instance.messaging.upsertMessage('u8', MessageState.STREAMING, () =>
        userDefinedResponse('u8', payload)
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('input validation', () => {
    it('rejects with TypeError when updater returns undefined', async () => {
      const config = createBaseConfig();
      const instance = await renderChatAndGetInstance(config);
      const badUpdater = ((): undefined => undefined) as any;
      await expect(
        instance.messaging.upsertMessage(
          'u9',
          MessageState.COMPLETE,
          badUpdater
        )
      ).rejects.toThrow(TypeError);
    });

    it('rejects when updater returns a message with a mismatched id', async () => {
      const config = createBaseConfig();
      const instance = await renderChatAndGetInstance(config);
      await expect(
        instance.messaging.upsertMessage('u10', MessageState.COMPLETE, () =>
          textResponse('not-u10', '')
        )
      ).rejects.toThrow(/but call was for/i);
    });

    it('assigns messageID when the returned message has no id', async () => {
      const config = createBaseConfig();
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(config);
      await instance.messaging.upsertMessage(
        'u11',
        MessageState.COMPLETE,
        () => ({
          output: {
            generic: [{ response_type: MessageResponseTypes.TEXT, text: 'hi' }],
          },
        })
      );
      const state = store.getState();
      expect(state.allMessagesByID['u11']).toBeDefined();
    });
  });

  describe('stop streaming button', () => {
    function cancellableResponse(id: string, text: string): MessageResponse {
      return {
        id,
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.TEXT,
              text,
              streaming_metadata: { id: '1', cancellable: true },
            },
          ],
        },
      };
    }

    const isVisible = (store: { getState: () => any }) =>
      store.getState().assistantInputState.stopStreamingButtonState.isVisible;

    it('shows the button on a cancellable streaming upsert', async () => {
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      expect(isVisible(store)).toBe(false);

      await instance.messaging.upsertMessage(
        'stop-1',
        MessageState.STREAMING,
        () => cancellableResponse('stop-1', 'partial')
      );

      expect(isVisible(store)).toBe(true);
    });

    it('hides the button once the message completes', async () => {
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.upsertMessage(
        'stop-2',
        MessageState.STREAMING,
        () => cancellableResponse('stop-2', 'partial')
      );
      expect(isVisible(store)).toBe(true);

      await instance.messaging.upsertMessage(
        'stop-2',
        MessageState.COMPLETE,
        () => cancellableResponse('stop-2', 'all of it')
      );

      expect(isVisible(store)).toBe(false);
    });

    it('hides the button when the message errors', async () => {
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.upsertMessage(
        'stop-3',
        MessageState.STREAMING,
        () => cancellableResponse('stop-3', 'partial')
      );
      expect(isVisible(store)).toBe(true);

      await instance.messaging.upsertMessage('stop-3', MessageState.ERROR, () =>
        cancellableResponse('stop-3', 'partial')
      );

      expect(isVisible(store)).toBe(false);
    });

    it('leaves the button hidden when the message is not cancellable', async () => {
      const { instance, store } =
        await renderChatAndGetInstanceWithStore(createBaseConfig());

      await instance.messaging.upsertMessage(
        'stop-4',
        MessageState.STREAMING,
        () => textResponse('stop-4', 'partial')
      );

      expect(isVisible(store)).toBe(false);
    });

    describe('with more than one message streaming', () => {
      it('keeps the button visible when one of two streams completes', async () => {
        const { instance, store } =
          await renderChatAndGetInstanceWithStore(createBaseConfig());

        await instance.messaging.upsertMessage(
          'multi-a',
          MessageState.STREAMING,
          () => cancellableResponse('multi-a', 'a partial')
        );
        await instance.messaging.upsertMessage(
          'multi-b',
          MessageState.STREAMING,
          () => cancellableResponse('multi-b', 'b partial')
        );
        expect(isVisible(store)).toBe(true);

        await instance.messaging.upsertMessage(
          'multi-a',
          MessageState.COMPLETE,
          () => cancellableResponse('multi-a', 'a done')
        );

        // multi-b is still streaming, so the affordance has to survive.
        expect(isVisible(store)).toBe(true);

        await instance.messaging.upsertMessage(
          'multi-b',
          MessageState.COMPLETE,
          () => cancellableResponse('multi-b', 'b done')
        );

        expect(isVisible(store)).toBe(false);
      });

      it('keeps the button visible when one of two streams errors', async () => {
        const { instance, store } =
          await renderChatAndGetInstanceWithStore(createBaseConfig());

        await instance.messaging.upsertMessage(
          'multi-err-a',
          MessageState.STREAMING,
          () => cancellableResponse('multi-err-a', 'a partial')
        );
        await instance.messaging.upsertMessage(
          'multi-err-b',
          MessageState.STREAMING,
          () => cancellableResponse('multi-err-b', 'b partial')
        );

        await instance.messaging.upsertMessage(
          'multi-err-a',
          MessageState.ERROR,
          () => cancellableResponse('multi-err-a', 'a failed')
        );

        expect(isVisible(store)).toBe(true);

        await instance.messaging.upsertMessage(
          'multi-err-b',
          MessageState.ERROR,
          () => cancellableResponse('multi-err-b', 'b failed')
        );

        expect(isVisible(store)).toBe(false);
      });

      it('does not strand the button when a terminal upsert throws', async () => {
        const { instance, store } =
          await renderChatAndGetInstanceWithStore(createBaseConfig());

        await instance.messaging.upsertMessage(
          'throw-a',
          MessageState.STREAMING,
          () => cancellableResponse('throw-a', 'a partial')
        );
        await instance.messaging.upsertMessage(
          'throw-b',
          MessageState.STREAMING,
          () => cancellableResponse('throw-b', 'b partial')
        );

        await expect(
          instance.messaging.upsertMessage(
            'throw-a',
            MessageState.COMPLETE,
            () =>
              // Returning the wrong id makes the coordinator reject.
              cancellableResponse('a-different-id', 'nope')
          )
        ).rejects.toThrow();

        // throw-a never settled, so it stays registered and holds the button up.
        expect(isVisible(store)).toBe(true);

        // The surviving stream completing must still be able to hide it once throw-a
        // is dropped, so removing throw-a has to drain its registration too.
        await instance.messaging.removeMessages(['throw-a']);
        await instance.messaging.upsertMessage(
          'throw-b',
          MessageState.COMPLETE,
          () => cancellableResponse('throw-b', 'b done')
        );

        expect(isVisible(store)).toBe(false);
      });

      it('drains streaming registrations on conversation restart', async () => {
        const { instance, store } =
          await renderChatAndGetInstanceWithStore(createBaseConfig());

        await instance.messaging.upsertMessage(
          'restart-a',
          MessageState.STREAMING,
          () => cancellableResponse('restart-a', 'partial')
        );
        expect(isVisible(store)).toBe(true);

        await instance.messaging.restartConversation();
        expect(isVisible(store)).toBe(false);

        // A fresh stream after the restart must still hide on its own completion —
        // proves restart-a's registration did not survive.
        await instance.messaging.upsertMessage(
          'restart-b',
          MessageState.STREAMING,
          () => cancellableResponse('restart-b', 'partial')
        );
        expect(isVisible(store)).toBe(true);

        await instance.messaging.upsertMessage(
          'restart-b',
          MessageState.COMPLETE,
          () => cancellableResponse('restart-b', 'done')
        );
        expect(isVisible(store)).toBe(false);
      });
    });

    describe('mixed with addMessageChunk', () => {
      const partialChunk = (responseId: string) => ({
        streaming_metadata: { response_id: responseId },
        partial_item: {
          streaming_metadata: { id: `${responseId}-item`, cancellable: true },
          response_type: MessageResponseTypes.TEXT,
          text: 'chunk partial ',
        },
      });

      const finalChunk = (responseId: string) => ({
        final_response: {
          id: responseId,
          output: {
            generic: [
              {
                streaming_metadata: { id: `${responseId}-item` },
                response_type: MessageResponseTypes.TEXT,
                text: 'chunk done',
              },
            ],
          },
        },
      });

      it('keeps the button visible when the chunk stream finishes first', async () => {
        const { instance, store } =
          await renderChatAndGetInstanceWithStore(createBaseConfig());

        await instance.messaging.addMessageChunk(partialChunk('mix-c1') as any);
        await instance.messaging.upsertMessage(
          'mix-u1',
          MessageState.STREAMING,
          () => cancellableResponse('mix-u1', 'upsert partial')
        );
        expect(isVisible(store)).toBe(true);

        await instance.messaging.addMessageChunk(finalChunk('mix-c1') as any);

        // The upsert stream is still running.
        expect(isVisible(store)).toBe(true);

        await instance.messaging.upsertMessage(
          'mix-u1',
          MessageState.COMPLETE,
          () => cancellableResponse('mix-u1', 'upsert done')
        );

        expect(isVisible(store)).toBe(false);
      });

      it('keeps the button visible when the upsert stream finishes first', async () => {
        const { instance, store } =
          await renderChatAndGetInstanceWithStore(createBaseConfig());

        await instance.messaging.addMessageChunk(partialChunk('mix-c2') as any);
        await instance.messaging.upsertMessage(
          'mix-u2',
          MessageState.STREAMING,
          () => cancellableResponse('mix-u2', 'upsert partial')
        );

        await instance.messaging.upsertMessage(
          'mix-u2',
          MessageState.COMPLETE,
          () => cancellableResponse('mix-u2', 'upsert done')
        );

        // The chunk stream is still running.
        expect(isVisible(store)).toBe(true);

        await instance.messaging.addMessageChunk(finalChunk('mix-c2') as any);

        expect(isVisible(store)).toBe(false);
      });
    });
  });
});
