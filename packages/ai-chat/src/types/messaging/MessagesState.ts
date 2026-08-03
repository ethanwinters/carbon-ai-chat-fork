/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { MessageErrorState } from './LocalMessageItem';
import { Message } from './Messages';

/**
 * The conversation's current messaging lifecycle, reported on {@link MessagesState.status}. It
 * follows the request/response arc of a single assistant or human-agent turn. Deliberately scoped
 * to messaging only — hydration and human-agent connection are separate concerns exposed on
 * {@link ChatInstance.getState}; folding them in here would force one value to answer two unrelated
 * questions.
 *
 * @category Messaging
 * @experimental Ships alongside {@link ChatInstanceMessaging.getMessagesState}; the members may evolve based on consumer feedback.
 */
enum MessagesStatus {
  /**
   * No request is in flight and there is no unresolved error.
   */
  READY = 'ready',

  /**
   * A request has been sent and no content has appeared yet for the pending response.
   */
  SUBMITTED = 'submitted',

  /**
   * Content is currently arriving for the active response.
   */
  STREAMING = 'streaming',

  /**
   * The latest turn failed to send or stream. See {@link MessagesError} for details. Clears when the
   * next turn is sent.
   */
  ERROR = 'error',
}

/**
 * Describes why {@link MessagesStatus.ERROR} is active, reported on {@link MessagesState.error}. A
 * `catastrophic` error means Carbon AI Chat cannot recover without a restart — see
 * {@link ChatInstance.updateCatastrophicErrorPanel}. A `message` error means one specific turn
 * failed to send or stream, and names that turn.
 *
 * @category Messaging
 * @experimental Ships alongside {@link ChatInstanceMessaging.getMessagesState}; the shape may evolve based on consumer feedback.
 */
type MessagesError =
  | {
      /**
       * Marks this as an unrecoverable error affecting the whole chat.
       */
      kind: 'catastrophic';

      /**
       * The title shown on the catastrophic error panel, when one was set.
       */
      title?: string;

      /**
       * The body text shown on the catastrophic error panel, when one was set.
       */
      bodyText?: string;
    }
  | {
      /**
       * Marks this as an error affecting a single turn.
       */
      kind: 'message';

      /**
       * The id of the message that failed.
       */
      messageID: string;

      /**
       * How the message failed.
       */
      errorState: MessageErrorState;
    };

/**
 * The bundled snapshot returned by {@link ChatInstanceMessaging.getMessagesState} and carried by
 * {@link BusEventMessagesStateChange} — it mirrors the one-bundled-object shape of
 * {@link PublicChatState}.
 *
 * @category Messaging
 * @experimental Ships alongside {@link ChatInstanceMessaging.getMessagesState}; the shape may evolve based on consumer feedback.
 */
interface MessagesState {
  /**
   * The conversation's turns, requests and responses interleaved, oldest first. Each message is
   * frozen, and a response's `output.generic` holds its current visible content — including
   * partially streamed content while {@link MessagesStatus.STREAMING} is active.
   */
  readonly messages: readonly Message[];

  /**
   * The conversation's current messaging lifecycle.
   */
  readonly status: MessagesStatus;

  /**
   * The current blocking error, or `null` when there is none.
   */
  readonly error: Readonly<MessagesError> | null;
}

export { MessagesError, MessagesState, MessagesStatus };
