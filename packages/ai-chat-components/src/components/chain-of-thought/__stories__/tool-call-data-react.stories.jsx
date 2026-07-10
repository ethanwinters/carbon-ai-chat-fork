/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/* eslint-disable */
import React from "react";
import ToolCallData from "../../../react/tool-call-data";
import Markdown from "../../../react/markdown";
import ToolCallDataWCMeta from "./tool-call-data.stories";

const request = `\`\`\`bash
curl -X POST https://api.internal/v1/search \\
  -H "Authorization: Bearer ****" \\
  -d '{ "query": "reset password policy", "limit": 5 }'
\`\`\``;

const response = `\`\`\`json
{
  "results": [
    { "title": "Password reset policy", "id": "DOC-101" },
    { "title": "SAML reset flow", "id": "DOC-103" }
  ]
}
\`\`\``;

export default {
  title: "Components/Chain of thought/Tool call data",
  component: ToolCallData,
  parameters: {
    docs: {
      description: {
        component:
          "Structured container for displaying tool metadata and IO within chain-of-thought steps. Renders nothing when empty.",
      },
    },
  },
  argTypes: { ...ToolCallDataWCMeta.argTypes },
  args: { ...ToolCallDataWCMeta.args },
};

export const Default = {
  render: (args) => (
    <ToolCallData
      toolName={args.toolName}
      inputLabelText={args.inputLabelText}
      outputLabelText={args.outputLabelText}
      toolLabelText={args.toolLabelText}
    >
      <Markdown slot="description" markdown={args.descriptionText} />
      <Markdown slot="input" markdown={request} />
      <Markdown slot="output" markdown={response} />
    </ToolCallData>
  ),
};
