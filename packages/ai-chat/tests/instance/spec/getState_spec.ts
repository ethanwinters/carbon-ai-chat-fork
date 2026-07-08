/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import * as fs from "fs";
import * as path from "path";

import {
  createBaseConfig,
  renderChatAndGetInstanceWithStore,
  setupAfterEach,
  setupBeforeEach,
} from "../../test_helpers";
import { BusEventType } from "../../../src/types/events/eventBusTypes";
import { ViewType } from "../../../src/types/instance/apiTypes";

function extractInterfaceBody(source: string, interfaceName: string): string {
  const match = source.match(
    new RegExp(`interface ${interfaceName} \\{([\\s\\S]*?)\\n\\}`),
  );
  if (!match) {
    throw new Error(`Could not find interface ${interfaceName} in AppState.ts`);
  }
  return match[1];
}

function extractTopLevelFieldNames(interfaceBody: string): string[] {
  const fieldPattern = /^\s*(\w+)\??:\s/gm;
  const names: string[] = [];
  let match: RegExpExecArray | null = fieldPattern.exec(interfaceBody);
  while (match !== null) {
    names.push(match[1]);
    match = fieldPattern.exec(interfaceBody);
  }
  return names;
}

describe("ChatInstance.getState", () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it("exposes flattened persisted state", async () => {
    const config = createBaseConfig();
    const { instance, store } = await renderChatAndGetInstanceWithStore(config);

    const state = instance.getState();
    const reduxPersisted = store.getState().persistedToBrowserStorage;

    expect(state.version).toBe(reduxPersisted.version);
    expect(state.viewState).toEqual(reduxPersisted.viewState);
    expect(state.showUnreadIndicator).toBe(reduxPersisted.showUnreadIndicator);
    expect(state.humanAgent.isConnected).toBe(
      reduxPersisted.humanAgentState.isConnected,
    );
    expect(state.humanAgent.isSuspended).toBe(
      reduxPersisted.humanAgentState.isSuspended,
    );
    expect(state.humanAgent.isConnecting).toBe(
      store.getState().humanAgentState.isConnecting,
    );
    expect(state).not.toHaveProperty("persistedToBrowserStorage");
  });

  it("freezes the persisted snapshot", async () => {
    const config = createBaseConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const state = instance.getState();

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.humanAgent)).toBe(true);
    expect(() => {
      (state as { showUnreadIndicator: boolean }).showUnreadIndicator = false;
    }).toThrow();
    expect(() => {
      (state.humanAgent as { isConnecting: boolean }).isConnecting = true;
    }).toThrow();
  });

  it("fires STATE_CHANGE event when state changes", async () => {
    const config = createBaseConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const stateChangeEvents: any[] = [];
    instance.on({
      type: BusEventType.STATE_CHANGE,
      handler: (event) => {
        stateChangeEvents.push(event);
      },
    });

    // Change the view state which should trigger STATE_CHANGE
    await instance.changeView("mainWindow" as ViewType);

    // Should have received at least one STATE_CHANGE event
    expect(stateChangeEvents.length).toBeGreaterThan(0);

    const lastEvent = stateChangeEvents[stateChangeEvents.length - 1];
    expect(lastEvent.type).toBe(BusEventType.STATE_CHANGE);
    expect(lastEvent.previousState).toBeDefined();
    expect(lastEvent.newState).toBeDefined();
    expect(lastEvent.newState.viewState.mainWindow).toBe(true);
  });

  it("provides both previous and new state in STATE_CHANGE event", async () => {
    const config = createBaseConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    let stateChangeEvent: any = null;
    instance.on({
      type: BusEventType.STATE_CHANGE,
      handler: (event) => {
        stateChangeEvent = event;
      },
    });

    // Change the unread indicator
    instance.updateAssistantUnreadIndicatorVisibility(true);

    // Should have received the event
    expect(stateChangeEvent).not.toBeNull();
    expect(stateChangeEvent.previousState.showUnreadIndicator).toBe(false);
    expect(stateChangeEvent.newState.showUnreadIndicator).toBe(true);
  });

  it("does not fire STATE_CHANGE event when state does not change", async () => {
    const config = createBaseConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    const stateChangeEvents: any[] = [];
    instance.on({
      type: BusEventType.STATE_CHANGE,
      handler: (event) => {
        stateChangeEvents.push(event);
      },
    });

    const initialCount = stateChangeEvents.length;

    // Try to set the same unread indicator value
    instance.updateAssistantUnreadIndicatorVisibility(false);
    instance.updateAssistantUnreadIndicatorVisibility(false);

    // Should not have fired additional events for unchanged state
    expect(stateChangeEvents.length).toBe(initialCount);
  });

  it("STATE_CHANGE event state is frozen", async () => {
    const config = createBaseConfig();
    const { instance } = await renderChatAndGetInstanceWithStore(config);

    let stateChangeEvent: any = null;
    instance.on({
      type: BusEventType.STATE_CHANGE,
      handler: (event) => {
        stateChangeEvent = event;
      },
    });

    // Trigger a state change
    instance.updateAssistantUnreadIndicatorVisibility(true);

    // Both previous and new states should be frozen
    expect(Object.isFrozen(stateChangeEvent.previousState)).toBe(true);
    expect(Object.isFrozen(stateChangeEvent.newState)).toBe(true);
  });

  describe("field allowlist", () => {
    it("spreads exactly the known-safe PersistedState fields into PublicChatState", () => {
      // getPublicChatState() destructures `humanAgentState` out separately and spreads everything
      // else from `persistedToBrowserStorage` via `...rest` — an implicit allowlist-by-omission.
      // This test makes that allowlist explicit: if PersistedState grows a new field, this list
      // must be consciously updated (and the new field audited for whether it's safe to expose)
      // instead of silently riding through the spread into the public surface.
      const appStateSource = fs.readFileSync(
        path.resolve(__dirname, "../../../src/types/state/AppState.ts"),
        "utf8",
      );
      const persistedStateBody = extractInterfaceBody(
        appStateSource,
        "PersistedState",
      );
      const fieldNames = extractTopLevelFieldNames(persistedStateBody);

      const knownSafeFields = [
        "wasLoadedFromBrowser",
        "version",
        "viewState",
        "showUnreadIndicator",
        "launcherIsExpanded",
        "launcherShouldStartCallToActionCounterIfEnabled",
        "hasSentNonWelcomeMessage",
        "disclaimersAccepted",
        "homeScreenState",
        "humanAgentState",
      ];

      expect(new Set(fieldNames)).toEqual(new Set(knownSafeFields));
    });
  });
});
