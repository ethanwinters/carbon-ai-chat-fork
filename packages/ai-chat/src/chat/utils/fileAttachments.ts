/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import type {
  ExternalFileReference,
  InlineFile,
  StructuredData,
  StructuredField,
} from '../../types/messaging/Messages';

/**
 * A file attached to a sent message, reduced to the fields the chat renders.
 *
 * Structurally identical to `FileAttachment` in `@carbon/ai-chat-components`, and
 * declared here on purpose: importing that type would couple `chat/utils/` to the
 * component package, which the SDK import-graph spec walks for. Structural typing
 * makes the hand-off to the Lit element cast-free.
 *
 * Deliberately carries neither `url` nor `size`. The chat renders no download link
 * and shows no file size, and leaving both out of the view model means neither can
 * leak into the UI by accident.
 */
interface MessageFileAttachment {
  /** A unique ID, used to key the rendered list. */
  id: string;
  /** The file name to display, when one is known. */
  name?: string;
  /** The MIME type, used to pick the file-type icon. */
  mimeType?: string;
}

/**
 * The runtime shape a `file` field's value may take. {@link StructuredField.value}
 * is `unknown` and entirely host-supplied, so every field is checked rather than
 * trusted. Mirrors the readable parts of {@link InlineFile} and
 * {@link ExternalFileReference}.
 */
interface FileValueLike {
  type?: InlineFile['type'] | ExternalFileReference['type'] | string;
  id?: string;
  name?: ExternalFileReference['name'];
  mime_type?: ExternalFileReference['mime_type'];
  file?: InlineFile['file'];
}

/**
 * Converts one `file` field value into an attachment, or returns null if the value
 * isn't a shape the chat recognizes.
 *
 * `fallbackID` covers a value that arrives without an `id`. That shouldn't happen
 * for a reference, whose `id` is required, but the value is `unknown` at runtime
 * and a missing key breaks list rendering.
 */
function toAttachment(
  value: unknown,
  fallbackID: string
): MessageFileAttachment | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const fileValue = value as FileValueLike;

  if (fileValue.type === 'reference') {
    return {
      id: fileValue.id || fallbackID,
      name: fileValue.name,
      mimeType: fileValue.mime_type,
    };
  }

  if (fileValue.type === 'inline') {
    // An inline file's name and type come from the live File. A File cannot be
    // serialized into a HistoryItem, so a restored inline file has neither, and
    // the chip falls back to a generic label.
    return {
      id: fileValue.id || fallbackID,
      name: fileValue.file?.name,
      mimeType: fileValue.file?.type,
    };
  }

  return null;
}

/**
 * Collects the file attachments the chat should render for a message, from the
 * `file`-typed fields on its structured data.
 *
 * Never throws. The render site has no error boundary above it that would preserve
 * the rest of the transcript, so an unrecognized field is skipped and the rest of
 * the message still renders.
 */
function getMessageFileAttachments(
  structuredData: StructuredData | undefined
): MessageFileAttachment[] {
  const fields = structuredData?.fields;

  if (!fields?.length) {
    return [];
  }

  const attachments: MessageFileAttachment[] = [];

  fields.forEach((field: StructuredField) => {
    if (field?.type !== 'file') {
      return;
    }

    // A file field's value may hold a single file or an array of them.
    const values = Array.isArray(field.value) ? field.value : [field.value];

    values.forEach((value: unknown, index: number) => {
      const attachment = toAttachment(value, `${field.id}:${index}`);
      if (attachment) {
        attachments.push(attachment);
      }
    });
  });

  return attachments;
}

/**
 * Whether a send has nothing to show and should be marked silent, so it reaches
 * the assistant without rendering an empty bubble.
 *
 * A file with no caption is not such a case: the bubble renders a chip for it, so
 * the message has something to show. This asks the same question the bubble does,
 * which keeps the two in step.
 */
function shouldSendSilently(
  text: string,
  structuredData: StructuredData | undefined
): boolean {
  return !text && getMessageFileAttachments(structuredData).length === 0;
}

export { getMessageFileAttachments, shouldSendSilently };
export type { MessageFileAttachment };
