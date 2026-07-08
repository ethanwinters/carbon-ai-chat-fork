/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  createBaseConfig,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from "../../test_helpers";
import { attachMessagesStateTracking } from "../../../src/chat/sdk/messagesState";
import { ConversationStatus } from "../../../src/types/messaging/ConversationState";
import { MessageErrorState } from "../../../src/types/messaging/LocalMessageItem";
import { MessageResponseTypes } from "../../../src/types/messaging/Messages";
import actions from "../../../src/chat/store/actions";

describe("attachMessagesStateTracking", () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it("is idempotent: a second attach on the same manager returns the same object", async () => {
    const config = createBaseConfig();
    const { serviceManager } = await renderChatAndGetInstanceWithStore(config);

    const first = serviceManager.messagesState;
    const second = attachMessagesStateTracking(serviceManager);

    expect(second).toBe(first);
  });

  describe("messages", () => {
    it("strips internal fields from seeded history", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.insertHistory([
        {
          message: {
            id: "req-1",
            input: { text: "hi", message_type: "text" } as any,
          },
          time: new Date().toISOString(),
        },
        {
          message: {
            id: "resp-1",
            output: {
              generic: [
                { response_type: MessageResponseTypes.TEXT, text: "hello" },
              ],
            },
          },
          time: new Date().toISOString(),
        },
      ]);

      const messages = serviceManager.messagesState.messages.get();
      const request = messages.find((m) => m.id === "req-1");
      const response = messages.find((m) => m.id === "resp-1");

      expect(request).not.toHaveProperty("ui_state_internal");
      expect(response).not.toHaveProperty("ui_state_internal");
      expect((response as any).output.generic[0].text).toBe("hello");
    });

    it("keeps unrelated messages reference-stable across an unrelated CHANGE_STATE dispatch", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.insertHistory([
        {
          message: {
            id: "stable-req",
            input: { text: "hi", message_type: "text" } as any,
          },
          time: new Date().toISOString(),
        },
      ]);

      const before = serviceManager.messagesState.messages.get();

      // An unrelated CHANGE_STATE dispatch (a non-config key) deep-clones the whole tree
      // (reducers.ts CHANGE_STATE), handing allMessagesByID/assistantMessageState fresh-but-equal
      // references — the derivation must fall back to a content compare rather than rebuild.
      store.dispatch(actions.changeState({ chatWidth: 999 } as any));

      const after = serviceManager.messagesState.messages.get();

      expect(after).toBe(before);
    });

    it("keeps other turns reference-stable while one response streams", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage({
        id: "unrelated-response",
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: "unrelated" },
          ],
        },
      });

      const beforeStreaming = serviceManager.messagesState.messages.get();
      const unrelatedBefore = beforeStreaming.find(
        (m) => m.id === "unrelated-response",
      );

      const responseId = "streaming-response";
      const itemId = "item-1";
      const chunks = ["Hello ", "world", "!"];
      for (const text of chunks) {
        // eslint-disable-next-line no-await-in-loop
        await instance.messaging.addMessageChunk({
          streaming_metadata: { response_id: responseId },
          partial_item: {
            streaming_metadata: { id: itemId },
            response_type: MessageResponseTypes.TEXT,
            text,
          },
        });

        const current = serviceManager.messagesState.messages.get();
        const unrelatedNow = current.find((m) => m.id === "unrelated-response");
        expect(unrelatedNow).toBe(unrelatedBefore);
      }
    });
  });

  describe("status", () => {
    it("is STREAMING while a response is mid-stream", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: "streaming-status" },
        partial_item: {
          streaming_metadata: { id: "item-1" },
          response_type: MessageResponseTypes.TEXT,
          text: "partial",
        },
      });

      expect(serviceManager.messagesState.status.get()).toBe(
        ConversationStatus.STREAMING,
      );
    });

    it("returns to READY once the response finalizes", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      const responseId = "finalize-status";
      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseId },
        partial_item: {
          streaming_metadata: { id: "item-1" },
          response_type: MessageResponseTypes.TEXT,
          text: "partial",
        },
      });
      expect(serviceManager.messagesState.status.get()).toBe(
        ConversationStatus.STREAMING,
      );

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseId },
        final_response: {
          id: responseId,
          output: {
            generic: [
              {
                response_type: MessageResponseTypes.TEXT,
                text: "partial done",
              },
            ],
          },
        },
      } as any);

      expect(serviceManager.messagesState.status.get()).toBe(
        ConversationStatus.READY,
      );
    });
  });

  describe("error", () => {
    it("reports a catastrophic error and takes precedence over a message error", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage({
        id: "failed-response",
        output: { generic: [] },
      });
      store.dispatch(
        actions.setMessageErrorState(
          "failed-response",
          MessageErrorState.FAILED,
        ),
      );
      store.dispatch(actions.setActiveResponseId("failed-response"));

      instance.updateCatastrophicErrorPanel({
        isOpen: true,
        title: "Catastrophic",
        bodyText: "Cannot recover",
      });

      expect(serviceManager.messagesState.status.get()).toBe(
        ConversationStatus.ERROR,
      );
      expect(serviceManager.messagesState.error.get()).toEqual({
        kind: "catastrophic",
        title: "Catastrophic",
        bodyText: "Cannot recover",
      });
    });

    it("reports a message-level error for the active response", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage({
        id: "failed-response-2",
        output: { generic: [] },
      });
      store.dispatch(
        actions.setMessageErrorState(
          "failed-response-2",
          MessageErrorState.FAILED_WHILE_STREAMING,
        ),
      );
      store.dispatch(actions.setActiveResponseId("failed-response-2"));

      expect(serviceManager.messagesState.status.get()).toBe(
        ConversationStatus.ERROR,
      );
      expect(serviceManager.messagesState.error.get()).toEqual({
        kind: "message",
        messageId: "failed-response-2",
        errorState: MessageErrorState.FAILED_WHILE_STREAMING,
      });
    });

    it("maps RETRYING/WAITING to SUBMITTED, not ERROR", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage({
        id: "retrying-response",
        output: { generic: [] },
      });
      store.dispatch(
        actions.setMessageErrorState(
          "retrying-response",
          MessageErrorState.RETRYING,
        ),
      );
      store.dispatch(actions.setActiveResponseId("retrying-response"));

      expect(serviceManager.messagesState.status.get()).toBe(
        ConversationStatus.SUBMITTED,
      );
      expect(serviceManager.messagesState.error.get()).toBeNull();
    });
  });

  describe("getMessage", () => {
    it("looks up a single message by id", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage({
        id: "lookup-me",
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: "found me" },
          ],
        },
      });

      const found = serviceManager.messagesState.getMessage("lookup-me");
      expect(found).toBeDefined();
      expect((found as any).output.generic[0].text).toBe("found me");

      expect(
        serviceManager.messagesState.getMessage("no-such-id"),
      ).toBeUndefined();
    });
  });

  describe("streaming content", () => {
    it("accumulates partial_item chunks into the public snapshot", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      const responseId = "accumulating-response";
      const chunks = ["Hello ", "world", "!"];
      let expected = "";
      for (const text of chunks) {
        // eslint-disable-next-line no-await-in-loop
        await instance.messaging.addMessageChunk({
          streaming_metadata: { response_id: responseId },
          partial_item: {
            streaming_metadata: { id: "item-1" },
            response_type: MessageResponseTypes.TEXT,
            text,
          },
        });
        expected += text;

        const streaming = serviceManager.messagesState
          .getMessagesState()
          .messages.find((m) => m.id === responseId);
        expect((streaming as any).output.generic[0].text).toBe(expected);
      }

      await instance.messaging.addMessageChunk({
        streaming_metadata: { response_id: responseId },
        final_response: {
          id: responseId,
          output: {
            generic: [
              { response_type: MessageResponseTypes.TEXT, text: "final text" },
            ],
          },
        },
      } as any);

      const finalized = serviceManager.messagesState
        .getMessagesState()
        .messages.find((m) => m.id === responseId);
      expect((finalized as any).output.generic[0].text).toBe("final text");
    });
  });

  describe("snapshot integrity", () => {
    it("keeps the error object reference-stable across unrelated dispatches", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager, store } =
        await renderChatAndGetInstanceWithStore(config);

      instance.updateCatastrophicErrorPanel({
        isOpen: true,
        title: "Catastrophic",
        bodyText: "Cannot recover",
      });
      const firstError = serviceManager.messagesState.error.get();
      expect(firstError).not.toBeNull();

      store.dispatch(actions.changeState({ chatWidth: 999 } as any));

      expect(serviceManager.messagesState.error.get()).toBe(firstError);
    });

    it("freezes the snapshot layers it creates", async () => {
      const config = createBaseConfig();
      const { instance, serviceManager } =
        await renderChatAndGetInstanceWithStore(config);

      await instance.messaging.addMessage({
        id: "frozen-response",
        output: {
          generic: [
            { response_type: MessageResponseTypes.TEXT, text: "frozen" },
          ],
        },
      });

      const snapshot = serviceManager.messagesState.getMessagesState();
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.messages)).toBe(true);

      const response = snapshot.messages.find(
        (m) => m.id === "frozen-response",
      ) as any;
      expect(Object.isFrozen(response)).toBe(true);
      expect(Object.isFrozen(response.output)).toBe(true);
      expect(Object.isFrozen(response.output.generic)).toBe(true);
    });
  });
});
