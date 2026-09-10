/**
 * @license
 *
 * Copyright IBM Corp. 2025, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { html, fixture, expect } from '@open-wc/testing';
import '@carbon/ai-chat-components/es/components/toolbar/index.js';
import Toolbar, {
  Action,
} from '@carbon/ai-chat-components/es/components/toolbar/src/toolbar.js';
import {
  Version16,
  Download16,
  Share16,
  Launch16,
  Maximize16,
  Close16,
} from '@carbon/icons';

const actionLists: Record<string, Action[]> = {
  'Advanced list': [
    { text: 'Version', icon: Version16, size: 'md', onClick: () => {} },
    { text: 'Download', icon: Download16, size: 'md', onClick: () => {} },
    { text: 'Share', icon: Share16, size: 'md', onClick: () => {} },
    { text: 'Launch', icon: Launch16, size: 'md', onClick: () => {} },
    { text: 'Maximize', icon: Maximize16, size: 'md', onClick: () => {} },
    {
      text: 'Close',
      fixed: true,
      icon: Close16,
      size: 'md',
      onClick: () => {},
    },
  ],
};

/**
 * This repository uses the @web/test-runner library for testing
 * Documentation on writing tests, plugins, and commands
 * here: https://modern-web.dev/docs/test-runner/overview/
 */

describe('toolbar', function () {
  it('should render with cds-aichat-toolbar minimum attributes', async () => {
    const el = await fixture<Toolbar>(
      html`<cds-aichat-toolbar
        .actions=${actionLists['Advanced list'] as Action[]}></cds-aichat-toolbar>`
    );
    expect(el).to.be.instanceOf(Toolbar);
    expect(el.actions).to.deep.equal(actionLists['Advanced list'] as Action[]);
    expect(el.shadowRoot).to.exist;
    await expect(el).dom.to.equalSnapshot();
  });

  it('should render the title div inside the shadow root', async () => {
    const el = await fixture<Toolbar>(
      html`<cds-aichat-toolbar
        titleText="My Title"
        .actions=${actionLists['Advanced list'] as Action[]}></cds-aichat-toolbar>`
    );
    const titleDiv = el.shadowRoot!.querySelector('.cds-aichat-toolbar__title');
    expect(titleDiv).to.exist;
  });

  it('composes its overflow menu the way the v12 structure expects', async () => {
    // The menu only renders once actions actually overflow, and the overflow
    // measurement only runs when `overflow` is set, so squeeze a toolbar that
    // has it until the actions spill.
    const wrapper = await fixture<HTMLDivElement>(
      html`<div style="width: 120px;">
        <cds-aichat-toolbar
          overflow
          .actions=${actionLists['Advanced list'] as Action[]}></cds-aichat-toolbar>
      </div>`
    );
    const el = wrapper.querySelector('cds-aichat-toolbar') as Toolbar;
    await el.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await el.updateComplete;

    const overflowMenu = el.shadowRoot!.querySelector(
      'cds-overflow-menu'
    ) as HTMLElement;
    expect(overflowMenu, 'actions should have overflowed into a menu').to.exist;

    // Under the v12 flag the menu only opens off a direct `cds-menu` child.
    // Anything else leaves it dead and only warns in development.
    expect(
      overflowMenu.querySelector(':scope > cds-menu'),
      'cds-menu must be a direct child of cds-overflow-menu'
    ).to.exist;
    expect(overflowMenu.querySelector('cds-overflow-menu-body')).to.not.exist;
    expect(overflowMenu.hasAttribute('enable-v12-overflowmenu')).to.be.true;
    expect(overflowMenu.getAttribute('menu-alignment')).to.equal('bottom-end');
    expect(overflowMenu.hasAttribute('autoalign')).to.be.true;
  });
});
