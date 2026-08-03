/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import isEqual from 'lodash-es/isEqual.js';

import type { ServiceManager } from '../services/ServiceManager';
import { toSnapshotMessage } from './toSnapshotMessage';
import { createUnmappingMemoizer } from '../utils/memoizerUtils';
import {
  isRequest,
  isResponse,
  materializeStreamedItemContent,
} from '../utils/messageUtils';
import { BusEventType } from '../../types/events/eventBusTypes';
import {
  MessagesStatus,
  MessagesError,
  MessagesState,
} from '../../types/messaging/MessagesState';
import {
  LocalMessageItem,
  MessageErrorState,
} from '../../types/messaging/LocalMessageItem';
import {
  GenericItem,
  Message,
  MessageResponse,
} from '../../types/messaging/Messages';
import { AppState } from '../../types/state/AppState';
import ObjectMap from '../../types/utilities/ObjectMap';

/**
 * Per-turn memoization record. Reused across recomputes whenever the underlying references (or, on
 * the `CHANGE_STATE` deep-merge fallback, the underlying content) are unchanged, so unrelated turns
 * keep `===` identity — the same guarantee `slotStates.ts` gives host-projection state.
 */
interface CacheEntry {
  rawMessage: Message;
  localItemIDs: string[];
  localItems: LocalMessageItem[];
  snapshotMessage: Message;
}

/**
 * Synchronous reads over the framework-agnostic messages/status/error state, derived from the app
 * store and bundled into an immutable snapshot. Backs `ChatInstanceMessaging.getMessagesState` and
 * `ChatInstanceMessaging.getMessage`, and drives `BusEventType.MESSAGES_STATE_CHANGE`. (Named to
 * avoid colliding with the unrelated `ChatMessagesState` slice in `types/state/ChatMessagesState.ts`.)
 */
export interface MessagesStateReader {
  /** Synchronous read of the bundled `{ messages, status, error }` snapshot. */
  getMessagesState(): MessagesState;
  /** Synchronous lookup of a single message by id, or `undefined` if none exists. */
  getMessage(messageID: string): Message | undefined;
}

function arraysEqualByReference<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * The error state on the most recent request in the conversation, if it carries one. Silent requests
 * count: `history.silent` hides a turn from the transcript, it does not remove it from the
 * conversation, and a host that sent one still needs to hear that it failed.
 */
function findLatestRequestErrorState(
  state: AppState
): { messageID: string; errorState: MessageErrorState } | undefined {
  const { messageIDs } = state.assistantMessageState;
  for (let index = messageIDs.length - 1; index >= 0; index--) {
    const messageID = messageIDs[index];
    const message = state.allMessagesByID[messageID];
    if (!message || !isRequest(message)) {
      continue;
    }
    const errorState = message.history?.error_state;
    return errorState === undefined ? undefined : { messageID, errorState };
  }
  return undefined;
}

function groupLocalItemIDsByFullMessageID(
  localMessageIDs: string[],
  allMessageItemsByID: ObjectMap<LocalMessageItem>
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  localMessageIDs.forEach((id) => {
    const item = allMessageItemsByID[id];
    if (!item) {
      return;
    }
    const existing = grouped.get(item.fullMessageID);
    if (existing) {
      existing.push(id);
    } else {
      grouped.set(item.fullMessageID, [id]);
    }
  });
  return grouped;
}

/**
 * Subscribes to the manager's app store (once, idempotently) and reduces the conversation's
 * messages, status, and error into an immutable snapshot, plus a bridge that fires
 * `BusEventType.MESSAGES_STATE_CHANGE` on the manager's event bus whenever that snapshot
 * actually changes. Called during boot *before* the chat instance exists — see the call site in
 * `ChatSDK.ts` for why it has to be. That is safe because the first seeding recompute deliberately
 * fires nothing (there is no prior snapshot to have changed from), and by the first real dispatch boot
 * has assigned `serviceManager.instance`.
 *
 * The subscription handle is pushed onto `serviceManager.storeUnsubscribers` so `unloadServices`
 * tears it down with the rest; a disposed instance leaves no live listener behind. On a re-call for
 * a manager that already has `messagesState`, returns the existing handle without re-subscribing.
 */
