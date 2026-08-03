/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import * as fs from 'fs';
import * as path from 'path';

import { toSnapshotMessage } from '../../../src/chat/sdk/toSnapshotMessage';
import {
  MessageRequest,
  MessageResponse,
  MessageResponseTypes,
} from '../../../src/types/messaging/Messages';

const MESSAGES_TS_PATH = path.resolve(
  __dirname,
  '../../../src/types/messaging/Messages.ts'
);

function extractInterfaceBody(source: string, interfaceName: string): string {
  const match = source.match(
    new RegExp(`interface ${interfaceName}[^{]*\\{([\\s\\S]*?)\\n\\}`)
  );
  if (!match) {
    throw new Error(`Could not find interface ${interfaceName} in Messages.ts`);
  }
  return match[1];
}

function extractInternalFieldNames(interfaceBody: string): string[] {
  const internalFieldPattern =
    /\/\*\*[\s\S]*?@internal[\s\S]*?\*\/\s*\n\s*(\w+)\??:/g;
  const names: string[] = [];
  let match: RegExpExecArray | null = internalFieldPattern.exec(interfaceBody);
  while (match !== null) {
    names.push(match[1]);
    match = internalFieldPattern.exec(interfaceBody);
  }
  return names;
}

describe('toSnapshotMessage', () => {
  describe('regression: @internal field coverage', () => {
    // The snapshot is typed as plain `Message`, so no `Omit<>` documents which fields get dropped —
    // this stripper is the only thing keeping them out of a consumer's hands at runtime. These
    // tests therefore don't hardcode "these are the only internal fields" as an assumption baked
    // silently into it: they scan Messages.ts itself and assert the discovered set equals what
    // toSnapshotMessage omits, so a future @internal addition to any of these four interfaces fails
    // here until the stripper is updated to match.
    const messagesSource = fs.readFileSync(MESSAGES_TS_PATH, 'utf8');

    it('MessageRequest has exactly one @internal field: ui_state_internal', () => {
      const body = extractInterfaceBody(messagesSource, 'MessageRequest');
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(['ui_state_internal'])
      );
    });

    it('MessageResponse has exactly one @internal field: ui_state_internal', () => {
      const body = extractInterfaceBody(messagesSource, 'MessageResponse');
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(['ui_state_internal'])
      );
    });

    it('MessageRequestHistory has exactly one @internal field: file_upload_status', () => {
      const body = extractInterfaceBody(
        messagesSource,
        'MessageRequestHistory'
      );
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(['file_upload_status'])
      );
    });

    it('MessageResponseHistory has exactly one @internal field: file_upload_status', () => {
      const body = extractInterfaceBody(
        messagesSource,
        'MessageResponseHistory'
      );
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(['file_upload_status'])
      );
    });
  });

  describe('stripping', () => {
    it('strips ui_state_internal and history.file_upload_status from a response', () => {
      const raw: MessageResponse = {
        id: 'response-1',
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: 'hi' }],
        },
        context: { foo: 'bar' },
        thread_id: 'thread-1',
        ui_state_internal: { from_history: true },
        history: { timestamp: 12345, file_upload_status: 'success' as any },
      };

      const snapshotMessage = toSnapshotMessage(raw);

      expect(snapshotMessage).not.toHaveProperty('ui_state_internal');
      expect(snapshotMessage.history).not.toHaveProperty('file_upload_status');
      expect(snapshotMessage.id).toBe('response-1');
      expect(snapshotMessage.context).toEqual({ foo: 'bar' });
      expect(snapshotMessage.thread_id).toBe('thread-1');
      expect((snapshotMessage.history as any).timestamp).toBe(12345);
    });

    it('strips ui_state_internal and history.file_upload_status from a request', () => {
      const raw: MessageRequest = {
        id: 'request-1',
        input: { text: 'hello', message_type: 'text' } as any,
        ui_state_internal: { from_history: false },
        history: {
          timestamp: 6789,
          file_upload_status: 'success' as any,
        } as any,
      };

      const snapshotMessage = toSnapshotMessage(raw);

      expect(snapshotMessage).not.toHaveProperty('ui_state_internal');
      expect(snapshotMessage.history).not.toHaveProperty('file_upload_status');
      expect(snapshotMessage.id).toBe('request-1');
      expect((snapshotMessage as any).input.text).toBe('hello');
    });

    it('omits history entirely when the source message has none', () => {
      const raw: MessageResponse = {
        id: 'no-history',
        output: { generic: [] },
      };

      const snapshotMessage = toSnapshotMessage(raw);

      expect(snapshotMessage.history).toBeUndefined();
    });

    it('overrides output.generic with liveGeneric when provided', () => {
      const raw: MessageResponse = {
        id: 'streaming-response',
        output: { generic: [] },
      };
      const liveGeneric = [
        { response_type: MessageResponseTypes.TEXT, text: 'partial' },
      ];

      const snapshotMessage = toSnapshotMessage(raw, liveGeneric as any);

      expect((snapshotMessage as MessageResponse).output.generic).toEqual(
        liveGeneric
      );
    });

    it('uses the stored output.generic when liveGeneric is not provided', () => {
      const raw: MessageResponse = {
        id: 'final-response',
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: 'done' }],
        },
      };

      const snapshotMessage = toSnapshotMessage(raw);

      expect((snapshotMessage as MessageResponse).output.generic).toEqual(
        raw.output.generic
      );
    });
  });

  describe('freezing', () => {
    it('freezes the whole snapshot, down through the generic items', () => {
      const genericItem = {
        response_type: MessageResponseTypes.TEXT,
        text: 'hi',
      };
      const raw: MessageResponse = {
        id: 'frozen-response',
        output: { generic: [genericItem] },
        history: { timestamp: 1 } as any,
      };

      const snapshotMessage = toSnapshotMessage(raw) as MessageResponse;

      expect(Object.isFrozen(snapshotMessage)).toBe(true);
      expect(Object.isFrozen(snapshotMessage.history)).toBe(true);
      expect(Object.isFrozen(snapshotMessage.output)).toBe(true);
      expect(Object.isFrozen(snapshotMessage.output.generic)).toBe(true);
      expect(Object.isFrozen(snapshotMessage.output.generic[0])).toBe(true);
    });

    it('clones content rather than freezing the store objects it came from', () => {
      // Reducers build these items unfrozen and keep using them. Freezing them in place would
      // freeze live store state, so the snapshot has to own its own copy.
      const genericItem = {
        response_type: MessageResponseTypes.TEXT,
        text: 'hi',
        nested: { deep: 'value' },
      };
      const raw: MessageResponse = {
        id: 'cloned-response',
        output: { generic: [genericItem] },
      };

      const snapshotMessage = toSnapshotMessage(raw) as MessageResponse;

      expect(snapshotMessage.output.generic[0]).not.toBe(genericItem);
      expect(snapshotMessage.output.generic[0]).toEqual(genericItem);
      expect(Object.isFrozen(genericItem)).toBe(false);
      expect(Object.isFrozen(genericItem.nested)).toBe(false);
    });

    it('freezes nested structures inside a generic item', () => {
      const raw: MessageResponse = {
        id: 'nested-response',
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.TEXT,
              text: 'hi',
              nested: { deep: 'value' },
            } as any,
          ],
        },
      };

      const snapshotMessage = toSnapshotMessage(raw) as MessageResponse;

      expect(
        Object.isFrozen((snapshotMessage.output.generic[0] as any).nested)
      ).toBe(true);
    });

    it('freezes a request down through its nested input', () => {
      const raw = {
        id: 'frozen-request',
        input: { text: 'hello', nested: { deep: 'value' } },
      } as any;

      const snapshotMessage = toSnapshotMessage(raw) as any;

      expect(Object.isFrozen(snapshotMessage)).toBe(true);
      expect(Object.isFrozen(snapshotMessage.input)).toBe(true);
      expect(Object.isFrozen(snapshotMessage.input.nested)).toBe(true);
      expect(snapshotMessage.input).not.toBe(raw.input);
    });
  });

  describe('output preservation', () => {
    it('keeps host output fields other than generic', () => {
      // The snapshot hands the host back its own message. Rebuilding `output` from scratch dropped
      // anything it round-tripped alongside `generic`.
      const raw = {
        id: 'extra-output-response',
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: 'hi' }],
          debug: { turn: 3 },
        },
      } as any;

      const snapshotMessage = toSnapshotMessage(raw) as any;

      expect(Object.keys(snapshotMessage.output)).toContain('debug');
      expect(snapshotMessage.output.debug).toEqual({ turn: 3 });
    });
  });
});
