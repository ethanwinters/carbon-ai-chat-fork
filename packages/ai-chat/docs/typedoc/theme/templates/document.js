/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { JSX } from "typedoc";

/**
 * Document Template Override
 *
 * Currently mirrors TypeDoc's default document template so we can iterate
 * on Carbon-specific markup/styling without touching node_modules.
 */
export const documentTemplate = ({ markdown }, props) =>
  JSX.createElement(
    "div",
    { class: "tsd-panel tsd-typography" },
    JSX.createElement(JSX.Raw, { html: markdown(props.model.content) }),
  );

export default documentTemplate;
