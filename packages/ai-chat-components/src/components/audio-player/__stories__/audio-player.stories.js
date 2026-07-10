/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "../index";
import "../../card/index.js";
import { html } from "lit";
import isChromatic from "chromatic/isChromatic";
import { action } from "storybook/actions";

const WITH_TRANSCRIPT_SOURCE_CHROMATIC_DATA_URI =
  "data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA";

export default {
  title: "Components/Audio player",
  args: {
    source:
      "https://soundcloud.com/ibmthinkleaders/leveraging-ai-to-tackle-large-problems-being-an-optimistic-futurist-feat-kate-oneill",
    title: "Leveraging AI to Tackle Large Problems",
    description:
      "A conversation about being an optimistic futurist featuring Kate O'Neill from IBM Think Leaders.",
    playing: false,
    ariaLabel: "Audio player",
    useCard: true,
    loadingStatusMessage: "Audio player loading",
    readyStatusMessage: "Audio player ready",
    loadingLabel: "Loading",
    readyLabel: "Ready",
    errorLabel: "Error",
  },
  argTypes: {
    source: {
      control: "text",
      description: "Audio source URL (SoundCloud, native audio files, etc.)",
    },
    title: {
      control: "text",
      description: "Audio title displayed in card body (when useCard is true)",
    },
    description: {
      control: "text",
      description:
        "Audio description displayed in card body (when useCard is true)",
    },
    playing: {
      control: "boolean",
      description: "Whether the audio should be playing",
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label for accessibility",
    },
    useCard: {
      control: "boolean",
      description: "Wrap audio player in a card component with metadata",
    },
    loadingStatusMessage: {
      control: "text",
      description: "Status message announced when audio starts loading",
      table: { defaultValue: { summary: "Audio player loading" } },
    },
    readyStatusMessage: {
      control: "text",
      description: "Status message announced when audio is ready",
      table: { defaultValue: { summary: "Audio player ready" } },
    },
    loadingLabel: {
      control: "text",
      description: "Label suffix for the loading state.",
      table: { defaultValue: { summary: "Loading" } },
    },
    readyLabel: {
      control: "text",
      description: "Label suffix for the ready state.",
      table: { defaultValue: { summary: "Ready" } },
    },
    errorLabel: {
      control: "text",
      description: "Label suffix for the error state.",
      table: { defaultValue: { summary: "Error" } },
    },
    "@cds-aichat-audio-player-ready": {
      action: "ready",
      table: { category: "events" },
    },
    "@cds-aichat-audio-player-error": {
      action: "error",
      table: { category: "events" },
    },
    "@cds-aichat-audio-player-play": {
      action: "play",
      table: { category: "events" },
    },
    "@cds-aichat-audio-player-pause": {
      action: "pause",
      table: { category: "events" },
    },
  },
};

export const Default = {
  render: (args) => {
    const {
      source,
      title,
      description,
      playing,
      ariaLabel,
      useCard,
      loadingStatusMessage,
      readyStatusMessage,
      loadingLabel,
      readyLabel,
      errorLabel,
    } = args;

    const audioPlayer = useCard
      ? html`
          <cds-aichat-audio-player
            source=${source}
            ?playing=${playing}
            aria-label=${ariaLabel}
            loading-status-message=${loadingStatusMessage}
            ready-status-message=${readyStatusMessage}
            loading-label=${loadingLabel}
            ready-label=${readyLabel}
            error-label=${errorLabel}
            data-rounded="top"
            @cds-aichat-audio-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-audio-player-error=${(e) => action("error")(e.detail)}
            @cds-aichat-audio-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-audio-player-pause=${(e) => action("pause")(e.detail)}
          >
          </cds-aichat-audio-player>
        `
      : html`
          <cds-aichat-audio-player
            source=${source}
            ?playing=${playing}
            aria-label=${ariaLabel}
            loading-status-message=${loadingStatusMessage}
            ready-status-message=${readyStatusMessage}
            loading-label=${loadingLabel}
            ready-label=${readyLabel}
            error-label=${errorLabel}
            @cds-aichat-audio-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-audio-player-error=${(e) => action("error")(e.detail)}
            @cds-aichat-audio-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-audio-player-pause=${(e) => action("pause")(e.detail)}
          >
          </cds-aichat-audio-player>
        `;

    if (!useCard) {
      return audioPlayer;
    }

    return html`
      <cds-aichat-card is-flush>
        <div slot="media">${audioPlayer}</div>
        <div slot="body" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0;">${title}</h4>
          <p style="margin: 0; color: var(--cds-text-secondary);">
            ${description}
          </p>
        </div>
      </cds-aichat-card>
    `;
  },
};

