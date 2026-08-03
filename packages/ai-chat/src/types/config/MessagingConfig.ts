/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { HistoryItem } from '../messaging/History';
import type {
  Message,
  MessageRequest,
  MessageResponse,
  StreamChunk,
} from '../messaging/Messages';
import { BusEventSend } from '../events/eventBusTypes';
import { MessagesState } from '../messaging/MessagesState';
import type { SendOptions } from '../instance/ChatInstance';

/**
 * Lifecycle state passed to {@link ChatInstanceMessaging.upsertMessage} to describe the
 * message's state after the upsert completes. Carbon AI Chat tracks this state internally;
 * it is never written onto a {@link MessageResponse}.
 *
 * `addMessage`, `addMessageChunk`, and `upsertMessage` may all target the same message
 * id without producing duplicate `pre:receive` / `receive` events — Carbon AI Chat tracks
 * the recorded state per id and fires those events only on the first transition to
 * {@link COMPLETE}.
 *
 * @category Messaging
 * @experimental
 */
export enum MessageState {
  /**
   * The message is still being constructed and further updates are expected. The
   * "stop streaming" affordance remains available while a message is in this state if
   * any item carries `streaming_metadata.cancellable: true`.
   */
  STREAMING = 'streaming',

  /**
   * The message has reached its final shape. Carbon AI Chat fires
   * {@link BusEventType.PRE_RECEIVE} and {@link BusEventType.RECEIVE} when a message
   * transitions into this state from any other state, including the case where no
   * message with this ID previously existed.
   */
  COMPLETE = 'complete',

  /**
   * The message terminated in an error condition. The chat displays the message as-is
   * and does not fire {@link BusEventType.PRE_RECEIVE} or {@link BusEventType.RECEIVE}
   * when a message transitions into this state. Treat `ERROR` as terminal — subsequent
   * upserts targeting the same id are still accepted but should be rare.
   */
  ERROR = 'error',
}

/**
 * The updater function passed to {@link ChatInstanceMessaging.upsertMessage}. Receives the
 * message currently stored under the target ID (or `undefined` when no message with that
 * ID is in the store) and returns the {@link MessageResponse} that should replace it. May
 * be synchronous or asynchronous.
 *
 * @param previous The message currently stored under the target id, or `undefined` on the
 *   first upsert of a new id.
 * @returns The {@link MessageResponse} to store, optionally as a Promise.
 * @category Messaging
 * @experimental
 */
export type UpsertMessageUpdater = (
  previous: MessageResponse | undefined
) => Promise<MessageResponse> | MessageResponse;

/**
 * Reasons why a message request was cancelled via the abort signal.
 *
 * @category Messaging
 */
export enum CancellationReason {
  /**
   * The user clicked the "stop streaming" button, or your code called
   * {@link ChatInstanceMessaging.stop}.
   */
  STOP_STREAMING = 'Stop streaming',

  /**
   * User restarted or cleared the conversation.
   */
  CONVERSATION_RESTARTED = 'Conversation restarted',

  /**
   * Message request exceeded the configured timeout duration.
   *
   * @deprecated Still reported whenever the {@link PublicConfigMessaging.messageTimeoutSecs}
   * window elapses, and nothing changes for you in 1.x. Removed in 2.0.0 along with that timer:
   * Carbon AI Chat stops aborting requests for exceeding a timeout, so nothing reports this
   * reason. Before upgrading, time out your own request inside
   * {@link PublicConfigMessaging.customSendMessage}.
   */
  TIMEOUT = 'Request timeout',
}

/**
 * Messaging actions for a chat instance.
 *
 * @category Messaging
 */
