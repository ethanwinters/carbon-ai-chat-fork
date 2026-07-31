/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A file attached to a message that has already been sent, described by metadata
 * alone.
 *
 * The counterpart to {@link FileUpload}, which describes a file staged in the input
 * area and carries the live `File` plus its upload status. The two differ only in
 * fidelity: an upload derives its name and type from the `File`, while an attachment
 * states them outright. A message restored from conversation history has no `File` —
 * one cannot be serialized — which is why this shape exists.
 */
export interface FileAttachment {
  /** A unique ID for the attachment. Not rendered; used to key a list of chips. */
  id: string;

  /** The file name to display. When absent the chip renders its fallback label. */
  name?: string;

  /** The MIME type, used to pick the file-type icon. */
  mimeType?: string;
}
