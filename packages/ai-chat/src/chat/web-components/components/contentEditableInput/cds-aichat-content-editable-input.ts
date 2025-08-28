/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { carbonElement } from "../../decorators/customElement";
import { ContentEditableInputElement } from "./src/ContentEditableInputElement";
import { contentEditableInputTemplate } from "./src/contentEditableInput.template";

const CONTENT_EDITABLE_INPUT_COMPONENT_TAG_NAME = `cds-aichat-content-editable-input`;

/**
 * This class is used to display a contenteditable input component which replaces the TextArea component
 * to enable future rich text features like @mentions while maintaining backward compatibility.
 */
@carbonElement(CONTENT_EDITABLE_INPUT_COMPONENT_TAG_NAME)
class CDSChatContentEditableInputElement extends ContentEditableInputElement {
  /**
   * Renders the template while passing in class functionality.
   */
  render() {
    return contentEditableInputTemplate(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cds-aichat-content-editable-input": CDSChatContentEditableInputElement;
  }
}

export { CONTENT_EDITABLE_INPUT_COMPONENT_TAG_NAME };
export default CDSChatContentEditableInputElement;
