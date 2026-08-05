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
} from '@carbon/ai-chat';
import { uuid } from '@carbon/ai-chat-components/es/globals/utils/uuid.js';

function doDate(instance: ChatInstance) {
  const messageID = uuid();
  instance.messaging.upsertMessage(messageID, MessageState.COMPLETE, () => ({
    id: messageID,
    output: {
      generic: [
        {
          response_type: MessageResponseTypes.DATE,
        },
      ],
    },
  }));
}

export { doDate };
