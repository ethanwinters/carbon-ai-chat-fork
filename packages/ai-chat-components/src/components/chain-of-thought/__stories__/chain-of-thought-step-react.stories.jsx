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
import ChainOfThought from "../../../react/chain-of-thought";
import ChainOfThoughtStep from "../../../react/chain-of-thought-step";
import ToolCallData from "../../../react/tool-call-data";
import Markdown from "../../../react/markdown";
import { action } from "storybook/actions";
import ChainOfThoughtStepWCMeta from "./chain-of-thought-step.stories";

const request = `\`\`\`json
{ "query": "recent outages in eu-west", "limit": 3 }
\`\`\``;

const response = `\`\`\`json
{
  "incidents": [
    { "id": "OUT-483", "status": "resolved" },
    { "id": "OUT-479", "status": "monitoring" }
  ]
}
\`\`\``;

export default {
  title: "Components/Chain of thought/Step",
  component: ChainOfThoughtStep,
  parameters: {
    docs: {
      description: {
        component:
          "Represents a single chain-of-thought entry. Supports controlled or uncontrolled open state when paired with `ChainOfThought`.",
      },
    },
  },
  argTypes: {
    ...ChainOfThoughtStepWCMeta.argTypes,
    onBeforeToggle: {
      action: "onBeforeToggle",
      table: { category: "events" },
      description:
        "Fires before a toggle; return false to prevent the open state from changing.",
    },
    onToggle: {
      action: "onToggle",
      table: { category: "events" },
      description:
        "Emitted after a toggle request. Useful for syncing controlled state.",
    },
  },
  args: {
    ...ChainOfThoughtStepWCMeta.args,
    onBeforeToggle: (event) => action("onBeforeToggle")(event?.detail),
    onToggle: (event) => action("onToggle")(event?.detail),
  },
};

export const Default = {
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <ChainOfThought open>
        <ChainOfThoughtStep
          title={args.title}
          status={args.status}
          open={args.open}
          controlled={args.controlled}
          statusSucceededLabelText={args.statusSucceededLabelText}
          statusFailedLabelText={args.statusFailedLabelText}
          statusProcessingLabelText={args.statusProcessingLabelText}
          stepNumber={1}
          onBeforeToggle={args.onBeforeToggle}
          onToggle={args.onToggle}
        >
          <ToolCallData toolName={args.toolName}>
            <Markdown slot="description" markdown={args.toolDescription} />
            <Markdown slot="input" markdown={request} />
            <Markdown slot="output" markdown={response} />
          </ToolCallData>
        </ChainOfThoughtStep>
        <ChainOfThoughtStep
          title={args.secondStepTitle}
          status="processing"
          stepNumber={2}
          onBeforeToggle={args.onBeforeToggle}
          onToggle={args.onToggle}
        />
      </ChainOfThought>
    </div>
  ),
};

export const Static = {
  render: () => (
    <div style={{ maxWidth: "32rem" }}>
      <ChainOfThought open>
        <ChainOfThoughtStep
          title="Plan remediation"
          status="success"
          stepNumber={1}
        />
      </ChainOfThought>
    </div>
  ),
};
