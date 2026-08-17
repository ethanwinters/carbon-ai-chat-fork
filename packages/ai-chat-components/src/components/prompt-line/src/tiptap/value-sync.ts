/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Tiptap value-sync extension. Emits `cds-aichat-prompt-change` on every
 * doc-changing transaction with the editor's current `getText()` (rawValue)
 * and `getJSON()` (Tiptap-native content shape).
 *
 * It fires for host-origin changes too — the host mirror (e.g. Redux) must
 * see programmatic writes. Origin-aware consumers (typing-indicator, the
 * mention-removal plugin) record the `aichatOrigin` transaction meta
 * themselves (see ./origin-meta.ts); this extension does not.
 */

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export const ValueSync = Extension.create({
  name: 'carbonValueSync',

  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        view: () => ({
          update(view, prevState) {
            if (view.state.doc === prevState.doc) {
              return;
            }
            view.dom.dispatchEvent(
              new CustomEvent('cds-aichat-prompt-change', {
                detail: {
                  rawValue: editor.getText(),
                  content: editor.getJSON(),
                },
                bubbles: true,
                composed: true,
              })
            );
          },
        }),
      }),
    ];
  },
});
