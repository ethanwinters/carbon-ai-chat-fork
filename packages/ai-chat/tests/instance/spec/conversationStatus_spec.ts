/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { act } from '@testing-library/react';
import { resolvablePromise } from '../../../src/chat/utils/resolvablePromise';
import { MessageResponseTypes } from '../../../src/types/messaging/Messages';

import { OnErrorType } from '../../../src/types/config/ErrorConfig';
import { MessageState } from '../../../src/types/config/MessagingConfig';
import {
  createBaseConfig,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from '../../test_helpers';

describe('conversation status', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('starts ready and reports hydration until the shared operation finishes', async () => {
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());
    const lifecycle = serviceManager.conversationLifecycleService;

    expect(instance.getState().status).toBe('ready');

    let generation: number;
    act(() => {
      generation = lifecycle.hydrationStarted();
    });
    expect(instance.getState().status).toBe('loading');

    act(() => lifecycle.hydrationFinished(generation));
    expect(instance.getState().status).toBe('ready');
  });

  it('keeps overlapping responses streaming until every response finishes', async () => {
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());
    const lifecycle = serviceManager.conversationLifecycleService;

    act(() => {
      lifecycle.requestStarted('request-a');
    });
    expect(instance.getState().status).toBe('submitted');

    act(() => {
      lifecycle.responseStreaming('response-a');
      lifecycle.responseStreaming('response-b');
      lifecycle.requestFinished('request-a');
    });
    expect(instance.getState().status).toBe('streaming');

    act(() => lifecycle.responseFinished('response-a'));
    expect(instance.getState().status).toBe('streaming');

    act(() => lifecycle.responseFinished('response-b'));
    expect(instance.getState().status).toBe('ready');
  });

  it('publishes the exact frozen error before calling onError', async () => {
    let callbackState: ReturnType<
      Awaited<
        ReturnType<typeof renderChatAndGetInstanceWithStore>
      >['instance']['getState']
    >;
    const onError = jest.fn((error) => {
      callbackState = instance.getState();
      expect(callbackState.error).toBe(error);
      expect(callbackState.status).toBe('error');
    });
    const config = { ...createBaseConfig(), onError };
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);

    let publicError: unknown;
    act(() => {
      publicError = serviceManager.actions.conversationErrorOccurred({
        errorType: OnErrorType.MESSAGE_COMMUNICATION,
        message: 'send failed',
        messageID: 'request-a',
      });
    });

    expect(onError).toHaveBeenCalledWith(publicError);
    expect(instance.getState().error).toBe(publicError);
    expect(Object.isFrozen(publicError)).toBe(true);
  });

  it('keeps a rejected welcome send as one message error with its request ID', async () => {
    const onError = jest.fn();
    let welcomeRequestID: string;
    const customSendMessage = jest.fn(async (request) => {
      welcomeRequestID = request.id;
      throw new Error('welcome send failed');
    });
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore({
        ...createBaseConfig(),
        onError,
        messaging: {
          customLoadHistory: jest.fn().mockResolvedValue([]),
          customSendMessage,
        },
      });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await serviceManager.actions.hydrateChat();

    expect(customSendMessage).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(instance.state.get().status).toBe('error');
    expect(instance.state.get().error).toMatchObject({
      errorType: OnErrorType.MESSAGE_COMMUNICATION,
      messageID: welcomeRequestID,
    });
  });

  it('ignores stale completion and errors after restart', async () => {
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(createBaseConfig());
    const lifecycle = serviceManager.conversationLifecycleService;
    const staleGeneration = lifecycle.currentGeneration;

    act(() => {
      lifecycle.requestStarted('old-request', staleGeneration);
      lifecycle.restart(true);
      lifecycle.requestStarted('new-request');
      lifecycle.requestFinished('old-request', staleGeneration);
      lifecycle.fail(
        {
          errorType: OnErrorType.MESSAGE_COMMUNICATION,
          message: 'old failure',
          messageID: 'old-request',
        },
        staleGeneration
      );
    });

    expect(instance.getState().status).toBe('submitted');
    expect(instance.getState().error).toBeNull();
  });

  it('treats an ERROR upsert as terminal without reporting a global error', async () => {
    const onError = jest.fn();
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore({
        ...createBaseConfig(),
        onError,
      });

    act(() => {
      serviceManager.conversationLifecycleService.responseStreaming(
        'standalone-response'
      );
    });
    await instance.messaging.upsertMessage(
      'standalone-response',
      MessageState.ERROR,
      () => ({
        id: 'standalone-response',
        output: { generic: [] },
      })
    );

    expect(instance.getState().status).toBe('ready');
    expect(instance.getState().error).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });
  it('releases an awaited upsert stream when its send throws', async () => {
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (request, _options, instance) => {
        if (request.input.text === 'first') {
          await instance.messaging.upsertMessage(
            'response-a',
            MessageState.STREAMING,
            () => ({ id: 'response-a', output: { generic: [] } })
          );
          throw new Error('send failed');
        }
        await instance.messaging.upsertMessage(
          'response-b',
          MessageState.COMPLETE,
          () => ({ id: 'response-b', output: { generic: [] } })
        );
      },
    };
    const { instance } = await renderChatAndGetInstanceWithStore(config);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(instance.send('first')).rejects.toThrow('send failed');
    consoleError.mockRestore();
    await instance.send('second');

    expect(instance.state.get().status).toBe('ready');
  });

  it('releases an unawaited upsert that lands after its send throws', async () => {
    const release = resolvablePromise();
    let pendingUpsert: Promise<void>;
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (request, _options, instance) => {
        if (request.input.text === 'first') {
          pendingUpsert = instance.messaging.upsertMessage(
            'response-a',
            MessageState.STREAMING,
            async () => {
              await release;
              return { id: 'response-a', output: { generic: [] } };
            }
          );
          throw new Error('send failed');
        }
        await instance.messaging.upsertMessage(
          'response-b',
          MessageState.COMPLETE,
          () => ({ id: 'response-b', output: { generic: [] } })
        );
      },
    };
    const { instance } = await renderChatAndGetInstanceWithStore(config);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(instance.send('first')).rejects.toThrow('send failed');
    consoleError.mockRestore();
    await instance.send('second');
    release.doResolve();
    await pendingUpsert;

    expect(instance.state.get().status).toBe('ready');
  });

  it('releases an upsert stream when its send is canceled', async () => {
    const streaming = resolvablePromise();
    const release = resolvablePromise();
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (_request, _options, instance) => {
        await instance.messaging.upsertMessage(
          'response-a',
          MessageState.STREAMING,
          () => ({ id: 'response-a', output: { generic: [] } })
        );
        streaming.doResolve();
        await release;
      },
    };
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);
    const pendingSend = instance.send('first');
    await streaming;
    expect(instance.state.get().status).toBe('streaming');

    await serviceManager.messageService.cancelCurrentMessageRequest();
    release.doResolve();
    await pendingSend;

    expect(instance.state.get().status).toBe('ready');
  });

  it('releases both chunk and upsert streams when their send is canceled', async () => {
    const streaming = resolvablePromise();
    const release = resolvablePromise();
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (request, _options, instance) => {
        await instance.messaging.addMessageChunk({
          streaming_metadata: {
            response_id: 'chunk-response',
            request_id: request.id,
          },
          partial_item: {
            response_type: MessageResponseTypes.TEXT,
            text: 'partial',
            streaming_metadata: { id: 'text', cancellable: true },
          },
        });
        await instance.messaging.upsertMessage(
          'upsert-response',
          MessageState.STREAMING,
          () => ({ id: 'upsert-response', output: { generic: [] } })
        );
        streaming.doResolve();
        await release;
      },
    };
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);
    const pendingSend = instance.send('first');
    await streaming;

    await serviceManager.messageService.cancelCurrentMessageRequest();
    release.doResolve();
    await pendingSend;

    expect(instance.state.get().status).toBe('ready');
  });

  it('keeps a settled request stream alive when another send fails', async () => {
    const started = resolvablePromise();
    const release = resolvablePromise();
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (request, _options, instance) => {
        if (request.input.text === 'first') {
          await instance.messaging.upsertMessage(
            'response-a',
            MessageState.STREAMING,
            () => ({ id: 'response-a', output: { generic: [] } })
          );
        } else if (request.input.text === 'second') {
          throw new Error('send failed');
        } else {
          started.doResolve();
          await release;
          await instance.messaging.upsertMessage(
            'response-c',
            MessageState.COMPLETE,
            () => ({ id: 'response-c', output: { generic: [] } })
          );
        }
      },
    };
    const { instance } = await renderChatAndGetInstanceWithStore(config);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    await instance.send('first');
    await expect(instance.send('second')).rejects.toThrow('send failed');
    consoleError.mockRestore();
    const pendingSend = instance.send('third');
    await started;
    const statusWhilePending = instance.state.get().status;
    release.doResolve();
    await pendingSend;
    const statusAfterSend = instance.state.get().status;
    await instance.messaging.upsertMessage(
      'response-a',
      MessageState.COMPLETE,
      () => ({ id: 'response-a', output: { generic: [] } })
    );

    expect(statusWhilePending).toBe('streaming');
    expect(statusAfterSend).toBe('streaming');
    expect(instance.state.get().status).toBe('ready');
  });

  it('keeps an updated settled request stream alive when another send is canceled', async () => {
    const started = resolvablePromise();
    const release = resolvablePromise();
    let secondRequestID: string;
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (request, _options, instance) => {
        if (request.input.text === 'first') {
          await instance.messaging.upsertMessage(
            'response-a',
            MessageState.STREAMING,
            () => ({ id: 'response-a', output: { generic: [] } })
          );
        } else {
          secondRequestID = request.id;
          started.doResolve();
          await release;
        }
      },
    };
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);
    await instance.send('first');
    const pendingSend = instance.send('second');
    await started;
    await instance.messaging.upsertMessage(
      'response-a',
      MessageState.STREAMING,
      () => ({ id: 'response-a', output: { generic: [] } })
    );

    await serviceManager.messageService.cancelMessageRequestByID(
      secondRequestID,
      false
    );
    release.doResolve();
    await pendingSend;
    const statusAfterCancel = instance.state.get().status;
    await instance.messaging.upsertMessage(
      'response-a',
      MessageState.COMPLETE,
      () => ({ id: 'response-a', output: { generic: [] } })
    );

    expect(statusAfterCancel).toBe('streaming');
    expect(instance.state.get().status).toBe('ready');
  });

  it('updates content without reviving an upsert stream after cancel', async () => {
    const streaming = resolvablePromise();
    const release = resolvablePromise();
    let requestID: string;
    const config = createBaseConfig();
    config.messaging = {
      skipWelcome: true,
      customSendMessage: async (request, _options, instance) => {
        requestID = request.id;
        await instance.messaging.upsertMessage(
          'response-a',
          MessageState.STREAMING,
          () => ({
            id: 'response-a',
            request_id: requestID,
            output: {
              generic: [
                { response_type: MessageResponseTypes.TEXT, text: 'before' },
              ],
            },
          })
        );
        streaming.doResolve();
        await release;
      },
    };
    const { instance, serviceManager } =
      await renderChatAndGetInstanceWithStore(config);
    const pendingSend = instance.send('first');
    await streaming;
    await serviceManager.messageService.cancelCurrentMessageRequest();
    release.doResolve();
    await pendingSend;

    await instance.messaging.upsertMessage(
      'response-a',
      MessageState.STREAMING,
      () => ({
        id: 'response-a',
        request_id: requestID,
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: 'after' },
          ],
        },
      })
    );

    expect(
      instance.state
        .get()
        .messages.find((message) => message.id === 'response-a')
    ).toMatchObject({ output: { generic: [{ text: 'after' }] } });
    expect(instance.state.get().status).toBe('ready');
  });
});
