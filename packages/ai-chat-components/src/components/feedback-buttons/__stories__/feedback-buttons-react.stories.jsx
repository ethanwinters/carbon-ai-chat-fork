/* eslint-disable */
import React from "react";

import FeedbackButtons from "../../../react/feedback-buttons";

export default {
  title: "Components/Feedback Buttons",
  argTypes: {
    isPositiveSelected: {
      control: "boolean",
      description: "Whether the positive button is selected",
    },
    isNegativeSelected: {
      control: "boolean",
      description: "Whether the negative button is selected",
    },
    isPositiveDisabled: {
      control: "boolean",
      description: "Whether the positive button is disabled",
    },
    isNegativeDisabled: {
      control: "boolean",
      description: "Whether the negative button is disabled",
    },
    hasPositiveDetails: {
      control: "boolean",
      description: "Whether positive button opens a details panel",
    },
    hasNegativeDetails: {
      control: "boolean",
      description: "Whether negative button opens a details panel",
    },
    isPositiveOpen: {
      control: "boolean",
      description: "Whether the positive details panel is open",
    },
    isNegativeOpen: {
      control: "boolean",
      description: "Whether the negative details panel is open",
    },
    positiveLabel: {
      control: "text",
      description: "Accessibility label for positive button",
    },
    negativeLabel: {
      control: "text",
      description: "Accessibility label for negative button",
    },
    panelID: {
      control: "text",
      description: "ID of the associated feedback panel",
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

export const Default = {
  args: {
    isPositiveSelected: false,
    isNegativeSelected: false,
    isPositiveDisabled: false,
    isNegativeDisabled: false,
    hasPositiveDetails: false,
    hasNegativeDetails: false,
    isPositiveOpen: false,
    isNegativeOpen: false,
    positiveLabel: "Thumbs up",
    negativeLabel: "Thumbs down",
  },
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

export const PositiveSelected = {
  args: {
    isPositiveSelected: true,
    isNegativeSelected: false,
    isPositiveDisabled: false,
    isNegativeDisabled: false,
    hasPositiveDetails: false,
    hasNegativeDetails: false,
    isPositiveOpen: false,
    isNegativeOpen: false,
    positiveLabel: "Thumbs up",
    negativeLabel: "Thumbs down",
  },
  render: (args) =>
    renderButtons(args, {
      description: "Positive feedback has been provided.",
      onClick: (isPositive) => {
        console.log(`${isPositive ? "Positive" : "Negative"} button clicked`);
      },
    }),
};

export const NegativeSelected = {
  args: {
    isPositiveSelected: false,
    isNegativeSelected: true,
    isPositiveDisabled: false,
    isNegativeDisabled: false,
    hasPositiveDetails: false,
    hasNegativeDetails: false,
    isPositiveOpen: false,
    isNegativeOpen: false,
    positiveLabel: "Thumbs up",
    negativeLabel: "Thumbs down",
  },
  render: (args) =>
    renderButtons(args, {
      description: "Negative feedback has been provided.",
      onClick: (isPositive) => {
        console.log(`${isPositive ? "Positive" : "Negative"} button clicked`);
      },
    }),
};

export const WithDetailsPanel = {
  args: {
    isPositiveSelected: false,
    isNegativeSelected: false,
    isPositiveDisabled: false,
    isNegativeDisabled: false,
    hasPositiveDetails: false,
    hasNegativeDetails: true,
    isPositiveOpen: false,
    isNegativeOpen: false,
    positiveLabel: "Thumbs up",
    negativeLabel: "Thumbs down",
    panelID: "feedback-panel-example",
  },
  render: (args) =>
    renderButtons(args, {
      description:
        "Negative feedback opens a details panel for more information.",
      onClick: (isPositive) => {
        if (isPositive) {
          console.log("Positive feedback recorded immediately");
          if (typeof window !== "undefined") {
            window.alert("Thank you for your positive feedback!");
          }
        } else {
          console.log("Opening negative feedback details panel");
          if (typeof window !== "undefined") {
            window.alert(
              "In a real implementation, this would open a feedback details panel.",
            );
          }
        }
      },
    }),
};

export const Disabled = {
  args: {
    isPositiveSelected: true,
    isNegativeSelected: false,
    isPositiveDisabled: true,
    isNegativeDisabled: true,
    hasPositiveDetails: false,
    hasNegativeDetails: false,
    isPositiveOpen: false,
    isNegativeOpen: false,
    positiveLabel: "Thumbs up",
    negativeLabel: "Thumbs down",
  },
  render: (args) =>
    renderButtons(args, {
      description: "Feedback has been submitted and cannot be changed.",
      onClick: () => {
        console.log("Buttons are disabled, should not fire");
      },
    }),
};

export const BothDetails = {
  args: {
    isPositiveSelected: false,
    isNegativeSelected: false,
    isPositiveDisabled: false,
    isNegativeDisabled: false,
    hasPositiveDetails: true,
    hasNegativeDetails: true,
    isPositiveOpen: false,
    isNegativeOpen: false,
    positiveLabel: "Thumbs up",
    negativeLabel: "Thumbs down",
    panelID: "feedback-panel-both",
  },
  render: (args) =>
    renderButtons(args, {
      description:
        "Both buttons open details panels for collecting more information.",
      onClick: (isPositive) => {
        console.log(
          `Opening ${isPositive ? "positive" : "negative"} feedback details panel`,
        );
        if (typeof window !== "undefined") {
          window.alert(
            `Would open ${isPositive ? "positive" : "negative"} feedback details panel`,
          );
        }
      },
    }),
};
