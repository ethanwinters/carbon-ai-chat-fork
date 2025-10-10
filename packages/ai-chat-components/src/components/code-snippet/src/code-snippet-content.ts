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
import { createRef, ref } from "lit/directives/ref.js";
import ChevronDown16 from "@carbon/icons/es/chevron--down/16.js";
import FocusMixin from "@carbon/web-components/es/globals/mixins/focus.js";
import { iconLoader } from "@carbon/web-components/es/globals/internal/icon-loader.js";
import { carbonElement } from "../../../globals/decorators/carbon-element.js";
import prefix from "../../../globals/settings.js";
import { throttle } from "lodash-es";
import {
  extractTextContent,
  detectLanguage,
  observeResize,
  getCodeRefDimensions,
} from "./utils.js";

// CodeMirror imports
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { LanguageDescription, LanguageSupport } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
// @ts-ignore
import cdsStyles from "./code-snippet-carbon.scss?lit";
// @ts-ignore
import styles from "./code-snippet.scss?lit";
import "@carbon/web-components/es/components/copy-button/index.js";
import "@carbon/web-components/es/components/copy/copy.js";
import "@carbon/web-components/es/components/button/button.js";

/**
 * Internal AI Chat code snippet content component (no wrapper).
 * Custom element: cds-aichat-code-snippet-content
 */
@carbonElement(`${prefix}-code-snippet-content`)
class CDSAIChatCodeSnippetContent extends FocusMixin(LitElement) {
  static styles = [cdsStyles, styles];

  // Carbon code snippet properties
  private _expandedCode = false;
  private _hObserveResize: { release(): null } | null = null;
  private _rowHeightInPixels = 16;
  private _hasRightOverflow = true;
  private _hasLeftOverflow = false;
  private _shouldShowMoreLessBtn = false;

  // CodeMirror properties
  @property({ type: String }) language = "";
  @property({ type: Boolean }) dark = false;
  @property({ type: Boolean }) editable = false;
  @property({ type: Boolean }) highlight = false;
  @property({ attribute: false }) onContentChange?: (content: string) => void;

  // Internal state for slotted content
  @property({ attribute: false })
  private _slottedContent = "";

  private editorView?: EditorView;
  private editorContainer = createRef<HTMLDivElement>();
  private themeCompartment = new Compartment();
  private languageCompartment = new Compartment();
  private readOnlyCompartment = new Compartment();
  private throttledUpdateContent?: ReturnType<typeof throttle>;
  private contentMutationObserver?: MutationObserver;

  // Carbon code snippet properties
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

  // Carbon methods
  private async _handleCopyClick() {
    try {
      await navigator.clipboard.writeText(
        this._slottedContent || this.copyText || "",
      );
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }

  private _handleScroll() {
    if (this) {
      const codeContainerRef = this?.shadowRoot?.querySelector(
        `.${prefix}--snippet-container`,
      );
      const codeContentRef = codeContainerRef?.querySelector("pre");
      if (!codeContentRef) {
        return;
      }

      const {
        horizontalOverflow,
        codeClientWidth,
        codeScrollWidth,
        codeScrollLeft,
      } = getCodeRefDimensions(codeContentRef);

      this._hasLeftOverflow = horizontalOverflow && !!codeScrollLeft;
      this._hasRightOverflow =
        horizontalOverflow &&
        codeScrollLeft + codeClientWidth !== codeScrollWidth;
      this.requestUpdate();
    }
  }

  private _handleClickExpanded() {
    this._expandedCode = !this._expandedCode;
    this.requestUpdate();
  }

  private _resizeObserver = new ResizeObserver(() => {
    this._checkShowMoreButton();
    this._handleScroll();
  });

  // CodeMirror methods

  private destroyEditor() {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = undefined;
    }
  }