export function attachMessagesStateTracking(
  serviceManager: ServiceManager
): MessagesStateReader {
  if (serviceManager.messagesState) {
    return serviceManager.messagesState;
  }

  const unmapMessages = createUnmappingMemoizer<Message>();
  const cache = new Map<string, CacheEntry>();

  let lastAllMessagesByID: ObjectMap<Message> | undefined;
  let lastAllMessageItemsByID: ObjectMap<LocalMessageItem> | undefined;
  let lastAssistantMessageState: AppState['assistantMessageState'] | undefined;
  let lastCatastrophicErrorType: boolean | undefined;
  let lastCatastrophicErrorPanelState:
    AppState['catastrophicErrorPanelState'] | undefined;

  let hasSeeded = false;

  // The bundled snapshot is cached rather than rebuilt per call so repeated `getMessagesState()`
  // reads are `===`-stable and a consumer can compare snapshots by identity. It is replaced only
  // when one of its three parts actually changed, and doubles as the record of the previous values
  // each recompute compares against.
  let snapshot: MessagesState = Object.freeze({
    messages: [],
    status: MessagesStatus.READY,
    error: null,
  });

  function deriveMessage(
    messageID: string,
    state: AppState,
    groupedLocalItemIDs: Map<string, string[]>
  ): Message {
    const rawMessage = state.allMessagesByID[messageID];
    const cached = cache.get(messageID);

    if (!isResponse(rawMessage)) {
      // Requests never stream and carry no local-item-derived content, so identity depends only on
      // the raw message itself.
      if (cached?.rawMessage === rawMessage) {
        return cached.snapshotMessage;
      }
      if (cached && isEqual(cached.rawMessage, rawMessage)) {
        // Reference changed (e.g. an unrelated CHANGE_STATE deep-merge) but content didn't — keep
        // the cached object and refresh the stored reference so the fast path hits next time.
        cache.set(messageID, { ...cached, rawMessage });
        return cached.snapshotMessage;
      }
      const snapshotMessage = toSnapshotMessage(rawMessage);
      cache.set(messageID, {
        rawMessage,
        localItemIDs: [],
        localItems: [],
        snapshotMessage,
      });
      return snapshotMessage;
    }

    const localItemIDs = groupedLocalItemIDs.get(messageID) ?? [];
    const localItems = localItemIDs.map((id) => state.allMessageItemsByID[id]);

    if (
      cached?.rawMessage === rawMessage &&
      arraysEqualByReference(cached.localItemIDs, localItemIDs) &&
      arraysEqualByReference(cached.localItems, localItems)
    ) {
      return cached.snapshotMessage;
    }

    if (
      cached &&
      arraysEqualByReference(cached.localItemIDs, localItemIDs) &&
      isEqual(cached.rawMessage, rawMessage) &&
      isEqual(cached.localItems, localItems)
    ) {
      cache.set(messageID, {
        rawMessage,
        localItemIDs,
        localItems,
        snapshotMessage: cached.snapshotMessage,
      });
      return cached.snapshotMessage;
    }

    // The stored `output.generic` lacks only streamed content — STREAMING_START seeds an empty
    // placeholder and chunks land per item in `allMessageItemsByID` — so it is reconciled against
    // the local items rather than replaced by them. Items that never produce one (`pause`, a silent
    // `user_defined`) would otherwise vanish from the host's own message as soon as a sibling
    // rendered. `outputItemToLocalItem` holds the stored entry by reference, hence the identity match.
    const storedGeneric = (rawMessage as MessageResponse).output?.generic;
    let liveGeneric: GenericItem[];
    if (storedGeneric?.length) {
      const materializedByStoredItem = new Map(
        localItems.map((localItem) => [
          localItem.item,
          materializeStreamedItemContent(localItem),
        ])
      );
      liveGeneric = storedGeneric.map(
        (item) => materializedByStoredItem.get(item) ?? item
      );
    } else if (localItems.length) {
      liveGeneric = localItems.map(materializeStreamedItemContent);
    }
    const snapshotMessage = toSnapshotMessage(rawMessage, liveGeneric);
    cache.set(messageID, {
      rawMessage,
      localItemIDs,
      localItems,
      snapshotMessage,
    });
    return snapshotMessage;
  }

  function deriveStatusAndError(
    state: AppState,
    groupedLocalItemIDs: Map<string, string[]>
  ): { status: MessagesStatus; error: MessagesError | null } {
    if (state.catastrophicErrorType) {
      const panelState = state.catastrophicErrorPanelState;
      return {
        status: MessagesStatus.ERROR,
        error: {
          kind: 'catastrophic',
          title: panelState?.title,
          bodyText: panelState?.bodyText,
        },
      };
    }

    const { activeResponseId, inFlightRequestCounter } =
      state.assistantMessageState;

    // Whether the turn in flight has already put content on screen. Load-bearing for the
    // `inFlightRequestCounter` fallthrough at the bottom: a stream finishes (every item reports
    // `isDone`) before `customSendMessage` resolves, so without this the status would drop back to
    // `SUBMITTED` for the gap between the last chunk and the callback settling — a visible flash at
    // the tail of every streamed turn, and a direct contradiction of what `SUBMITTED` documents.
    let activeResponseHasContent = false;

    if (activeResponseId) {
      const localItemIDs = groupedLocalItemIDs.get(activeResponseId) ?? [];
      activeResponseHasContent = localItemIDs.length > 0;
      const isStreaming = localItemIDs.some((id) => {
        const streamingState =
          state.allMessageItemsByID[id]?.ui_state.streamingState;
        return streamingState !== undefined && streamingState.isDone === false;
      });
      if (isStreaming) {
        return { status: MessagesStatus.STREAMING, error: null };
      }
    }

    // Failures are recorded on the *request* — `setMessageErrorState` dispatches on the pending
    // request's id, and the human-agent send path does the same — so a response-keyed lookup alone
    // never sees one. Only the latest turn is considered: an older failure the conversation has since
    // moved past is history, not the current blocking error.
    const latestRequestError = findLatestRequestErrorState(state);
    if (
      latestRequestError?.errorState === MessageErrorState.FAILED ||
      latestRequestError?.errorState ===
        MessageErrorState.FAILED_WHILE_STREAMING
    ) {
      return {
        status: MessagesStatus.ERROR,
        error: {
          kind: 'message',
          messageID: latestRequestError.messageID,
          errorState: latestRequestError.errorState,
        },
      };
    }

    // RETRYING comes from the human-agent send path when the service desk has not confirmed yet.
    if (latestRequestError?.errorState === MessageErrorState.RETRYING) {
      return { status: MessagesStatus.SUBMITTED, error: null };
    }

    // `SUBMITTED` means "sent, nothing back yet", so it only applies while the turn has produced
    // nothing. Once the active response has content the turn reads as `READY` even though the
    // request is still settling — the alternative is reporting "waiting" about a response the
    // reader can already see.
    if (inFlightRequestCounter > 0 && !activeResponseHasContent) {
      return { status: MessagesStatus.SUBMITTED, error: null };
    }

    return { status: MessagesStatus.READY, error: null };
  }

  /**
   * Replaces the cached snapshot when any of its three parts changed, and announces that change on
   * the event bus.
   */
  function commitSnapshot(
    nextMessages: Message[],
    nextStatus: MessagesStatus,
    nextError: Readonly<MessagesError> | null
  ) {
    const previousState = snapshot;
    const changed =
      snapshot.messages !== nextMessages ||
      snapshot.status !== nextStatus ||
      snapshot.error !== nextError;
    if (changed) {
      snapshot = Object.freeze({
        messages: nextMessages,
        status: nextStatus,
        error: nextError,
      });
    }

    if (!hasSeeded) {
      // First recompute, right after the app-store subscription is registered during boot: capture
      // a baseline only, since nothing has observed a prior snapshot to have changed from.
      hasSeeded = true;
      return;
    }

    if (!changed) {
      return;
    }

    serviceManager.eventBus.fireSync(
      {
        type: BusEventType.MESSAGES_STATE_CHANGE,
        previousState,
        newState: snapshot,
      },
      serviceManager.instance
    );
  }

  function recompute() {
    const state = serviceManager.store.getState();
    const {
      allMessagesByID,
      allMessageItemsByID,
      assistantMessageState,
      catastrophicErrorType,
      catastrophicErrorPanelState,
    } = state;

    const slicesUnchanged =
      allMessagesByID === lastAllMessagesByID &&
      allMessageItemsByID === lastAllMessageItemsByID &&
      assistantMessageState === lastAssistantMessageState &&
      catastrophicErrorType === lastCatastrophicErrorType &&
      catastrophicErrorPanelState === lastCatastrophicErrorPanelState;
    if (slicesUnchanged) {
      return;
    }
    lastAllMessagesByID = allMessagesByID;
    lastAllMessageItemsByID = allMessageItemsByID;
    lastAssistantMessageState = assistantMessageState;
    lastCatastrophicErrorType = catastrophicErrorType;
    lastCatastrophicErrorPanelState = catastrophicErrorPanelState;

    const groupedLocalItemIDs = groupLocalItemIDsByFullMessageID(
      assistantMessageState.localMessageIDs,
      allMessageItemsByID
    );

    // Reducers keep `messageIDs` and `allMessagesByID` in step, so an id with no stored message is
    // not expected. Skip it rather than derive from `undefined`: the store swallows a throwing
    // subscriber, so a failure here silently stops the snapshot updating.
    const messageIDs = assistantMessageState.messageIDs.filter(
      (id) => allMessagesByID[id]
    );

    const snapshotMessagesByID: ObjectMap<Message> = {};
    messageIDs.forEach((id) => {
      snapshotMessagesByID[id] = deriveMessage(id, state, groupedLocalItemIDs);
    });

    // Bound the cache to messages still present so removeMessages/restartConversation don't leak.
    const presentIDs = new Set(messageIDs);
    Array.from(cache.keys()).forEach((id) => {
      if (!presentIDs.has(id)) {
        cache.delete(id);
      }
    });

    const nextMessages = Object.freeze(
      unmapMessages(messageIDs, snapshotMessagesByID)
    ) as Message[];

    const { status: nextStatus, error: derivedError } = deriveStatusAndError(
      state,
      groupedLocalItemIDs
    );

    // Keep the previous error object when the content is unchanged: deriveStatusAndError builds a
    // fresh object each pass, and a new reference would fire MESSAGES_STATE_CHANGE with deep-equal
    // snapshots on every unrelated recompute for as long as the error persists.
    const previousError = snapshot.error;
    const nextError =
      previousError && derivedError && isEqual(previousError, derivedError)
        ? previousError
        : derivedError && Object.freeze(derivedError);

    commitSnapshot(nextMessages, nextStatus, nextError);
  }

  serviceManager.storeUnsubscribers.push(
    serviceManager.store.subscribe(recompute)
  );
  recompute();

  const messagesState: MessagesStateReader = {
    getMessagesState: () => snapshot,
    getMessage: (messageID: string) => cache.get(messageID)?.snapshotMessage,
  };
  serviceManager.messagesState = messagesState;
  return messagesState;
}
