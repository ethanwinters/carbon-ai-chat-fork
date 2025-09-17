/*
 * Copyright IBM Corp. 2025
 */

import { JSX } from "typedoc";

export const indexTemplate = ({ markdown }, props) =>
  JSX.createElement(
    "div",
    { class: "tsd-panel tsd-typography" },
    JSX.createElement(JSX.Raw, {
      html: markdown(props.model.readme || []),
    }),
  );

export default indexTemplate;
