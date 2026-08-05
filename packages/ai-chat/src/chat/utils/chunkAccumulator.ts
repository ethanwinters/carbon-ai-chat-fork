/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  GenericItem,
  MessageResponse,
  MessageResponseOptions,
} from '../../types/messaging/Messages';
import { DeepPartial } from '../../types/utilities/DeepPartial';
import { streamItemID } from './messageUtils';

/**
 * Chunks are allowed to omit `streaming_metadata.id`; the old reducer keyed those under
 * a literal `null`. Give them a stable synthetic key instead — the practical contract is
 * "an id-less stream has one item".
 */
const NO_STREAM_ID_KEY = '__aichat_no_stream_id__';

/**
 * SPIKE (chunk facade): assembles whole-message snapshots from `addMessageChunk` deltas
 * so the chunk API can drive the same store pipeline as `upsertMessage`.
 *
 * The chunk contract sends deltas — partial items whose `text` concatenates, complete
 * items that replace, and per-chunk `message_options` merges. The upsert pipeline
 * consumes whole `MessageResponse` snapshots. This module owns the delta → snapshot
 * translation and nothing else: no store access, no events, no framework imports, so it
 * is unit-testable alone.
 */

interface AccumulatedItem {
  /** The accumulated item — text concatenated, other fields latest-wins. */
  item: DeepPartial<GenericItem>;

  /** Raw deltas in arrival order, preserved for the `streamingState.chunks` contract. */
  chunks: DeepPartial<GenericItem>[];

  /** True once a `complete_item` replaced this item. */
  complete: boolean;
}

interface AccumulatorEntry {
  /** Stream item ids in first-seen order — the order items render in. */
  order: string[];

  itemsByStreamID: Map<string, AccumulatedItem>;

  messageOptions: MessageResponseOptions | undefined;

  /**
   * Set once when the response first appears and reused on every snapshot, so the
   * message's timestamp does not drift chunk by chunk.
   */
  timestamp: number;
}

/**
 * The result of applying one chunk: the whole-message snapshot to dispatch, plus the
 * detail the reducer needs to keep per-item streaming state faithful to the chunk
 * contract.
 */
interface ApplyResult {
  message: MessageResponse;

  /** The raw delta just applied, so the reducer can append it to `streamingState.chunks`. */
  chunkItem: DeepPartial<GenericItem> | undefined;

  /** Local item ids (streamItemID form) whose items have received their complete_item. */
  completedItemIDs: string[];
}

class ChunkAccumulator {
  private byResponseID = new Map<string, AccumulatorEntry>();

  private entryFor(responseID: string): AccumulatorEntry {
    let entry = this.byResponseID.get(responseID);
    if (!entry) {
      entry = {
        order: [],
        itemsByStreamID: new Map(),
        messageOptions: undefined,
        timestamp: Date.now(),
      };
      this.byResponseID.set(responseID, entry);
    }
    return entry;
  }

  /**
   * Applies a `partial_item` delta: text concatenates, everything else latest-wins.
   */
  applyPartial(
    responseID: string,
    partialItem: DeepPartial<GenericItem>
  ): ApplyResult {
    const entry = this.entryFor(responseID);
    const streamID = streamItemID(responseID, partialItem) ?? NO_STREAM_ID_KEY;

    let acc = entry.itemsByStreamID.get(streamID);
    if (!acc) {
      acc = {
        item: { ...partialItem },
        chunks: [partialItem],
        complete: false,
      };
      entry.itemsByStreamID.set(streamID, acc);
      entry.order.push(streamID);
    } else {
      const prevText = (acc.item as { text?: string }).text;
      const deltaText = (partialItem as { text?: string }).text;
      acc.item = {
        ...acc.item,
        ...partialItem,
        ...(typeof prevText === 'string' || typeof deltaText === 'string'
          ? { text: `${prevText ?? ''}${deltaText ?? ''}` }
          : {}),
      };
      acc.chunks = [...acc.chunks, partialItem];
    }

    return this.result(responseID, entry, partialItem);
  }

  /**
   * Applies a `complete_item`: the authoritative whole item, replacing the accumulation.
   */
  applyComplete(
    responseID: string,
    completeItem: DeepPartial<GenericItem>
  ): ApplyResult {
    const entry = this.entryFor(responseID);
    const streamID = streamItemID(responseID, completeItem) ?? NO_STREAM_ID_KEY;

    let acc = entry.itemsByStreamID.get(streamID);
    if (!acc) {
      acc = { item: completeItem, chunks: [], complete: true };
      entry.itemsByStreamID.set(streamID, acc);
      entry.order.push(streamID);
    } else {
      acc.item = completeItem;
      acc.complete = true;
    }

    return this.result(responseID, entry, completeItem);
  }

  /**
   * Merges `partial_response.message_options` the way the old
   * STREAMING_MERGE_MESSAGE_OPTIONS reducer did — shallow, latest wins.
   */
  mergeMessageOptions(
    responseID: string,
    options: DeepPartial<MessageResponseOptions>
  ): void {
    const entry = this.entryFor(responseID);
    entry.messageOptions = {
      ...entry.messageOptions,
      ...(options as MessageResponseOptions),
    };
  }

  /**
   * True when this response id has accumulated anything — i.e. the chunk facade is
   * driving it.
   */
  has(responseID: string): boolean {
    return this.byResponseID.has(responseID);
  }

  /**
   * The current snapshot with no delta applied — for options-only chunks, which must
   * still reach the store.
   */
  snapshot(responseID: string): ApplyResult {
    const entry = this.entryFor(responseID);
    return this.result(responseID, entry, undefined);
  }

  /** Drops one response's accumulation (final_response arrived, or cancelled). */
  clear(responseID: string): void {
    this.byResponseID.delete(responseID);
  }

  /** Drops everything (restart / destroy). */
  clearAll(): void {
    this.byResponseID.clear();
  }

  private result(
    responseID: string,
    entry: AccumulatorEntry,
    chunkItem: DeepPartial<GenericItem> | undefined
  ): ApplyResult {
    const message: MessageResponse = {
      id: responseID,
      output: {
        generic: entry.order.map(
          (id) => entry.itemsByStreamID.get(id).item as GenericItem
        ),
      },
      history: { timestamp: entry.timestamp },
      ...(entry.messageOptions
        ? { message_options: entry.messageOptions }
        : {}),
    };

    const completedItemIDs = entry.order.filter(
      (id) => entry.itemsByStreamID.get(id).complete
    );

    return { message, chunkItem, completedItemIDs };
  }
}

export { ChunkAccumulator, NO_STREAM_ID_KEY };
export type { ApplyResult };
