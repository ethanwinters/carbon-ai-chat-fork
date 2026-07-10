/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/forbid-dom-props */
import React from "react";
import WorkspaceShell, {
  WorkspaceShellBody,
} from "../../../react/workspace-shell";
import { getBodyContent } from "./story-helper-react";
import WorkspaceShellBodyMeta, {
  Default as DefaultWC,
  EmptyState as EmptyStateWC,
} from "./workspace-shell-body.stories";
import "./story-styles.scss";

export default {
  title: "Components/Workspace shell/Body",
  component: WorkspaceShellBody,
  parameters: {
    docs: {
      description: {
        component:
          "Main content area of the workspace shell. Provides a scrollable container for workspace content.",
      },
    },
  },
  argTypes: {
    ...WorkspaceShellBodyMeta.argTypes,
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
  render: ({ contentType }) => (
    <WorkspaceShell>
      <WorkspaceShellBody>{getBodyContent(contentType)}</WorkspaceShellBody>
    </WorkspaceShell>
  ),
};

export const EmptyState = {
  argTypes: {
    ...EmptyStateWC.argTypes,
  },
  args: {
    ...EmptyStateWC.args,
  },
  render: ({ emptyStateHeading, emptyStateMessage }) => (
    <WorkspaceShell>
      <WorkspaceShellBody>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: "1rem" }}>{emptyStateHeading}</h3>
          <p style={{ color: "var(--cds-text-secondary)" }}>
            {emptyStateMessage}
          </p>
        </div>
      </WorkspaceShellBody>
    </WorkspaceShell>
  ),
};