export interface ChatInstanceMessaging {
  /**
   * Sends a message to the assistant, firing {@link BusEventType.PRE_SEND} and then
   * {@link BusEventType.SEND}.
   *
   * The returned promise settles with your {@link PublicConfigMessaging.customSendMessage}: it
   * resolves once that callback has resolved, and it also resolves — rather than rejecting — when
   * the turn is stopped or the conversation is restarted. It rejects when the request times out or
   * fails terminally.
   *
   * Resolution does not mean a response has arrived. Responses reach the chat through
   * {@link ChatInstanceMessaging.addMessage} and {@link ChatInstanceMessaging.addMessageChunk},
   * which your `customSendMessage` calls; await those if you need the response in hand.
   *
   * Rejects when the chat is in read-only mode.
   *
   * @param message The message to send, either a full {@link MessageRequest} or plain text.
   * @param options Options for the message sent.
   *
   * @example Send a plain-text message
   * ```ts
   * await instance.messaging.send("What is the weather today?");
   * ```
   *
   * @example Send a message to the assistant without showing it in the UI
   * ```ts
   * await instance.messaging.send("Resync context", { silent: true });
   * ```
   */
  send: (
    message: MessageRequest | string,
    options?: SendOptions
  ) => Promise<void>;

  /**
   * Instructs the widget to process the given message as an incoming message received from the assistant. This will
   * fire a "pre:receive" event immediately and a "receive" event after the event has been processed by the widget.
   *
   * @param message A {@link MessageResponse} object.
   */
  addMessage: (message: MessageResponse) => Promise<void>;

  /**
   * Adds a streaming message chunk to the chat widget.
   */
  addMessageChunk: (chunk: StreamChunk) => Promise<void>;

  /**
   * Inserts or updates a single message identified by `messageID`. The `updater` receives
   * the {@link MessageResponse} currently stored under `messageID` (or `undefined` when no
   * message with that ID exists) and returns the message that should replace it.
   *
   * Calls targeting the same `messageID` are serialized — each call awaits the previous
   * call for that ID before running. Calls targeting different `messageID`s run
   * independently.
   *
   * The `state` argument describes the {@link MessageState} the chat records for this
   * message after the upsert completes; it is applied uniformly to every item in the
   * returned message. Carbon AI Chat fires {@link BusEventType.PRE_RECEIVE} and
   * {@link BusEventType.RECEIVE} exactly when this call transitions the message into
   * {@link MessageState.COMPLETE} from any other state, including the case where the
   * message did not previously exist. STREAMING-to-STREAMING and COMPLETE-to-COMPLETE
   * upserts do not fire these events.
   *
   * If the returned message has no `id`, Carbon AI Chat assigns `messageID`. The
   * cancellation contract for outbound messages is unchanged — see
   * {@link CustomSendMessageOptions}.
   *
   * @param messageID The stable identifier the chat uses to track this message across
   *   subsequent upserts.
   * @param state The {@link MessageState} to record for this message once the updater
   *   resolves.
   * @param updater Function that produces the {@link MessageResponse} to store.
   * @throws `TypeError` when the updater returns `null`/`undefined`, returns a message
   *   whose `id` differs from `messageID`, or returns a non-assistant message (a request
   *   or a human-agent message).
   * @experimental Upsert semantics and the updater signature may evolve based on consumer feedback.
   */
  upsertMessage: (
    messageID: string,
    state: MessageState,
    updater: UpsertMessageUpdater
  ) => Promise<void>;

  /**
   * Removes the messages with the given IDs from the chat view.
   */
  removeMessages: (messageIDs: string[]) => Promise<void>;

  /**
   * Clears the current conversation. This will trigger a restart of the conversation but will not start a new
   * conversation (hydration). It will also clear any loading indicators UNLESS you have set
   * {@link PublicConfigMessaging.messageLoadingIndicatorTimeoutSecs} to 0.
   */
  clearConversation: () => Promise<void>;

  /**
   * Inserts the given messages into the chat window as part of the chat history. This will fire the history:begin
   * and history:end events.
   */
  insertHistory: (messages: HistoryItem[]) => Promise<void>;

