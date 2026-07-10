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
import AudioPlayer from "../../../react/audio-player";
import { Transcript } from "../../../react/transcript";
import Card from "../../../react/card";
import { action } from "storybook/actions";
import AudioPlayerMeta, {
  Default as DefaultWC,
  WithTranscript as WithTranscriptWC,
  ErrorState as ErrorStateWC,
} from "./audio-player.stories";
import "./audio-player-react.stories.css";

const eventArgTypes = {
  onReady: {
    action: "ready",
    description:
      AudioPlayerMeta.argTypes["@cds-aichat-audio-player-ready"].description,
    control: "none",
    table: { category: "events" },
  },
  onError: {
    action: "error",
    description:
      AudioPlayerMeta.argTypes["@cds-aichat-audio-player-error"].description,
    control: "none",
    table: { category: "events" },
  },
  onPlay: {
    action: "play",
    description:
      AudioPlayerMeta.argTypes["@cds-aichat-audio-player-play"].description,
    control: "none",
    table: { category: "events" },
  },
  onPause: {
    action: "pause",
    description:
      AudioPlayerMeta.argTypes["@cds-aichat-audio-player-pause"].description,
    control: "none",
    table: { category: "events" },
  },
};

const withoutWcEventArgTypes = (argTypes) => {
  const {
    "@cds-aichat-audio-player-ready": _ready,
    "@cds-aichat-audio-player-error": _error,
    "@cds-aichat-audio-player-play": _play,
    "@cds-aichat-audio-player-pause": _pause,
    ...rest
  } = argTypes;
  return rest;
};

export default {
  title: "Components/Audio player",
  component: AudioPlayer,
};

export const Default = {
  argTypes: {
    ...withoutWcEventArgTypes(AudioPlayerMeta.argTypes),
    ...eventArgTypes,
  },
  args: { ...DefaultWC.args },
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

    const audioPlayer = useCard ? (
      <AudioPlayer
        source={source}
        playing={playing}
        ariaLabel={ariaLabel}
        loadingStatusMessage={loadingStatusMessage}
        readyStatusMessage={readyStatusMessage}
        loadingLabel={loadingLabel}
        readyLabel={readyLabel}
        errorLabel={errorLabel}
        data-rounded="top"
        onReady={(e) => action("ready")(e.detail)}
        onError={(e) => action("error")(e.detail)}
        onPlay={(e) => action("play")(e.detail)}
        onPause={(e) => action("pause")(e.detail)}
      />
    ) : (
      <AudioPlayer
        source={source}
        playing={playing}
        ariaLabel={ariaLabel}
        loadingStatusMessage={loadingStatusMessage}
        readyStatusMessage={readyStatusMessage}
        loadingLabel={loadingLabel}
        readyLabel={readyLabel}
        errorLabel={errorLabel}
        onReady={(e) => action("ready")(e.detail)}
        onError={(e) => action("error")(e.detail)}
        onPlay={(e) => action("play")(e.detail)}
        onPause={(e) => action("pause")(e.detail)}
      />
    );

    if (!useCard) {
      return audioPlayer;
    }

    return (
      <Card isFlush>
        <div slot="media">{audioPlayer}</div>
        <div slot="body" className="audio-player-card-body">
          <h4 className="audio-player-card-title">{title}</h4>
          <p className="audio-player-card-description">{description}</p>
        </div>
      </Card>
    );
  },
};

export const WithTranscript = {
  argTypes: {
    transcriptText: WithTranscriptWC.argTypes.transcriptText,
    transcriptLabel: WithTranscriptWC.argTypes.transcriptLabel,
    transcriptLanguage: WithTranscriptWC.argTypes.transcriptLanguage,
  },
  args: { ...WithTranscriptWC.args },
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

    return (
      <Card isFlush>
        <div slot="media">
          <AudioPlayer
            source={source}
            playing={playing}
            ariaLabel={ariaLabel}
            data-rounded="top"
            onReady={(e) => action("ready")(e.detail)}
            onError={(e) => action("error")(e.detail)}
            onPlay={(e) => action("play")(e.detail)}
            onPause={(e) => action("pause")(e.detail)}
          />
        </div>
        <div slot="body" className="audio-player-card-body">
          <h4 className="audio-player-card-title">{title}</h4>
          <p className="audio-player-card-description-with-transcript">
            {description}
          </p>
          <Transcript
            text={transcriptText}
            label={transcriptLabel}
            language={transcriptLanguage}
          />
        </div>
      </Card>
    );
  },
};

export const ErrorState = {
  argTypes: {
    errorMessage: ErrorStateWC.argTypes.errorMessage,
  },
  args: { ...ErrorStateWC.args },
  render: (args) => {
    const { source, title, description, playing, ariaLabel, errorMessage } =
      args;

    return (
      <Card isFlush>
        <div slot="media">
          <AudioPlayer
            source={source}
            playing={playing}
            ariaLabel={ariaLabel}
            errorMessage={errorMessage}
            data-rounded="top"
            onReady={(e) => action("ready")(e.detail)}
            onError={(e) => action("error")(e.detail)}
            onPlay={(e) => action("play")(e.detail)}
            onPause={(e) => action("pause")(e.detail)}
          />
        </div>
        <div slot="body" className="audio-player-card-body">
          <h4 className="audio-player-card-title">{title}</h4>
          <p className="audio-player-card-description">{description}</p>
        </div>
      </Card>
    );
  },
};
