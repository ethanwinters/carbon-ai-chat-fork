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

import Processing from "../../../react/processing";
import { Default as DefaultWC } from "./processing.stories";

export default {
  title: "Components/Processing",
};

export const Default = {
  argTypes: {
    loop: DefaultWC.argTypes.loop,
    quickLoad: DefaultWC.argTypes.quickLoad,
  },
  args: { loop: DefaultWC.args.loop, quickLoad: DefaultWC.args.quickLoad },
  render: (args) => <Processing loop={args.loop} quickLoad={args.quickLoad} />,
};

export const LinearNoLoop = {
  args: { ...Default.args, loop: false },
  argTypes: Default.argTypes,
  render: Default.render,
};
