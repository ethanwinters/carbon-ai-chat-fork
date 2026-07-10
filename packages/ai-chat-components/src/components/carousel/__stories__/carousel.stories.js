/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "../src/carousel";
import "../../card/src/card";
import { html } from "lit";
import styles from "./story-styles.scss?lit";
import { map } from "lit/directives/map.js";
import { action } from "storybook/actions";

const cards = Array(8)
  .fill(null)
  .map((_, idx) => `Card ${idx + 1}`);

const argTypes = {
  nextBtnText: {
    control: "text",
    description: "Text for the next button",
  },
  previousBtnText: {
    control: "text",
    description: "Text for the previous button",
  },
  "@cds-aichat-carousel-onchange": {
    action: "change",
    description: "Fired when the visible carousel item changes.",
    table: { category: "events" },
  },
};

export default {
  title: "Components/Carousel",
  argTypes,
  decorators: [
    (story) => html`
      <style>
        ${styles}
      </style>
      ${story()}
    `,
  ],
  render: ({ nextBtnText, previousBtnText }) => html`
    <cds-aichat-carousel
      nextBtnText=${nextBtnText}
      previousBtnText=${previousBtnText}
      @cds-aichat-carousel-onchange=${(e) => action("change")(e.detail)}
    >
      <div>
        ${map(
          cards,
          (card) => html`
            <cds-aichat-card>
              <div slot="body">
                <div class="carousel-card">${card}</div>
              </div>
            </cds-aichat-card>
          `,
        )}
      </div>
    </cds-aichat-carousel>
  `,
};

export const Default = {
  args: {
    nextBtnText: "Next",
    previousBtnText: "Previous",
  },
};
