/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import WorkspaceShell, {
  WorkspaceShellHeader,
  WorkspaceShellBody,
} from "../../../react/workspace-shell";
import { Button } from "@carbon/react";
import Edit16 from "@carbon/icons/es/edit/16.js";
import { getHeaderDescription, getBodyContent } from "./story-helper-react";
import WorkspaceShellHeaderMeta, {
  Default as DefaultWC,
} from "./workspace-shell-header.stories";
import "./story-styles.scss";

export default {
  title: "Components/Workspace shell/Header",
  component: WorkspaceShellHeader,
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
    ...WorkspaceShellHeaderMeta.argTypes,
  },
  decorators: [
    (Story) => (
      <div className="workspace-story-container">
        <Story />
      </div>
    ),
  ],
};

const renderHeader = ({
  titleText,
  subTitleText,
  collapsible,
  descriptionType,
  showAction,
}) => (
  <WorkspaceShell>
    <WorkspaceShellHeader
      titleText={titleText}
      subTitleText={subTitleText}
      collapsible={collapsible}
    >
      {descriptionType !== "none" && getHeaderDescription(descriptionType)}
      {showAction && (
        <Button icon={Edit16} kind="tertiary" slot="header-action">
          Edit Plan
        </Button>
      )}
    </WorkspaceShellHeader>
    <WorkspaceShellBody>{getBodyContent("short")}</WorkspaceShellBody>
  </WorkspaceShell>
);

export const Default = {
  args: {
    ...DefaultWC.args,
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
