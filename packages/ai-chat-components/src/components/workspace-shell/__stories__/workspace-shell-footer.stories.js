/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../index";
import { action } from "storybook/actions";
import { html } from "lit";
import { FooterActionList } from "./story-data";
import styles from "./story-styles.scss?lit";

export default {
  title: "Components/Workspace shell/Footer",
  component: "cds-aichat-workspace-shell-footer",
  parameters: {
    docs: {
      description: {
        component:
          "Footer section for the workspace shell, containing action buttons. Automatically handles responsive stacking and button ordering.",
      },
    },
  },
  argTypes: {
    actionPreset: {
      control: {
        type: "select",
      },
      options: Object.keys(FooterActionList),
      description: "Select a predefined set of actions",
    },
    bodyText: {
      control: "text",
      description:
        "Sample body content shown above the footer to demonstrate footer positioning.",
      table: {
        defaultValue: {
          summary:
            "This is sample content to demonstrate the footer positioning. The footer will be pushed to the bottom of the workspace shell. Shrink the workspace width below 671px to see the footer buttons stack vertically with primary actions appearing first.",
        },
      },
    },
    "@cds-aichat-workspace-shell-footer-clicked": {
      action: "footer-action",
      table: { category: "events" },
      description: "Event fired when a footer button is clicked.",
    },
  },
  decorators: [
    (story) => html`
      <style>
        ${styles}
      </style>
      <div class="workspace-story-container">
        <cds-aichat-workspace-shell>${story()}</cds-aichat-workspace-shell>
      </div>
    `,
  ],
};

export const Default = {
  args: {
    actionPreset: "Two buttons",
    bodyText:
      "This is sample content to demonstrate the footer positioning. The footer will be pushed to the bottom of the workspace shell. Shrink the workspace width below 671px to see the footer buttons stack vertically with primary actions appearing first.",
  },
  render: (args) => html`
    <cds-aichat-workspace-shell-body>
      <p>${args.bodyText}</p>
    </cds-aichat-workspace-shell-body>
    <cds-aichat-workspace-shell-footer
      @cds-aichat-workspace-shell-footer-clicked=${(e) =>
        action("footer-action")(e.detail)}
      .actions=${FooterActionList[args.actionPreset]}
    >
    </cds-aichat-workspace-shell-footer>
  `,
};
