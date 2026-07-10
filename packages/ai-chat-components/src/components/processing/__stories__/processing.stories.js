/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../src/processing";
import { html } from "lit";

export default {
  title: "Components/Processing",
  component: "cds-aichat-processing",
};

export const Default = {
  argTypes: {
    loop: {
      control: "boolean",
      description:
        "Enables the continuous linear animation. When disabled, the animation plays once.",
      table: { defaultValue: { summary: "false" } },
    },
    quickLoad: {
      control: "boolean",
      description:
        "Removes the ~1s entry delay so the dots appear immediately. Composes with loop.",
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: {
    loop: true,
    quickLoad: false,
  },
  render: (args) =>
    html`<cds-aichat-processing
      ?quick-load=${args.quickLoad}
      ?loop=${args.loop}
    />`,
};

export const LinearNoLoop = {
  args: { ...Default.args, loop: false },
  argTypes: Default.argTypes,
  render: Default.render,
};
