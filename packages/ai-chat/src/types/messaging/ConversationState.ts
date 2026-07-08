/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { MessageErrorState } from "./LocalMessageItem";
import { PublicMessage } from "./PublicMessage";

/**
 * The conversation's current messaging lifecycle, mirroring the request/response arc of a single
 * assistant or human-agent turn. Deliberately scoped to messaging only — hydration and human-agent
 * connection are independent concerns exposed separately on {@link ChatInstance.getState}; folding
 * them in here would force one value to answer two unrelated questions ("is a response in flight" vs.
 * "is the app still booting").
 *
 * @category Messaging
 */
enum ConversationStatus {
  /**
   * No request is in flight and there is no unresolved error.
   */
  READY = "ready",

  /**
   * A request has been sent and no content has appeared yet for the pending response.
   */
  SUBMITTED = "submitted",

  /**
   * Content is currently arriving for the active response.
   */
  STREAMING = "streaming",

  /**
   * The active response failed to send or stream. See {@link PublicChatError} for details.
   */
  ERROR = "error",
}

/**
 * Describes why {@link ConversationStatus.ERROR} is active. `kind: "catastrophic"` means Carbon AI Chat
 * cannot recover without a restart (see {@link ChatInstance.updateCatastrophicErrorPanel}); `kind:
 * "message"` means a specific turn failed to send or stream and identifies that turn.
 *
 * @category Messaging
 */
type PublicChatError =
  | {
      kind: "catastrophic";
      title?: string;
      bodyText?: string;
    }
  | {
      kind: "message";
      messageId: string;
      errorState: MessageErrorState;
    };

/**
 * The bundled snapshot returned by {@link ChatInstanceMessaging.getMessagesState} and carried by
 * {@link BusEventType.MESSAGES_STATE_CHANGE} — mirrors the "one bundled object" shape of
 * {@link PublicChatState}.
 *
 * @category Messaging
 */
interface PublicMessagesState {
  /**
   * The ordered list of conversation turns, requests and responses interleaved, oldest first.
   */
  messages: PublicMessage[];

  /**
   * The conversation's current messaging lifecycle.
   */
  status: ConversationStatus;

  /**
   * The current blocking error, or `null` when none.
   */
  error: PublicChatError | null;
}

export { ConversationStatus, PublicChatError, PublicMessagesState };
