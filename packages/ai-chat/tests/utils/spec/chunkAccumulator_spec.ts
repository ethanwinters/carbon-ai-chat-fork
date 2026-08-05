/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  ChunkAccumulator,
  NO_STREAM_ID_KEY,
} from '../../../src/chat/utils/chunkAccumulator';
import { MessageResponseTypes } from '../../../src/types/messaging/Messages';

const partial = (id: string, text: string) => ({
  response_type: MessageResponseTypes.TEXT,
  text,
  streaming_metadata: { id },
});

describe('ChunkAccumulator', () => {
  it('concatenates partial text into one accumulated item', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('1', 'Hello '));
    const result = acc.applyPartial('r1', partial('1', 'world'));

    expect(result.message.id).toBe('r1');
    expect(result.message.output.generic).toHaveLength(1);
    expect((result.message.output.generic[0] as any).text).toBe('Hello world');
    expect(result.completedItemIDs).toEqual([]);
  });

  it('returns the raw delta as chunkItem, not the accumulation', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('1', 'Hello '));
    const delta = partial('1', 'world');
    const result = acc.applyPartial('r1', delta);

    expect(result.chunkItem).toBe(delta);
  });

  it('keeps items in first-seen order across interleaved streams', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('a', 'A1 '));
    acc.applyPartial('r1', partial('b', 'B1 '));
    const result = acc.applyPartial('r1', partial('a', 'A2'));

    const texts = result.message.output.generic.map((i: any) => i.text);
    expect(texts).toEqual(['A1 A2', 'B1 ']);
  });

  it('complete_item replaces the accumulation and marks the item complete', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('1', 'partial '));
    const result = acc.applyComplete('r1', partial('1', 'The whole text'));

    expect((result.message.output.generic[0] as any).text).toBe(
      'The whole text'
    );
    expect(result.completedItemIDs).toEqual(['r1-1']);
  });

  it('a completed sibling stays completed while another item streams', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('a', 'A'));
    acc.applyComplete('r1', partial('a', 'A done'));
    const result = acc.applyPartial('r1', partial('b', 'B streaming'));

    expect(result.completedItemIDs).toEqual(['r1-a']);
    expect(result.message.output.generic).toHaveLength(2);
  });

  it('merges message_options into every subsequent snapshot', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('1', 'text'));
    acc.mergeMessageOptions('r1', {
      response_user_profile: { id: 'p' },
    } as any);
    const result = acc.snapshot('r1');

    expect(result.message.message_options).toEqual({
      response_user_profile: { id: 'p' },
    });
    expect(result.chunkItem).toBeUndefined();
  });

  it('keys id-less items under the synthetic key', () => {
    const acc = new ChunkAccumulator();
    const result = acc.applyComplete('r1', {
      response_type: MessageResponseTypes.TEXT,
      text: 'Done',
    });

    expect(result.completedItemIDs).toEqual([NO_STREAM_ID_KEY]);
  });

  it('keeps the message timestamp stable across chunks', () => {
    const acc = new ChunkAccumulator();
    const first = acc.applyPartial('r1', partial('1', 'a'));
    const second = acc.applyPartial('r1', partial('1', 'b'));

    expect(second.message.history.timestamp).toBe(
      first.message.history.timestamp
    );
  });

  it('tracks responses independently and clears them independently', () => {
    const acc = new ChunkAccumulator();
    acc.applyPartial('r1', partial('1', 'one'));
    acc.applyPartial('r2', partial('1', 'two'));

    acc.clear('r1');
    expect(acc.has('r1')).toBe(false);
    expect(acc.has('r2')).toBe(true);

    acc.clearAll();
    expect(acc.has('r2')).toBe(false);
  });
});
