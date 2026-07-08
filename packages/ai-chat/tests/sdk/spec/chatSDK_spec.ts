/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import * as loadServicesModule from "../../../src/chat/services/loadServices";
import {
  acquireChatSDK,
  mergePublicConfig,
  performInitialViewChange,
} from "../../../src/chat/sdk/ChatSDK";
import { __resetReuseInstanceRegistry } from "../../../src/chat/services/reuseInstanceRegistry";
import { createBaseTestProps } from "../../test_helpers";
import { BusEventType } from "../../../src/types/events/eventBusTypes";

describe("mergePublicConfig", () => {
  it("merges defaults with provided config", () => {
    const base = createBaseTestProps();
    const publicConfig = mergePublicConfig(base);

    // Defaults applied
    expect(publicConfig.openChatByDefault).toBe(false);
    expect(publicConfig.launcher?.isOn).toBe(true);
    expect(publicConfig.shouldTakeFocusIfOpensAutomatically).toBe(true);

    // Provided fields preserved
    expect(publicConfig.messaging?.customSendMessage).toBe(
      base.messaging?.customSendMessage,
    );
    expect(publicConfig.exposeServiceManagerForTesting).toBe(true);
  });

  it("sets default assistantName to 'watsonx'", () => {
    const base = createBaseTestProps();
    const publicConfig = mergePublicConfig(base);

    expect(publicConfig.assistantName).toBe("watsonx");
  });

  it("preserves custom assistantName when provided", () => {
    const base = createBaseTestProps();
    base.assistantName = "Custom Assistant";
    const publicConfig = mergePublicConfig(base);

    expect(publicConfig.assistantName).toBe("Custom Assistant");
  });

  it("uses default assistantName when not provided", () => {
    const base = createBaseTestProps();
    delete (base as any).assistantName;
    const publicConfig = mergePublicConfig(base);

    expect(publicConfig.assistantName).toBe("watsonx");
  });

  it("allows empty string as assistantName", () => {
    const base = createBaseTestProps();
    base.assistantName = "";
    const publicConfig = mergePublicConfig(base);

    expect(publicConfig.assistantName).toBe("");
  });
});

describe("performInitialViewChange", () => {
  it("opens main window with OPEN_BY_DEFAULT when configured and not from browser", async () => {
    const changeView = jest.fn().mockResolvedValue({ mainWindow: true });

    const fakeServiceManager: any = {
      actions: { changeView },
      store: {
        getState: () => ({
          persistedToBrowserStorage: {
            launcherState: { wasLoadedFromBrowser: false },
          },
          targetViewState: { mainWindow: true },
          config: { public: { openChatByDefault: true } },
        }),
      },
    };

    await performInitialViewChange(fakeServiceManager);
    expect(changeView).toHaveBeenCalledTimes(1);
    const [, options] = changeView.mock.calls[0];
    expect(options).toMatchObject({});
  });

  it("calls changeView with WEB_CHAT_LOADED when main window not targeted", async () => {
    const changeView = jest.fn().mockResolvedValue({ mainWindow: false });

    const fakeServiceManager: any = {
      actions: { changeView },
      store: {
        getState: () => ({
          persistedToBrowserStorage: {
            launcherState: { wasLoadedFromBrowser: true },
          },
          targetViewState: { mainWindow: false },
          config: { public: { openChatByDefault: false } },
        }),
      },
    };

    await performInitialViewChange(fakeServiceManager);
    expect(changeView).toHaveBeenCalledTimes(1);
    const [target, , tryHydrating] = changeView.mock.calls[0];
    expect(target).toEqual({ mainWindow: false });
    expect(tryHydrating).toBe(false);
  });
});

