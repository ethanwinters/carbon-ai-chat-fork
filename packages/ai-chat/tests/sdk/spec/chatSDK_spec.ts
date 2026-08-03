/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import * as loadServicesModule from '../../../src/chat/services/loadServices';
import {
  acquireChatForShell,
  acquireChatSDK,
  performInitialViewChange,
} from '../../../src/chat/sdk/ChatSDK';
import { mergePublicConfig } from '../../../src/chat/boot/appBoot';
import { __resetReuseInstanceRegistry } from '../../../src/chat/services/reuseInstanceRegistry';
import { createBaseTestProps } from '../../test_helpers';
import { BusEventType } from '../../../src/types/events/eventBusTypes';

describe('performInitialViewChange', () => {
  it('opens main window with OPEN_BY_DEFAULT when configured and not from browser', async () => {
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

  it('calls changeView with WEB_CHAT_LOADED when main window not targeted', async () => {
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

describe('acquireChatSDK', () => {
  beforeEach(() => {
    __resetReuseInstanceRegistry();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    __resetReuseInstanceRegistry();
  });

  it('cold boots: initializes the ServiceManager and creates the instance', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());

    const { chat, adopted, serviceManager } =
      await acquireChatForShell(publicConfig);

    expect(adopted).toBe(false);
    expect(chat).toBeTruthy();
    expect(serviceManager.instance).toBeTruthy();

    // The handle delegates to the instance rather than copying it, so core members are the very
    // same objects reached through either.
    expect(chat.messaging).toBe(serviceManager.instance.messaging);

    // The core does not hold a reference to the lifecycle layer (that would invert the layering).
    // Instead cold boot installs a bare teardown hook that routes back through destroyChat().
    expect(typeof serviceManager.onDestroy).toBe('function');
    serviceManager.onDestroy!();
    expect(serviceManager.disposed).toBe(true);
  });

  it('keeps release() off the instance handed to host code', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    // The whole point of the extension: app code holding a plain ChatInstance — from
    // customSendMessage, an event handler, or the shells' onAttach — cannot grace-release a
    // manager the acquiring owner is managing.
    expect(typeof chat.release).toBe('function');
    expect('release' in serviceManager.instance).toBe(false);
  });

  it('acquireChatSDK resolves to the handle itself, with no envelope', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());

    const chat = await acquireChatSDK(publicConfig);

    expect(typeof chat.release).toBe('function');
    expect(typeof chat.messaging.addMessage).toBe('function');
    expect(chat).not.toHaveProperty('adopted');
    expect(chat).not.toHaveProperty('chat');
  });

  it('cold-boots once, then adopts the same handle/instance on a reuse remount', async () => {
    const createSM = jest.spyOn(loadServicesModule, 'createServiceManager');
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: 'acquire-adopt',
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const { chat: chat1, adopted: adopted1 } =
      await acquireChatForShell(publicConfig);
    expect(adopted1).toBe(false);
    expect(createSM).toHaveBeenCalledTimes(1);

    chat1.release();

    const {
      chat: chat2,
      adopted: adopted2,
      serviceManager: manager2,
    } = await acquireChatForShell(publicConfig);

    expect(adopted2).toBe(true);
    expect(chat2).toBe(chat1);
    expect(chat2.messaging).toBe(manager2.instance.messaging);
    expect(createSM).toHaveBeenCalledTimes(1); // no second cold boot
  });

  it('preserves slot state across an adopted re-acquire', async () => {
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: 'acquire-slot-state',
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const { chat: chat1, serviceManager: manager1 } =
      await acquireChatForShell(publicConfig);
    await manager1.fire({
      type: BusEventType.USER_DEFINED_RESPONSE,
      data: {
        slot: 's1',
        fullMessage: { id: 'm1' } as any,
        message: { id: 'i1' } as any,
      },
    } as any);
    chat1.release();

    const { serviceManager: manager2 } =
      await acquireChatForShell(publicConfig);

    expect(manager2.slotStates.userDefinedBySlot.get().s1.messageItem).toEqual({
      id: 'i1',
    });
  });

  it('release() past the grace window disposes; the next acquire cold-boots again', async () => {
    const createSM = jest.spyOn(loadServicesModule, 'createServiceManager');
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: 'acquire-grace',
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 20 },
    };

    const { chat: chat1, serviceManager: manager1 } =
      await acquireChatForShell(publicConfig);
    expect(createSM).toHaveBeenCalledTimes(1);

    chat1.release();
    // Wait past the (short) grace window for the registry's disposal timer to fire.
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(manager1.disposed).toBe(true);

    const { chat: chat2, adopted } = await acquireChatForShell(publicConfig);

    expect(adopted).toBe(false);
    expect(chat2).not.toBe(chat1);
    expect(createSM).toHaveBeenCalledTimes(2);
  });

  it('destroy() disposes immediately, skipping the grace window', async () => {
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: 'acquire-destroy',
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    chat.destroy();
    expect(serviceManager.disposed).toBe(true);

    const createSM = jest.spyOn(loadServicesModule, 'createServiceManager');
    const { adopted } = await acquireChatForShell(publicConfig);
    expect(adopted).toBe(false); // nothing left to adopt; cold-boots fresh
    expect(createSM).toHaveBeenCalledTimes(1);
  });

  it('updateConfig() after destroy() resolves and changes nothing', async () => {
    // Teardown leaves the store and the human-agent service in place, so without the same
    // `disposed` guard release()/destroy() carry, a late update would write config and rebuild a
    // service desk on a chat that can never be torn down again.
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: 'update-after-destroy',
      serviceDeskFactory: jest.fn(),
    };

    const { chat, serviceManager } = await acquireChatForShell(publicConfig);
    // What a hydrated chat looks like: the rebuild branch gates on this flag.
    serviceManager.humanAgentService.hasInitialized = true;
    const humanAgentService = serviceManager.humanAgentService;

    chat.destroy();

    await expect(
      chat.updateConfig({
        ...publicConfig,
        isReadonly: true,
        serviceDeskFactory: jest.fn(),
      })
    ).resolves.toBeUndefined();

    expect(serviceManager.humanAgentService).toBe(humanAgentService);
    expect(
      serviceManager.store.getState().config.public.isReadonly
    ).toBeFalsy();
  });

  it('an adopted manager whose first mount released mid-boot still owes the boot-once steps', async () => {
    // The row that motivated `initialViewChangeComplete`: acquire, then release BEFORE the
    // initial view change ran. `adopted` alone would tell the next mount to skip the boot-once
    // steps forever, rendering a chat that never opened; the durable store flag does not.
    const publicConfig: any = {
      ...mergePublicConfig(createBaseTestProps()),
      namespace: 'acquire-midboot-release',
      featureFlags: { reuseInstance: true, reuseInstanceGraceMs: 100000 },
    };

    const { chat: chat1 } = await acquireChatForShell(publicConfig);
    chat1.release();

    const { adopted, serviceManager } = await acquireChatForShell(publicConfig);

    expect(adopted).toBe(true);
    expect(serviceManager.store.getState().initialViewChangeComplete).toBe(
      false
    );
  });

  it('performInitialViewChange runs the view transition once per cold boot', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { serviceManager } = await acquireChatForShell(publicConfig);

    const changeViewSpy = jest.spyOn(serviceManager.actions, 'changeView');
    await performInitialViewChange(serviceManager);
    expect(changeViewSpy).toHaveBeenCalledTimes(1);
  });

  describe('with featureFlags.reuseInstance off (the default)', () => {
    // The trap #1906 calls out: with reuse off the two teardown verbs are the same code path, so
    // a consumer developing without the flag cannot tell which one they meant. Pin both.
    it('release() disposes immediately — nothing survives to adopt', async () => {
      const createSM = jest.spyOn(loadServicesModule, 'createServiceManager');
      const publicConfig: any = {
        ...mergePublicConfig(createBaseTestProps()),
        namespace: 'no-reuse-release',
      };

      const { chat, serviceManager } = await acquireChatForShell(publicConfig);
      chat.release();

      expect(serviceManager.disposed).toBe(true);

      const { adopted } = await acquireChatForShell(publicConfig);
      expect(adopted).toBe(false);
      expect(createSM).toHaveBeenCalledTimes(2);
    });

    it('destroy() disposes immediately, indistinguishably from release()', async () => {
      const publicConfig: any = {
        ...mergePublicConfig(createBaseTestProps()),
        namespace: 'no-reuse-destroy',
      };

      const { chat, serviceManager } = await acquireChatForShell(publicConfig);
      chat.destroy();

      expect(serviceManager.disposed).toBe(true);
    });
  });
});
