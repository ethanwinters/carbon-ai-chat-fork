/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../index";
import "@carbon/web-components/es/components/button/button.js";
import "@carbon/web-components/es/components/tag/tag.js";
import { iconLoader } from "@carbon/web-components/es/globals/internal/icon-loader.js";
import { html } from "lit";
import Edit16 from "@carbon/icons/es/edit/16.js";
import { getHeaderDescription, getBodyContent } from "./story-helper";
import styles from "./story-styles.scss?lit";

export default {
  title: "Components/Workspace shell/Header",
  component: "cds-aichat-workspace-shell-header",
  parameters: {
    docs: {
      description: {
        component:
          "Header section for the workspace shell, containing title, subtitle, description, and optional action buttons.",
      },
    },
    controls: {
      // Only show the args a reader of this story family should touch;
      // hides any controls Storybook infers automatically from the
      // component's full prop surface that aren't wired up as story args.
      include: [
        "titleText",
        "subTitleText",
        "collapsible",
        "descriptionType",
        "showAction",
      ],
    },
  },
  argTypes: {
    titleText: {
      control: "text",
      description: "Title text for the header.",
      table: { defaultValue: { summary: "Workspace Title" } },
    },
    subTitleText: {
      control: "text",
      description: "Subtitle text for the header.",
      table: { defaultValue: { summary: "Workspace subtitle" } },
    },
    collapsible: {
      control: "boolean",
      description:
        "Whether the header can be collapsed/expanded. When true, header starts collapsed and can be toggled. When false, header is always fully expanded. Useful when you have a lot of header content or when workspaces are used in small form factors.",
    },
    descriptionType: {
      control: {
        type: "select",
      },
      options: {
        None: "none",
        "Basic text": "basic",
        "With Tags": "withTags",
      },
      description: "Type of description content to display",
    },
    showAction: {
      control: "boolean",
      description: "Whether to show the action button",
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

const renderHeader = (args) => html`
  <cds-aichat-workspace-shell-header
    title-text="${args.titleText}"
    subtitle-text="${args.subTitleText}"
    ?collapsible=${args.collapsible}
  >
    ${
      args.descriptionType !== "none"
        ? getHeaderDescription(args.descriptionType)
        : ""
    }
    ${
      args.showAction
        ? html`
            <cds-button kind="tertiary" slot="header-action">
              Edit Plan ${iconLoader(Edit16, { slot: "icon" })}
            </cds-button>
          `
        : ""
    }
  </cds-aichat-workspace-shell-header>
  <cds-aichat-workspace-shell-body>
    ${getBodyContent("short")}
  </cds-aichat-workspace-shell-body>
`;

export const Default = {
  args: {
    titleText: "Workspace Title",
    subTitleText: "Workspace subtitle",
    collapsible: false,
    descriptionType: "none",
    showAction: false,
  },
  render: renderHeader,
};

export const WithDescription = {
  args: {
    ...Default.args,
    titleText: "Project Analysis",
    subTitleText: "Q4 2024 Performance Review",
    descriptionType: "basic",
  },
  render: renderHeader,
};

export const WithTags = {
  args: {
    ...Default.args,
    titleText: "Development Plan",
    subTitleText: "Sprint 23 - Feature Implementation",
    descriptionType: "withTags",
  },
  render: renderHeader,
};

export const Collapsible = {
  args: {
    ...Default.args,
    titleText: "Collapsible Header",
    subTitleText: "Click title to expand/collapse",
    collapsible: true,
    descriptionType: "basic",
    showAction: true,
  },
  render: renderHeader,
};
