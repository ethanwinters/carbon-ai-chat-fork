/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import {
  ChainOfThoughtStep,
  ChainOfThoughtStepStatus,
} from "@carbon/ai-chat-components/es/components/chain-of-thought/src/types.js";
import {
  ChatInstance,
  MessageResponseOptions,
  MessageResponseTypes,
  PartialItemChunk,
  ReasoningStep,
  ReasoningStepOpenState,
  StreamChunk,
} from "@carbon/ai-chat";

export type ScenarioKey =
  | "reasoning-steps"
  | "controlled-reasoning-steps"
  | "reasoning-content"
  | "chain-of-thought";

type ScenarioOption = {
  label: string;
  value: ScenarioKey;
};

const TEXT_STREAM_ID = "text-1";
const WORD_DELAY = 40;
const REASONING_STEP_DELAY = 3000;

const REASONING_STEPS_TEXT =
  "Reasoning steps will auto-open while the model is thinking, then hide once user-facing content starts streaming back. This is the default behavior.";
const CONTROLLED_REASONING_TEXT =
  "This *controlled* reasoning example is set to keep all reasoning steps closed by default with a loading indicator visible instead.";
const REASONING_CONTENT_TEXT =
  "Reasoning content can stream in as a single trace without individual steps. Use this when you want a long-form rationale instead of expandable steps.";
const CHAIN_OF_THOUGHT_TEXT =
  "Chain of thought is best suited for raw debugging or tool-call traces. In most cases you should use reasoning steps instead, because they are more user-friendly while still exposing the assistant's thinking.";

const REASONING_STEPS = [
  {
    title: "Read the user request",
    content:
      "Scanning the prompt and preparing to choose a relevant example response.",
  },
  {
    title: "Pick a scenario",
    content:
      "Selecting the reasoning flow that matches the provided dropdown choice.",
  },
  {
    title: "Fetching data",
    content: `Calling the retrieval service for supporting facts:
\`\`\`json
{
  "endpoint": "/mock/retrieve",
  "results": [
    { "id": "doc-123", "score": 0.91 },
    { "id": "doc-456", "score": 0.88 }
  ]
}
\`\`\``,
  },
  {
    title: "Prepare the response",
    content: "Generating the final answer to return to the user.",
  },
];

const REASONING_TRACE_CONTENT = REASONING_STEPS.map(
  (step) => step.content || step.title,
).join("\n\n");

const CHAIN_OF_THOUGHT_STEPS: ChainOfThoughtStep[] = [
  {
    title: "Vector search",
    description: "Retrieved similar documents.",
    tool_name: "semantic_search",
    request: { args: { query: "user request" } },
    response: { content: ["doc-1", "doc-2", "doc-3"] },
    status: ChainOfThoughtStepStatus.SUCCESS,
  },
  {
    title: "Summarize",
    description: "Summarizing the retrieved documents.",
    tool_name: "summarize",
    request: { args: { documents: ["doc-1", "doc-2", "doc-3"] } },
    response: { content: "Summary of the retrieved context." },
    status: ChainOfThoughtStepStatus.SUCCESS,
  },
  {
    title: "Generate response",
    description: "Drafting the user-facing reply.",
    tool_name: "generate",
    request: { args: { summary: "Summary of the retrieved context." } },
    response: { content: "Final chain of thought drafted." },
    status: ChainOfThoughtStepStatus.SUCCESS,
  },
];

export const scenarioOptions: ScenarioOption[] = [
  { label: "Reasoning steps", value: "reasoning-steps" },
  { label: "Controlled reasoning steps", value: "controlled-reasoning-steps" },
  { label: "Reasoning content", value: "reasoning-content" },
  { label: "Chain of thought", value: "chain-of-thought" },
];

export const scenarioTexts = {
  reasoningSteps: REASONING_STEPS_TEXT,
  controlledReasoning: CONTROLLED_REASONING_TEXT,
  reasoningContent: REASONING_CONTENT_TEXT,
  chainOfThought: CHAIN_OF_THOUGHT_TEXT,
};

