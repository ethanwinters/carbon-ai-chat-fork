/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../src/cds-aichat-feedback-buttons";
import { html } from "lit";

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
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin-bottom: 1rem;">
        Click the buttons to provide feedback on this message.
      </p>
      <cds-aichat-feedback-buttons
        ?is-positive-selected=${args.isPositiveSelected}
        ?is-negative-selected=${args.isNegativeSelected}
        ?is-positive-disabled=${args.isPositiveDisabled}
        ?is-negative-disabled=${args.isNegativeDisabled}
        ?has-positive-details=${args.hasPositiveDetails}
        ?has-negative-details=${args.hasNegativeDetails}
        ?is-positive-open=${args.isPositiveOpen}
        ?is-negative-open=${args.isNegativeOpen}
        positive-label=${args.positiveLabel}
        negative-label=${args.negativeLabel}
        panel-id=${args.panelID}
        @feedback-buttons-click=${(event) => {
          const { isPositive } = event.detail;
          console.log(`${isPositive ? "Positive" : "Negative"} button clicked`);
          alert(`${isPositive ? "Positive" : "Negative"} feedback recorded!`);
        }}
      >
      </cds-aichat-feedback-buttons>
    </div>
  `,
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
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin-bottom: 1rem;">Positive feedback has been provided.</p>
      <cds-aichat-feedback-buttons
        ?is-positive-selected=${args.isPositiveSelected}
        ?is-negative-selected=${args.isNegativeSelected}
        ?is-positive-disabled=${args.isPositiveDisabled}
        ?is-negative-disabled=${args.isNegativeDisabled}
        ?has-positive-details=${args.hasPositiveDetails}
        ?has-negative-details=${args.hasNegativeDetails}
        ?is-positive-open=${args.isPositiveOpen}
        ?is-negative-open=${args.isNegativeOpen}
        positive-label=${args.positiveLabel}
        negative-label=${args.negativeLabel}
        panel-id=${args.panelID}
        @feedback-buttons-click=${(event) => {
          const { isPositive } = event.detail;
          console.log(`${isPositive ? "Positive" : "Negative"} button clicked`);
        }}
      >
      </cds-aichat-feedback-buttons>
    </div>
  `,
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
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin-bottom: 1rem;">Negative feedback has been provided.</p>
      <cds-aichat-feedback-buttons
        ?is-positive-selected=${args.isPositiveSelected}
        ?is-negative-selected=${args.isNegativeSelected}
        ?is-positive-disabled=${args.isPositiveDisabled}
        ?is-negative-disabled=${args.isNegativeDisabled}
        ?has-positive-details=${args.hasPositiveDetails}
        ?has-negative-details=${args.hasNegativeDetails}
        ?is-positive-open=${args.isPositiveOpen}
        ?is-negative-open=${args.isNegativeOpen}
        positive-label=${args.positiveLabel}
        negative-label=${args.negativeLabel}
        panel-id=${args.panelID}
        @feedback-buttons-click=${(event) => {
          const { isPositive } = event.detail;
          console.log(`${isPositive ? "Positive" : "Negative"} button clicked`);
        }}
      >
      </cds-aichat-feedback-buttons>
    </div>
  `,
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
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin-bottom: 1rem;">
        Negative feedback opens a details panel for more information.
      </p>
      <cds-aichat-feedback-buttons
        ?is-positive-selected=${args.isPositiveSelected}
        ?is-negative-selected=${args.isNegativeSelected}
        ?is-positive-disabled=${args.isPositiveDisabled}
        ?is-negative-disabled=${args.isNegativeDisabled}
        ?has-positive-details=${args.hasPositiveDetails}
        ?has-negative-details=${args.hasNegativeDetails}
        ?is-positive-open=${args.isPositiveOpen}
        ?is-negative-open=${args.isNegativeOpen}
        positive-label=${args.positiveLabel}
        negative-label=${args.negativeLabel}
        panel-id=${args.panelID}
        @feedback-buttons-click=${(event) => {
          const { isPositive } = event.detail;
          if (isPositive) {
            console.log("Positive feedback recorded immediately");
            alert("Thank you for your positive feedback!");
          } else {
            console.log("Opening negative feedback details panel");
            alert(
              "In a real implementation, this would open a feedback details panel.",
            );
          }
        }}
      >
      </cds-aichat-feedback-buttons>
    </div>
  `,
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
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin-bottom: 1rem;">
        Feedback has been submitted and cannot be changed.
      </p>
      <cds-aichat-feedback-buttons
        ?is-positive-selected=${args.isPositiveSelected}
        ?is-negative-selected=${args.isNegativeSelected}
        ?is-positive-disabled=${args.isPositiveDisabled}
        ?is-negative-disabled=${args.isNegativeDisabled}
        ?has-positive-details=${args.hasPositiveDetails}
        ?has-negative-details=${args.hasNegativeDetails}
        ?is-positive-open=${args.isPositiveOpen}
        ?is-negative-open=${args.isNegativeOpen}
        positive-label=${args.positiveLabel}
        negative-label=${args.negativeLabel}
        panel-id=${args.panelID}
        @feedback-buttons-click=${() => {
          console.log("Buttons are disabled, should not fire");
        }}
      >
      </cds-aichat-feedback-buttons>
    </div>
  `,
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
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin-bottom: 1rem;">
        Both buttons open details panels for collecting more information.
      </p>
      <cds-aichat-feedback-buttons
        ?is-positive-selected=${args.isPositiveSelected}
        ?is-negative-selected=${args.isNegativeSelected}
        ?is-positive-disabled=${args.isPositiveDisabled}
        ?is-negative-disabled=${args.isNegativeDisabled}
        ?has-positive-details=${args.hasPositiveDetails}
        ?has-negative-details=${args.hasNegativeDetails}
        ?is-positive-open=${args.isPositiveOpen}
        ?is-negative-open=${args.isNegativeOpen}
        positive-label=${args.positiveLabel}
        negative-label=${args.negativeLabel}
        panel-id=${args.panelID}
        @feedback-buttons-click=${(event) => {
          const { isPositive } = event.detail;
          console.log(
            `Opening ${isPositive ? "positive" : "negative"} feedback details panel`,
          );
          alert(
            `Would open ${isPositive ? "positive" : "negative"} feedback details panel`,
          );
        }}
      >
      </cds-aichat-feedback-buttons>
    </div>
  `,
};
