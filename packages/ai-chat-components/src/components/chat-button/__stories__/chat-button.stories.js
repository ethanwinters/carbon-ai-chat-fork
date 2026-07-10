/**
 * @license
 *
 * Copyright IBM Corp. 2025, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// https://storybook.js.org/docs/essentials/controls#conditional-controls

import "../src/chat-button";
import { html } from "lit";
import {
  BUTTON_KIND,
  BUTTON_SIZE,
  BUTTON_TOOLTIP_ALIGNMENT,
  BUTTON_TYPE,
  BUTTON_TOOLTIP_POSITION,
} from "@carbon/web-components/es/components/button/button.js";
import { iconLoader } from "@carbon/web-components/es/globals/internal/icon-loader.js";
import Add16 from "@carbon/icons/es/add/16.js";
import Link16 from "@carbon/icons/es/link/16.js";
import { fn } from "storybook/test";
import { ifDefined } from "lit/directives/if-defined.js";

const slots = {
  Add16: () => html`${iconLoader(Add16, { slot: "icon" })}`,
  Link16: () => html`${iconLoader(Link16, { slot: "icon" })}`,
  None: () => "",
};

const sharedArgTypes = {
  disabled: {
    control: "boolean",
    description: "Specify whether the Button should be disabled, or not.",
    table: { defaultValue: { summary: "false" } },
  },
  href: {
    control: "text",
    description:
      "Optionally specify an href for your Button to become an `<a>` element.",
  },
  isExpressive: {
    control: "boolean",
    description: "Specify whether the Button is expressive, or not.",
    table: { defaultValue: { summary: "false" } },
  },
  linkRole: {
    control: "text",
    description: "Optional prop to specify the role of the Button.",
    if: { arg: "href" },
    table: { defaultValue: { summary: "button" } },
  },
  size: {
    control: "select",
    description: "Specify the size of the Button.",
    options: [BUTTON_SIZE.SMALL, BUTTON_SIZE.MEDIUM, BUTTON_SIZE.LARGE],
    table: { defaultValue: { summary: BUTTON_SIZE.LARGE } },
  },
  type: {
    control: "radio",
    description: "Specify the type of the Button.",
    options: [BUTTON_TYPE.BUTTON, BUTTON_TYPE.RESET, BUTTON_TYPE.SUBMIT],
    table: { defaultValue: { summary: BUTTON_TYPE.BUTTON } },
  },
  onClick: { table: { disable: true } },
};

const sharedArgs = {
  disabled: false,
  isExpressive: false,
  iconSlot: "None",
  onClick: fn(),
};

const baseButtonControls = {
  buttonText: {
    control: "text",
    description:
      "The button text. storybook only control, not a prop/attribute.",
    table: {
      category: "story controls",
      defaultValue: { summary: "Button" },
    },
  },
  iconSlot: {
    control: "select",
    options: Object.keys(slots),
    mapping: slots,
    description: "Places the slotted icon inside the Button.",
    table: { category: "slot", defaultValue: { summary: "None" } },
  },
};

const baseButtonTemplate = (args) => html`
  <cds-aichat-button
    @click=${args.onClick}
    .button-class-name="${args.buttonClassName}"
    danger-description=${ifDefined(args.dangerDescription)}
    ?disabled="${args.disabled}"
    href=${ifDefined(args.href)}
    ?isExpressive="${args.isExpressive}"
    ?isSelected="${args.isSelected}"
    kind=${ifDefined(args.kind)}
    link-role=${ifDefined(args.linkRole)}
    size=${ifDefined(args.size)}
    tooltip-text=${ifDefined(args.tooltipText)}
    tooltip-alignment=${ifDefined(args.tooltipAlignment)}
    tooltip-position=${ifDefined(args.tooltipPosition)}
    type=${ifDefined(args.type)}
    ?is-quick-action="${args.isQuickAction}"
  >
    ${args.buttonText} ${args.iconSlot?.()}
  </cds-aichat-button>
`;

export default {
  title: "Components/Chat button",
  component: "cds-aichat-button",
};

export const Default = {
  name: "Primary (default)",
  argTypes: {
    ...sharedArgTypes,
    ...baseButtonControls,
    kind: {
      control: "select",
      description: "Specify the kind of Button.",
      options: [
        BUTTON_KIND.PRIMARY,
        BUTTON_KIND.SECONDARY,
        BUTTON_KIND.TERTIARY,
        BUTTON_KIND.GHOST,
      ],
      table: { defaultValue: { summary: BUTTON_KIND.PRIMARY } },
    },
  },
  args: {
    ...sharedArgs,
    kind: BUTTON_KIND.PRIMARY,
    buttonText: "Button",
    iconSlot: "None",
  },
  render: baseButtonTemplate,
};

export const Secondary = {
  argTypes: {
    ...sharedArgTypes,
    ...baseButtonControls,
    kind: {
      control: "select",
      description: "Specify the kind of Button.",
      options: [
        BUTTON_KIND.PRIMARY,
        BUTTON_KIND.SECONDARY,
        BUTTON_KIND.TERTIARY,
        BUTTON_KIND.GHOST,
      ],
      table: { defaultValue: { summary: BUTTON_KIND.SECONDARY } },
    },
  },
  args: {
    ...sharedArgs,
    kind: BUTTON_KIND.SECONDARY,
    buttonText: "Button",
    iconSlot: "None",
  },
  render: baseButtonTemplate,
};

export const Tertiary = {
  argTypes: {
    ...sharedArgTypes,
    ...baseButtonControls,
    kind: {
      control: "select",
      description: "Specify the kind of Button.",
      options: [
        BUTTON_KIND.PRIMARY,
        BUTTON_KIND.SECONDARY,
        BUTTON_KIND.TERTIARY,
        BUTTON_KIND.GHOST,
      ],
      table: { defaultValue: { summary: BUTTON_KIND.TERTIARY } },
    },
  },
  args: {
    ...sharedArgs,
    kind: BUTTON_KIND.TERTIARY,
    buttonText: "Button",
    iconSlot: "None",
  },
  render: baseButtonTemplate,
};

export const Danger = {
  argTypes: {
    ...sharedArgTypes,
    ...baseButtonControls,
    kind: {
      control: "select",
      description: "Specify the kind of Button.",
      options: [
        BUTTON_KIND.DANGER,
        BUTTON_KIND.DANGER_TERTIARY,
        BUTTON_KIND.DANGER_GHOST,
      ],
      table: { defaultValue: { summary: BUTTON_KIND.DANGER } },
    },
    dangerDescription: {
      control: "text",
      description:
        "Specify the message read by screen readers for the danger button variant",
      table: { defaultValue: { summary: "danger" } },
    },
  },
  args: {
    ...sharedArgs,
    kind: BUTTON_KIND.DANGER,
    dangerDescription: "danger",
    buttonText: "Button",
    iconSlot: "None",
  },
  render: baseButtonTemplate,
};

export const Ghost = {
  argTypes: {
    ...sharedArgTypes,
    ...baseButtonControls,
    kind: {
      control: "select",
      options: [
        BUTTON_KIND.PRIMARY,
        BUTTON_KIND.SECONDARY,
        BUTTON_KIND.TERTIARY,
        BUTTON_KIND.GHOST,
      ],
      description: "Specify the kind of Button.",
      table: { defaultValue: { summary: BUTTON_KIND.GHOST } },
    },
  },
  args: {
    ...sharedArgs,
    kind: BUTTON_KIND.GHOST,
    buttonText: "Button",
    iconSlot: "None",
  },
  render: baseButtonTemplate,
};

export const IconOnly = {
  argTypes: {
    ...sharedArgTypes,
    href: {
      control: "text",
      description:
        "Optionally specify an href for your Button to become an `<a>` element. Note: setting this overrides `tooltipText` and `dangerDescription`, which currently fails accessibility — pending a fix in Carbon.",
    },
    kind: {
      control: "select",
      options: [
        BUTTON_KIND.PRIMARY,
        BUTTON_KIND.SECONDARY,
        BUTTON_KIND.TERTIARY,
        BUTTON_KIND.GHOST,
        BUTTON_KIND.DANGER,
        BUTTON_KIND.DANGER_TERTIARY,
        BUTTON_KIND.DANGER_GHOST,
      ],
      description: "Specify the kind of Button.",
      table: { defaultValue: { summary: BUTTON_KIND.PRIMARY } },
    },
    tooltipText: {
      control: "text",
      description:
        "The tooltip text for icon only button (accessibility required). <br> Note: setting this overrides `dangerDescription`",
      if: { arg: "href", exists: false },
      table: { defaultValue: { summary: "Tooltip text" } },
    },
    dangerDescription: {
      control: "text",
      description:
        "Screen reader message for the danger variant when no tooltip text is present.",
      if: { arg: "tooltipText", eq: "" },
      table: { defaultValue: { summary: "danger" } },
    },
    tooltipAlignment: {
      control: "radio",
      description:
        "Specify the alignment of the tooltip to the icon-only button. Can be one of: start, center, or end.",
      options: ["start", "center", "end"],
      mapping: {
        start: BUTTON_TOOLTIP_ALIGNMENT.START,
        center: BUTTON_TOOLTIP_ALIGNMENT.CENTER,
        end: BUTTON_TOOLTIP_ALIGNMENT.END,
      },
      if: { arg: "tooltipText" },
      table: { defaultValue: { summary: "center" } },
    },
    tooltipPosition: {
      control: "radio",
      description:
        "Specify the direction of the tooltip for icon-only buttons. Can be either top, right, bottom, or left.",
      options: [
        BUTTON_TOOLTIP_POSITION.TOP,
        BUTTON_TOOLTIP_POSITION.RIGHT,
        BUTTON_TOOLTIP_POSITION.BOTTOM,
        BUTTON_TOOLTIP_POSITION.LEFT,
      ],
      if: { arg: "tooltipText" },
      table: { defaultValue: { summary: BUTTON_TOOLTIP_POSITION.TOP } },
    },
    isSelected: {
      control: "boolean",
      description:
        "Specify whether the Button is currently selected. Only applies to Ghost variant or Quick Action button.",
      if: { arg: "kind", eq: BUTTON_KIND.GHOST },
      table: { defaultValue: { summary: "false" } },
    },
    iconSlot: {
      control: "select",
      options: Object.keys(slots).filter((key) => key !== "None"),
      mapping: slots,
      description: "Places the slotted icon inside the button",
      table: { category: "slot", defaultValue: { summary: "Add16" } },
    },
  },
  args: {
    ...sharedArgs,
    kind: BUTTON_KIND.PRIMARY,
    iconSlot: "Add16",
    dangerDescription: "danger",
    tooltipText: "Tooltip text",
    tooltipAlignment: "center",
    tooltipPosition: BUTTON_TOOLTIP_POSITION.TOP,
  },
  render: baseButtonTemplate,
};

export const QuickAction = {
  argTypes: {
    ...sharedArgTypes,
    ...baseButtonControls,
    isQuickAction: {
      control: { disable: true },
      description:
        "Specify whether the Button is a quick action. Overrides `kind` to `ghost`. and `size` to `sm`",
      table: { defaultValue: { summary: "true" } },
    },
    size: {
      control: { disable: true },
      description:
        "Size defaults to `sm` in quick action variant, and does not support any other size.",
      table: { defaultValue: { summary: BUTTON_SIZE.SMALL } },
    },
    isSelected: {
      control: "boolean",
      description:
        "Specify whether the Button is currently selected. Only applies to Ghost variant or Quick Action button.",
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: {
    ...sharedArgs,
    buttonText: "Quick action",
    isQuickAction: true,
    isSelected: false,
  },
  render: baseButtonTemplate,
};
