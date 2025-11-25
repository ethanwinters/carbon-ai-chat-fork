/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  ChatInstance,
  CustomSendMessageOptions,
  MessageRequest,
  MessageResponseTypes,
  OptionItemPreference,
} from "@carbon/ai-chat";

import { ScenarioKey, runScenario, scenarioOptions } from "./scenarios";

const WELCOME_TEXT = `This example shows how to mock reasoning steps and chain of thought in Carbon AI Chat.

Choose a scenario from the dropdown below to see how the UI responds to different mocked streaming patterns.`;

function isScenarioKey(value: string): value is ScenarioKey {
  return scenarioOptions.some((option) => option.value === value);
}

function sendWelcome(instance: ChatInstance) {
  instance.messaging.addMessage({
    output: {
      generic: [
        {
          response_type: MessageResponseTypes.TEXT,
          text: WELCOME_TEXT,
        },
        {
          response_type: MessageResponseTypes.OPTION,
          title: "Pick a reasoning demo",
          description:
            "Each option shows a different mocked flow. You can edit the text for each scenario in src/scenarios.ts.",
          preference: OptionItemPreference.DROPDOWN,
          options: scenarioOptions.map((option) => ({
            label: option.label,
            value: { input: { text: option.value } },
          })),
        },
      ],
    },
  });
}

async function customSendMessage(
  request: MessageRequest,
  requestOptions: CustomSendMessageOptions,
  instance: ChatInstance,
) {
  const trimmedText = request.input.text?.trim() ?? "";

  if (!trimmedText) {
    sendWelcome(instance);
    return;
  }

  if (isScenarioKey(trimmedText)) {
    await runScenario(trimmedText, instance, requestOptions.signal);
    return;
  }

  sendWelcome(instance);
}

export { customSendMessage };
