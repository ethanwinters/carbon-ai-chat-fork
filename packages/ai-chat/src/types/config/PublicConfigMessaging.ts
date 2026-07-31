/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { ChatInstance } from '../instance/ChatInstance';
import { CustomSendMessageOptions } from './MessagingConfig';
import { MessageRequest } from '../messaging/Messages';
import { HistoryItem } from '../messaging/History';

/**
 * The messaging options a headless consumer needs, surfaced on
 * {@link ChatCoreConfig.messaging}. These configure the conversation itself — the transport
 * callbacks, whether a conversation opens with a welcome request, and how long a request may run
 * before the chat aborts it — so they apply whether or not the shipped UI is rendered.
 *
 * @category Config
 */
export interface ChatCoreConfigMessaging {
  /**
   * Indicates if Carbon AI Chat should make a request for the welcome message when a new conversation begins. If this is
   * true, then Carbon AI Chat will start with an empty conversation.
   *
   * **Manual session management required**: Changes to this property after conversation has started have no effect.
   * To apply new welcome behavior, call `instance.messaging.restartConversation()`.
   */
  skipWelcome?: boolean;

  /**
   * Changes the timeout used by the message service when making message calls. The timeout is in seconds. The
   * default is 150 seconds. After this time, an error will be shown in the client and an Abort signal will be sent
   * to customSendMessage. If set to 0, the chat will never timeout.  This is tied to either {@link ChatInstanceMessaging.addMessage} or
   * {@link ChatInstanceMessaging.addMessageChunk} being called after this message was sent. If neither of those methods
   * are called with in the window defined here, the chat will timeout (unless the value is set to 0).
   */
  messageTimeoutSecs?: number;

  /**
   * A callback for Carbon AI Chat to use to send messages to your assistant.
   *
   * Carbon AI Chat will queue up any additional user messages until the Promise from a previous call to customSendMessage
   * has resolved. If you do not make customSendMessage async, it will be up to you to manage what happens when a message is
   * sent when the previous is still processing. If the Promise rejects, an error indicator will be displayed next to the user's message.
   *
   * If the request takes longer than PublicConfigMessaging.messageTimeoutSecs than the AbortSignal will be sent.
   */
  customSendMessage?: (
    request: MessageRequest,
    requestOptions: CustomSendMessageOptions,
    instance: ChatInstance
  ) => Promise<void> | void;

  /**
   * This is a callback function that is used by Carbon AI Chat to retrieve history data for populating the Carbon AI Chat. If
   * this function is defined, it will be used instead of any other mechanism for fetching history.
   *
   * If this function is mutated after it was initially called, the chat does not re-call it.
   */
  customLoadHistory?: (instance: ChatInstance) => Promise<HistoryItem[]>;
}

/**
 * The messaging options that tune the shipped UI, surfaced on
 * {@link ChatShellConfig.messaging}. Both control chrome a consumer who renders their own
 * interface never draws — the built-in loading indicator and the built-in stop button — so
 * neither has any effect without the shipped shell.
 *
 * @category Config
 */
export interface ChatShellConfigMessaging {
  /**
   * Controls how long AI chat should wait before showing the loading indicator. If set to 0, the chat will never show
   * the loading indicator on its own. This is tied to either {@link ChatInstanceMessaging.addMessage} or
   * {@link ChatInstanceMessaging.addMessageChunk} being called after this message was sent. If neither of those methods
   * are called with in the window defined here, the loading indicator will be shown.
   */
  messageLoadingIndicatorTimeoutSecs?: number;

  /**
   * Controls when the stop streaming button becomes visible during message streaming.
   *
   * You must have {@link PublicConfigMessaging.customSendMessage} return a promise for
   * this setting to work correctly.
   *
   * When `true`, the stop button appears immediately when `customSendMessage` is called,
   * allowing users to cancel requests before the first streaming chunk arrives. This is
   * useful for slow-starting requests or when you want to give users immediate control
   * over long-running operations. The button will remain visible as long as there is an
   * active streaming message, even if the initial message promise resolves.
   *
   * When `false` (default), the stop button only appears after the first streaming chunk
   * arrives with `cancellable: true` metadata, maintaining backward compatibility with
   * existing behavior.
   *
   */
  showStopButtonImmediately?: boolean;
}

/**
 * Config options for controlling messaging.
 *
 * Both halves of the messaging surface, under the name the shipped React and web-component
 * surfaces already accept. See {@link ChatCoreConfigMessaging} for the conversation options and
 * {@link ChatShellConfigMessaging} for the ones that tune the shipped UI.
 *
 * @category Config
 */
export interface PublicConfigMessaging
  extends ChatCoreConfigMessaging, ChatShellConfigMessaging {}
