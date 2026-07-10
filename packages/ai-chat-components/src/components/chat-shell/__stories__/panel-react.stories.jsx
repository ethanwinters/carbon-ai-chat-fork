/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */
import React, { useState } from "react";
import "@carbon/web-components/es/components/toggle/index.js";

import { action } from "storybook/actions";

import ChatShell from "../../../react/chat-shell.js";
import ChatPanel from "../../../react/panel.js";
import { CardFooter } from "../../../react/card.js";
import {
  default as PanelStoriesMeta,
  Default as DefaultWC,
} from "./panel.stories.js";
import { cardFooterPresets } from "../../card/__stories__/story-data.js";
import "./story-styles.scss";

// Core slots for panel stories
const CoreSlotContent = () => (
  <>
    <div slot="header" className="header slot-sample">
      Header
    </div>
    <div slot="history" className="history slot-sample">
      History
    </div>
    <div slot="workspace" className="workspace slot-sample">
      Workspace
    </div>
    <div slot="messages" className="messages slot-sample">
      Messages
    </div>
    <div slot="input" className="input slot-sample">
      Input
    </div>
  </>
);

export default {
  title: "Preview/Chat shell/Panels",
  argTypes: { ...PanelStoriesMeta.argTypes },
};

// The Lit `Default` story's `showFrame`/`aiEnabled` describe the panel, but those
// names collide with this file's shell-level `showFrame`/`aiEnabled` args, so pull
// them out and re-add them below as `showPanelFrame`/`panelAiEnabled`.
const {
  showFrame: panelShowFrameArgType,
  aiEnabled: panelAiEnabledArgType,
  roundedCorners: _roundedCorners,
  ...restPanelArgTypes
} = PanelStoriesMeta.argTypes;

const {
  "@openstart": openStartArgType,
  "@closestart": closeStartArgType,
  "@openend": openEndArgType,
  "@closeend": closeEndArgType,
} = DefaultWC.argTypes;
const {
  showFrame: panelShowFrameDefault,
  aiEnabled: panelAiEnabledDefault,
  ...restPanelArgs
} = DefaultWC.args;

export const Default = {
  args: {
    // Shell-level args
    aiEnabled: true,
    showFrame: true,
    roundedCorners: true,
    // Panel-specific args
    ...restPanelArgs,
    showPanelFrame: panelShowFrameDefault,
    panelAiEnabled: panelAiEnabledDefault,
  },
  argTypes: {
    // Panel-specific argTypes
    ...restPanelArgTypes,
    showPanelFrame: {
      ...panelShowFrameArgType,
      description: "Show visual frame around panel content",
    },
    panelAiEnabled: {
      ...panelAiEnabledArgType,
      description: "Enable AI theme for panel content",
    },
    onOpenStart: {
      action: openStartArgType.action,
      control: "none",
      table: { category: "events" },
    },
    onCloseStart: {
      action: closeStartArgType.action,
      control: "none",
      table: { category: "events" },
    },
    onOpenEnd: {
      action: openEndArgType.action,
      control: "none",
      table: { category: "events" },
    },
    onCloseEnd: {
      action: closeEndArgType.action,
      control: "none",
      table: { category: "events" },
    },
  },
  render: (args) => {
    const {
      aiEnabled,
      showFrame,
      roundedCorners,
      open,
      priority,
      fullWidth,
      showChatHeader,
      showPanelFrame,
      panelAiEnabled,
      animationOnOpen,
      animationOnClose,
      panelAriaLabel,
      headerText,
      bodyText,
    } = args;

    return (
      <ChatShell
        aiEnabled={aiEnabled}
        showFrame={showFrame}
        roundedCorners={roundedCorners}
      >
        <CoreSlotContent />
        <div slot="panels">
          <ChatPanel
            open={open}
            priority={priority}
            fullWidth={fullWidth}
            showChatHeader={showChatHeader}
            showFrame={showPanelFrame}
            aiEnabled={panelAiEnabled}
            animationOnOpen={animationOnOpen || undefined}
            animationOnClose={animationOnClose || undefined}
            panelAriaLabel={panelAriaLabel}
            onOpenStart={() => action("openstart")()}
            onCloseStart={() => action("closestart")()}
            onOpenEnd={() => action("openend")()}
            onCloseEnd={() => action("closeend")()}
          >
            <div slot="header">
              <h4>{headerText}</h4>
            </div>
            <div slot="body" className="panel-sample">
              <p>{bodyText}</p>
              <p>
                Toggle the "open" control to see the panel's animation behavior.
              </p>
            </div>
            <CardFooter
              slot="footer"
              actions={cardFooterPresets["secondary primary buttons"]}
            />
          </ChatPanel>
        </div>
      </ChatShell>
    );
  },
};

