/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  ChatInstance,
  MessageResponseTypes,
  MessageState,
  SystemMessageVariant,
} from '@carbon/ai-chat';
import { uuid } from '@carbon/ai-chat-components/es/globals/utils/uuid.js';
import { MARKDOWN } from './constants';

function doSystemMessage(
  instance: ChatInstance,
  inline?: boolean,
  variant?: SystemMessageVariant
) {
  if (inline) {
    const messageID = uuid();
    instance.messaging.upsertMessage(messageID, MessageState.COMPLETE, () => ({
      id: messageID,
      output: {
        generic: [
          {
            response_type: MessageResponseTypes.SYSTEM,
            title: 'This is a system message',
          },
          {
            response_type: MessageResponseTypes.TEXT,
            text: MARKDOWN,
          },
        ],
      },
    }));
  }
  if (variant === 'agent') {
    const systemMessageID = uuid();
    instance.messaging.upsertMessage(
      systemMessageID,
      MessageState.COMPLETE,
      () => ({
        id: systemMessageID,
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.SYSTEM,
              title: 'Agent joined the chat',
              variant: 'agent',
            },
          ],
        },
      })
    );
    const messageID = uuid();
    instance.messaging.upsertMessage(messageID, MessageState.COMPLETE, () => ({
      id: messageID,
      output: {
        generic: [
          {
            response_type: MessageResponseTypes.TEXT,
            text: MARKDOWN,
          },
        ],
      },
    }));
  }
  if (variant === 'date') {
    const systemMessageID = uuid();
    instance.messaging.upsertMessage(
      systemMessageID,
      MessageState.COMPLETE,
      () => ({
        id: systemMessageID,
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.SYSTEM,
              title: 'Monday, June 14th 2025',
              variant: 'date',
            },
          ],
        },
      })
    );
    const messageID = uuid();
    instance.messaging.upsertMessage(messageID, MessageState.COMPLETE, () => ({
      id: messageID,
      output: {
        generic: [
          {
            response_type: MessageResponseTypes.TEXT,
            text: MARKDOWN,
          },
        ],
      },
    }));
  } else {
    const systemMessageID = uuid();
    instance.messaging.upsertMessage(
      systemMessageID,
      MessageState.COMPLETE,
      () => ({
        id: systemMessageID,
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.SYSTEM,
              title: 'This is a system message',
              variant: 'default',
            },
          ],
        },
      })
    );

    const messageID = uuid();
    instance.messaging.upsertMessage(messageID, MessageState.COMPLETE, () => ({
      id: messageID,
      output: {
        generic: [
          {
            response_type: MessageResponseTypes.TEXT,
            text: MARKDOWN,
          },
        ],
      },
    }));
  }
}

export { doSystemMessage };
