/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../src/chain-of-thought-step";
import "../src/chain-of-thought";
import "../src/tool-call-data";
import "../../markdown";
import { html } from "lit";

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
  component: "cds-aichat-chain-of-thought-step",
  parameters: {
    docs: {
      description: {
        component:
          "Represents a single chain-of-thought entry. Supports controlled or uncontrolled open state when paired with `cds-aichat-chain-of-thought`.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Label displayed in the step header.",
      table: { defaultValue: { summary: "Check recent incidents" } },
    },
    status: {
      control: "select",
      options: ["success", "failure", "processing"],
      description: "Status indicator for the step.",
      table: { defaultValue: { summary: "success" } },
    },
    open: {
      control: "boolean",
      description: "Whether the step is expanded.",
      table: { defaultValue: { summary: "true" } },
    },
    controlled: {
      control: "boolean",
      description:
        "When true, the host application must update the open state in response to toggle events.",
      table: { defaultValue: { summary: "false" } },
    },
    statusSucceededLabelText: {
      control: "text",
      description: "Assistive text when a step has succeeded.",
      table: { defaultValue: { summary: "Succeeded" } },
    },
    statusFailedLabelText: {
      control: "text",
      description: "Assistive text when a step failed.",
      table: { defaultValue: { summary: "Failed" } },
    },
    statusProcessingLabelText: {
      control: "text",
      description: "Assistive text when a step is processing.",
      table: { defaultValue: { summary: "Processing" } },
    },
    secondStepTitle: {
      control: "text",
      description: "Label displayed in the second step's header.",
      table: { defaultValue: { summary: "Awaiting confirmation" } },
    },
    toolName: {
      control: "text",
      description: "Plain text name of the tool invoked by the first step.",
      table: { defaultValue: { summary: "incident_lookup" } },
    },
    toolDescription: {
      control: "text",
      description:
        "Description text rendered in the first step's tool call data.",
      table: {
        defaultValue: {
          summary:
            "Look up recent outages affecting the EU region before escalating.",
        },
      },
    },
  },
  args: {
    title: "Check recent incidents",
    status: "success",
    open: true,
    controlled: false,
    statusSucceededLabelText: "Succeeded",
    statusFailedLabelText: "Failed",
    statusProcessingLabelText: "Processing",
    secondStepTitle: "Awaiting confirmation",
    toolName: "incident_lookup",
    toolDescription:
      "Look up recent outages affecting the EU region before escalating.",
  },
};

export const Default = {
  render: (args) => html`
    <cds-aichat-chain-of-thought open>
      <cds-aichat-chain-of-thought-step
        title=${args.title}
        status=${args.status}
        ?open=${args.open}
        ?controlled=${args.controlled}
        status-succeeded-label-text=${args.statusSucceededLabelText}
        status-failed-label-text=${args.statusFailedLabelText}
        status-processing-label-text=${args.statusProcessingLabelText}
        step-number="1"
      >
        <cds-aichat-tool-call-data tool-name=${args.toolName}>
          <cds-aichat-markdown
            slot="description"
            .markdown=${args.toolDescription}
          ></cds-aichat-markdown>
          <cds-aichat-markdown
            slot="input"
            .markdown=${request}
          ></cds-aichat-markdown>
          <cds-aichat-markdown
            slot="output"
            .markdown=${response}
          ></cds-aichat-markdown>
        </cds-aichat-tool-call-data>
      </cds-aichat-chain-of-thought-step>
      <cds-aichat-chain-of-thought-step
        title=${args.secondStepTitle}
        status="processing"
        step-number="2"
      >
      </cds-aichat-chain-of-thought-step>
    </cds-aichat-chain-of-thought>
  `,
};

export const Static = {
  render: () => html`
    <cds-aichat-chain-of-thought open>
      <cds-aichat-chain-of-thought-step
        title="Plan remediation"
        status="success"
        step-number="1"
      >
      </cds-aichat-chain-of-thought-step>
    </cds-aichat-chain-of-thought>
  `,
};