async function sleep(milliseconds: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function createMessageShell(
  instance: ChatInstance,
  responseID: string,
  messageOptions?: MessageResponseOptions,
) {
  // Kick off streaming so reducers create the shell message before we add reasoning steps.
  instance.messaging.addMessageChunk({
    partial_item: {
      response_type: MessageResponseTypes.TEXT,
      text: "",
      streaming_metadata: { id: TEXT_STREAM_ID },
    },
    partial_response: {
      message_options: messageOptions,
    },
    streaming_metadata: { response_id: responseID },
  });
}

function updateMessageOptions(
  instance: ChatInstance,
  responseID: string,
  messageOptions: MessageResponseOptions,
) {
  const chunk: PartialItemChunk = {
    partial_item: {
      response_type: MessageResponseTypes.TEXT,
      text: "",
      streaming_metadata: { id: TEXT_STREAM_ID, cancellable: true },
    },
    partial_response: {
      message_options: messageOptions,
    },
    streaming_metadata: { response_id: responseID },
  };

  console.log({ chunk: JSON.parse(JSON.stringify(chunk)) });

  instance.messaging.addMessageChunk(chunk);
}

async function streamTextResponse(
  instance: ChatInstance,
  responseID: string,
  text: string,
  signal?: AbortSignal,
  onStart?: () => void,
  finalMessageOptions?: MessageResponseOptions,
) {
  const words = text.split(" ");
  let isCanceled = false;
  const timeouts: number[] = [];

  const abortHandler = () => {
    isCanceled = true;
    timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  };

  signal?.addEventListener("abort", abortHandler);

  onStart?.();

  try {
    words.forEach((word, index) => {
      const timeoutId = setTimeout(() => {
        if (!isCanceled) {
          instance.messaging.addMessageChunk({
            partial_item: {
              response_type: MessageResponseTypes.TEXT,
              text: `${word} `,
              streaming_metadata: {
                id: TEXT_STREAM_ID,
                cancellable: true,
              },
            },
            streaming_metadata: {
              response_id: responseID,
            },
          });
        }
      }, index * WORD_DELAY);
      timeouts.push(timeoutId as unknown as number);
    });

    await sleep(words.length * WORD_DELAY);

    if (!isCanceled) {
      const completeItem = {
        response_type: MessageResponseTypes.TEXT,
        text,
        streaming_metadata: {
          id: TEXT_STREAM_ID,
        },
      };
      instance.messaging.addMessageChunk({
        complete_item: completeItem,
        streaming_metadata: {
          response_id: responseID,
        },
      });

      const finalResponse: StreamChunk = {
        final_response: {
          id: responseID,
          output: {
            generic: [completeItem],
          },
        },
      };

      if (finalMessageOptions) {
        finalResponse.final_response.message_options = finalMessageOptions;
      }

      instance.messaging.addMessageChunk(finalResponse);
    } else {
      const stoppedItem = {
        response_type: MessageResponseTypes.TEXT,
        text: words.slice(0, Math.floor(words.length * 0.3)).join(" "),
        streaming_metadata: {
          id: TEXT_STREAM_ID,
          stream_stopped: true,
        },
      };
      instance.messaging.addMessageChunk({
        complete_item: stoppedItem,
        streaming_metadata: {
          response_id: responseID,
        },
      });
    }
  } finally {
    signal?.removeEventListener("abort", abortHandler);
  }
}

async function streamReasoningContentFirst(
  instance: ChatInstance,
  responseID: string,
  content: string,
  signal?: AbortSignal,
) {
  const tokens = content.match(/\S+\s*/g) ?? [content];
  let isCanceled = false;
  const abortHandler = () => {
    isCanceled = true;
  };

  signal?.addEventListener("abort", abortHandler);

  try {
    let partial = "";
    for (const token of tokens) {
      if (isCanceled) {
        break;
      }
      partial += token;
      updateMessageOptions(instance, responseID, {
        reasoning: { content: partial },
      });
      await sleep(WORD_DELAY);
    }
  } finally {
    signal?.removeEventListener("abort", abortHandler);
  }

  return !isCanceled;
}

async function runReasoningStepsScenario(
  instance: ChatInstance,
  signal?: AbortSignal,
) {
  const responseID = crypto.randomUUID();
  const collectedSteps: ReasoningStep[] = [];
  createMessageShell(instance, responseID, { reasoning: { steps: [] } });

  for (const step of REASONING_STEPS) {
    collectedSteps.push(step);
    updateMessageOptions(instance, responseID, {
      reasoning: { steps: collectedSteps },
    });
    await sleep(REASONING_STEP_DELAY);
  }

  await streamTextResponse(
    instance,
    responseID,
    scenarioTexts.reasoningSteps,
    signal,
    undefined,
    { reasoning: { steps: collectedSteps } },
  );
}

async function runControlledReasoningScenario(
  instance: ChatInstance,
  signal?: AbortSignal,
) {
  const responseID = crypto.randomUUID();

  const collectedSteps: ReasoningStep[] = [];
  createMessageShell(instance, responseID, { reasoning: { steps: [] } });

  instance.updateIsMessageLoadingCounter("increase", "Thinking...");

  for (const step of REASONING_STEPS) {
    collectedSteps.push({
      ...step,
      open_state: ReasoningStepOpenState.OPEN,
    });
    updateMessageOptions(instance, responseID, {
      reasoning: {
        open_state: ReasoningStepOpenState.CLOSE,
        steps: collectedSteps,
      },
    });
    instance.updateIsMessageLoadingCounter(undefined, `${step.title}...`);
    await sleep(REASONING_STEP_DELAY);
  }

  instance.updateIsMessageLoadingCounter("decrease");

  await streamTextResponse(
    instance,
    responseID,
    scenarioTexts.controlledReasoning,
    signal,
    undefined,
    { reasoning: { steps: collectedSteps } },
  );
}

async function runReasoningContentScenario(
  instance: ChatInstance,
  signal?: AbortSignal,
) {
  const responseID = crypto.randomUUID();
  const reasoningContent = REASONING_TRACE_CONTENT;

  createMessageShell(instance, responseID, { reasoning: { content: "" } });

  const completed = await streamReasoningContentFirst(
    instance,
    responseID,
    reasoningContent,
    signal,
  );

  if (!completed) {
    return;
  }

  await streamTextResponse(
    instance,
    responseID,
    scenarioTexts.reasoningContent,
    signal,
    undefined,
    { reasoning: { content: reasoningContent } },
  );
}

async function runChainOfThoughtScenario(
  instance: ChatInstance,
  signal?: AbortSignal,
) {
  const responseID = crypto.randomUUID();

  createMessageShell(instance, responseID, {
    chain_of_thought: [],
  });

  const steps: ChainOfThoughtStep[] = [];

  const pushStep = async (step: ChainOfThoughtStep, delay: number) => {
    steps.push(step);
    updateMessageOptions(instance, responseID, {
      chain_of_thought: steps,
    });
    await sleep(delay);
  };

  await pushStep(
    {
      ...CHAIN_OF_THOUGHT_STEPS[0],
      status: ChainOfThoughtStepStatus.PROCESSING,
    },
    400,
  );
  await pushStep(CHAIN_OF_THOUGHT_STEPS[0], 400);
  await pushStep(
    {
      ...CHAIN_OF_THOUGHT_STEPS[1],
      status: ChainOfThoughtStepStatus.PROCESSING,
    },
    400,
  );
  await pushStep(CHAIN_OF_THOUGHT_STEPS[1], 400);
  await pushStep(
    {
      ...CHAIN_OF_THOUGHT_STEPS[2],
      status: ChainOfThoughtStepStatus.PROCESSING,
    },
    400,
  );
  await pushStep(CHAIN_OF_THOUGHT_STEPS[2], 400);

  await streamTextResponse(
    instance,
    responseID,
    scenarioTexts.chainOfThought,
    signal,
    undefined,
    {
      chain_of_thought: steps,
    },
  );
}

export async function runScenario(
  scenario: ScenarioKey,
  instance: ChatInstance,
  signal?: AbortSignal,
) {
  switch (scenario) {
    case "reasoning-steps":
      await runReasoningStepsScenario(instance, signal);
      return;
    case "controlled-reasoning-steps":
      await runControlledReasoningScenario(instance, signal);
      return;
    case "reasoning-content":
      await runReasoningContentScenario(instance, signal);
      return;
    case "chain-of-thought":
      await runChainOfThoughtScenario(instance, signal);
      return;
    default:
      return;
  }
}
