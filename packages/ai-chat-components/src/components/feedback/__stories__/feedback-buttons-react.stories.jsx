/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/* eslint-disable */
import React from "react";

import Feedback from "../../../react/feedback";
import FeedbackButtons from "../../../react/feedback-buttons";
import FeedbackButtonsMetaWC, {
  Default as DefaultWC,
  WithDetailsPanel as WithDetailsPanelWC,
} from "./feedback-buttons.stories";

const {
  "@feedback-buttons-click": clickEventWC,
  ...feedbackButtonsArgTypesWC
} = FeedbackButtonsMetaWC.argTypes;

export default {
  title: "Components/Feedback/Buttons",
  argTypes: {
    ...feedbackButtonsArgTypesWC,
    onClick: {
      action: "onClick",
      control: "none",
      table: { category: "events" },
      description: clickEventWC.description,
    },
  },
};

const renderButtons = (args, options) => {
  const description = options?.description ?? "";
  const clickHandler = options?.onClick;

  return (
    <div style={{ padding: "2rem" }}>
      {description ? (
        <p style={{ marginBottom: "1rem" }}>{description}</p>
      ) : null}
      <FeedbackButtons
        isPositiveSelected={args.isPositiveSelected}
        isNegativeSelected={args.isNegativeSelected}
        isPositiveDisabled={args.isPositiveDisabled}
        isNegativeDisabled={args.isNegativeDisabled}
        hasPositiveDetails={args.hasPositiveDetails}
        hasNegativeDetails={args.hasNegativeDetails}
        isPositiveOpen={args.isPositiveOpen}
        isNegativeOpen={args.isNegativeOpen}
        positiveLabel={args.positiveLabel}
        negativeLabel={args.negativeLabel}
        panelID={args.panelID}
        onClick={(event) => {
          const { isPositive } = event.detail;
          clickHandler?.(isPositive);
        }}
      />
    </div>
  );
};

const reactPositiveCategories = [
  "Accurate",
  "Helpful",
  "Clear explanation",
  "Comprehensive",
];

const reactNegativeCategories = [
  "Inaccurate",
  "Unhelpful",
  "Inappropriate",
  "Too verbose",
];

