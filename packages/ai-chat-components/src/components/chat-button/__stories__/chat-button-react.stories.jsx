/**
 * @license
 *
 * Copyright IBM Corp. 2025, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */
import React from "react";
import { action } from "storybook/actions";
import ChatButton from "../../../react/chat-button";
import {
  Default as DefaultWC,
  Secondary as SecondaryWC,
  Tertiary as TertiaryWC,
  Danger as DangerWC,
  Ghost as GhostWC,
  IconOnly as IconOnlyWC,
  QuickAction as QuickActionWC,
} from "./chat-button.stories";
import { Add, Link } from "@carbon/icons-react";

const slots = {
  Add16: (args) => <Add {...args} />,
  Link16: (args) => <Link {...args} />,
  None: undefined,
};

const withReactIconSlot = (argTypes) =>
  argTypes.iconSlot
    ? { ...argTypes, iconSlot: { ...argTypes.iconSlot, mapping: slots } }
    : argTypes;

const BaseButtonTemplate = (args) => {
  const { buttonText, iconSlot: IconSlot, isQuickAction, ...rest } = args;

  return (
    <ChatButton
      is-quick-action={isQuickAction}
      onClick={action("onClick")}
      {...rest}
    >
      {buttonText}
      {IconSlot && <IconSlot slot="icon" />}
    </ChatButton>
  );
};

export default {
  title: "Components/Chat button",
  component: ChatButton,
};

export const Default = {
  name: "Primary (default)",
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(DefaultWC.argTypes),
  args: { ...DefaultWC.args },
};

export const Secondary = {
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(SecondaryWC.argTypes),
  args: { ...SecondaryWC.args },
};

export const Tertiary = {
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(TertiaryWC.argTypes),
  args: { ...TertiaryWC.args },
};

export const Danger = {
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(DangerWC.argTypes),
  args: { ...DangerWC.args },
};

export const Ghost = {
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(GhostWC.argTypes),
  args: { ...GhostWC.args },
};

export const IconOnly = {
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(IconOnlyWC.argTypes),
  args: { ...IconOnlyWC.args },
};

export const QuickAction = {
  render: BaseButtonTemplate,
  argTypes: withReactIconSlot(QuickActionWC.argTypes),
  args: { ...QuickActionWC.args },
};
