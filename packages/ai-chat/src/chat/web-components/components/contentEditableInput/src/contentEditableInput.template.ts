/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { ContentEditableInputElement } from "./ContentEditableInputElement";

/**
 * Template for the contenteditable input element.
 */
export function contentEditableInputTemplate(
  element: ContentEditableInputElement,
) {
  const isEmpty = !element.value || element.value.trim() === "";
  const showPlaceholder = isEmpty && element.placeholder;

  const containerClasses = {
    WAC__TextArea: true,
    "WAC__TextArea--autoSize": element.autoSize,
    "WAC__TextArea--disabled": element.disabled,
  };

  const inputClasses = {
    "WAC__TextArea-textarea": true,
    "WAC__TextArea-textarea--empty": isEmpty,
  };

  return html`
    <div class=${classMap(containerClasses)}>
      <div
        contenteditable=${element.disabled ? "false" : "true"}
        aria-label=${ifDefined(element.ariaLabel || undefined)}
        aria-required=${element.isRequired}
        aria-multiline="true"
        role="textbox"
        tabindex=${element.disabled ? -1 : 0}
        class=${classMap(inputClasses)}
        id=${ifDefined(element.id || element.testId || undefined)}
        data-name=${ifDefined(element.name || undefined)}
        @focus=${(event: FocusEvent) => element["handleFocus"](event)}
        @blur=${(event: FocusEvent) => element["handleBlur"](event)}
        @click=${(event: MouseEvent) => element["handleClick"](event)}
        @input=${(event: Event) => element["handleInput"](event)}
        @keydown=${(event: KeyboardEvent) => element["handleKeyDown"](event)}
        @paste=${(event: ClipboardEvent) => element["handlePaste"](event)}
        @select=${(event: Event) => element["handleSelect"](event)}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        data-testid=${ifDefined(element.testId || undefined)}
      ></div>
      ${showPlaceholder
        ? html`<div class="WAC__TextArea-placeholder" aria-hidden="true">
            ${element.placeholder}
          </div>`
        : ""}
      ${element.autoSize
        ? html`<div class="WAC__TextArea-sizer">
            ${element.value || element.placeholder || " "}
          </div>`
        : ""}
    </div>
  `;
}
