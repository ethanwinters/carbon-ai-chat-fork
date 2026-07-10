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
import { action } from "storybook/actions";

export default {
  title: "Components/Video player",
  args: {
    source: "https://www.youtube.com/watch?v=eZ1NizUx9U4",
    title: "Sample Video Title",
    description:
      "This is a sample video description that provides context about the video content.",
    playing: false,
    aspectRatioPercentage: 56.25,
    ariaLabel: "Video player",
    useCard: true,
  },
  argTypes: {
    source: {
      control: "text",
      description:
        "Video source URL. Try a YouTube URL (https://www.youtube.com/watch?v=eZ1NizUx9U4), a Vimeo URL (https://vimeo.com/671038464), or a native video file.",
      table: {
        defaultValue: {
          summary: "https://www.youtube.com/watch?v=eZ1NizUx9U4",
        },
      },
    },
    title: {
      control: "text",
      description: "Video title displayed in card body (when useCard is true)",
      table: { defaultValue: { summary: "Sample Video Title" } },
    },
    description: {
      control: "text",
      description:
        "Video description displayed in card body (when useCard is true)",
      table: {
        defaultValue: {
          summary:
            "This is a sample video description that provides context about the video content.",
        },
      },
    },
    playing: {
      control: "boolean",
      description: "Whether the video should be playing",
      table: { defaultValue: { summary: "false" } },
    },
    aspectRatioPercentage: {
      control: { type: "number", min: 0, max: 100, step: 0.01 },
      description:
        "Aspect ratio as padding-top percentage (default: 56.25 for 16:9)",
      table: { defaultValue: { summary: "56.25" } },
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label for accessibility",
      table: { defaultValue: { summary: "Video player" } },
    },
    useCard: {
      control: "boolean",
      description: "Wrap video player in a card component with metadata",
      table: { defaultValue: { summary: "true" } },
    },
    "@cds-aichat-video-player-play": {
      action: "play",
      table: { category: "events" },
    },
    "@cds-aichat-video-player-pause": {
      action: "pause",
      table: { category: "events" },
    },
    "@cds-aichat-video-player-ready": {
      action: "ready",
      table: { category: "events" },
    },
    "@cds-aichat-video-player-error": {
      action: "error",
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
      aspectRatioPercentage,
      ariaLabel,
      useCard,
    } = args;

    const videoPlayer = useCard
      ? html`
          <cds-aichat-video-player
            source=${source}
            ?playing=${playing}
            aspect-ratio-percentage=${aspectRatioPercentage}
            aria-label=${ariaLabel}
            data-rounded="top"
            @cds-aichat-video-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-video-player-pause=${(e) => action("pause")(e.detail)}
            @cds-aichat-video-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-video-player-error=${(e) => action("error")(e.detail)}
          >
          </cds-aichat-video-player>
        `
      : html`
          <cds-aichat-video-player
            source=${source}
            ?playing=${playing}
            aspect-ratio-percentage=${aspectRatioPercentage}
            aria-label=${ariaLabel}
            @cds-aichat-video-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-video-player-pause=${(e) => action("pause")(e.detail)}
            @cds-aichat-video-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-video-player-error=${(e) => action("error")(e.detail)}
          >
          </cds-aichat-video-player>
        `;

    if (!useCard) {
      return videoPlayer;
    }

    return html`
      <cds-aichat-card is-flush>
        <div slot="media">${videoPlayer}</div>
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

export const ErrorState = {
  args: {
    source: "https://invalid-url-that-will-cause-error.com/video.mp4",
    title: "Error State Example",
    description:
      "This demonstrates the error state when a video fails to load.",
    useCard: true,
  },
  render: (args) => {
    const {
      source,
      title,
      description,
      playing,
      aspectRatioPercentage,
      ariaLabel,
    } = args;

    return html`
      <cds-aichat-card is-flush>
        <div slot="media">
          <cds-aichat-video-player
            source=${source}
            ?playing=${playing}
            aspect-ratio-percentage=${aspectRatioPercentage}
            aria-label=${ariaLabel}
            data-rounded="top"
            @cds-aichat-video-player-play=${(e) => action("play")(e.detail)}
            @cds-aichat-video-player-pause=${(e) => action("pause")(e.detail)}
            @cds-aichat-video-player-ready=${(e) => action("ready")(e.detail)}
            @cds-aichat-video-player-error=${(e) => action("error")(e.detail)}
          >
          </cds-aichat-video-player>
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