const FeedbackButtonsWithDetailsDemo = ({
  hasPositiveDetails,
  hasNegativeDetails,
  panelID,
  positiveLabel,
  negativeLabel,
  positivePanelTitle,
  negativePanelTitle,
  positivePanelPrompt,
  negativePanelPrompt,
  positiveTextAreaPlaceholder,
  negativeTextAreaPlaceholder,
  cancelLabel,
  submitLabel,
}) => {
  const [state, setState] = React.useState({
    isPositiveSelected: false,
    isNegativeSelected: false,
    isPositiveOpen: false,
    isNegativeOpen: false,
    isSubmitted: false,
    lastSubmission: null,
  });

  const recordSubmission = React.useCallback(
    (prevState, isPositive, details) => {
      const submission = {
        isPositive,
        text: details?.text || "",
        selectedCategories: details?.selectedCategories || [],
      };

      // eslint-disable-next-line no-console
      console.log(
        `[Feedback Demo] ${isPositive ? "Positive" : "Negative"} submission recorded`,
        submission,
      );

      return {
        ...prevState,
        isPositiveSelected: isPositive,
        isNegativeSelected: !isPositive,
        isPositiveOpen: false,
        isNegativeOpen: false,
        isSubmitted: true,
        lastSubmission: submission,
      };
    },
    [],
  );

  const handleButtonClick = React.useCallback(
    (isPositive) => {
      setState((prev) => {
        if (prev.isSubmitted) {
          return prev;
        }

        const currentlySelected = isPositive
          ? prev.isPositiveSelected
          : prev.isNegativeSelected;
        const toggleToSelected = !currentlySelected;
        const hasDetails = isPositive ? hasPositiveDetails : hasNegativeDetails;
        const openDetails = hasDetails && toggleToSelected;

        if (toggleToSelected && !hasDetails) {
          return recordSubmission(prev, isPositive, {
            text: "",
            selectedCategories: [],
          });
        }

        return {
          ...prev,
          isPositiveSelected: isPositive ? toggleToSelected : false,
          isNegativeSelected: isPositive ? false : toggleToSelected,
          isPositiveOpen: openDetails && isPositive,
          isNegativeOpen: openDetails && !isPositive,
        };
      });
    },
    [hasNegativeDetails, hasPositiveDetails, recordSubmission],
  );

  const handleSubmit = React.useCallback(
    (isPositive, details) => {
      setState((prev) => recordSubmission(prev, isPositive, details));
    },
    [recordSubmission],
  );

  const renderFeedbackPanel = (isPositive) => {
    const label = isPositive ? "positive" : "negative";
    const categories = isPositive
      ? reactPositiveCategories
      : reactNegativeCategories;
    const title = isPositive ? positivePanelTitle : negativePanelTitle;
    const prompt = isPositive ? positivePanelPrompt : negativePanelPrompt;
    const placeholder = isPositive
      ? positiveTextAreaPlaceholder
      : negativeTextAreaPlaceholder;

    return (
      <Feedback
        key={label}
        className={`cds-aichat--feedback-details-${label}`}
        id={`${panelID}-feedback-${label}`}
        isOpen={isPositive ? state.isPositiveOpen : state.isNegativeOpen}
        isReadonly={state.isSubmitted}
        categories={categories}
        showTextArea
        showBody
        title={title}
        body={prompt}
        placeholder={placeholder}
        cancelLabel={cancelLabel}
        primaryLabel={submitLabel}
        onClose={() => handleButtonClick(isPositive)}
        onSubmit={(event) => handleSubmit(isPositive, event.detail)}
      />
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <p style={{ marginBottom: "1rem" }}>
        {hasPositiveDetails && hasNegativeDetails
          ? "Both buttons open details panels for collecting more information."
          : "Negative feedback opens a details panel for more information."}
      </p>
      <FeedbackButtons
        isPositiveSelected={state.isPositiveSelected}
        isNegativeSelected={state.isNegativeSelected}
        isPositiveDisabled={state.isNegativeSelected || state.isSubmitted}
        isNegativeDisabled={state.isPositiveSelected || state.isSubmitted}
        hasPositiveDetails={hasPositiveDetails}
        hasNegativeDetails={hasNegativeDetails}
        isPositiveOpen={state.isPositiveOpen}
        isNegativeOpen={state.isNegativeOpen}
        positiveLabel={positiveLabel}
        negativeLabel={negativeLabel}
        panelID={panelID}
        onClick={(event) => {
          handleButtonClick(event.detail.isPositive);
        }}
      />
      <div style={{ marginTop: "1rem", maxWidth: "26rem" }}>
        {hasPositiveDetails ? renderFeedbackPanel(true) : null}
        {hasNegativeDetails ? renderFeedbackPanel(false) : null}
      </div>
      {state.lastSubmission ? (
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
          Last submission:{" "}
          <strong>
            {state.lastSubmission.isPositive ? "Positive" : "Negative"}
          </strong>
          {state.lastSubmission.text ? ` — ${state.lastSubmission.text}` : null}
        </p>
      ) : null}
    </div>
  );
};

export const Default = {
  args: { ...DefaultWC.args },
  render: (args) =>
    renderButtons(args, {
      description: "Click the buttons to provide feedback on this message.",
      onClick: (isPositive) => {
        console.log(`${isPositive ? "Positive" : "Negative"} button clicked`);
        if (typeof window !== "undefined") {
          window.alert(
            `${isPositive ? "Positive" : "Negative"} feedback recorded!`,
          );
        }
      },
    }),
};

export const WithDetailsPanel = {
  args: { ...WithDetailsPanelWC.args },
  argTypes: { ...WithDetailsPanelWC.argTypes },
  render: (args) => (
    <FeedbackButtonsWithDetailsDemo
      hasPositiveDetails={args.hasPositiveDetails}
      hasNegativeDetails={args.hasNegativeDetails}
      panelID={args.panelID}
      positiveLabel={args.positiveLabel}
      negativeLabel={args.negativeLabel}
      positivePanelTitle={args.positivePanelTitle}
      negativePanelTitle={args.negativePanelTitle}
      positivePanelPrompt={args.positivePanelPrompt}
      negativePanelPrompt={args.negativePanelPrompt}
      positiveTextAreaPlaceholder={args.positiveTextAreaPlaceholder}
      negativeTextAreaPlaceholder={args.negativeTextAreaPlaceholder}
      cancelLabel={args.cancelLabel}
      submitLabel={args.submitLabel}
    />
  ),
};
