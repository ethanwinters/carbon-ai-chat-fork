/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { acquireChatForShell } from '../../../src/chat/sdk/ChatSDK';
import { mergePublicConfig } from '../../../src/chat/boot/appBoot';
import { __resetReuseInstanceRegistry } from '../../../src/chat/services/reuseInstanceRegistry';
import { createBaseTestProps } from '../../test_helpers';
import { PublicConfig } from '../../../src/types/config/PublicConfig';

describe('HeadlessChatInstance.updateConfig', () => {
  beforeEach(() => {
    __resetReuseInstanceRegistry();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    __resetReuseInstanceRegistry();
  });

  it('propagates a reactive field through the store', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    expect(
      serviceManager.store.getState().config.public.isReadonly
    ).toBeFalsy();

    await chat.updateConfig({ ...publicConfig, isReadonly: true });

    expect(serviceManager.store.getState().config.public.isReadonly).toBe(true);
  });

  it('propagates a field with an out-of-store side effect', async () => {
    // `namespace` is not read reactively — it lives on the ServiceManager, so it only moves if the
    // per-field side-effect block runs. This is the half a plain store write would miss.
    const publicConfig = mergePublicConfig({
      ...createBaseTestProps(),
      namespace: 'before',
    });
    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    expect(serviceManager.namespace.originalName).toBe('before');

    await chat.updateConfig({ ...publicConfig, namespace: 'after' });

    expect(serviceManager.namespace.originalName).toBe('after');
    expect(serviceManager.store.getState().config.public.namespace).toBe(
      'after'
    );
  });

  it('ignores mutation of the config object passed to acquire', async () => {
    // Acquire snapshots the caller's config. Without that, a host editing its own object would
    // change store state with no dispatch — subscribers comparing by reference would never fire
    // and the dynamic diff would see "no change" forever.
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { serviceManager } = await acquireChatForShell(publicConfig);

    (publicConfig as PublicConfig).isReadonly = true;
    (publicConfig as PublicConfig).namespace = 'mutated';

    const stored = serviceManager.store.getState().config.public;
    expect(stored.isReadonly).toBeFalsy();
    expect(stored.namespace).not.toBe('mutated');
    expect(stored).not.toBe(publicConfig);
  });

  it('ignores mutation of the config object passed to updateConfig', async () => {
    // Mutate a NESTED branch, not a top-level scalar. `reconcileObjectReferences` rebuilds the top
    // level whenever any key changed, so a top-level mutation is defended even without the
    // snapshot — but reconciliation copies only one level deep, so an un-snapshotted sub-object is
    // handed straight into the store and stays live to the caller. That is the leak this guards.
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    const next: PublicConfig = {
      ...publicConfig,
      launcher: { ...publicConfig.launcher, isOn: false },
    };
    await chat.updateConfig(next);

    next.launcher.isOn = true;

    expect(serviceManager.store.getState().config.public.launcher.isOn).toBe(
      false
    );
    expect(serviceManager.store.getState().config.public.launcher).not.toBe(
      next.launcher
    );
  });

  it('ignores mutation of layout.customProperties passed to acquire', async () => {
    // `validateCustomProperties` returns the very map it is handed, so `derived` is only safe if
    // the snapshot happens before it runs — otherwise one setting has two values in the store.
    const publicConfig = mergePublicConfig({
      ...createBaseTestProps(),
      layout: { customProperties: { width: '420px' } },
    });
    const { serviceManager } = await acquireChatForShell(publicConfig);

    publicConfig.layout.customProperties.width = '999px';

    const { derived, public: stored } = serviceManager.store.getState().config;
    expect(derived.cssVariableOverrides).not.toBe(
      publicConfig.layout.customProperties
    );
    expect(derived.cssVariableOverrides.width).toBe('420px');
    expect(stored.layout.customProperties.width).toBe('420px');
  });

  it('ignores mutation of layout.customProperties passed to updateConfig', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    const customProperties = { width: '420px' };
    await chat.updateConfig({
      ...publicConfig,
      layout: { ...publicConfig.layout, customProperties },
    });

    customProperties.width = '999px';

    const { derived, public: stored } = serviceManager.store.getState().config;
    expect(derived.cssVariableOverrides).not.toBe(customProperties);
    expect(derived.cssVariableOverrides.width).toBe('420px');
    expect(stored.layout.customProperties.width).toBe('420px');
  });

  it('preserves function identity across the snapshot', async () => {
    // `serviceDeskFactory` and `customSendMessage` are compared by reference by the dynamic-update
    // path, so the snapshot must not clone them into new functions.
    const serviceDeskFactory = jest.fn();
    const base = createBaseTestProps();
    const publicConfig = mergePublicConfig({
      ...base,
      serviceDeskFactory,
    } as PublicConfig);

    const { serviceManager } = await acquireChatForShell(publicConfig);

    const stored = serviceManager.store.getState().config.public;
    expect(stored.serviceDeskFactory).toBe(serviceDeskFactory);
    expect(stored.messaging.customSendMessage).toBe(
      publicConfig.messaging.customSendMessage
    );
  });

  it('keeps unchanged sub-objects referentially stable across an update', async () => {
    const publicConfig = mergePublicConfig(createBaseTestProps());
    const { chat, serviceManager } = await acquireChatForShell(publicConfig);

    const before = serviceManager.store.getState().config;

    await chat.updateConfig({ ...publicConfig, isReadonly: true });

    const after = serviceManager.store.getState().config;
    expect(after.public).not.toBe(before.public);
    // Reconciliation reuses every key whose content did not change, so untouched branches keep
    // their identity and subscribers comparing by reference do not re-render.
    expect(after.public.messaging).toBe(before.public.messaging);
    expect(after.derived).toBe(before.derived);
  });
});
