/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */
import React from "react";
import VideoPlayer from "../../../react/video-player";
import Card from "../../../react/card";
import { action } from "storybook/actions";
import VideoPlayerMeta, {
  Default as DefaultWC,
  ErrorState as ErrorStateWC,
} from "./video-player.stories";
import "./video-player-react.stories.css";

const eventArgTypes = {
  onPlay: {
    action: "play",
    description:
      VideoPlayerMeta.argTypes["@cds-aichat-video-player-play"].description,
    control: "none",
    table: { category: "events" },
  },
  onPause: {
    action: "pause",
    description:
      VideoPlayerMeta.argTypes["@cds-aichat-video-player-pause"].description,
    control: "none",
    table: { category: "events" },
  },
  onReady: {
    action: "ready",
    description:
      VideoPlayerMeta.argTypes["@cds-aichat-video-player-ready"].description,
    control: "none",
    table: { category: "events" },
  },
  onError: {
    action: "error",
    description:
      VideoPlayerMeta.argTypes["@cds-aichat-video-player-error"].description,
    control: "none",
    table: { category: "events" },
  },
};

const withoutWcEventArgTypes = (argTypes) => {
  const {
    "@cds-aichat-video-player-play": _play,
    "@cds-aichat-video-player-pause": _pause,
    "@cds-aichat-video-player-ready": _ready,
    "@cds-aichat-video-player-error": _error,
    ...rest
  } = argTypes;
  return rest;
};

export default {
  title: "Components/Video player",
  component: VideoPlayer,
};

export const Default = {
  argTypes: {
    ...withoutWcEventArgTypes(VideoPlayerMeta.argTypes),
    ...eventArgTypes,
  },
  args: { ...DefaultWC.args },
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

    const videoPlayer = useCard ? (
      <VideoPlayer
        source={source}
        playing={playing}
        aspectRatioPercentage={aspectRatioPercentage}
        ariaLabel={ariaLabel}
        data-rounded="top"
        onPlay={(e) => action("play")(e.detail)}
        onPause={(e) => action("pause")(e.detail)}
        onReady={(e) => action("ready")(e.detail)}
        onError={(e) => action("error")(e.detail)}
      />
    ) : (
      <VideoPlayer
        source={source}
        playing={playing}
        aspectRatioPercentage={aspectRatioPercentage}
        ariaLabel={ariaLabel}
        onPlay={(e) => action("play")(e.detail)}
        onPause={(e) => action("pause")(e.detail)}
        onReady={(e) => action("ready")(e.detail)}
        onError={(e) => action("error")(e.detail)}
      />
    );

    if (!useCard) {
      return videoPlayer;
    }

    return (
      <Card isFlush>
        <div slot="media">{videoPlayer}</div>
        <div slot="body" className="video-player-card-body">
          <h4 className="video-player-card-title">{title}</h4>
          <p className="video-player-card-description">{description}</p>
        </div>
      </Card>
    );
  },
};

export const ErrorState = {
  args: { ...ErrorStateWC.args },
  render: (args) => {
    const {
      source,
      title,
      description,
      playing,
      aspectRatioPercentage,
      ariaLabel,
    } = args;

    return (
      <Card isFlush>
        <div slot="media">
          <VideoPlayer
            source={source}
            playing={playing}
            aspectRatioPercentage={aspectRatioPercentage}
            ariaLabel={ariaLabel}
            data-rounded="top"
            onPlay={(e) => action("play")(e.detail)}
            onPause={(e) => action("pause")(e.detail)}
            onReady={(e) => action("ready")(e.detail)}
            onError={(e) => action("error")(e.detail)}
          />
        </div>
        <div slot="body" className="video-player-card-body">
          <h4 className="video-player-card-title">{title}</h4>
          <p className="video-player-card-description">{description}</p>
        </div>
      </Card>
    );
  },
};
