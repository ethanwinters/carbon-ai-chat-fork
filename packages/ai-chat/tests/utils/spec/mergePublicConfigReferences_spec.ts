/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * Reference-identity coverage for `mergePublicConfig`. Its value semantics are
 * pinned by chatBoot_spec; this file pins the half that was missing when
 * `mergePublicConfig` deep-merged into a fresh object, cloning every sub-object
 * the caller supplied. Consumers memoize on those references, so the clone
 * rebuilt the prompt-line's extension set on every config update and recreated
 * the live editor mid-typing (issue #2152).
 *
 * Passing sub-objects through by reference means the boot pipeline now holds the
 * host's own objects, so the other half of the contract is that nothing
 * downstream writes through them.
 */

import { createAppConfig } from '../../../src/chat/store/doCreateStore';
import {
  DEFAULT_PUBLIC_CONFIG,
  mergePublicConfig,
} from '../../../src/chat/utils/chatBoot';
import { PublicConfig } from '../../../src/types/config/PublicConfig';

const STARTER_ITEMS = [{ id: 's1', label: 'Summarize this' }];

function buildConfig(): Partial<PublicConfig> {
  return {
    messaging: { customSendMessage: () => undefined },
    input: {
      starters: { items: STARTER_ITEMS },
      actions: [{ text: 'Toggle', icon: {}, onClick: (): void => undefined }],
    },
  } as Partial<PublicConfig>;
}

describe('mergePublicConfig reference preservation', () => {
  it('passes caller-supplied sub-objects through by reference', () => {
    const config = buildConfig();
    const merged = mergePublicConfig(config);

    expect(merged.input).toBe(config.input);
    expect(merged.input.starters).toBe(config.input.starters);
    // The array the host holds as a module constant must arrive unchanged —
    // this is the exact identity the extensions memo keys on.
    expect(merged.input.starters.items).toBe(STARTER_ITEMS);
    expect(merged.input.starters.items[0]).toBe(STARTER_ITEMS[0]);
    expect(merged.input.actions).toBe(config.input.actions);
  });

  it('keeps sub-object identity stable across repeated merges', () => {
    const config = buildConfig();
    expect(mergePublicConfig(config).input).toBe(
      mergePublicConfig(config).input
    );
  });

  it('preserves function identity', () => {
    const config = buildConfig();
    const merged = mergePublicConfig(config);
    expect(merged.messaging.customSendMessage).toBe(
      config.messaging.customSendMessage
    );
  });

  it('applies object-valued defaults without sharing the default instances', () => {
    const first = mergePublicConfig({});
    const second = mergePublicConfig({});

    expect(first.launcher.isOn).toBe(true);
    expect(first.serviceDesk).toEqual({});
    expect(first.messaging).toEqual({});

    // Each call owns its defaulted objects, so a later write cannot leak
    // between chat instances or back into the shared default.
    expect(first.launcher).not.toBe(second.launcher);
    expect(first.launcher).not.toBe(DEFAULT_PUBLIC_CONFIG.launcher);
    expect(first.serviceDesk).not.toBe(second.serviceDesk);
  });

  it('merges launcher per key rather than replacing the default wholesale', () => {
    const merged = mergePublicConfig({
      launcher: { desktop: { title: 'Chat' } },
    } as Partial<PublicConfig>);

    expect(merged.launcher.isOn).toBe(true);
    expect((merged.launcher as { desktop: unknown }).desktop).toEqual({
      title: 'Chat',
    });
  });

  it('does not mutate the caller config or the shared defaults', () => {
    const config = buildConfig();
    const launcherDefault = { ...DEFAULT_PUBLIC_CONFIG.launcher };

    mergePublicConfig(config);

    expect(config.launcher).toBeUndefined();
    expect(config.serviceDesk).toBeUndefined();
    expect(DEFAULT_PUBLIC_CONFIG.launcher).toEqual(launcherDefault);
  });

  it('leaves the host layout untouched when boot rejects a Carbon token', () => {
    // `validateCustomProperties` drops a `$` token whose value is not a hex color.
    // It used to delete from a clone; with `layout` passed through by reference the
    // map it edits is the host's own, so it has to copy first.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const customProperties = { '$button-primary': 'var(--brand)' };
    const config = {
      layout: { customProperties },
    } as Partial<PublicConfig>;

    const appConfig = createAppConfig(mergePublicConfig(config));

    expect(appConfig.derived.cssVariableOverrides['$button-primary']).toBe(
      undefined
    );
    expect(customProperties['$button-primary']).toBe('var(--brand)');
    warn.mockRestore();
  });

  it('lets an explicitly-undefined field fall back to its default', () => {
    const merged = mergePublicConfig({
      assistantName: undefined,
    } as Partial<PublicConfig>);
    expect(merged.assistantName).toBe('watsonx');
  });
});
