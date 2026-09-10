/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import type { BaseOverflowMenuItem } from '../../typings/overflow-menu.js';

/**
 * Activates an overflow menu item: runs its `onClick`, then navigates when it
 * carries an `href`. An item with both gets both, which is what the toolbar's
 * icon-button path does with the same `Action`.
 *
 * Carbon's v12 menu item has no `href` support, so an item that used to render
 * an anchor now renders a plain row. Navigation has to happen here instead.
 *
 * This is a downgrade, not a translation: the option still goes where it
 * points, but the browser no longer treats it as a link. Middle-click and
 * modifier-click do nothing, the context menu offers no "copy link address",
 * and assistive technology announces a menu item rather than a link. Whether
 * Carbon restores link support is tracked in #2317.
 */
export function activateOverflowMenuItem(item: BaseOverflowMenuItem): void {
  if (item.disabled) {
    return;
  }

  item.onClick?.();

  if (item.href) {
    // Anchors get an implicit `noopener` for `target="_blank"`; `window.open`
    // does not, so a host option that opens a new tab would hand that tab a
    // live `window.opener` back into the chat. Not `noreferrer` -- the anchor
    // sent a `Referer` and dropping it would break referrer-gated links. The
    // feature string is ignored when the target resolves to the current tab.
    window.open(item.href, item.target || '_self', 'noopener');
  }
}

/**
 * Stops Space from scrolling the page while a menu item has focus.
 *
 * Carbon's `cds-menu-item` synthesizes a click for Enter and Space without
 * calling `preventDefault`, and `cds-menu` prevents it only for the arrow
 * keys. The deprecated `cds-overflow-menu-body` used to swallow every key,
 * so without this Space both activates the item and scrolls what is behind
 * the open menu.
 */
export function suppressMenuItemSpaceScroll(event: KeyboardEvent): void {
  if (event.key === ' ') {
    event.preventDefault();
  }
}
