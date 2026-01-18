/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React from "react";

import WriteableElement from "./components-legacy/WriteableElement";
import { WriteableElementName } from "../types/instance/ChatInstance";
import { HasServiceManager } from "./hocs/withServiceManager";

/**
 * Renders WriteableElement slots that live directly under ChatShell.
 */
export function AppShellWriteableElements({
  serviceManager,
}: HasServiceManager) {
  const suffix = serviceManager.namespace.suffix;

  return (
    <>
      <div slot="header-after">
        <WriteableElement
          slotName={WriteableElementName.HEADER_BOTTOM_ELEMENT}
          id={`headerBottomElement${suffix}`}
          className="cds-aichat--header-bottom-element"
        />
      </div>

      <div slot="messages-before">
        <WriteableElement
          slotName={WriteableElementName.MESSAGES_BEFORE_ELEMENT}
          id={`messagesBeforeElement${suffix}`}
          className="cds-aichat--messages-before-element"
        />
      </div>

      <div slot="messages-after">
        <WriteableElement
          slotName={WriteableElementName.MESSAGES_AFTER_ELEMENT}
          id={`messagesAfterElement${suffix}`}
          className="cds-aichat--messages-after-element"
        />
      </div>

      <div slot="input-before">
        <WriteableElement
          slotName={WriteableElementName.BEFORE_INPUT_ELEMENT}
          id={`beforeInputElement${suffix}`}
          className="cds-aichat--before-input-element"
        />
      </div>

      <div slot="input-after">
        <WriteableElement
          slotName={WriteableElementName.AFTER_INPUT_ELEMENT}
          id={`afterInputElement${suffix}`}
          className="cds-aichat--after-input-element"
        />
      </div>

      <div slot="footer">
        <WriteableElement
          slotName={WriteableElementName.FOOTER_ELEMENT}
          id={`footerElement${suffix}`}
          className="cds-aichat--footer-element"
        />
      </div>
    </>
  );
}
