/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import * as fs from "fs";
import * as path from "path";

import { toPublicMessage } from "../../../src/chat/sdk/toPublicMessage";
import {
  MessageRequest,
  MessageResponse,
  MessageResponseTypes,
} from "../../../src/types/messaging/Messages";

const MESSAGES_TS_PATH = path.resolve(
  __dirname,
  "../../../src/types/messaging/Messages.ts",
);

function extractInterfaceBody(source: string, interfaceName: string): string {
  const match = source.match(
    new RegExp(`interface ${interfaceName}[^{]*\\{([\\s\\S]*?)\\n\\}`),
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

describe("toPublicMessage", () => {
  describe("regression: @internal field coverage", () => {
    // These tests don't hardcode "these are the only internal fields" as an assumption baked
    // silently into the stripper — they scan Messages.ts itself and assert the *discovered* set
    // equals toPublicMessage's omit list, so a future @internal addition to any of these four
    // interfaces fails here until the stripper (and this test) is updated.
    const messagesSource = fs.readFileSync(MESSAGES_TS_PATH, "utf8");

    it("MessageRequest has exactly one @internal field: ui_state_internal", () => {
      const body = extractInterfaceBody(messagesSource, "MessageRequest");
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(["ui_state_internal"]),
      );
    });

    it("MessageResponse has exactly one @internal field: ui_state_internal", () => {
      const body = extractInterfaceBody(messagesSource, "MessageResponse");
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(["ui_state_internal"]),
      );
    });

    it("MessageRequestHistory has exactly one @internal field: file_upload_status", () => {
      const body = extractInterfaceBody(
        messagesSource,
        "MessageRequestHistory",
      );
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(["file_upload_status"]),
      );
    });

    it("MessageResponseHistory has exactly one @internal field: file_upload_status", () => {
      const body = extractInterfaceBody(
        messagesSource,
        "MessageResponseHistory",
      );
      expect(new Set(extractInternalFieldNames(body))).toEqual(
        new Set(["file_upload_status"]),
      );
    });
  });

  describe("stripping", () => {
    it("strips ui_state_internal and history.file_upload_status from a response", () => {
      const raw: MessageResponse = {
        id: "response-1",
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: "hi" }],
        },
        context: { foo: "bar" },
        thread_id: "thread-1",
        ui_state_internal: { from_history: true },
        history: { timestamp: 12345, file_upload_status: "success" as any },
      };

      const publicMessage = toPublicMessage(raw);

      expect(publicMessage).not.toHaveProperty("ui_state_internal");
      expect(publicMessage.history).not.toHaveProperty("file_upload_status");
      expect(publicMessage.id).toBe("response-1");
      expect(publicMessage.context).toEqual({ foo: "bar" });
      expect(publicMessage.thread_id).toBe("thread-1");
      expect((publicMessage.history as any).timestamp).toBe(12345);
    });

    it("strips ui_state_internal and history.file_upload_status from a request", () => {
      const raw: MessageRequest = {
        id: "request-1",
        input: { text: "hello", message_type: "text" } as any,
        ui_state_internal: { from_history: false },
        history: {
          timestamp: 6789,
          file_upload_status: "success" as any,
        } as any,
      };

      const publicMessage = toPublicMessage(raw);

      expect(publicMessage).not.toHaveProperty("ui_state_internal");
      expect(publicMessage.history).not.toHaveProperty("file_upload_status");
      expect(publicMessage.id).toBe("request-1");
      expect((publicMessage as any).input.text).toBe("hello");
    });

    it("omits history entirely when the source message has none", () => {
      const raw: MessageResponse = {
        id: "no-history",
        output: { generic: [] },
      };

      const publicMessage = toPublicMessage(raw);

      expect(publicMessage.history).toBeUndefined();
    });

    it("overrides output.generic with liveGeneric when provided", () => {
      const raw: MessageResponse = {
        id: "streaming-response",
        output: { generic: [] },
      };
      const liveGeneric = [
        { response_type: MessageResponseTypes.TEXT, text: "partial" },
      ];

      const publicMessage = toPublicMessage(raw, liveGeneric as any);

      expect((publicMessage as MessageResponse).output.generic).toEqual(
        liveGeneric,
      );
    });

    it("uses the stored output.generic when liveGeneric is not provided", () => {
      const raw: MessageResponse = {
        id: "final-response",
        output: {
          generic: [{ response_type: MessageResponseTypes.TEXT, text: "done" }],
        },
      };

      const publicMessage = toPublicMessage(raw);

      expect((publicMessage as MessageResponse).output.generic).toEqual(
        raw.output.generic,
      );
    });
  });
});
