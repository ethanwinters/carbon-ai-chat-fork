/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import isEqual from "lodash-es/isEqual.js";

import type { ServiceManager } from "../services/ServiceManager.js";
import { createValueStore, ReadableValueStore } from "./valueStore.js";
import { toPublicMessage } from "./toPublicMessage.js";
import { createUnmappingMemoizer } from "../utils/memoizerUtils.js";
import { isResponse } from "../utils/messageUtils.js";
import { BusEventType } from "../../types/events/eventBusTypes.js";
import {
  ConversationStatus,
  PublicChatError,
  PublicMessagesState,
} from "../../types/messaging/ConversationState.js";
import { PublicMessage } from "../../types/messaging/PublicMessage.js";
import {
  LocalMessageItem,
  MessageErrorState,
} from "../../types/messaging/LocalMessageItem.js";
import { Message, MessageResponse } from "../../types/messaging/Messages.js";
import { AppState } from "../../types/state/AppState.js";
import ObjectMap from "../../types/utilities/ObjectMap.js";

/**
 * Per-turn memoization record. Reused across recomputes whenever the underlying references (or, on the
 * `CHANGE_STATE` deep-merge fallback, the underlying content) are unchanged, so unrelated turns keep
 * `===` identity — the same guarantee `slotStates.ts` gives host-projection state.
 */
interface CacheEntry {
  rawMessage: Message;
  localItemIDs: string[];
  localItems: LocalMessageItem[];
  publicMessage: PublicMessage;
}

/**
 * Framework-agnostic messages/status/error state, derived from the app store and reduced into
 * {@link ReadableValueStore}s. Backs {@link ChatInstanceMessaging.getMessagesState} and
 * {@link ChatInstanceMessaging.getMessage}, and drives {@link BusEventType.MESSAGES_STATE_CHANGE}.
 * (Named to avoid the unrelated `ChatMessagesState` slice interface in `types/state/AppState.ts`.)
 */
export interface MessagesStateStores {
  /** The ordered list of conversation turns, requests and responses interleaved, oldest first. */
  messages: ReadableValueStore<PublicMessage[]>;
  /** The conversation's current messaging lifecycle. */
  status: ReadableValueStore<ConversationStatus>;
  /** The current blocking error, or `null` when none. */
  error: ReadableValueStore<PublicChatError | null>;
  /** Synchronous read of the bundled `{ messages, status, error }` snapshot. */
  getMessagesState(): PublicMessagesState;
  /** Synchronous lookup of a single message by id, or `undefined` if none exists. */
  getMessage(messageId: string): PublicMessage | undefined;
}

function arraysEqualByReference<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * The current visible content of a local item. While an item is mid-stream its accumulated deltas
 * live in `ui_state.streamingState.chunks` (the reducer seeds `item` from the first chunk only and
 * appends later chunks without merging them in — the view joins them the same way, see
 * `StreamingRichText`), so the joined chunk text replaces the first-chunk text here. Only
 * text-bearing chunks are reconstructed; other item types pass through unchanged.
 */
function liveItemContent(item: LocalMessageItem): LocalMessageItem["item"] {
  const streamingState = item.ui_state.streamingState;
  if (
    !streamingState ||
    streamingState.isDone ||
    streamingState.chunks.length === 0 ||
    !streamingState.chunks.some(
      (chunk) => typeof (chunk as { text?: string }).text === "string",
    )
  ) {
    return item.item;
  }
  const text = streamingState.chunks
    .map((chunk) => (chunk as { text?: string }).text ?? "")
    .join("");
  return { ...item.item, text };
}

