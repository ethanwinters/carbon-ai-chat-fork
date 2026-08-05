/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { ChatInstance, CustomSendMessageOptions } from '@carbon/ai-chat';

import { TABLE } from './constants';
import { doText, doTextStreamingUpsert } from './doText';

function doTable(instance: ChatInstance) {
  doText(instance, `A periodic table in markdown format.\n\n${TABLE}`);
}

async function doTableStreaming(
  instance: ChatInstance,
  requestOptions?: CustomSendMessageOptions
) {
  await doTextStreamingUpsert(instance, {
    text: `A periodic table in markdown format.\n\n${TABLE}`,
    requestOptions,
  });
}

export { doTable, doTableStreaming };
