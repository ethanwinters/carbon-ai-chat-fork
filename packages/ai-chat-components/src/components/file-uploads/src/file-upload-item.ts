/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import { carbonElement } from '../../../globals/decorators/carbon-element.js';
import { isBrowser } from '../../../globals/utils/browser-utils.js';
import prefix from '../../../globals/settings.js';

import '@carbon/web-components/es/components/file-uploader/index.js';

import { iconLoader } from '@carbon/web-components/es/globals/internal/icon-loader.js';
import PlayFilledAlt16 from '@carbon/icons/es/play--filled--alt/16.js';

import { pickFileTypeIcon } from './file-type-icon.js';

import type {
  FileUpload,
  FileRemoveEventDetail,
} from '../../prompt-line/src/types.js';
import type { FileAttachment } from './types.js';

import styles from './file-upload-item.scss?lit';

/**
 * The name, type, and (when available) `File` behind the chip, resolved from
 * whichever input was supplied.
 */
interface ResolvedFile {
  name?: string;
  mimeType?: string;
  file?: File;
}

/**
 * Renders a single file chip with an optional media preview or file-type icon.
 *
 * Serves both places a file appears. In the input area it is driven by `upload`,
 * which carries the live `File`, and shows upload status plus a remove button. In a
 * sent message it is driven by either input with `read-only` set: no status, no
 * remove affordance. `attachment` exists for the read-only case where there is no
 * `File` at all — a message restored from conversation history — since a `File`
 * cannot be serialized.
 *
 * @element cds-aichat-file-upload-item
 * @fires {CustomEvent<FileRemoveEventDetail>} cds-aichat-file-remove - Fired when the remove button is clicked
 */
@carbonElement(`${prefix}-file-upload-item`)
class FileUploadItemElement extends LitElement {
  static styles = css`
    ${unsafeCSS(styles)}
  `;

  /**
   * The file to render. A {@link FileUpload} when the live `File` is to hand, as in
   * the input area; a {@link FileAttachment} when only metadata survives, as on a
   * message restored from conversation history.
   */
  @property({ type: Object, attribute: false })
  upload: FileUpload | FileAttachment | null = null;

  /**
   * Renders the chip without status or a remove button, for a file on a message
   * that has already been sent.
   */
  @property({ type: Boolean, attribute: 'read-only', reflect: true })
  readOnly = false;

  /** Label for the remove file button. */
  @property({ type: String, attribute: 'remove-file-label' })
  removeFileLabel = 'Remove file';

  /** Label for the uploading status. */
  @property({ type: String, attribute: 'uploading-file-label' })
  uploadingFileLabel = 'Uploading';

  /** Text shown when the file's name is not known. */
  @property({ type: String, attribute: 'fallback-label' })
  fallbackLabel = 'Attachment';

  /** Object URL created for image/video previews. Revoked on disconnect or when the file changes. */
  private _objectURL: string | null = null;

  /** The File instance the current object URL was created for. */
  private _objectURLFile: File | null = null;

  /**
   * The chip's content, resolved from whichever shape `upload` holds. An upload
   * derives its name and type from the `File`; an attachment states them outright.
   */
  private get _resolved(): ResolvedFile | null {
    if (!this.upload) {
      return null;
    }

    if (this._isUpload(this.upload)) {
      const { name, type } = this.upload.file;
      return { name, mimeType: type, file: this.upload.file };
    }

    return { name: this.upload.name, mimeType: this.upload.mimeType };
  }

  /** Whether `upload` is the live-`File` shape rather than metadata alone. */
  private _isUpload(value: FileUpload | FileAttachment): value is FileUpload {
    return (value as FileUpload).file instanceof File;
  }

  /** Upload status, which only a staged file has. */
  private get _uploadStatus(): string {
    return this.upload && this._isUpload(this.upload) ? this.upload.status : '';
  }

  /** Error state, which only a staged file has. */
  private get _uploadError(): { isError: boolean; message: string } {
    if (!this.upload || !this._isUpload(this.upload)) {
      return { isError: false, message: '' };
    }
    return {
      isError: Boolean(this.upload.isError),
      message: this.upload.errorMessage || '',
    };
  }

  private _getOrCreateObjectURL(file: File): string | null {
    if (this._objectURLFile !== file) {
      if (this._objectURL) {
        URL.revokeObjectURL(this._objectURL);
      }
      this._objectURL = URL.createObjectURL(file);
      this._objectURLFile = file;
    }
    return this._objectURL;
  }

  private _hasMediaPreview(): boolean {
    const resolved = this._resolved;
    // A preview needs the real File to build an object URL from, so a restored
    // attachment falls back to a file-type icon.
    if (!resolved?.file) {
      return false;
    }
    const type = resolved.mimeType ?? '';
    return type.startsWith('image/') || type.startsWith('video/');
  }

  firstUpdated() {
    this._syncInjectedStyles();
  }

  updated() {
    this._syncInjectedStyles();
  }

