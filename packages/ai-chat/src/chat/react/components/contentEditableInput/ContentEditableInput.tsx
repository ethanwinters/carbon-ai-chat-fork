/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { createComponent } from "@lit/react";
import React from "react";

import CDSChatContentEditableInputElement, {
  CONTENT_EDITABLE_INPUT_COMPONENT_TAG_NAME,
} from "../../../web-components/components/contentEditableInput/cds-aichat-content-editable-input";

interface ContentEditableInputRef {
  takeFocus(): void;
  doBlur(): void;
  getHTMLElement(): HTMLDivElement | undefined;
}

const ContentEditableInput = createComponent({
  tagName: CONTENT_EDITABLE_INPUT_COMPONENT_TAG_NAME,
  elementClass: CDSChatContentEditableInputElement,
  react: React,
});

export { ContentEditableInput, ContentEditableInputRef };
