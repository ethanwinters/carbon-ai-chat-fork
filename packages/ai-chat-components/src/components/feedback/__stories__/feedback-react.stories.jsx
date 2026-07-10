/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/* eslint-disable */
import React from "react";

import Feedback from "../../../react/feedback";
import FeedbackMetaWC, {
  Default as DefaultWC,
  WithCategories as WithCategoriesWC,
  WithDisclaimer as WithDisclaimerWC,
  ReadOnly as ReadOnlyWC,
} from "./feedback.stories";

const {
  "@feedback-submit": submitEventWC,
  "@feedback-close": closeEventWC,
  ...feedbackArgTypesWC
} = FeedbackMetaWC.argTypes;

export default {
  title: "Components/Feedback",
  argTypes: {
    ...feedbackArgTypesWC,
    onSubmit: {
      action: "onSubmit",
      control: "none",
      table: { category: "events" },
      description: submitEventWC.description,
    },
    onClose: {
      action: "onClose",
      control: "none",
      table: { category: "events" },
      description: closeEventWC.description,
    },
  },
};

const renderFeedback = (args, options) => {
  const description = options?.description;
  const handleSubmit = options?.onSubmit ?? args.onSubmit;
  const handleClose = options?.onClose ?? args.onClose;

  return (
    <div style={{ padding: "1rem", maxWidth: "24rem" }}>
      {description ? (
        <p style={{ marginBottom: "1rem" }}>{description}</p>
      ) : null}
      <Feedback
        isOpen={args.isOpen}
        isReadonly={args.isReadonly}
        title={args.title}
        body={args.body}
        placeholder={args.placeholder}
        categoriesLabel={args.categoriesLabel}
        primaryLabel={args.primaryLabel}
        cancelLabel={args.cancelLabel}
        showTextArea={args.showTextArea}
        showBody={args.showBody}
        categories={args.categories}
        disclaimer={args.disclaimer}
        disclaimerCheckbox={args.disclaimerCheckbox}
        initialValues={args.initialValues}
        onSubmit={(event) => {
          const details = event.detail;
          handleSubmit?.(details);
        }}
        onClose={() => {
          handleClose?.();
        }}
        maxLength={args.maxLength}
      />
    </div>
  );
};

export const Default = {
  args: { ...DefaultWC.args },
  render: (args) =>
    renderFeedback(args, {
      onSubmit: (details) => {
        console.log("Feedback submitted:", details);
        if (typeof window !== "undefined") {
          window.alert(
            `Feedback submitted!\nText: ${details.text || "(empty)"}\nCategories: ${details.selectedCategories?.join(", ") || "(none)"}`,
          );
        }
      },
      onClose: () => {
        console.log("Feedback closed");
      },
    }),
};

export const WithCategories = {
  args: { ...WithCategoriesWC.args },
  render: (args) =>
    renderFeedback(args, {
      description:
        "Provide multiple categories when collecting specific negative feedback.",
      onSubmit: (details) => {
        console.log("Feedback submitted:", details);
        if (typeof window !== "undefined") {
          window.alert(
            `Feedback submitted!\nText: ${details.text || "(empty)"}\nCategories: ${details.selectedCategories?.join(", ") || "(none)"}`,
          );
        }
      },
      onClose: () => {
        console.log("Feedback closed");
      },
    }),
};

export const WithDisclaimer = {
  args: { ...WithDisclaimerWC.args },
  render: (args) =>
    renderFeedback(args, {
      onSubmit: (details) => {
        console.log("Feedback submitted:", details);
        if (typeof window !== "undefined") {
          window.alert(
            `Feedback submitted!\nText: ${details.text || "(empty)"}\nCategories: ${details.selectedCategories?.join(", ") || "(none)"}`,
          );
        }
      },
      onClose: () => {
        console.log("Feedback closed");
      },
    }),
};

export const ReadOnly = {
  args: { ...ReadOnlyWC.args },
  render: (args) => renderFeedback(args, {}),
};