export const WithTranscript = {
  args: {
    source: isChromatic()
      ? WITH_TRANSCRIPT_SOURCE_CHROMATIC_DATA_URI
      : "https://web-chat.assistant.test.watson.cloud.ibm.com/assets/Teapot_Hasselhoff.mp3",
    title: "Your own mp3 file with transcript",
    description: "This example includes a transcript for accessibility.",
    transcriptText:
      "My text input is, you know, I am a teapot and then my image input is a picture of David Hasselhoff.",
    transcriptLabel: "English Transcript",
    transcriptLanguage: "en",
    useCard: true,
  },
  argTypes: {
    transcriptText: {
      control: "text",
      description: "Transcript text content",
    },
    transcriptLabel: {
      control: "text",
      description: "Transcript label",
    },
    transcriptLanguage: {
      control: "text",
      description: "Transcript language code",
    },
  },
  render: (args) => {
    const {
      source,
      title,
      description,
      transcriptText,
      transcriptLabel,
      transcriptLanguage,
      playing,
      ariaLabel,
    } = args;

    return html`
      <cds-aichat-card is-flush>
        <div slot="media">
          <cds-aichat-audio-player
            source=${source}
            ?playing=${playing}
            aria-label=${ariaLabel}
            data-rounded="top"
            @cds-aichat-audio-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-audio-player-error=${(e) => action("error")(e.detail)}
            @cds-aichat-audio-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-audio-player-pause=${(e) => action("pause")(e.detail)}
          >
          </cds-aichat-audio-player>
        </div>
        <div slot="body" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0;">${title}</h4>
          <p style="margin: 0 0 1rem 0; color: var(--cds-text-secondary);">
            ${description}
          </p>
          <cds-aichat-transcript
            text=${transcriptText}
            label=${transcriptLabel}
            language=${transcriptLanguage}
          >
          </cds-aichat-transcript>
        </div>
      </cds-aichat-card>
    `;
  },
};

export const ErrorState = {
  args: {
    source: "https://invalid-url-that-will-cause-error.com/audio.mp3",
    title: "Error State Example",
    description:
      "This demonstrates the error state when an audio file fails to load.",
    useCard: true,
    errorMessage: "Failed to load audio",
  },
  argTypes: {
    errorMessage: {
      control: "text",
      description: "Generic error message to display when audio fails to load",
      table: { defaultValue: { summary: "Failed to load audio" } },
    },
  },
  render: (args) => {
    const { source, title, description, playing, ariaLabel, errorMessage } =
      args;

    return html`
      <cds-aichat-card is-flush>
        <div slot="media">
          <cds-aichat-audio-player
            source=${source}
            ?playing=${playing}
            aria-label=${ariaLabel}
            error-message=${errorMessage}
            data-rounded="top"
            @cds-aichat-audio-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-audio-player-error=${(e) => action("error")(e.detail)}
            @cds-aichat-audio-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-audio-player-pause=${(e) => action("pause")(e.detail)}
          >
          </cds-aichat-audio-player>
        </div>
        <div slot="body" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0;">${title}</h4>
          <p style="margin: 0; color: var(--cds-text-secondary);">
            ${description}
          </p>
        </div>
      </cds-aichat-card>
    `;
  },
};
