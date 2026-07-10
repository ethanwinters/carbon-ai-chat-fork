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
import ReasoningSteps from "../../../react/reasoning-steps";
import ReasoningStep from "../../../react/reasoning-step";
import Markdown from "../../../react/markdown";
import ReasoningStepWCMeta from "./reasoning-step.stories";
import { action } from "storybook/actions";

const {
  "@reasoning-step-beingtoggled": _beforeToggle,
  "@reasoning-step-toggled": _toggle,
  ...restArgTypes
} = ReasoningStepWCMeta.argTypes;

export default {
  title: "Components/Reasoning steps/Step",
  component: ReasoningStep,
  parameters: {
    docs: {
      description: {
        component:
          "Represents a single entry within the reasoning steps timeline. Supports controlled or uncontrolled open state when paired with ReasoningSteps.",
      },
    },
  },
  argTypes: {
    ...restArgTypes,
    onBeforeToggle: {
      action: "onBeforeToggle",
      control: "none",
      table: { category: "events" },
      description:
        "Fires before a toggle; return false to prevent the open state from changing.",
    },
    onToggle: {
      action: "onToggle",
      control: "none",
      table: { category: "events" },
      description:
        "Emitted after a toggle request. Useful for syncing controlled state.",
    },
  },
  args: {
    ...ReasoningStepWCMeta.args,
    onBeforeToggle: (e) => action("onBeforeToggle")(e.detail),
    onToggle: (e) => action("onToggle")(e.detail),
  },
};

export const Default = {
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <ReasoningSteps open>
        <ReasoningStep
          title={args.title}
          open={args.open}
          controlled={args.controlled}
          onBeforeToggle={args.onBeforeToggle}
          onToggle={args.onToggle}
        >
          <Markdown markdown={args.body} />
        </ReasoningStep>
        <ReasoningStep
          title={args.secondStepTitle}
          onBeforeToggle={args.onBeforeToggle}
          onToggle={args.onToggle}
        />
      </ReasoningSteps>
    </div>
  ),
};