  private async getLanguageSupport(): Promise<LanguageSupport | null> {
    // Only apply syntax highlighting if highlight is true
    if (!this.highlight) {
      return null;
    }

    let languageToUse = this.language;

    // If no language specified, try to auto-detect
    if (!languageToUse && this._slottedContent) {
      languageToUse = detectLanguage(this._slottedContent) || "";
      if (!languageToUse) {
        // Auto-detection failed or low confidence
        return null;
      }
    }

    // If still no language, return null (plain text)
    if (!languageToUse) {
      return null;
    }

    const langDesc = LanguageDescription.matchLanguageName(
      languages,
      languageToUse,
      true,
    );

    if (langDesc) {
      try {
        return await langDesc.load();
      } catch (error) {
        console.warn(`Failed to load language support for "${languageToUse}"`);
      }
    }

    return null;
  }

  private _isCreatingEditor = false;

  private async updateEditor(changedProperties: Map<string, any>) {
    if (!this.editorContainer.value) {
      return;
    }

    // Prevent creating multiple editors simultaneously
    if (this._isCreatingEditor) {
      return;
    }

    const needsRecreate = !this.editorView || changedProperties.has("editable");

    if (needsRecreate) {
      this._isCreatingEditor = true;
      this.destroyEditor();
      await this.createEditor();
      this._isCreatingEditor = false;
    } else {
      if (changedProperties.has("_slottedContent")) {
        const currentContent = this.editorView?.state.doc.toString();
        if (currentContent !== this._slottedContent) {
          // Initialize throttled function if not already created
          if (!this.throttledUpdateContent) {
            this.throttledUpdateContent = throttle(
              (content: string) => {
                if (!this.editorView) {
                  return;
                }
                const current = this.editorView.state.doc.toString();
                this.editorView.dispatch({
                  changes: {
                    from: 0,
                    to: current.length,
                    insert: content,
                  },
                });
                // Check if "show more" button should appear after content update
                requestAnimationFrame(() => {
                  this._checkShowMoreButton();
                });
              },
              200,
              { leading: true, trailing: true },
            );
          }

          this.throttledUpdateContent(this._slottedContent);
        }
      }

      if (changedProperties.has("dark")) {
        this.editorView?.dispatch({
          effects: this.themeCompartment.reconfigure(this.dark ? oneDark : []),
        });
      }

      if (
        changedProperties.has("language") ||
        changedProperties.has("highlight")
      ) {
        const languageSupport = await this.getLanguageSupport();
        this.editorView?.dispatch({
          effects: this.languageCompartment.reconfigure(
            languageSupport ? [languageSupport] : [],
          ),
        });
      }
    }
  }

  private async createEditor() {
    if (!this.editorContainer.value) {
      return;
    }

    const languageSupport = await this.getLanguageSupport();

    const state = EditorState.create({
      doc: this._slottedContent,
      extensions: [
        basicSetup,
        this.themeCompartment.of(this.dark ? oneDark : []),
        this.languageCompartment.of(languageSupport ? [languageSupport] : []),
        this.readOnlyCompartment.of(EditorState.readOnly.of(!this.editable)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && this.onContentChange) {
            this.onContentChange(update.state.doc.toString());
          }
        }),
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.value,
    });

