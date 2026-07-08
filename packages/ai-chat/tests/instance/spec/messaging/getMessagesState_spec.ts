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
  renderChatAndGetInstance,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from "../../../test_helpers";
import { BusEventType } from "../../../../src/types/events/eventBusTypes";
import { ConversationStatus } from "../../../../src/types/messaging/ConversationState";
import { MessageResponseTypes } from "../../../../src/types/messaging/Messages";

describe("ChatInstance.messaging.getMessagesState / getMessage", () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it("exposes getMessagesState and getMessage as functions", async () => {
    const config = createBaseConfig();
    const instance = await renderChatAndGetInstance(config);

    expect(typeof instance.messaging.getMessagesState).toBe("function");
    expect(typeof instance.messaging.getMessage).toBe("function");
  });

  it("returns an empty, ready snapshot before any message is sent", async () => {
    const config = createBaseConfig();
    const instance = await renderChatAndGetInstance(config);

    const snapshot = instance.messaging.getMessagesState();

    expect(snapshot.messages).toEqual([]);
    expect(snapshot.status).toBe(ConversationStatus.READY);
    expect(snapshot.error).toBeNull();
  });

  it("reflects an added message in both getMessagesState and getMessage", async () => {
    const config = createBaseConfig();
    const instance = await renderChatAndGetInstance(config);

    await instance.messaging.addMessage({
      id: "public-message-1",
      output: {
        generic: [
          { response_type: MessageResponseTypes.TEXT, text: "hi there" },
        ],
      },
    });

    const snapshot = instance.messaging.getMessagesState();
    const viaGetMessage = instance.messaging.getMessage("public-message-1");

    expect(snapshot.messages.map((m) => m.id)).toContain("public-message-1");
    expect(viaGetMessage).toBeDefined();
    expect(viaGetMessage).toBe(
      snapshot.messages.find((m) => m.id === "public-message-1"),
    );
    expect(instance.messaging.getMessage("does-not-exist")).toBeUndefined();
  });

  it("fires MESSAGES_STATE_CHANGE when a message is added", async () => {
    const config = createBaseConfig();
    const instance = await renderChatAndGetInstance(config);

    const events: any[] = [];
    instance.on({
      type: BusEventType.MESSAGES_STATE_CHANGE,
      handler: (event) => {
        events.push(event);
      },
    });

    await instance.messaging.addMessage({
      id: "event-message-1",
      output: {
        generic: [
          { response_type: MessageResponseTypes.TEXT, text: "event test" },
        ],
      },
    });

    expect(events.length).toBeGreaterThan(0);
    const lastEvent = events[events.length - 1];
    expect(lastEvent.type).toBe(BusEventType.MESSAGES_STATE_CHANGE);
    expect(lastEvent.previousState).toBeDefined();
    expect(lastEvent.newState).toBeDefined();
    expect(lastEvent.newState.messages.map((m: any) => m.id)).toContain(
      "event-message-1",
    );
  });

  it("does not fire MESSAGES_STATE_CHANGE for a change with no messaging effect", async () => {
    const config = createBaseConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const events: any[] = [];
    instance.on({
      type: BusEventType.MESSAGES_STATE_CHANGE,
      handler: (event) => {
        events.push(event);
      },
    });

    // Unlike changeView (which can trigger the welcome-message flow on a fresh chat and
    // legitimately touch messaging state), this toggles a persisted flag with no messaging effect.
    instance.updateAssistantUnreadIndicatorVisibility(true);

    expect(events.length).toBe(0);
  });

  it("does not extend getState()/PublicChatState with message data", async () => {
    const config = createBaseConfig();
    const instance = await renderChatAndGetInstance(config);

    const messagesStateEvents: any[] = [];
    const stateChangeEvents: any[] = [];
    instance.on([
      {
        type: BusEventType.MESSAGES_STATE_CHANGE,
        handler: (event) => messagesStateEvents.push(event),
      },
      {
        type: BusEventType.STATE_CHANGE,
        handler: (event) => stateChangeEvents.push(event),
      },
    ]);

    await instance.messaging.addMessage({
      id: "independence-check",
      output: {
        generic: [
          { response_type: MessageResponseTypes.TEXT, text: "independent" },
        ],
      },
    });

    expect(messagesStateEvents.length).toBeGreaterThan(0);
    // isMessageLoadingCounter is legitimately shared between the two events (addMessage ends
    // the loading indicator), so STATE_CHANGE may also fire — but its PublicChatState payload
    // must never carry a `messages` field; that surface is MESSAGES_STATE_CHANGE-only.
    stateChangeEvents.forEach((event) => {
      expect(event.newState).not.toHaveProperty("messages");
      expect(event.previousState).not.toHaveProperty("messages");
    });
  });
});
