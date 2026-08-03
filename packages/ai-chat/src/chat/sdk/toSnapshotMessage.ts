/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import cloneDeep from 'lodash-es/cloneDeep.js';

import { isResponse } from '../utils/messageUtils';
import { deepFreeze } from '../utils/lang/objectUtils';
import {
  GenericItem,
  Message,
  MessageRequest,
  MessageRequestHistory,
  MessageResponse,
  MessageResponseHistory,
} from '../../types/messaging/Messages';

/**
 * Strips the `file_upload_status` rider Carbon AI Chat keeps on message history for its own
 * upload-UI bookkeeping. Shared by both the request and response history shapes.
 */
function omitFileUploadStatus<
  T extends MessageRequestHistory | MessageResponseHistory,
>(history: T): T {
  const { file_upload_status: _fileUploadStatus, ...rest } = history;
  return rest as T;
}

/**
 * Converts a stored message into the form handed out by
 * `ChatInstanceMessaging.getMessagesState`/`getMessage`, dropping the chat-internal bookkeeping
 * (`ui_state_internal`, `history.file_upload_status`) that must never reach a consumer.
 *
 * The return type stays `Message` rather than a parallel public shape: both stripped fields are
 * `@internal`, so `stripInternal` already removes them from the published type declarations, and
 * both are optional, so a stripped object still satisfies `Message`. That makes this function —
 * not a type — the only thing keeping those fields out of a consumer's hands at runtime, which is
 * what `toSnapshotMessage_spec` guards by scanning the request, response and history interfaces in
 * `Messages.ts` for `@internal` fields and asserting the set matches what is omitted here.
 *
 * For a response, `liveGeneric` — when provided — replaces the stored `output.generic` with the
 * caller's live array of the response's current visible content. The stored `output.generic` is only
 * authoritative once a response has finished streaming; while streaming is in progress it is an
 * empty placeholder, so callers building a live snapshot must pass that array instead of relying on
 * this function to read it off `message`.
 *
 * The result is deeply immutable, and deeply its own: message content is cloned before it is frozen.
 * Both halves are load-bearing. Snapshots are cached and handed out by reference from
 * `getMessagesState`/`getMessage` and every `MESSAGES_STATE_CHANGE` payload, so without freezing a
 * consumer mutation would corrupt every later snapshot. And most of what is frozen here is live store
 * state — reducers build `output.generic` items unfrozen, and the post-send copy of a request is an
 * unfrozen clone — so freezing without cloning first would freeze the store itself.
 *
 * Cloning costs nothing in reference stability: a snapshot is only rebuilt when its message actually
 * changes, and unchanged messages are served from cache.
 */
function toSnapshotMessage(
  message: Message,
  liveGeneric?: GenericItem[]
): Message {
  if (isResponse(message)) {
    const {
      ui_state_internal: _uiStateInternalResponse,
      history: responseHistory,
      output,
      ...rest
    } = message as MessageResponse;
    return deepFreeze({
      ...cloneDeep(rest),
      ...(responseHistory
        ? { history: omitFileUploadStatus(cloneDeep(responseHistory)) }
        : {}),
      // Spread the stored output so host fields other than `generic` survive — a snapshot of the
      // host's own message should not quietly lose parts of it.
      output: {
        ...cloneDeep(output ?? {}),
        generic: cloneDeep(liveGeneric ?? output?.generic ?? []),
      },
    }) as MessageResponse;
  }

  const {
    ui_state_internal: _uiStateInternalRequest,
    history: requestHistory,
    ...rest
  } = message;
  return deepFreeze({
    ...cloneDeep(rest),
    ...(requestHistory
      ? { history: omitFileUploadStatus(cloneDeep(requestHistory)) }
      : {}),
  }) as MessageRequest;
}

export { toSnapshotMessage };
