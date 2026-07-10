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
  WorkspaceShellBody,
  WorkspaceShellFooter,
} from "../../../react/workspace-shell";
import { action } from "storybook/actions";
import { FooterActionList } from "./story-data";
import FooterMeta, {
  Default as DefaultWC,
} from "./workspace-shell-footer.stories";
import "./story-styles.scss";

export default {
  title: "Components/Workspace shell/Footer",
  component: WorkspaceShellFooter,
  parameters: {
    docs: {
      description: {
        component:
          "Footer section for the workspace shell, containing action buttons. Automatically handles responsive stacking and button ordering.",
      },
    },
  },
  argTypes: {
    ...(() => {
      const { "@cds-aichat-workspace-shell-footer-clicked": _, ...rest } =
        FooterMeta.argTypes;
      return rest;
    })(),
    onFooterClicked: {
      action: "onFooterClicked",
      description:
        FooterMeta.argTypes["@cds-aichat-workspace-shell-footer-clicked"]
          .description,
      control: "none",
      table: { category: "events" },
    },
  },
  decorators: [
    (Story) => (
      <div className="workspace-story-container">
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    ...DefaultWC.args,
    onFooterClicked: (data) => action("footer-action")(data),
  },
  render: ({ actionPreset, bodyText, onFooterClicked }) => (
    <WorkspaceShell>
      <WorkspaceShellBody>
        <p>{bodyText}</p>
      </WorkspaceShellBody>
      <WorkspaceShellFooter
        actions={FooterActionList[actionPreset]}
        onFooterClicked={onFooterClicked}
      />
    </WorkspaceShell>
  ),
};
