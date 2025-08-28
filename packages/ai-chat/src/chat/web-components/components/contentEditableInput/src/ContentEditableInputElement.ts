/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { css, LitElement, unsafeCSS } from "lit";
import { property, query } from "lit/decorators.js";

import styles from "./contentEditableInput.scss";

class ContentEditableInputElement extends LitElement {
  static styles = css`
    ${unsafeCSS(styles)}
  `;

  /**
   * Whether input is required before form submission.
   */
  @property({ type: Boolean, attribute: "is-required", reflect: true })
  isRequired = false;

  /**
   * The name of the input for parsing form data.
   */
  @property({ type: String, attribute: "name", reflect: true })
  name = "";

  /**
   * Placeholder text to be rendered when no information is inputted.
   */
  @property({ type: String, attribute: "placeholder", reflect: true })
  placeholder = "";

  /**
   * The current value of the input.
   */
  @property({ type: String, attribute: "value", reflect: true })
  value = "";

  /**
   * Indicates whether the input should automatically resize.
   */
  @property({ type: Boolean, attribute: "auto-size", reflect: true })
  autoSize = false;

  /**
   * Maximum number of characters permitted.
   */
  @property({ type: Number, attribute: "max-length", reflect: true })
  maxLength = 10000;

  /**
   * Indicates if the input should be set as disabled.
   */
  @property({ type: Boolean, attribute: "disabled", reflect: true })
  disabled = false;

  /**
   * The value to add for the aria-label attribute.
   */
  @property({ type: String, attribute: "aria-label", reflect: true })
  ariaLabel = "";

  /**
   * The value for data-test-id for automated testing suites.
   */
  @property({ type: String, attribute: "test-id", reflect: true })
  testId = "";

  /**
   * Callback for change events.
   */
  @property({ type: Object, attribute: false })
  onChange?: (event: CustomEvent) => void;

  /**
   * Callback for focus events.
   */
  @property({ type: Object, attribute: false })
  onFocus?: (event: CustomEvent) => void;

  /**
   * Callback for blur events.
   */
  @property({ type: Object, attribute: false })
  onBlur?: (event: CustomEvent) => void;

  /**
   * Callback for click events.
   */
  @property({ type: Object, attribute: false })
  onClick?: (event: CustomEvent) => void;

  /**
   * Callback for keydown events.
   */
  @property({ type: Object, attribute: false })
  onKeyDown?: (event: CustomEvent) => void;

  /**
   * Callback for select events.
   */
  @property({ type: Object, attribute: false })
  onSelect?: (event: CustomEvent) => void;

  /**
   * Query the contenteditable div element.
   */
  @query("[contenteditable]")
  private contentEditableElement?: HTMLDivElement;

  /**
   * Track if we're currently updating the content to prevent infinite loops.
   */
  private isUpdating = false;

  /**
   * Returns the HTML element.
   */
  public getHTMLElement() {
    return this.contentEditableElement;
  }

  /**
   * Instructs this component to put focus into the input.
   */
  public takeFocus() {
    if (this.contentEditableElement && !this.disabled) {
      this.contentEditableElement.focus();
    }
  }

  /**
   * Causes the input to blur.
   */
  public doBlur() {
    this.contentEditableElement?.blur();
  }

  /**
   * Gets the plain text content from the contenteditable div.
   */
  private getTextContent(): string {
    return this.contentEditableElement?.textContent || "";
  }

  /**
   * Sets the text content of the contenteditable div.
   */
  private setTextContent(text: string) {
    if (this.contentEditableElement) {
      this.contentEditableElement.textContent = text;
    }
  }

  /**
   * Handles input events from the contenteditable div.
   */
  private handleInput = (_event: Event) => {
    if (this.isUpdating) {
      return;
    }

    const textContent = this.getTextContent();

    // Enforce character limit
    if (this.maxLength && textContent.length > this.maxLength) {
      const truncated = textContent.substring(0, this.maxLength);
      this.isUpdating = true;
      this.setTextContent(truncated);

      // Restore cursor position to end
      const selection = window.getSelection();
      if (selection && this.contentEditableElement) {
        const range = document.createRange();
        range.selectNodeContents(this.contentEditableElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      this.isUpdating = false;
      return;
    }

    // Update the value property
    this.value = textContent;

    // Dispatch change event
    const changeEvent = new CustomEvent("change", {
      detail: {
        value: textContent,
        name: this.name,
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(changeEvent);
    this.onChange?.(changeEvent);
  };

  /**
   * Handles paste events to ensure only plain text is pasted.
   */
  private handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();

    const text = event.clipboardData?.getData("text/plain") || "";

    // Get current content and cursor position
    const currentText = this.getTextContent();
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const beforeCursor = currentText.substring(0, range.startOffset);
      const afterCursor = currentText.substring(range.endOffset);

      let newText = beforeCursor + text + afterCursor;

      // Enforce character limit
      if (this.maxLength && newText.length > this.maxLength) {
        const availableSpace =
          this.maxLength - (beforeCursor.length + afterCursor.length);
        const truncatedText = text.substring(0, Math.max(0, availableSpace));
        newText = beforeCursor + truncatedText + afterCursor;
      }

      this.setTextContent(newText);

      // Trigger change event
      this.handleInput(event);

      // Restore cursor position
      const newCursorPos =
        beforeCursor.length + (newText.length - currentText.length);
      if (this.contentEditableElement) {
        const newRange = document.createRange();
        const textNode = this.contentEditableElement.firstChild;
        if (textNode) {
          newRange.setStart(
            textNode,
            Math.min(newCursorPos, textNode.textContent?.length || 0),
          );
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  };

  /**
   * Handles keydown events, preventing certain formatting keys and managing enter behavior.
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    // Prevent common formatting shortcuts to maintain plain text
    if (event.ctrlKey || event.metaKey) {
      if (["b", "i", "u"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        return;
      }
    }

    // Dispatch custom keydown event
    const keydownEvent = new CustomEvent("keydown", {
      detail: {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        value: this.getTextContent(),
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(keydownEvent);
    this.onKeyDown?.(keydownEvent);
  };

  /**
   * Handles focus events.
   */
  private handleFocus = (_event: FocusEvent) => {
    const focusEvent = new CustomEvent("focus", {
      detail: { value: this.getTextContent() },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(focusEvent);
    this.onFocus?.(focusEvent);
  };

  /**
   * Handles blur events.
   */
  private handleBlur = (_event: FocusEvent) => {
    const blurEvent = new CustomEvent("blur", {
      detail: { value: this.getTextContent() },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(blurEvent);
    this.onBlur?.(blurEvent);
  };

  /**
   * Handles click events.
   */
  private handleClick = (_event: MouseEvent) => {
    const clickEvent = new CustomEvent("click", {
      detail: { value: this.getTextContent() },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(clickEvent);
    this.onClick?.(clickEvent);
  };

  /**
   * Handles select events.
   */
  private handleSelect = (_event: Event) => {
    const selectEvent = new CustomEvent("select", {
      detail: { value: this.getTextContent() },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(selectEvent);
    this.onSelect?.(selectEvent);
  };

  /**
   * Updates the content when value prop changes.
   */
  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has("value") && !this.isUpdating) {
      const currentContent = this.getTextContent();
      if (currentContent !== this.value) {
        this.isUpdating = true;
        this.setTextContent(this.value);
        this.isUpdating = false;
      }
    }
  }

  /**
   * Set initial content on first update.
   */
  firstUpdated() {
    if (this.value && this.contentEditableElement) {
      this.setTextContent(this.value);
    }
  }
}

export { ContentEditableInputElement };
