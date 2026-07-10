/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../src/reasoning-step";
import "../src/reasoning-steps";
import "../../markdown/src/markdown";
import { html } from "lit";
import { action } from "storybook/actions";

export default {
  title: "Components/Reasoning steps/Step",
  component: "cds-aichat-reasoning-step",
  parameters: {
    docs: {
      description: {
        component:
          "Represents a single entry within the reasoning steps timeline. Supports controlled or uncontrolled open state when paired with cds-aichat-reasoning-steps.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Label displayed in the step header.",
      table: { defaultValue: { summary: "Review retrieved context" } },
    },
    body: {
      control: "text",
      description: "Markdown content rendered inside the expanded step.",
      table: {
        defaultValue: {
          summary:
            "Validated supporting documents, captured relevant citations, and noted confidence levels before drafting a response.",
        },
      },
    },
    secondStepTitle: {
      control: "text",
      description: "Label displayed on the second, bodyless step.",
      table: { defaultValue: { summary: "Awaiting attachments" } },
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
    "@reasoning-step-beingtoggled": {
      action: "beforeToggle",
      table: { category: "events" },
    },
    "@reasoning-step-toggled": {
      action: "toggle",
      table: { category: "events" },
    },
  },
  args: {
    title: "Review retrieved context",
    body: "Validated supporting documents, captured relevant citations, and noted confidence levels before drafting a response.",
    secondStepTitle: "Awaiting attachments",
    open: true,
    controlled: false,
  },
};

export const Default = {
  render: (args) => html`
    <cds-aichat-reasoning-steps open>
      <cds-aichat-reasoning-step
        title=${args.title}
        ?open=${args.open}
        ?controlled=${args.controlled}
        @reasoning-step-beingtoggled=${(e) => action("beforeToggle")(e.detail)}
        @reasoning-step-toggled=${(e) => action("toggle")(e.detail)}
      >
        <cds-aichat-markdown .markdown=${args.body}></cds-aichat-markdown>
      </cds-aichat-reasoning-step>
      <cds-aichat-reasoning-step
        title=${args.secondStepTitle}
        @reasoning-step-beingtoggled=${(e) => action("beforeToggle")(e.detail)}
        @reasoning-step-toggled=${(e) => action("toggle")(e.detail)}
      >
      </cds-aichat-reasoning-step>
    </cds-aichat-reasoning-steps>
  `,
};