    // Check height after editor renders
    requestAnimationFrame(() => {
      this._checkShowMoreButton();
    });
  }

  private _checkShowMoreButton() {
    const codeContainerRef = this.shadowRoot?.querySelector(
      `.${prefix}--snippet-container`,
    );
    const codeContentRef = codeContainerRef?.querySelector(
      `.${prefix}--code-editor`,
    );

    if (codeContentRef) {
      const { height } = codeContentRef.getBoundingClientRect();
      const shouldShow =
        height > this.maxCollapsedNumberOfRows * this._rowHeightInPixels;
      if (this._shouldShowMoreLessBtn !== shouldShow) {
        this._shouldShowMoreLessBtn = shouldShow;
        this.requestUpdate();
      }
    }
  }

  // Lifecycle methods
  connectedCallback() {
    super.connectedCallback();
    if (this._hObserveResize) {
      this._hObserveResize = this._hObserveResize.release();
    }
    this._hObserveResize = observeResize(this._resizeObserver, this);

    // Watch for text content changes (for streaming)
    this.contentMutationObserver = new MutationObserver(() => {
      this._extractSlotContent();
    });

    this.contentMutationObserver.observe(this, {
      characterData: true,
      subtree: true,
      childList: true,
    });
  }

  private _hasExtractedContent = false;

  willUpdate(_changedProperties: Map<string, any>) {
    // Extract slot content before first render
    if (!this._hasExtractedContent) {
      this._extractSlotContent();
      this._hasExtractedContent = true;
    }
  }

  private _extractSlotContent() {
    const textContent = extractTextContent(this);
    if (textContent && textContent !== this._slottedContent) {
      this._slottedContent = textContent;
    }
  }

  private _handleSlotChange() {
    this._extractSlotContent();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._hObserveResize) {
      this._hObserveResize = this._hObserveResize.release();
    }
    // Cancel any pending throttled updates
    if (this.throttledUpdateContent) {
      this.throttledUpdateContent.cancel();
    }
    // Disconnect mutation observer
    if (this.contentMutationObserver) {
      this.contentMutationObserver.disconnect();
    }
    this.destroyEditor();
  }

  updated(changedProperties: Map<string, any>) {
    if (this._expandedCode) {
      this.setAttribute("expanded-code", "");
    } else {
      this.removeAttribute("expanded-code");
    }

    this.updateEditor(changedProperties);
  }

  render() {
    const {
      disabled,
      feedback,
      feedbackTimeout,
      hideCopyButton,
      wrapText,
      tooltipContent,
      showMoreText,
      showLessText,
      _expandedCode: expandedCode,
      _handleCopyClick: handleCopyClick,
      _hasRightOverflow: hasRightOverflow,
      _hasLeftOverflow: hasLeftOverflow,
      _shouldShowMoreLessBtn: shouldShowMoreLessBtn,
    } = this;

    let classes = `${prefix}--snippet ${prefix}--snippet--multi`;
    disabled ? (classes += ` ${prefix}--snippet--disabled`) : "";
    hideCopyButton ? (classes += ` ${prefix}--snippet--no-copy`) : "";
    wrapText ? (classes += ` ${prefix}--snippet--wraptext`) : "";
    hasRightOverflow
      ? (classes += ` ${prefix}--snippet--has-right-overflow`)
      : "";

    const expandButtonClass = `${prefix}--snippet-btn--expand`;
    const disabledCopyButtonClasses = disabled
      ? `${prefix}--snippet--disabled`
      : "";
    const expandCodeBtnText = expandedCode ? showLessText : showMoreText;

    let containerClasses = `${prefix}--snippet-container ${prefix}--snippet--codemirror`;
    if (!expandedCode) {
      containerClasses += ` ${prefix}--snippet-container--collapsed`;
    }

    return html`
      <!-- Hidden slot for content extraction -->
      <div class="${prefix}--visually-hidden">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>

      <div
        role="textbox"
        tabindex="${!disabled ? 0 : null}"
        class="${containerClasses}"
        aria-label="${"code-snippet"}"
        aria-readonly="true"
        aria-multiline="true"
      >
        <div class="${prefix}--code-editor" ${ref(this.editorContainer)}></div>
      </div>

      ${hasLeftOverflow
        ? html`
            <div class="${prefix}--snippet__overflow-indicator--left"></div>
          `
        : ``}
      ${hideCopyButton
        ? ``
        : html`
            <cds-copy-button
              ?disabled=${disabled}
              button-class-name=${disabledCopyButtonClasses}
              feedback=${feedback}
              feedback-timeout=${feedbackTimeout}
              @click="${handleCopyClick}"
            >
              ${tooltipContent}
            </cds-copy-button>
          `}
      ${shouldShowMoreLessBtn
        ? html`
            <cds-button
              kind="ghost"
              size="sm"
              button-class-name=${expandButtonClass}
              ?disabled=${disabled}
              @click=${() => this._handleClickExpanded()}
            >
              <span class="${prefix}--snippet-btn--text">
                ${expandCodeBtnText}
              </span>
              ${iconLoader(ChevronDown16, {
                class: `${prefix}--icon-chevron--down ${prefix}--snippet__icon`,
                role: "img",
                slot: "icon",
              })}
            </cds-button>
          `
        : ``}
    `;
  }

  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
}

export default CDSAIChatCodeSnippetContent;
