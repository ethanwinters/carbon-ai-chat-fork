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
import Toolbar from "../../../react/toolbar";
import {
  Button,
  OverflowMenu,
  OverflowMenuItem,
  ContentSwitcher,
  Switch,
  IconButton,
  AILabel,
} from "@carbon/react";
import { actionLists } from "./story-data-react";
import { Home, ArrowLeft, OverflowMenuVertical } from "@carbon/icons-react";
import "./story-styles.scss";
import ToolbarMeta, { Default as DefaultWC } from "./toolbar.stories";

import { action } from "storybook/actions";

export default {
  title: "Components/Toolbar",
  component: Toolbar,
};

export const Default = {
  argTypes: {
    ...ToolbarMeta.argTypes,
    navigation: {
      ...ToolbarMeta.argTypes.navigation,
      mapping: {
        home: (
          <div slot="navigation">
            <IconButton
              data-rounded="top-left"
              size="md"
              kind="ghost"
              align="bottom-start"
              enterDelayMs={0}
              leaveDelayMs={0}
              onClick={action("onClick")}
              label="Home"
            >
              <Home />
            </IconButton>
          </div>
        ),
        back: (
          <div slot="navigation">
            <IconButton
              data-rounded="top-left"
              size="md"
              kind="ghost"
              align="bottom-start"
              enterDelayMs={0}
              leaveDelayMs={0}
              onClick={action("onClick")}
              label="Back"
            >
              <ArrowLeft />
            </IconButton>
          </div>
        ),
        "custom 1": (
          <div slot="navigation" data-rounded="top-left">
            <OverflowMenu
              size="md"
              renderIcon={OverflowMenuVertical}
              iconDescription="Menu"
            >
              <OverflowMenuItem itemText="Stop app" />
              <OverflowMenuItem itemText="Restart app" />
              <OverflowMenuItem itemText="Rename app" />
              <OverflowMenuItem itemText="Clone and move app" disabled />
              <OverflowMenuItem itemText="Edit routes and access" />
              <OverflowMenuItem itemText="Delete app" hasDivider isDelete />
            </OverflowMenu>
          </div>
        ),
        "custom 2": (
          <div slot="navigation" data-rounded="top-left">
            <Button onClick={action("onClick")} size="md">
              test
            </Button>
          </div>
        ),
        none: undefined,
      },
    },
    fixedActions: {
      ...ToolbarMeta.argTypes.fixedActions,
      mapping: {
        "content switcher": (
          <div slot="fixed-actions">
            <ContentSwitcher
              onSelected={(e) => console.log(e)}
              selectionMode="automatic"
              selectedIndex="0"
              size="sm"
            >
              <Switch value="code" name="one">
                code
              </Switch>
              <Switch value="preview" name="two">
                preview
              </Switch>
            </ContentSwitcher>
          </div>
        ),
        "custom 1": (
          <div slot="fixed-actions">
            <Button onClick={action("onClick")} size="md">
              test
            </Button>
          </div>
        ),
        none: undefined,
      },
    },
  },
  args: {
    ...DefaultWC.args,
  },
  render: ({
    title,
    titleSlotText,
    overflow,
    actions,
    aiLabel,
    aiLabelHeading,
    aiLabelBody,
    navigation,
    "--cds-aichat-border-radius": borderRadius,
    fixedActions,
  }) => {
    const titleContent =
      title === "default" ? (
        <div slot="title">{titleSlotText}</div>
      ) : title === "with truncation" ? (
        <div slot="title">
          <span className="truncated-text">
            Lorem ipsum dolor sit amet <span className="bold">consectetur</span>
          </span>
        </div>
      ) : null;

    return (
      <Toolbar
        actions={actions}
        overflow={overflow}
        style={
          borderRadius ? { "--cds-aichat-border-radius": "8px" } : undefined
        }
      >
        {/* Navigation slot */}
        {navigation}

        {/* Title slot */}
        {titleContent}

        {/* Fixed actions slot */}
        {fixedActions}

        {/* AI Label slot */}
        {aiLabel && (
          <AILabel size="2xs" autoalign alignment="bottom" slot="decorator">
            <div slot="body-text">
              <h4 className="margin-bottom-05">{aiLabelHeading}</h4>
              <div>{aiLabelBody}</div>
            </div>
          </AILabel>
        )}
      </Toolbar>
    );
  },
};
