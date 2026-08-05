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
  ConversationalSearchItem,
  CustomSendMessageOptions,
  MessageResponseTypes,
  MessageState,
} from '@carbon/ai-chat';

import { uuid } from '@carbon/ai-chat-components/es/globals/utils/uuid.js';
import { WORD_DELAY } from './constants';

async function sleep(milliseconds: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const TEXT =
  'Carbon was first recognized as an element by Antoine Lavoisier in 1789, though carbon compounds have been known since ancient times. Carbon exists in multiple allotropes including diamond, graphite, and fullerenes. Diamond was first synthesized artificially in 1955, while fullerenes were discovered in 1985, and graphene was first isolated in 2004 by Andre Geim and Konstantin Novoselov at the University of Manchester.';

const META = {
  citations: [
    {
      title: 'Carbon Allotropes - Chemical Database (IBM Research)',
      text: 'Diamond was first synthesized artificially in 1955, while fullerenes were discovered in 1985, and graphene was first isolated in 2004 by Andre Geim and Konstantin Novoselov.',
      url: 'https://ibm.com/research/carbon-allotropes#:~:text=Diamond%20was%20first,University%20of%20Manchester',
      ranges: [{ start: 147, end: 290 }],
    },
    {
      title: 'Carbon Element History - Chemical Elements Database (IBM Watson)',
      text: 'Carbon was first recognized as an element by Antoine Lavoisier in 1789, though carbon compounds have been known since ancient times.',
      url: 'https://ibm.com/chemistry/elements/carbon#:~:text=Antoine%20Lavoisier%201789',
      ranges: [{ start: 0, end: 137 }],
    },
    {
      title:
        'Carbon Research Database - Internal Collection (IBM Quantum Network)',
      text: 'Carbon exists in multiple allotropes including diamond, graphite, and fullerenes. Diamond was first synthesized artificially in 1955, while fullerenes were discovered in 1985.',
      // The result comes from an internal collection and does not have a url, instead we are going to reference the full search result.
      search_result_idx: 0,
      ranges: [{ start: 138, end: 247 }],
    },
  ],
  search_results: [
    {
      body: `Carbon exists in multiple allotropes including diamond, graphite, and fullerenes. Diamond was first synthesized artificially in 1955, while fullerenes were discovered in 1985, and graphene was first isolated in 2004 by Andre Geim and Konstantin Novoselov at the University of Manchester.
      
Carbon forms the backbone of organic chemistry due to its ability to form four covalent bonds and create long chains and complex structures. The element has an atomic number of 6 and is located in group 14 of the periodic table.

Carbon nanotubes, another important allotrope, exhibit remarkable mechanical and electrical properties. These cylindrical structures were first discovered in 1991 and have applications in electronics, materials science, and nanotechnology.

Isotopes of carbon include carbon-12, carbon-13, and carbon-14. Carbon-14 is radioactive and is used in carbon dating to determine the age of organic materials up to about 50,000 years old.`,
    },
  ],
};

function doConversationalSearch(instance: ChatInstance) {
  const response: ConversationalSearchItem = {
    response_type: MessageResponseTypes.CONVERSATIONAL_SEARCH,
    text: TEXT,
    ...META,
  };

  const messageID = uuid();
  instance.messaging.upsertMessage(messageID, MessageState.COMPLETE, () => ({
    id: messageID,
    output: {
      generic: [response],
    },
  }));
}

async function doConversationalSearchStreaming(
  instance: ChatInstance,
  text: string = TEXT,
  requestOptions?: CustomSendMessageOptions
) {
  const signal = requestOptions?.signal;
  const messageID = uuid();
  const words = text.split(' ');

  // The accumulated answer lives here rather than being sent as deltas.
  let streamedText = '';
  let isCanceled = signal?.aborted ?? false;

  const abortHandler = () => {
    isCanceled = true;
  };
  signal?.addEventListener('abort', abortHandler);

  // Search citations only make sense once the answer is whole, so they attach
  // on the completing update rather than on every tick.
  const apply = (state: MessageState) =>
    instance.messaging.upsertMessage(messageID, state, () => {
      const isComplete = state === MessageState.COMPLETE;
      return {
        id: messageID,
        output: {
          generic: [
            {
              response_type: MessageResponseTypes.CONVERSATIONAL_SEARCH,
              text: streamedText,
              streaming_metadata: {
                id: '1',
                cancellable: true,
                stream_stopped: isComplete && isCanceled,
              },
              ...(isComplete && !isCanceled ? META : {}),
            },
          ],
        },
      };
    });

  try {
    for (let index = 0; index < words.length && !isCanceled; index++) {
      await sleep(WORD_DELAY);
      if (isCanceled) {
        break;
      }
      streamedText += `${words[index]} `;
      await apply(MessageState.STREAMING);
    }

    if (!isCanceled) {
      streamedText = text;
    }
    await apply(MessageState.COMPLETE);
  } finally {
    signal?.removeEventListener('abort', abortHandler);
  }
}

export { doConversationalSearch, doConversationalSearchStreaming };
