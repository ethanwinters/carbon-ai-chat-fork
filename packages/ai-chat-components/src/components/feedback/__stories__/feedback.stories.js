/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../src/feedback";
import { html } from "lit";
import { action } from "storybook/actions";

const negativeCategories = [
  "Inaccurate",
  "Unhelpful",
  "Inappropriate",
  "Not relevant",
  "Too verbose",
  "Missing information",
];

const positiveCategories = [
  "Accurate",
  "Helpful",
  "Well-formatted",
  "Clear explanation",
  "Comprehensive",
];

export default {
  title: "Components/Feedback",
  component: "cds-aichat-feedback",
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the feedback panel is open",
    },
    isReadonly: {
      control: "boolean",
      description: "Whether the feedback is in read-only mode",
    },
    title: {
      control: "text",
      description: "Title of the feedback panel",
    },
    body: {
      control: "text",
      description: "Body text for the user",
    },
    placeholder: {
      control: "text",
      description: "Placeholder for the text area",
    },
    disclaimer: {
      control: "text",
      description: "Legal disclaimer text",
    },
    disclaimerCheckbox: {
      control: "text",
      description: "Label text to display with disclaimer checkbox",
    },
    categoriesLabel: {
      control: "text",
      description: "Accessible label for the categories listbox",
    },
    primaryLabel: {
      control: "text",
      description: "Label for the primary button",
    },
    cancelLabel: {
      control: "text",
      description:
        "Accessible label for the button that closes the panel without submitting",
    },
    categories: {
      control: false,
      description: "Array of category labels shown as chips.",
      table: { category: "data" },
    },
    initialValues: {
      control: false,
      description:
        "Preset text and selected categories to display, typically for read-only feedback.",
      table: { category: "data" },
    },
    showTextArea: {
      control: "boolean",
      description: "Show the text area (defaults to false)",
    },
    showBody: {
      control: "boolean",
      description: "Show the body text (defaults to false)",
    },
    maxLength: {
      control: "number",
      description:
        "The maximum number of characters allowed in the feedback text area.",
    },
    "@feedback-submit": {
      action: "feedback-submit",
      table: { category: "events" },
      description:
        "Fires when feedback is submitted. `event.detail` includes text and selectedCategories.",
    },
    "@feedback-close": {
      action: "feedback-close",
      table: { category: "events" },
      description: "Fires when the panel is closed without submitting.",
    },
  },
};

export const Default = {
  args: {
    isOpen: true,
    isReadonly: false,
    title: "Provide feedback",
    body: "Help us improve by sharing your thoughts",
    placeholder: "Tell us more...",
    primaryLabel: "Submit",
    cancelLabel: "Cancel",
    showTextArea: true,
    showBody: true,
    maxLength: 1000,
  },
  render: (args) => html`
    <div style="padding: 1rem; max-width: 24rem;">
      <cds-aichat-feedback
        ?is-open=${args.isOpen}
        ?is-readonly=${args.isReadonly}
        title=${args.title}
        body=${args.body}
        text-area-placeholder=${args.placeholder}
        primary-label=${args.primaryLabel}
        cancel-label=${args.cancelLabel}
        .showTextArea=${args.showTextArea}
        ?show-body=${args.showBody}
        @feedback-submit=${(e) => action("feedback-submit")(e.detail)}
        @feedback-close=${() => action("feedback-close")()}
        max-length=${args.maxLength}
      >
      </cds-aichat-feedback>
    </div>
  `,
};

export const WithCategories = {
  args: {
    isOpen: true,
    isReadonly: false,
    title: "What went wrong?",
    body: "Select all that apply and provide details",
    placeholder: "Please describe the issue...",
    categoriesLabel: "Feedback categories",
    primaryLabel: "Submit",
    cancelLabel: "Cancel",
    showTextArea: true,
    showBody: true,
    categories: negativeCategories,
    maxLength: 1000,
  },
  render: (args) => html`
    <div style="padding: 1rem; max-width: 24rem;">
      <cds-aichat-feedback
        ?is-open=${args.isOpen}
        ?is-readonly=${args.isReadonly}
        title=${args.title}
        body=${args.body}
        text-area-placeholder=${args.placeholder}
        categories-label=${args.categoriesLabel}
        primary-label=${args.primaryLabel}
        cancel-label=${args.cancelLabel}
        .showTextArea=${args.showTextArea}
        ?show-body=${args.showBody}
        .categories=${args.categories}
        @feedback-submit=${(e) => action("feedback-submit")(e.detail)}
        @feedback-close=${() => action("feedback-close")()}
        max-length=${args.maxLength}
      >
      </cds-aichat-feedback>
    </div>
  `,
};

export const WithDisclaimer = {
  args: {
    isOpen: true,
    isReadonly: false,
    title: "Additional feedback",
    body: "Help us improve by sharing your thoughts",
    placeholder: "Your feedback...",
    primaryLabel: "Submit",
    cancelLabel: "Cancel",
    showTextArea: true,
    showBody: true,
    disclaimer:
      "To better understand your feedback, a dedicated IBM team may review additional information (such as your prompt and the model output) to drive improvement of AI-powered features. Your content will not be used to train or enhance the AI model.",
    disclaimerCheckbox:
      "I agree to IBM collecting information related to my feedback.",
    categories: positiveCategories,
    maxLength: 1000,
  },
  render: (args) => html`
    <div style="padding: 1rem; max-width: 24rem;">
      <cds-aichat-feedback
        ?is-open=${args.isOpen}
        ?is-readonly=${args.isReadonly}
        title=${args.title}
        body=${args.body}
        text-area-placeholder=${args.placeholder}
        primary-label=${args.primaryLabel}
        cancel-label=${args.cancelLabel}
        .showTextArea=${args.showTextArea}
        ?show-body=${args.showBody}
        .categories=${args.categories}
        disclaimer=${args.disclaimer}
        disclaimer-checkbox=${args.disclaimerCheckbox}
        @feedback-submit=${(e) => action("feedback-submit")(e.detail)}
        @feedback-close=${() => action("feedback-close")()}
        max-length=${args.maxLength}
      >
      </cds-aichat-feedback>
    </div>
  `,
};

export const ReadOnly = {
  args: {
    isOpen: true,
    isReadonly: true,
    title: "Your feedback",
    cancelLabel: "Cancel",
    showTextArea: true,
    showBody: false,
    categories: negativeCategories,
    initialValues: {
      text: "The response was inaccurate and didn't address my question properly. It also included irrelevant information.",
      selectedCategories: ["Inaccurate", "Not relevant"],
    },
    maxLength: 1000,
  },
  render: (args) => html`
    <div style="padding: 1rem; max-width: 24rem;">
      <cds-aichat-feedback
        ?is-open=${args.isOpen}
        ?is-readonly=${args.isReadonly}
        title=${args.title}
        cancel-label=${args.cancelLabel}
        .showTextArea=${args.showTextArea}
        ?show-body=${args.showBody}
        .categories=${args.categories}
        .initialValues=${args.initialValues}
        max-length=${args.maxLength}
      >
      </cds-aichat-feedback>
    </div>
  `,
};