function groupLocalItemIDsByFullMessageID(
  localMessageIDs: string[],
  allMessageItemsByID: ObjectMap<LocalMessageItem>,
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
 * Registers the messages/status/error reduction on the manager's app store (once, idempotently) and
 * reduces it into three {@link ValueStore}s plus a bridge that fires {@link
 * BusEventType.MESSAGES_STATE_CHANGE} on the manager's event bus whenever the reduced snapshot
 * actually changes. Called during boot, before `createChatInstance`, so it needs only
 * `serviceManager.store` — see `ChatSDK.ts` for the ordering note.
 */
export function attachMessagesStateTracking(
  serviceManager: ServiceManager,
): MessagesStateStores {
  if (serviceManager.messagesState) {
    return serviceManager.messagesState;
  }

  const messages = createValueStore<PublicMessage[]>([]);
  const status = createValueStore<ConversationStatus>(ConversationStatus.READY);
  const error = createValueStore<PublicChatError | null>(null);
  const unmapMessages = createUnmappingMemoizer<PublicMessage>();
  const cache = new Map<string, CacheEntry>();

  let lastAllMessagesByID: ObjectMap<Message> | undefined;
  let lastAllMessageItemsByID: ObjectMap<LocalMessageItem> | undefined;
  let lastAssistantMessageState: AppState["assistantMessageState"] | undefined;
  let lastCatastrophicErrorType: boolean | undefined;
  let lastCatastrophicErrorPanelState:
    | AppState["catastrophicErrorPanelState"]
    | undefined;

  let hasSeeded = false;
  let previousEventState: PublicMessagesState | undefined;

  function derivePublicMessage(
    messageID: string,
    state: AppState,
    groupedLocalItemIDs: Map<string, string[]>,
  ): PublicMessage {
    const rawMessage = state.allMessagesByID[messageID];
    const cached = cache.get(messageID);

    if (!isResponse(rawMessage)) {
      // Requests never stream and carry no local-item-derived content, so identity depends only on
      // the raw message itself.
      if (cached?.rawMessage === rawMessage) {
        return cached.publicMessage;
      }
      if (cached && isEqual(cached.rawMessage, rawMessage)) {
        // Reference changed (e.g. an unrelated CHANGE_STATE deep-merge) but content didn't — keep the
        // cached object and refresh the stored reference so the fast path hits again next time.
        cache.set(messageID, { ...cached, rawMessage });
        return cached.publicMessage;
      }
      const publicMessage = toPublicMessage(rawMessage);
      cache.set(messageID, {
        rawMessage,
        localItemIDs: [],
        localItems: [],
        publicMessage,
      });
      return publicMessage;
    }

    const localItemIDs = groupedLocalItemIDs.get(messageID) ?? [];
    const localItems = localItemIDs.map((id) => state.allMessageItemsByID[id]);

    if (
      cached?.rawMessage === rawMessage &&
      arraysEqualByReference(cached.localItemIDs, localItemIDs) &&
      arraysEqualByReference(cached.localItems, localItems)
    ) {
      return cached.publicMessage;
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
        publicMessage: cached.publicMessage,
      });
      return cached.publicMessage;
    }

    // The stored `output.generic` for a response is only authoritative once streaming has finished
    // (STREAMING_START seeds an empty placeholder) — the response's current visible content lives per
    // item in `allMessageItemsByID`, so it's reconstructed here rather than read off `rawMessage`.
    // A response with NO local items (e.g. an all-silent user_defined turn is never given any) keeps
    // its stored content: an empty reconstruction would wipe it.
    const liveGeneric =
      localItems.length > 0 ? localItems.map(liveItemContent) : undefined;
    const publicMessage = toPublicMessage(rawMessage, liveGeneric);
    cache.set(messageID, {
      rawMessage,
      localItemIDs,
      localItems,
      publicMessage,
    });
    return publicMessage;
  }

  function deriveStatusAndError(
    state: AppState,
    groupedLocalItemIDs: Map<string, string[]>,
  ): { status: ConversationStatus; error: PublicChatError | null } {
    if (state.catastrophicErrorType) {
      const panelState = state.catastrophicErrorPanelState;
      return {
        status: ConversationStatus.ERROR,
        error: {
          kind: "catastrophic",
          title: panelState?.title,
          bodyText: panelState?.bodyText,
        },
      };
    }

    const { activeResponseId, isMessageLoadingCounter } =
      state.assistantMessageState;

    if (activeResponseId) {
      const activeMessage = state.allMessagesByID[
        activeResponseId
      ] as MessageResponse;
      const errorState = activeMessage?.history?.error_state;

      if (
        errorState === MessageErrorState.FAILED ||
        errorState === MessageErrorState.FAILED_WHILE_STREAMING
      ) {
        return {
          status: ConversationStatus.ERROR,
          error: { kind: "message", messageId: activeResponseId, errorState },
        };
      }

      if (
        errorState === MessageErrorState.RETRYING ||
        errorState === MessageErrorState.WAITING
      ) {
        return { status: ConversationStatus.SUBMITTED, error: null };
      }

      const localItemIDs = groupedLocalItemIDs.get(activeResponseId) ?? [];
      const isStreaming = localItemIDs.some((id) => {
        const streamingState =
          state.allMessageItemsByID[id]?.ui_state.streamingState;
        return streamingState !== undefined && streamingState.isDone === false;
      });
      if (isStreaming) {
        return { status: ConversationStatus.STREAMING, error: null };
      }
    }

    if (isMessageLoadingCounter > 0) {
      return { status: ConversationStatus.SUBMITTED, error: null };
    }

    return { status: ConversationStatus.READY, error: null };
  }

  function currentEventState(): PublicMessagesState {
    return Object.freeze({
      messages: messages.get(),
      status: status.get(),
      error: error.get(),
    });
  }

  function maybeFireMessagesStateChangeEvent() {
    const newState = currentEventState();

    if (!hasSeeded) {
      // First recompute (right after this function subscribes, during boot, before the instance
      // exists): capture a baseline only — nothing has "changed" yet.
      hasSeeded = true;
      previousEventState = newState;
      return;
    }

    if (
      newState.messages === previousEventState.messages &&
      newState.status === previousEventState.status &&
      newState.error === previousEventState.error
    ) {
      return;
    }

    const previousState = previousEventState;
    previousEventState = newState;
    serviceManager.eventBus.fireSync(
      {
        type: BusEventType.MESSAGES_STATE_CHANGE,
        previousState,
        newState,
      },
      serviceManager.instance,
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
      allMessageItemsByID,
    );

    const publicMessagesByID: ObjectMap<PublicMessage> = {};
    assistantMessageState.messageIDs.forEach((id) => {
      publicMessagesByID[id] = derivePublicMessage(
        id,
        state,
        groupedLocalItemIDs,
      );
    });

    // Bound the cache to messages still present so removeMessages/restartConversation don't leak.
    const presentIDs = new Set(assistantMessageState.messageIDs);
    Array.from(cache.keys()).forEach((id) => {
      if (!presentIDs.has(id)) {
        cache.delete(id);
      }
    });

    messages.set(
      Object.freeze(
        unmapMessages(assistantMessageState.messageIDs, publicMessagesByID),
      ) as PublicMessage[],
    );

    const { status: nextStatus, error: nextError } = deriveStatusAndError(
      state,
      groupedLocalItemIDs,
    );
    status.set(nextStatus);
    // Keep the previous error object when the content is unchanged: deriveStatusAndError builds a
    // fresh object each pass, and a new reference would fire MESSAGES_STATE_CHANGE with deep-equal
    // snapshots on every unrelated recompute for as long as the error persists.
    error.set((previous) =>
      previous && nextError && isEqual(previous, nextError)
        ? previous
        : nextError && Object.freeze(nextError),
    );

    maybeFireMessagesStateChangeEvent();
  }

  serviceManager.storeUnsubscribers.push(
    serviceManager.store.subscribe(recompute),
  );
  recompute();

  const messagesState: MessagesStateStores = {
    messages,
    status,
    error,
    getMessagesState: currentEventState,
    getMessage: (messageId: string) => cache.get(messageId)?.publicMessage,
  };
  serviceManager.messagesState = messagesState;
  return messagesState;
}
