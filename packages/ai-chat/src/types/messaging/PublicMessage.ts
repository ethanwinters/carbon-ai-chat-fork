/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  EventInput,
  MessageInput,
  MessageRequest,
  MessageRequestHistory,
  MessageResponse,
  MessageResponseHistory,
} from "./Messages";

/**
 * The history-safe view of {@link MessageRequestHistory} returned by
 * {@link ChatInstanceMessaging.getMessagesState} and {@link ChatInstanceMessaging.getMessage}. Identical
 * to {@link MessageRequestHistory} except for the internal file-upload status rider, which exists only
 * to drive a transient upload checkmark and carries no meaning once a request has been sent.
 *
 * @category Messaging
 */
type PublicMessageRequestHistory = Omit<
  MessageRequestHistory,
  "file_upload_status"
>;

/**
 * The history-safe view of {@link MessageResponseHistory} returned by
 * {@link ChatInstanceMessaging.getMessagesState} and {@link ChatInstanceMessaging.getMessage}. Identical
 * to {@link MessageResponseHistory} except for the internal file-upload status rider.
 *
 * @category Messaging
 */
type PublicMessageResponseHistory = Omit<
  MessageResponseHistory,
  "file_upload_status"
>;

/**
 * A user or event request, as returned by {@link ChatInstanceMessaging.getMessagesState} and
 * {@link ChatInstanceMessaging.getMessage}. Identical to {@link MessageRequest} minus the internal
 * UI-state bookkeeping Carbon AI Chat keeps for its own rendering, which was never meant to be read or
 * relied on by a consumer.
 *
 * @category Messaging
 */
type PublicMessageRequest = Omit<
  MessageRequest<MessageInput | EventInput>,
  "ui_state_internal" | "history"
> & {
  history?: PublicMessageRequestHistory;
};

/**
 * An assistant or human-agent response, as returned by {@link ChatInstanceMessaging.getMessagesState}
 * and {@link ChatInstanceMessaging.getMessage}. Identical to {@link MessageResponse} minus internal
 * UI-state bookkeeping. Unlike the response objects seen on {@link BusEventType.RECEIVE},
 * `output.generic` here always reflects the response's current visible content, including partially
 * streamed content while {@link ConversationStatus.STREAMING} is active.
 *
 * @category Messaging
 */
type PublicMessageResponse = Omit<
  MessageResponse,
  "ui_state_internal" | "history"
> & {
  history?: PublicMessageResponseHistory;
};

/**
 * A single turn in the conversation, in display order — either a request or a response.
 *
 * @category Messaging
 */
type PublicMessage = PublicMessageRequest | PublicMessageResponse;

export {
  PublicMessage,
  PublicMessageRequest,
  PublicMessageRequestHistory,
  PublicMessageResponse,
  PublicMessageResponseHistory,
};
