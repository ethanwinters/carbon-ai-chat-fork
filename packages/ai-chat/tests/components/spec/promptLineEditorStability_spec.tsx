/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * End-to-end coverage for issue #2152, driving the whole path the bug took: a
 * React config prop change → `mergePublicConfig` → `createAppConfig` →
 * reference reconciliation → the input hooks → the prompt-line element. The
 * store-level specs pin each seam; this asserts the user-visible outcome, that
 * typing survives a config update with its undo history intact.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { ChatContainer } from '../../../src/react/ChatContainer';
import {
  createBaseConfig,
  setupAfterEach,
  setupBeforeEach,
} from '../../test_helpers';
import type { ChatInstance } from '../../../src/types/instance/ChatInstance';
import type { PublicConfig } from '../../../src/types/config/PublicConfig';

// Held as module constants exactly like the reproducing example app, so any
// churn observed downstream originates in the framework, not the host.
const STARTER_ITEMS = [
  { id: 's1', label: 'Summarize this' },
  { id: 's2', label: 'Draft an email' },
];

function buildConfig(inputHasText: boolean): PublicConfig {
  return {
    ...createBaseConfig(),
    input: {
      starters: { items: STARTER_ITEMS, isOn: true },
      actions: [
        {
          text: inputHasText ? 'Hide starters' : 'Show starters',
          icon: {},
          onClick: (): void => undefined,
          // The example ties this to whether the user has typed, so the first
          // keystroke rebuilds the host config.
          disabled: inputHasText,
        },
      ],
    },
  } as PublicConfig;
}

/** The input config as it landed in the store, past all the reconciliation. */
function storedInput(instance: ChatInstance) {
  return instance.serviceManager.store.getState().config.public.input;
}

describe('prompt-line editor stability across runtime config updates', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('keeps the live editor and its undo history when the host config changes', async () => {
    let instance: ChatInstance | null = null;
    const onBeforeRender = jest.fn((next: ChatInstance) => {
      instance = next;
    });

    const { rerender } = render(
      <ChatContainer {...buildConfig(false)} onBeforeRender={onBeforeRender} />
    );
    await waitFor(() => expect(instance).not.toBeNull(), { timeout: 5000 });

    const editor = await instance!.input.getEditor();
    editor.view.dispatch(editor.state.tr.insertText('hello'));

    rerender(
      <ChatContainer {...buildConfig(true)} onBeforeRender={onBeforeRender} />
    );
    await waitFor(() =>
      expect(storedInput(instance!).actions[0].disabled).toBe(true)
    );

    // Same editor instance — the config update no longer tears it down.
    const afterUpdate = await instance!.input.getEditor();
    expect(afterUpdate).toBe(editor);
    expect(afterUpdate.isDestroyed).toBe(false);

    afterUpdate.view.dispatch(afterUpdate.state.tr.insertText(' world'));
    expect(afterUpdate.getText()).toBe('hello world');

    // History reaches back past the config update to an empty field. Before the
    // fix it stopped at the first chunk typed before the rebuild.
    while (afterUpdate.commands.undo()) {
      /* drain the history stack */
    }
    expect(afterUpdate.getText()).toBe('');
  });

  it('keeps the editor when the starters list is toggled', async () => {
    let instance: ChatInstance | null = null;
    const onBeforeRender = jest.fn((next: ChatInstance) => {
      instance = next;
    });

    const base = buildConfig(false);
    const { rerender } = render(
      <ChatContainer {...base} onBeforeRender={onBeforeRender} />
    );
    await waitFor(() => expect(instance).not.toBeNull(), { timeout: 5000 });

    const editor = await instance!.input.getEditor();
    const toggled = {
      ...base,
      input: {
        ...base.input,
        starters: { items: STARTER_ITEMS, isOn: false },
      },
    } as PublicConfig;

    rerender(<ChatContainer {...toggled} onBeforeRender={onBeforeRender} />);
    await waitFor(() =>
      expect(storedInput(instance!).starters.isOn).toBe(false)
    );

    // Toggling the list applies to extension storage in place; it is not a
    // reason to rebuild the editor.
    expect(await instance!.input.getEditor()).toBe(editor);
  });
});
