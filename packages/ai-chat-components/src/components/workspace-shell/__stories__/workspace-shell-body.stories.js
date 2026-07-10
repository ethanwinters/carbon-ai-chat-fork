/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../index";
import { html } from "lit";
import { getBodyContent } from "./story-helper";
import styles from "./story-styles.scss?lit";

export default {
  title: "Components/Workspace shell/Body",
  component: "cds-aichat-workspace-shell-body",
  parameters: {
    docs: {
      description: {
        component:
          "Main content area of the workspace shell. Provides a scrollable container for workspace content.",
      },
    },
  },
  argTypes: {
    contentType: {
      control: {
        type: "select",
      },
      options: {
        "Short text": "short",
        "Long text": "long",
      },
      description: "Type of content to display in the body",
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
    contentType: "short",
  },
  render: (args) => html`
    <cds-aichat-workspace-shell-body>
      ${getBodyContent(args.contentType)}
    </cds-aichat-workspace-shell-body>
  `,
};

export const EmptyState = {
  argTypes: {
    emptyStateHeading: {
      control: "text",
      description: "Heading text shown when the workspace has no content.",
      table: { defaultValue: { summary: "No content available" } },
    },
    emptyStateMessage: {
      control: "text",
      description:
        "Supporting message shown when the workspace has no content.",
      table: {
        defaultValue: {
          summary: "This workspace is empty. Add content to get started.",
        },
      },
    },
  },
  args: {
    emptyStateHeading: "No content available",
    emptyStateMessage: "This workspace is empty. Add content to get started.",
  },
  render: (args) => html`
    <cds-aichat-workspace-shell-body>
      <div
        style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center;"
      >
        <h3 style="margin-bottom: 1rem;">${args.emptyStateHeading}</h3>
        <p style="color: var(--cds-text-secondary);">
          ${args.emptyStateMessage}
        </p>
      </div>
    </cds-aichat-workspace-shell-body>
  `,
};
