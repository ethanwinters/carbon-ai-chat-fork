/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { isResponse } from "../utils/messageUtils.js";
import {
  GenericItem,
  Message,
  MessageRequestHistory,
  MessageResponse,
  MessageResponseHistory,
} from "../../types/messaging/Messages.js";
import {
  PublicMessage,
  PublicMessageRequest,
  PublicMessageResponse,
} from "../../types/messaging/PublicMessage.js";

/**
 * Strips the `file_upload_status` rider Carbon AI Chat keeps on message history for its own upload-UI
 * bookkeeping. Shared by both the request and response history shapes.
 */
function omitFileUploadStatus<
  T extends MessageRequestHistory | MessageResponseHistory,
>(history: T): Omit<T, "file_upload_status"> {
  const { file_upload_status: _fileUploadStatus, ...rest } = history;
  return rest;
}

/**
 * Converts a stored {@link Message} into the curated {@link PublicMessage} shape returned by
 * `ChatInstanceMessaging.getMessagesState`/`getMessage`, stripping the chat-internal bookkeeping
 * fields (`ui_state_internal`, `history.file_upload_status`) that must never reach a consumer.
 *
 * For a response, `liveGeneric` — when provided — replaces the stored `output.generic` with the
 * response's current visible content, reconstructed from the local message items. The stored
 * `output.generic` is only authoritative once a response has finished streaming; while streaming is in
 * progress it is an empty placeholder, so callers building a live snapshot must pass the reconstructed
 * array instead of relying on this function to read it from `message` directly.
 *
 * The layers this function creates (the message, its `history` clone, its `output` wrapper, and the
 * `generic` array) are frozen: the objects are cached and handed out by reference from
 * `getMessagesState`/`getMessage` and every `MESSAGES_STATE_CHANGE` payload, so a consumer mutation
 * would corrupt every later snapshot. The individual generic items remain store references and are
 * deliberately not frozen here — freezing them would freeze store state.
 */
function toPublicMessage(
  message: Message,
  liveGeneric?: GenericItem[],
): PublicMessage {
  if (isResponse(message)) {
    const {
      ui_state_internal: _uiStateInternalResponse,
      history: responseHistory,
      ...rest
    } = message as MessageResponse;
    return Object.freeze({
      ...rest,
      ...(responseHistory
        ? { history: Object.freeze(omitFileUploadStatus(responseHistory)) }
        : {}),
      output: Object.freeze({
        generic: Object.freeze(
          liveGeneric ?? [...(message.output?.generic ?? [])],
        ),
      }),
    }) as PublicMessageResponse;
  }

  const {
    ui_state_internal: _uiStateInternalRequest,
    history: requestHistory,
    ...rest
  } = message;
  return Object.freeze({
    ...rest,
    ...(requestHistory
      ? { history: Object.freeze(omitFileUploadStatus(requestHistory)) }
      : {}),
  }) as PublicMessageRequest;
}

export { toPublicMessage };