// Panel configurations for the MultiplePanels story
const panelConfigs = [
  {
    id: "panel-primary-full",
    label: "fullscreen takeover panel. (highest priority)",
    priority: 2,
    fullWidth: true,
    showChatHeader: false,
    showFrame: false,
    animationOnOpen: "",
    animationOnClose: "",
  },
  {
    id: "panel-tertiary-full",
    label: "fullscreen panel",
    priority: 0,
    fullWidth: true,
    showChatHeader: true,
    showFrame: true,
    animationOnOpen: "slide-in-from-bottom",
    animationOnClose: "slide-out-to-bottom",
  },
  {
    id: "panel-tertiary",
    label: "standard panel",
    priority: 0,
    fullWidth: false,
    showChatHeader: true,
    showFrame: true,
    animationOnOpen: "slide-in-from-bottom",
    animationOnClose: "slide-out-to-bottom",
  },
  {
    id: "panel-tertiary-no-header",
    label: "standard panel takeover panel",
    priority: 0,
    fullWidth: false,
    showChatHeader: false,
    showFrame: false,
    animationOnOpen: "slide-in-from-bottom",
    animationOnClose: "slide-out-to-bottom",
  },
];

export const MultiplePanels = {
  parameters: {
    controls: { disable: true },
  },
  render: () => {
    // State for each panel
    const [panelStates, setPanelStates] = useState(
      panelConfigs.reduce((acc, config) => {
        acc[config.id] = false;
        return acc;
      }, {}),
    );

    const togglePanel = (panelId) => {
      setPanelStates((prev) => ({
        ...prev,
        [panelId]: !prev[panelId],
      }));
    };

    return (
      <>
        <div className="panel-controls">
          <p>
            Toggle open/closed various example panels. Only one panel will be
            opened at a time. Which panel is opened will depend first on its
            "priority" attribute, and in the case of a priority tie, on the
            order in which the panels were opened.
          </p>
          {panelConfigs.map(({ id, label }) => (
            <cds-toggle
              key={id}
              label-text={label}
              checked={panelStates[id]}
              onCds-toggle-changed={(e) => togglePanel(id)}
            ></cds-toggle>
          ))}
        </div>
        <ChatShell aiEnabled={false} showFrame={true} roundedCorners={true}>
          <CoreSlotContent />
          <div slot="panels">
            {/* Standard panel */}
            <ChatPanel
              open={panelStates["panel-tertiary"]}
              priority={0}
              showChatHeader
              showFrame
              animationOnOpen="slide-in-from-bottom"
              animationOnClose="slide-out-to-bottom"
              panelAriaLabel="Standard panel"
            >
              <div slot="header">
                <h4>Standard panel</h4>
              </div>
              <div slot="body" className="panel-sample">
                Slide in from bottom with frame while showing chat header
                <br />
                Lowest priority panel.
              </div>
            </ChatPanel>

            {/* Standard panel takeover */}
            <ChatPanel
              open={panelStates["panel-tertiary-no-header"]}
              priority={0}
              animationOnOpen="slide-in-from-bottom"
              animationOnClose="slide-out-to-bottom"
              panelAriaLabel="Standard panel takeover panel"
            >
              <div slot="header">
                <h4>Standard panel takeover panel</h4>
              </div>
              <div slot="body" className="panel-sample">
                Slide in from bottom without chat header or content frame
                <br />
                Lowest priority panel.
              </div>
            </ChatPanel>

            {/* Fullscreen panel */}
            <ChatPanel
              open={panelStates["panel-tertiary-full"]}
              priority={0}
              fullWidth
              showChatHeader
              showFrame
              animationOnOpen="slide-in-from-bottom"
              animationOnClose="slide-out-to-bottom"
              panelAriaLabel="Fullscreen panel"
            >
              <div slot="header" className="panel-sample">
                <h4>Fullscreen panel</h4>
              </div>
              <div slot="body" className="panel-sample">
                <p>
                  Slide in from bottom full width with frame. This panel
                  demonstrates all panel slots: header, body, and footer. These
                  slots are compatible with all panel views.
                </p>
              </div>
              <CardFooter
                slot="footer"
                actions={cardFooterPresets["secondary primary buttons"]}
              />
            </ChatPanel>

            {/* Fullscreen takeover panel (highest priority) */}
            <ChatPanel
              open={panelStates["panel-primary-full"]}
              priority={2}
              fullWidth
              panelAriaLabel="Fullscreen takeover panel"
            >
              <div slot="header">
                <h4>Fullscreen takeover panel. (highest priority)</h4>
              </div>
              <div slot="body" className="panel-sample">
                No animation take over panel
                <br />
                Highest priority, full width
              </div>
            </ChatPanel>
          </div>
        </ChatShell>
      </>
    );
  },
};
