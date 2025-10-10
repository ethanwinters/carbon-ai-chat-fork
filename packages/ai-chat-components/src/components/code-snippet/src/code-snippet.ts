/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { carbonElement } from "../../../globals/decorators/carbon-element.js";
import prefix from "../../../globals/settings.js";
import { extractSlotContent } from "./utils.js";
import "../../tile-container/index.js";
import "./code-snippet-content.js";
import "@carbon/web-components/es/components/tile/index.js";
import type CDSAIChatCodeSnippetContent from "./code-snippet-content.js";

/**
 * AI Chat code snippet with syntax highlighting and edit capabilities.
 * Wraps code-snippet-content with tile-container for styling.
 * Custom element: cds-aichat-code-snippet
 */
@carbonElement(`${prefix}-code-snippet`)
class CDSAIChatCodeSnippet extends LitElement {
  // Forward all properties to the inner component
  @property({ type: String }) language = "";
  @property({ type: Boolean }) dark = false;
  @property({ type: Boolean }) editable = false;
  @property({ type: Boolean }) highlight = false;
  @property({ attribute: false }) onContentChange?: (content: string) => void;

  @property({ attribute: "copy-text" })
  copyText = "";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property()
  feedback = "Copied!";

  @property({ type: Number, attribute: "feedback-timeout" })
  feedbackTimeout = 2000;

  @property({ type: Boolean, reflect: true, attribute: "hide-copy-button" })
  hideCopyButton = false;

  @property()
  maxCollapsedNumberOfRows = 15;

  @property({ attribute: "show-less-text" })
  showLessText = "Show less";

  @property({ attribute: "show-more-text" })
  showMoreText = "Show more";

  @property({ attribute: "tooltip-content" })
  tooltipContent = "Copy to clipboard";

  @property({ type: Boolean, reflect: true, attribute: "wrap-text" })
  wrapText = false;

  private contentRef: Ref<CDSAIChatCodeSnippetContent> = createRef();

  private _handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const textContent = extractSlotContent(slot);

    // Pass content to inner component by setting its text content
    if (this.contentRef.value) {
      // Clear existing content
      while (this.contentRef.value.firstChild) {
        this.contentRef.value.removeChild(this.contentRef.value.firstChild);
      }
      // Add new text node
      if (textContent) {
        this.contentRef.value.appendChild(document.createTextNode(textContent));
      }
    }
  }

  render() {
    return html`
      <div style="display: none;">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
      <cds-aichat-tile-container>
        <cds-tile>
          <cds-aichat-code-snippet-content
            ${ref(this.contentRef)}
            language=${this.language}
            ?dark=${this.dark}
            ?editable=${this.editable}
            ?highlight=${this.highlight}
            .onContentChange=${this.onContentChange}
            copy-text=${this.copyText}
            ?disabled=${this.disabled}
            feedback=${this.feedback}
            feedback-timeout=${this.feedbackTimeout}
            ?hide-copy-button=${this.hideCopyButton}
            max-collapsed-number-of-rows=${this.maxCollapsedNumberOfRows}
            show-less-text=${this.showLessText}
            show-more-text=${this.showMoreText}
            tooltip-content=${this.tooltipContent}
            ?wrap-text=${this.wrapText}
          >
          </cds-aichat-code-snippet-content>
        </cds-tile>
      </cds-aichat-tile-container>
    `;
  }
}

export default CDSAIChatCodeSnippet;