describe("acquireChatSDK", () => {
  beforeEach(() => {
    __resetReuseInstanceRegistry();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    __resetReuseInstanceRegistry();
  });

  it("cold boots: initializes ServiceManager, sets container styles and creates instance (with host element)", async () => {
    const container = document.createElement("div");
    const host = document.createElement("div");

    const publicConfig = mergePublicConfig(createBaseTestProps());

    const { sdk, adopted } = await acquireChatSDK(publicConfig, {
      container,
      customHostElement: host,
    });

    expect(adopted).toBe(false);
    expect(sdk).toBeTruthy();
    expect(sdk.instance).toBeTruthy();
    expect(sdk.serviceManager.instance).toBe(sdk.instance);
    expect(sdk.serviceManager.container).toBe(container);
    expect(sdk.serviceManager.customHostElement).toBe(host);
    expect(sdk.serviceManager.sdk).toBe(sdk);

    expect(
      container.classList.contains("cds-aichat--boot-container--filled"),
    ).toBe(true);
    expect(
      container.classList.contains("cds-aichat--boot-container--collapsed"),
    ).toBe(false);
  });

  it("cold boots with default (collapsed) container styles when no host element provided", async () => {
    const container = document.createElement("div");

    const publicConfig = mergePublicConfig(createBaseTestProps());

    const { sdk } = await acquireChatSDK(publicConfig, { container });

    expect(sdk.serviceManager.customHostElement).toBeUndefined();
    expect(
      container.classList.contains("cds-aichat--boot-container--collapsed"),
    ).toBe(true);
    expect(
      container.classList.contains("cds-aichat--boot-container--filled"),
    ).toBe(false);
  });

  it("cold-boots once, then adopts the same ChatSDK/instance on a reuse remount", async () => {
    const createSM = jest.spyOn(loadServicesModule, "createServiceManager");
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: "acquire-adopt",
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const container1 = document.createElement("div");
    const { sdk: sdk1, adopted: adopted1 } = await acquireChatSDK(
      publicConfig,
      { container: container1 },
    );
    expect(adopted1).toBe(false);
    expect(createSM).toHaveBeenCalledTimes(1);

    sdk1.release();

    const container2 = document.createElement("div");
    const { sdk: sdk2, adopted: adopted2 } = await acquireChatSDK(
      publicConfig,
      { container: container2, customHostElement: container2 },
    );

    expect(adopted2).toBe(true);
    expect(sdk2).toBe(sdk1);
    expect(sdk2.instance).toBe(sdk1.instance);
    expect(createSM).toHaveBeenCalledTimes(1); // no second cold boot
    // `attach` rebinds to the new host.
    expect(sdk2.serviceManager.container).toBe(container2);
    expect(sdk2.serviceManager.customHostElement).toBe(container2);
  });

  it("preserves slot state across an adopted re-acquire", async () => {
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: "acquire-slot-state",
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const { sdk: sdk1 } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });
    await sdk1.serviceManager.fire({
      type: BusEventType.USER_DEFINED_RESPONSE,
      data: {
        slot: "s1",
        fullMessage: { id: "m1" } as any,
        message: { id: "i1" } as any,
      },
    } as any);
    sdk1.release();

    const { sdk: sdk2 } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });

    expect(sdk2.slotStates.userDefinedBySlot.get().s1.messageItem).toEqual({
      id: "i1",
    });
  });

  it("release() past the grace window disposes; the next acquire cold-boots again", async () => {
    const createSM = jest.spyOn(loadServicesModule, "createServiceManager");
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: "acquire-grace",
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 20 },
    };

    const { sdk: sdk1 } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });
    expect(createSM).toHaveBeenCalledTimes(1);

    sdk1.release();
    // Wait past the (short) grace window for the registry's disposal timer to fire.
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(sdk1.serviceManager.disposed).toBe(true);

    const { sdk: sdk2, adopted } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });

    expect(adopted).toBe(false);
    expect(sdk2).not.toBe(sdk1);
    expect(createSM).toHaveBeenCalledTimes(2);
  });

  it("destroy() disposes immediately, skipping the grace window", async () => {
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: "acquire-destroy",
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const { sdk } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });

    sdk.destroy();
    expect(sdk.serviceManager.disposed).toBe(true);

    const createSM = jest.spyOn(loadServicesModule, "createServiceManager");
    const { adopted } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });
    expect(adopted).toBe(false); // nothing left to adopt; cold-boots fresh
    expect(createSM).toHaveBeenCalledTimes(1);
  });

  it("runInitialViewChange() runs once per cold boot", async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { sdk } = await acquireChatSDK(publicConfig, {
      container: document.createElement("div"),
    });

    const changeViewSpy = jest.spyOn(sdk.serviceManager.actions, "changeView");
    await sdk.runInitialViewChange();
    expect(changeViewSpy).toHaveBeenCalledTimes(1);
  });
});
