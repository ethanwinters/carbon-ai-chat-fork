/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { activateOverflowMenuItem } from '../menu-item-activation';

describe('activateOverflowMenuItem', () => {
  let open: jest.Mock;

  beforeEach(() => {
    open = jest.fn();
    window.open = open as unknown as typeof window.open;
  });

  it('calls onClick for an item with no href', () => {
    const onClick = jest.fn();
    activateOverflowMenuItem({ text: 'Rename', onClick });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it('navigates in the current tab when the item has no target', () => {
    activateOverflowMenuItem({ text: 'Docs', href: 'https://example.com' });

    expect(open).toHaveBeenCalledWith(
      'https://example.com',
      '_self',
      'noopener,noreferrer'
    );
  });

  it('severs the opener when the item opens a new tab', () => {
    activateOverflowMenuItem({
      text: 'Docs',
      href: 'https://example.com',
      target: '_blank',
    });

    // The anchor this replaced got `noopener` implicitly. `window.open` does
    // not, so the opened tab would otherwise hold a live handle on the chat.
    expect(open).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('prefers href over onClick when an item carries both', () => {
    const onClick = jest.fn();
    activateOverflowMenuItem({
      text: 'Docs',
      href: 'https://example.com',
      onClick,
    });

    expect(open).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does nothing for a disabled item', () => {
    const onClick = jest.fn();
    activateOverflowMenuItem({
      text: 'Delete',
      href: 'https://example.com',
      disabled: true,
      onClick,
    });

    expect(onClick).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });
});
