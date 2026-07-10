/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */
import "../index";
import { html } from "lit";
import { action } from "storybook/actions";
import {
  BookAvatarIcon,
  ChartLineAvatarIcon,
  DatabaseAvatarIcon,
  HelpAvatarIcon,
} from "./avatar-icons.js";

// Flat suggestion items (no groups)
const flatSuggestions = [
  {
    id: "suggestion-1",
    label: "When is the best time to eat?",
  },
  {
    id: "suggestion-2",
    label: "When is the sun rising today?",
  },
  {
    id: "suggestion-3",
    label: "When is the sun setting today?",
  },
  {
    id: "suggestion-4",
    label: "When is the start of Spring?",
  },
  {
    id: "suggestion-5",
    label: "When is the next full moon?",
  },
  {
    id: "suggestion-6",
    label: "When is the next lunar eclipse?",
  },
];

// Suggestion groups with avatars and descriptions
const suggestionGroupsWithAvatars = [
  {
    id: "group-1",
    title: "Domain A",
    items: [
      {
        id: "suggestion-1",
        label: "Summarize",
        description: "Describe selected data",
        avatar: BookAvatarIcon,
      },
      {
        id: "suggestion-2",
        label: "Visualization",
        description: "Generate quick chart",
        avatar: ChartLineAvatarIcon,
      },
    ],
  },
  {
    id: "group-2",
    title: "Domain B",
    items: [
      {
        id: "suggestion-3",
        label: "Train",
        description: "Use dataset to train model",
        avatar: DatabaseAvatarIcon,
      },
      {
        id: "suggestion-4",
        label: "Summarize",
        description: "Describe selected data",
        avatar: BookAvatarIcon,
      },
    ],
  },
  {
    id: "group-3",
    title: "Domain C",
    items: [
      {
        id: "suggestion-5",
        label: "Validate",
        description: "Check quality of data",
        avatar: DatabaseAvatarIcon,
      },
      {
        id: "suggestion-6",
        label: "Document",
        description: "Show available commands ",
        avatar: HelpAvatarIcon,
      },
    ],
  },
];

/**
 * Filter suggestion items based on query string (case-insensitive).
 * Returns all items if query is empty.
 */
const filterSuggestions = (items, query) => {
  if (!query) {
    return items;
  }
  const lower = query.toLowerCase();
  return items.filter((item) => item.label.toLowerCase().includes(lower));
};

/**
 * Filter suggestion groups based on query string (case-insensitive).
 * Returns groups with filtered items, excluding empty groups.
 */
const filterSuggestionGroups = (groups, query) => {
  if (!query) {
    return groups;
  }
  const lower = query.toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(lower),
      ),
    }))
    .filter((group) => group.items.length > 0);
};

export default {
  title: "Preview/Autocomplete",
  component: "cds-aichat-autocomplete",
};

export const Default = {
  argTypes: {
    inputText: {
      control: "text",
      description:
        "The current input text. Suggestion items will apply styling to indicate what the user has already typed.",
      table: { defaultValue: { summary: "" } },
    },
    enableSendButton: {
      control: "boolean",
      description: "Whether to enable the send button.",
      table: { defaultValue: { summary: "true" } },
    },
    attached: {
      control: "boolean",
      description:
        "Whether the autocomplete is attached to another element (e.g., an input field). When true, the bottom corners will not be rounded.",
      table: { defaultValue: { summary: "true" } },
    },
    showHeader: {
      control: "boolean",
      description:
        "Whether to show the optional header above the suggestion list.",
      table: { defaultValue: { summary: "false" } },
    },
    headerTitle: {
      control: "text",
      description: "Title text displayed in the header when it's shown.",
      table: { defaultValue: { summary: "Prompt suggestions" } },
    },
  },
  args: {
    inputText: "",
    enableSendButton: true,
    attached: true,
    showHeader: false,
    headerTitle: "Prompt suggestions",
  },
  render: (args) => {
    const query = args.inputText || "";
    const filteredItems = filterSuggestions(flatSuggestions, query);

    return html`
      <div style="width: 320px;">
        <cds-aichat-autocomplete
          style="--cds-aichat-autocomplete-max-height: 328px;"
          .items=${filteredItems}
          .headerConfig=${{
            showHeader: args.showHeader,
            title: args.headerTitle,
          }}
          ?attached=${args.attached}
          ?enable-send-button=${args.enableSendButton}
          input-text=${args.inputText}
          @cds-aichat-autocomplete-select=${(e) =>
            action("cds-aichat-autocomplete-select")(e.detail)}
          @cds-aichat-autocomplete-send=${(e) =>
            action("cds-aichat-autocomplete-send")(e.detail)}
          @cds-aichat-autocomplete-dismiss=${() =>
            action("cds-aichat-autocomplete-dismiss")()}
        ></cds-aichat-autocomplete>
      </div>
    `;
  },
};

export const WithCategories = {
  argTypes: { ...Default.argTypes },
  args: { ...Default.args },
  render: (args) => {
    const query = args.inputText || "";
    const filteredGroups = filterSuggestionGroups(
      suggestionGroupsWithAvatars,
      query,
    );

    return html`
      <div style="width: 320px;">
        <cds-aichat-autocomplete
          style="--cds-aichat-autocomplete-max-height: 328px;"
          .groups=${filteredGroups}
          .headerConfig=${{
            showHeader: args.showHeader,
            title: args.headerTitle,
          }}
          ?attached=${args.attached}
          ?enable-send-button=${args.enableSendButton}
          input-text=${args.inputText}
          @cds-aichat-autocomplete-select=${(e) =>
            action("cds-aichat-autocomplete-select")(e.detail)}
          @cds-aichat-autocomplete-send=${(e) =>
            action("cds-aichat-autocomplete-send")(e.detail)}
          @cds-aichat-autocomplete-dismiss=${() =>
            action("cds-aichat-autocomplete-dismiss")()}
        ></cds-aichat-autocomplete>
      </div>
    `;
  },
};

export const Detached = {
  argTypes: { ...Default.argTypes },
  args: { ...Default.args, attached: false },
  render: (args) => {
    const query = args.inputText || "";
    const filteredItems = filterSuggestions(flatSuggestions, query);

    return html`
      <div style="width: 671px;">
        <cds-aichat-autocomplete
          style="--cds-aichat-autocomplete-max-height: 328px;"
          .items=${filteredItems}
          .headerConfig=${{
            showHeader: args.showHeader,
            title: args.headerTitle,
          }}
          ?enable-send-button=${args.enableSendButton}
          input-text=${args.inputText}
          ?attached=${args.attached}
          @cds-aichat-autocomplete-select=${(e) =>
            action("cds-aichat-autocomplete-select")(e.detail)}
          @cds-aichat-autocomplete-send=${(e) =>
            action("cds-aichat-autocomplete-send")(e.detail)}
          @cds-aichat-autocomplete-dismiss=${() =>
            action("cds-aichat-autocomplete-dismiss")()}
        ></cds-aichat-autocomplete>
      </div>
    `;
  },
};