  /**
   * Restarts the conversation with the assistant. This does not make any changes to a conversation with a human agent.
   * This will clear all the current assistant messages from the main assistant view and cancel any outstanding
   * messages. It will also clear any loading indicators UNLESS you have set
   * {@link PublicConfigMessaging.messageLoadingIndicatorTimeoutSecs} to 0.
   */
  restartConversation: () => Promise<void>;

  /**
   * Returns a snapshot of the current conversation's messages, status, and error. Seed with this in
   * `onBeforeRender`, then subscribe to {@link BusEventType.MESSAGES_STATE_CHANGE} for updates —
   * the same convention as {@link ChatInstance.getState} and
   * {@link BusEventType.STATE_CHANGE}. Internal fields Carbon AI Chat keeps for its own bookkeeping
   * are stripped from every message.
   *
   * The returned object is stable by reference until something in it changes, so you can compare
   * two snapshots with `===` to tell whether the conversation moved.
   *
   * @example Read the conversation after a turn completes
   * ```ts
   * import { BusEventType, MessagesStatus } from '@carbon/ai-chat';
   *
   * instance.on({
   *   type: BusEventType.MESSAGES_STATE_CHANGE,
   *   handler: (event) => {
   *     if (event.newState.status === MessagesStatus.READY) {
   *       console.log(event.newState.messages.length); // => 4
   *     }
   *   },
   * });
   * ```
   * @experimental The snapshot shape may evolve based on consumer feedback.
   */
  getMessagesState: () => MessagesState;

  /**
   * Returns the message with the given id from the current conversation, or `undefined` if no
   * message with that id exists. Equivalent to
   * `getMessagesState().messages.find((message) => message.id === messageID)`, provided as a
   * convenience for the common case of looking up a single message.
   *
   * @param messageID The id of the message to retrieve.
   * @example Look up a single message by id
   * ```ts
   * const message = instance.messaging.getMessage('response-1');
   * console.log(message?.id); // => 'response-1'
   * ```
   * @experimental The returned message shape may evolve based on consumer feedback.
   */
  getMessage: (messageID: string) => Message | undefined;

  /**
   * Fires the abort signal on the active turn — the same behavior as the built-in stop button.
   * Pending {@link ChatInstanceMessaging.send} promises resolve rather than reject, queued messages behind
   * the active turn still send, and the returned promise resolves once the signal has been
   * delivered, or immediately when no turn is active.
   *
   * **Firing the signal is all this does — your `customSendMessage` has to do the stopping.** It
   * receives that signal and is responsible for halting its stream and emitting one final chunk
   * whose `complete_item` carries the content it managed to stream. That chunk is what finalizes the
   * stopped response and returns the conversation to {@link MessagesStatus.READY}. Set
   * `streaming_metadata.stream_stopped: true` on the item to mark the turn as stopped rather than
   * completed. A host that aborts without emitting the chunk leaves the response mid-stream and the
   * status short of `READY`; with {@link PublicConfig.debug} enabled, that omission logs a warning.
   *
   * @example Stop the active turn from your own control
   * ```ts
   * async function onCancelClick() {
   *   await instance.messaging.stop();
   * }
   * ```
   *
   * @example Close out a stopped turn in customSendMessage
   * ```ts
   * import { MessageResponseTypes } from "@carbon/ai-chat";
   *
   * async function customSendMessage(request, { signal }, instance) {
   *   let streamed = "";
   *   for (const word of await fetchWords(request)) {
   *     if (signal.aborted) {
   *       break;
   *     }
   *     streamed += word;
   *     // … addMessageChunk a partial_item carrying `word` under item-1.
   *   }
   *
   *   if (signal.aborted) {
   *     // Closing out is yours to do; this chunk is what returns the chat to READY.
   *     await instance.messaging.addMessageChunk({
   *       streaming_metadata: { response_id: "response-1" },
   *       complete_item: {
   *         streaming_metadata: { id: "item-1", stream_stopped: true },
   *         response_type: MessageResponseTypes.TEXT,
   *         text: streamed,
   *       },
   *     });
   *   }
   *   // … a completed turn emits complete_item + final_response instead; see the next example.
   * }
   * ```
   *
   * @example Close out a completed turn in customSendMessage
   * ```ts
   * import { MessageResponseTypes } from "@carbon/ai-chat";
   *
   * async function customSendMessage(request, options, instance) {
   *   let streamed = "";
   *   for (const word of await fetchWords(request)) {
   *     streamed += word;
   *     // … addMessageChunk a partial_item carrying `word` under item-1.
   *   }
   *
   *   const item = {
   *     streaming_metadata: { id: "item-1" },
   *     response_type: MessageResponseTypes.TEXT,
   *     text: streamed,
   *   };
   *   await instance.messaging.addMessageChunk({
   *     streaming_metadata: { response_id: "response-1" },
   *     complete_item: item,
   *   });
   *
   *   // final_response releases the send queue, so the next send stalls without it.
   *   await instance.messaging.addMessageChunk({
   *     final_response: { id: "response-1", output: { generic: [item] } },
   *   });
   * }
   * ```
   * @experimental The cancellation contract may evolve based on consumer feedback.
   */
  stop: () => Promise<void>;