  /**
   * Carbon's `cds-file-uploader-item` needs two things patched from inside its own
   * shadow root, because it exposes no `part=` for either.
   *
   * The filename margin is too wide when a media preview sits beside it. And the
   * status container is rendered unconditionally at `min-inline-size: 1.5rem` plus
   * `padding-inline-end: .75rem`, so in read-only mode — where there is no status
   * to show — it would leave 36px of dead space on the chip's trailing edge.
   */
  private _syncInjectedStyles() {
    const innerRoot = this.shadowRoot?.querySelector(
      'cds-file-uploader-item'
    )?.shadowRoot;
    if (!innerRoot) {
      return;
    }

    const rules: string[] = [];
    if (this._hasMediaPreview()) {
      rules.push(
        '.cds--file-filename { margin-inline-start: 2px !important; }'
      );
    }
    if (this.readOnly) {
      rules.push('.cds--file__state-container { display: none !important; }');
      // Carbon hangs the chip's trailing padding off the status container, so
      // hiding it leaves the name flush to the edge against a 1rem leading margin.
      // Restate it on the name to even the two sides up.
      rules.push('.cds--file-filename { margin-inline-end: 1rem !important; }');
    }

    const nextText = rules.join('\n');
    if (this._injectedStyle?.textContent === nextText) {
      return;
    }

    if (!this._injectedStyle) {
      this._injectedStyle = document.createElement('style');
      innerRoot.appendChild(this._injectedStyle);
    }
    this._injectedStyle.textContent = nextText;
  }

  /** The `<style>` patched into Carbon's shadow root. See `_syncInjectedStyles`. */
  private _injectedStyle: HTMLStyleElement | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._objectURL) {
      URL.revokeObjectURL(this._objectURL);
      this._objectURL = null;
      this._objectURLFile = null;
    }
  }

  private _renderPreview() {
    const resolved = this._resolved;
    if (!resolved) {
      return nothing;
    }

    const { file, name } = resolved;
    const type = resolved.mimeType ?? '';

    // Image preview. Needs the live File, so a restored attachment skips ahead to
    // the file-type icon below.
    if (file && type.startsWith('image/')) {
      const url = this._getOrCreateObjectURL(file);
      if (!url) {
        return nothing;
      }

      return html`<span class="${prefix}-file-upload-item__preview-wrapper"
        ><img
          class="${prefix}-file-upload-item__preview"
          src="${url}"
          width="36"
          height="36"
          alt=""
          aria-hidden="true"
      /></span>`;
    }

    // Video preview
    if (file && type.startsWith('video/')) {
      const url = this._getOrCreateObjectURL(file);
      if (!url) {
        return nothing;
      }

      const openVideo = () => {
        const newWindow = isBrowser()
          ? window.open('', '_blank', 'width=800,height=600')
          : null;

        if (!newWindow) {
          return;
        }

        const style = newWindow.document.createElement('style');
        style.textContent =
          '* { margin: 0; padding: 0; background: #000 } video { display: block; width: 100%; height: 100vh; object-fit: contain }';
        const video = newWindow.document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        newWindow.document.title = name ?? '';
        newWindow.document.head.appendChild(style);
        newWindow.document.body.appendChild(video);
      };

      return html`<button
        class="${prefix}-file-upload-item__preview-wrapper ${prefix}-file-upload-item__video-preview-wrapper"
        type="button"
        aria-label="Play video"
        @click="${openVideo}">
        <video
          class="${prefix}-file-upload-item__preview"
          src="${url}"
          width="36"
          height="36"
          preload="metadata"
          muted
          playsinline
          tabindex="-1"
          aria-hidden="true"
          @loadedmetadata="${(e: Event) => {
            (e.target as HTMLVideoElement).currentTime = 0.1;
          }}"></video
        ><span class="${prefix}-file-upload-item__play-badge" aria-hidden="true"
          >${iconLoader(PlayFilledAlt16)}</span
        >
      </button>`;
    }

    // File type icon (for supported icons)
    const icon = pickFileTypeIcon(name, type);
    if (icon) {
      return html`<span
        class="${prefix}-file-upload-item__icon"
        aria-hidden="true"
        >${iconLoader(icon)}</span
      >`;
    }

    return nothing;
  }

  private _handleRemove() {
    if (!this.upload) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<FileRemoveEventDetail>('cds-aichat-file-remove', {
        detail: { fileId: this.upload.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const resolved = this._resolved;
    if (!resolved) {
      return nothing;
    }

    // An empty state falls through Carbon's status switch, rendering no
    // affordance. `_syncInjectedStyles` collapses the container it still reserves.
    const state = this.readOnly ? '' : this._uploadStatus;
    const error = this._uploadError;

    return html`
      <cds-file-uploader-item
        size="md"
        .state="${state}"
        .iconDescription="${
          state === 'uploading' ? this.uploadingFileLabel : this.removeFileLabel
        }"
        .errorSubject="${error.message}"
        ?invalid="${!this.readOnly && error.isError}"
        @cds-file-uploader-item-deleted="${this._handleRemove}">
        ${this._renderPreview()} ${resolved.name || this.fallbackLabel}
      </cds-file-uploader-item>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cds-aichat-file-upload-item': FileUploadItemElement;
  }
}

export default FileUploadItemElement;
