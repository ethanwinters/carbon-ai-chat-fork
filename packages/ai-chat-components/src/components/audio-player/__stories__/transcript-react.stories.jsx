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
import { Transcript } from "../../../react/transcript";
import { AudioPlayer } from "../../../react/audio-player";
import { Card } from "../../../react/card";
import { action } from "storybook/actions";
import TranscriptMeta, {
  Default as DefaultWC,
  LongTranscript as LongTranscriptWC,
  WithAudioPlayer as WithAudioPlayerWC,
} from "./transcript.stories";
import "./transcript-react.stories.css";

/**
 * `expanded` is a controlled prop on `<Transcript>` — the component only
 * fires `onTranscriptToggle` and leaves the parent responsible for flipping
 * it back. This wraps that state so the `Controlled` story's toggle button
 * actually opens and closes the transcript content region.
 */
function TranscriptStateful({ showLabel, hideLabel, ...rest }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Transcript
      {...rest}
      showLabel={showLabel}
      hideLabel={hideLabel}
      expanded={expanded}
      onTranscriptToggle={(e) => {
        action("toggle")(e.detail);
        setExpanded(e.detail.expanded);
      }}
    />
  );
}

export default {
  title: "Components/Audio player/Transcript",
  component: Transcript,
};

const eventArgTypes = {
  onTranscriptToggle: {
    action: "toggle",
    description:
      TranscriptMeta.argTypes["@cds-aichat-transcript-toggle"].description,
    control: "none",
    table: { category: "events" },
  },
};

const withoutWcEventArgTypes = (argTypes) => {
  const { "@cds-aichat-transcript-toggle": _toggle, ...rest } = argTypes;
  return rest;
};

export const Default = {
  argTypes: {
    ...withoutWcEventArgTypes(TranscriptMeta.argTypes),
    ...eventArgTypes,
  },
  args: { ...DefaultWC.args },
  render: (args) => {
    const { text, label, language, showLabel, hideLabel } = args;

    return (
      <Transcript
        text={text}
        label={label}
        language={language}
        showLabel={showLabel}
        hideLabel={hideLabel}
        onTranscriptToggle={(e) => action("toggle")(e.detail)}
      />
    );
  },
};

export const LongTranscript = {
  args: { ...LongTranscriptWC.args },
  render: (args) => {
    const { text, label, language, showLabel, hideLabel } = args;

    return (
      <Transcript
        text={text}
        label={label}
        language={language}
        showLabel={showLabel}
        hideLabel={hideLabel}
        onTranscriptToggle={(e) => action("toggle")(e.detail)}
      />
    );
  },
};

export const Controlled = {
  render: (args) => {
    const { text, label, language, showLabel, hideLabel } = args;

    return (
      <TranscriptStateful
        text={text}
        label={label}
        language={language}
        showLabel={showLabel}
        hideLabel={hideLabel}
      />
    );
  },
};

export const WithAudioPlayer = {
  argTypes: { ...WithAudioPlayerWC.argTypes },
  args: { ...WithAudioPlayerWC.args },
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

    return (
      <Card>
        <div slot="media">
          <AudioPlayer
            source={audioSource}
            ariaLabel={audioTitle}
            data-rounded="top"
          />
        </div>
        <div slot="body" className="audio-player-card-body">
          <h4 className="audio-player-card-title">{audioTitle}</h4>
          <p className="audio-player-card-description">{audioDescription}</p>
          <Transcript
            text={text}
            label={label}
            language={language}
            showLabel={showLabel}
            hideLabel={hideLabel}
            onTranscriptToggle={(e) => action("toggle")(e.detail)}
          />
        </div>
      </Card>
    );
  },
};