  /**
   * Re-runs the last assistant turn: removes the most recent response from the conversation and
   * re-sends its originating request — the same request id, so no duplicate user turn appears —
   * through the normal send pipeline, firing {@link BusEventType.PRE_SEND} and
   * {@link BusEventType.SEND} and walking the conversation through
   * {@link MessagesStatus.SUBMITTED} again. The returned promise rejects when there is no turn
   * to regenerate, or when {@link RegenerateOptions.messageID} names a message outside the last
   * turn.
   *
   * @param options Options controlling which turn is regenerated.
   * @internal Not implemented yet — calling it logs a warning and does nothing.
   */
  regenerate: (options?: RegenerateOptions) => Promise<void>;

  /**
   * Clears the current message error and returns the conversation to
   * {@link MessagesStatus.READY} without restarting it. The failed turn stays in the
   * conversation with its error state reset, so it can be re-sent or regenerated. A catastrophic
   * error is not cleared by this method — recover from those with
   * {@link ChatInstance.updateCatastrophicErrorPanel} or
   * {@link ChatInstanceMessaging.restartConversation}. Does nothing when there is no error.
   *
   * @internal Not implemented yet — calling it logs a warning and does nothing.
   */
  clearError: () => void;
}

/**
 * Options for {@link ChatInstanceMessaging.regenerate}.
 *
 * @category Messaging
 * @internal Not implemented yet — calling {@link ChatInstanceMessaging.regenerate} logs a warning and does nothing.
 */
export interface RegenerateOptions {
  /**
   * The id of a message in the last turn — either the request or the response. When omitted, the
   * most recent turn is regenerated. Regenerating an earlier turn is not supported; passing the id
   * of a message from an earlier turn rejects the returned promise.
   */
  messageID?: string;
}

/**
 * Options for calling the addMessage method.
 *
 * @category Messaging
 */
export interface AddMessageOptions {
  /**
   * Indicates if the message should be treated as a new welcome message (as opposed to an existing one loaded from
   * history).
   */
  isLatestWelcomeNode?: boolean;
}

/**
 * @category Messaging
 */
export interface CustomSendMessageOptions {
  /**
   * A signal to let customSendMessage to cancel a request if it has exceeded Carbon AI Chat's timeout.
   */
  signal: AbortSignal;

  /**
   * If the message was sent with "silent" set to true to not be displayed in the conversation history.
   */
  silent: boolean;

  /**
   *  BusEventSend provides extra context such as MessageSendSource.
   */
  busEventSend?: BusEventSend;
}
