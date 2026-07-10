/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React from "react";
import Toolbar from "../../../react/toolbar";
import WorkspaceShell, {
  WorkspaceShellHeader,
  WorkspaceShellBody,
  WorkspaceShellFooter,
} from "../../../react/workspace-shell";
import { Edit } from "@carbon/icons-react";
import { AILabel, InlineNotification, Button } from "@carbon/react";
import { action } from "storybook/actions";
import { getHeaderDescription, getBodyContent } from "./story-helper-react";
import WorkspaceShellMeta, {
  Default as DefaultWC,
} from "./workspace-shell.stories";
import { actionLists, FooterActionList } from "./story-data-react";
import "./story-styles.scss";

export default {
  title: "Components/Workspace shell",
  component: WorkspaceShell,
  argTypes: {
    ...WorkspaceShellMeta.argTypes,
    toolbarAction: {
      ...WorkspaceShellMeta.argTypes.toolbarAction,
      mapping: actionLists,
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
  },
  render: ({
    toolbarTitle,
    toolbarAction,
    toolbarOverflow,
    notificationTitle,
    notificationSubTitle,
    headerTitle,
    headerSubTitle,
    headerDescription,
    showHeaderAction,
    autoCollapsibleHeader,
    bodyContent,
    footerAction,
    aiLabelBodyText,
    headerActionLabel,
  }) => {
    return (
      <WorkspaceShell autoCollapsibleHeader={autoCollapsibleHeader}>
        <Toolbar
          slot="toolbar"
          actions={toolbarAction}
          overflow={toolbarOverflow}
          titleText={toolbarTitle}
        >
          <AILabel
            size="2xs"
            autoalign
            alignment="bottom"
            slot="toolbar-ai-label"
          >
            <div slot="body-text">
              <h4 className="margin-bottom-05">Powered by IBM watsonx</h4>
              <div>{aiLabelBodyText}</div>
            </div>
          </AILabel>
        </Toolbar>
        <InlineNotification
          slot="notification"
          title={notificationTitle}
          subtitle={notificationSubTitle}
          kind="warning"
          hideCloseButton
        ></InlineNotification>
        <WorkspaceShellHeader
          titleText={headerTitle}
          subTitleText={headerSubTitle}
        >
          {getHeaderDescription(headerDescription)}
          {showHeaderAction && (
            <Button kind="tertiary" slot="header-action" renderIcon={Edit}>
              {headerActionLabel}
            </Button>
          )}
        </WorkspaceShellHeader>
        <WorkspaceShellBody>{getBodyContent(bodyContent)}</WorkspaceShellBody>
        {footerAction !== "None" && (
          <WorkspaceShellFooter
            onFooterClicked={(data) => action("action")(data)}
            actions={FooterActionList[footerAction]}
          ></WorkspaceShellFooter>
        )}
      </WorkspaceShell>
    );
  },
};
