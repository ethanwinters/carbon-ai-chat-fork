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
import { Carousel } from "../../../react/carousel";
import { Card } from "../../../react/card";
import CarouselMeta, { Default as DefaultWC } from "./carousel.stories";
import { action } from "storybook/actions";
import "./story-styles.scss";

const cards = Array(8)
  .fill(null)
  .map((_, idx) => `Card ${idx + 1}`);

export default {
  title: "Components/Carousel",
  render: (args) => (
    <Carousel {...args} onChange={(e) => action("change")(e.detail)}>
      <div className="container">
        {cards.map((card, _idx) => (
          <Card key={_idx}>
            <div slot="body">
              <div className="carousel-card">{card}</div>
            </div>
          </Card>
        ))}
      </div>
    </Carousel>
  ),
};

export const Default = {
  argTypes: { ...CarouselMeta.argTypes },
  args: { ...DefaultWC.args },
};
