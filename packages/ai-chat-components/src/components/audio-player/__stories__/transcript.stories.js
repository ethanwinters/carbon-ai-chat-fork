/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "../index";
import { html, LitElement } from "lit";
import isChromatic from "chromatic/isChromatic";
import { action } from "storybook/actions";

const WITH_TRANSCRIPT_SOURCE_CHROMATIC_DATA_URI =
  "data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA";

/**
 * `expanded` is a controlled property on `cds-aichat-transcript` — the
 * component only dispatches a `cds-aichat-transcript-toggle` event and
 * leaves the parent responsible for flipping it back. This stateful wrapper
 * owns that state so the `Controlled` story's toggle button actually opens
 * and closes the transcript content region.
 */
class TranscriptStateful extends LitElement {
  static properties = {
    text: { type: String },
    label: { type: String },
    language: { type: String },
    showLabel: { type: String, attribute: "show-label" },
    hideLabel: { type: String, attribute: "hide-label" },
    expanded: { type: Boolean },
  };

  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this.text = "";
    this.label = "Transcript";
    this.language = "";
    this.showLabel = "Show";
    this.hideLabel = "Hide";
    this.expanded = false;
  }

  handleToggle(event) {
    action("toggle")(event.detail);
    this.expanded = event.detail.expanded;
  }

  render() {
    return html`
      <cds-aichat-transcript
        text=${this.text}
        label=${this.label}
        language=${this.language}
        show-label=${this.showLabel}
        hide-label=${this.hideLabel}
        ?expanded=${this.expanded}
        @cds-aichat-transcript-toggle=${(e) => this.handleToggle(e)}
      >
      </cds-aichat-transcript>
    `;
  }
}

if (!customElements.get("transcript-stateful")) {
  customElements.define("transcript-stateful", TranscriptStateful);
}

export default {
  title: "Components/Audio player/Transcript",
  args: {
    text: "My text input is, you know, I am a teapot and then my image input is a picture of David Hasselhoff.",
    label: "English Transcript",
    language: "en",
    showLabel: "Show",
    hideLabel: "Hide",
  },
  argTypes: {
    text: {
      control: "text",
      description: "The transcript text content (supports markdown)",
    },
    label: {
      control: "text",
      description: "Label for the transcript toggle button",
    },
    language: {
      control: "text",
      description: "Language code for the transcript (e.g., 'en', 'es')",
    },
    showLabel: {
      control: "text",
      description: "Label for showing the transcript",
      table: { defaultValue: { summary: "Show" } },
    },
    hideLabel: {
      control: "text",
      description: "Label for hiding the transcript",
      table: { defaultValue: { summary: "Hide" } },
    },
    "@cds-aichat-transcript-toggle": {
      action: "toggle",
      table: { category: "events" },
    },
  },
};

export const Default = {
  render: (args) => {
    const { text, label, language, showLabel, hideLabel } = args;

    return html`
      <cds-aichat-transcript
        text=${text}
        label=${label}
        language=${language}
        show-label=${showLabel}
        hide-label=${hideLabel}
        @cds-aichat-transcript-toggle=${(e) => action("toggle")(e.detail)}
      ></cds-aichat-transcript>
    `;
  },
};

export const LongTranscript = {
  args: {
    text: `This is a much longer transcript that demonstrates how the component handles extensive content.

The transcript component is designed to be collapsible, allowing users to expand and view the full content when needed, while keeping the interface clean and uncluttered by default.

**Key Features:**
- Expandable/collapsible interface
- Markdown support for formatting
- Accessibility-focused design
- Clean visual presentation

This makes it ideal for providing detailed transcripts of audio content without overwhelming the user interface. Users can choose to read the transcript when they need it, making the content more accessible to those who prefer or require text-based alternatives to audio.`,
    label: "Full Transcript",
    language: "en",
  },
  render: (args) => {
    const { text, label, language, showLabel, hideLabel } = args;

    return html`
      <cds-aichat-transcript
        text=${text}
        label=${label}
        language=${language}
        show-label=${showLabel}
        hide-label=${hideLabel}
        @cds-aichat-transcript-toggle=${(e) => action("toggle")(e.detail)}
      ></cds-aichat-transcript>
    `;
  },
};

export const Controlled = {
  render: (args) => {
    const { text, label, language, showLabel, hideLabel } = args;

    return html`
      <transcript-stateful
        text=${text}
        label=${label}
        language=${language}
        show-label=${showLabel}
        hide-label=${hideLabel}
      ></transcript-stateful>
    `;
  },
};

export const WithAudioPlayer = {
  args: {
    audioSource: isChromatic()
      ? WITH_TRANSCRIPT_SOURCE_CHROMATIC_DATA_URI
      : "https://web-chat.assistant.test.watson.cloud.ibm.com/assets/Teapot_Hasselhoff.mp3",
    audioTitle: "Your own mp3 file with transcript",
    audioDescription: "This example includes a transcript for accessibility.",
    text: "My text input is, you know, I am a teapot and then my image input is a picture of David Hasselhoff.",
    label: "English Transcript",
    language: "en",
  },
  argTypes: {
    audioSource: {
      control: "text",
      description: "Audio source URL",
    },
    audioTitle: {
      control: "text",
      description: "Audio title",
    },
    audioDescription: {
      control: "text",
      description: "Audio description",
    },
  },
  render: (args) => {
    const {
      audioSource,
      audioTitle,
      audioDescription,
      text,
      label,
      language,
      showLabel,
      hideLabel,
    } = args;

    return html`
      <cds-aichat-card>
        <div slot="media">
          <cds-aichat-audio-player
            source=${audioSource}
            aria-label=${audioTitle}
            data-rounded="top"
          >
          </cds-aichat-audio-player>
        </div>
        <div slot="body" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0;">${audioTitle}</h4>
          <p style="margin: 0 0 1rem 0; color: var(--cds-text-secondary);">
            ${audioDescription}
          </p>
          <cds-aichat-transcript
            text=${text}
            label=${label}
            language=${language}
            show-label=${showLabel}
            hide-label=${hideLabel}
            @cds-aichat-transcript-toggle=${(e) => action("toggle")(e.detail)}
          ></cds-aichat-transcript>
        </div>
      </cds-aichat-card>
    `;
  },
};
