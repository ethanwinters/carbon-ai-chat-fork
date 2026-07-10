/**
 * @license
 *
 * Copyright IBM Corp. 2025, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */
import React, { useState } from "react";

import ChatShell from "../../../react/chat-shell";
import Toolbar from "../../../react/toolbar";
import {
  default as ShellStoriesMeta,
  Slots as SlotsWC,
  SidebarWorkspace as SidebarWorkspaceWC,
} from "./shell.stories";
import "./story-styles.scss";

// Core slot content for stories
const CoreSlotContent = ({
  headerTitle,
  historyText,
  workspaceText,
  messagesText,
  inputText,
}) => (
  <>
    <div slot="header">
      <Toolbar>
        <div slot="title">{headerTitle}</div>
      </Toolbar>
    </div>
    <div slot="history" className="history slot-sample">
      {historyText}
    </div>
    <div slot="workspace" className="workspace slot-sample">
      {workspaceText}
    </div>
    <div slot="messages" className="messages slot-sample">
      {messagesText}
    </div>
    <div slot="input" className="input slot-sample">
      {inputText}
    </div>
  </>
);

export default {
  title: "Preview/Chat shell",
  argTypes: { ...ShellStoriesMeta.argTypes },
};

export const Default = {
  args: { ...ShellStoriesMeta.args },
  render: (args) => {
    const {
      aiEnabled,
      showFrame,
      cornerAll,
      cornerStartStart,
      cornerStartEnd,
      cornerEndStart,
      cornerEndEnd,
      showHistory,
      showWorkspace,
      workspaceLocation,
      historyLocation,
      contentMaxWidth,
      headerTitle,
      historyText,
      workspaceText,
      messagesText,
      inputText,
    } = args;

    return (
      <ChatShell
        aiEnabled={aiEnabled}
        showFrame={showFrame}
        cornerAll={cornerAll}
        cornerStartStart={cornerStartStart}
        cornerStartEnd={cornerStartEnd}
        cornerEndStart={cornerEndStart}
        cornerEndEnd={cornerEndEnd}
        showHistory={showHistory}
        showWorkspace={showWorkspace}
        workspaceLocation={workspaceLocation}
        historyLocation={historyLocation}
        contentMaxWidth={contentMaxWidth}
      >
        <CoreSlotContent
          headerTitle={headerTitle}
          historyText={historyText}
          workspaceText={workspaceText}
          messagesText={messagesText}
          inputText={inputText}
        />
      </ChatShell>
    );
  },
};

// Slot configuration definitions
const SLOT_CONFIGS = [
  { name: "header", label: "Header", hasCheckbox: true },
  { name: "header-after", label: "Header after", hasCheckbox: true },
  { name: "messages", label: "Messages", hasCheckbox: true },
  { name: "input-before", label: "Input before", hasCheckbox: true },
  { name: "input", label: "Input", hasCheckbox: true },
  { name: "input-after", label: "Input after", hasCheckbox: true },
  { name: "footer", label: "Footer", hasCheckbox: true },
  { name: "history", label: "History", hasCheckbox: false },
  { name: "workspace", label: "Workspace", hasCheckbox: false },
];

export const Slots = {
  args: { ...ShellStoriesMeta.args, ...SlotsWC.args },
  argTypes: { ...SlotsWC.argTypes },
  render: (args) => {
    const {
      aiEnabled,
      showFrame,
      cornerAll,
      cornerStartStart,
      cornerStartEnd,
      cornerEndStart,
      cornerEndEnd,
      showHistory,
      showWorkspace,
      workspaceLocation,
      historyLocation,
      contentMaxWidth,
      messagesMaxWidth,
      messagesMinWidth,
      workspaceMinWidth,
      historyWidth,
    } = args;

    // Initialize slot visibility state
    const [slotVisibility, setSlotVisibility] = useState(
      SLOT_CONFIGS.reduce((acc, slot) => {
        acc[slot.name] = true;
        return acc;
      }, {}),
    );

    const toggleSlot = (slotName) => {
      setSlotVisibility((prev) => ({
        ...prev,
        [slotName]: !prev[slotName],
      }));
    };

    return (
      <div className="story-container">
        <div className="slot-controls">
          <div className="control-section">
            <h4>Slot Visibility</h4>
            <div className="control-group">
              {SLOT_CONFIGS.filter((slot) => slot.hasCheckbox).map((slot) => (
                <label key={slot.name}>
                  <input
                    type="checkbox"
                    checked={slotVisibility[slot.name]}
                    onChange={() => toggleSlot(slot.name)}
                  />
                  {slot.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <ChatShell
          aiEnabled={aiEnabled}
          showFrame={showFrame}
          cornerAll={cornerAll}
          cornerStartStart={cornerStartStart}
          cornerStartEnd={cornerStartEnd}
          cornerEndStart={cornerEndStart}
          cornerEndEnd={cornerEndEnd}
          showHistory={showHistory}
          showWorkspace={showWorkspace}
          workspaceLocation={workspaceLocation}
          historyLocation={historyLocation}
          contentMaxWidth={contentMaxWidth}
          style={{
            "--cds-aichat-messages-max-width": messagesMaxWidth,
            "--cds-aichat-messages-min-width": messagesMinWidth,
            "--cds-aichat-workspace-min-width": workspaceMinWidth,
            "--cds-aichat-history-width": historyWidth,
          }}
        >
          {SLOT_CONFIGS.map((slot) =>
            slotVisibility[slot.name] ? (
              <div
                key={slot.name}
                slot={slot.name}
                className={`${slot.name} slot-sample`}
              >
                {slot.label}
              </div>
            ) : null,
          )}
        </ChatShell>
      </div>
    );
  },
};

export const SidebarWorkspace = {
  args: { ...ShellStoriesMeta.args, ...SidebarWorkspaceWC.args },
  argTypes: { ...SidebarWorkspaceWC.argTypes },
  render: (args) => {
    const {
      aiEnabled,
      showFrame,
      cornerAll,
      cornerStartStart,
      cornerStartEnd,
      cornerEndStart,
      cornerEndEnd,
      workspaceLocation,
      contentMaxWidth,
      headerText,
      messagesText,
      workspaceTitle,
      workspaceBodyText,
      workspaceBodyText2,
      inputText,
    } = args;
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

    return (
      <ChatShell
        className={`sidebar-workspace-shell ${isWorkspaceOpen ? "expanded" : ""}`}
        aiEnabled={aiEnabled}
        showFrame={showFrame}
        cornerAll={cornerAll}
        cornerStartStart={cornerStartStart}
        cornerStartEnd={cornerStartEnd}
        cornerEndStart={cornerEndStart}
        cornerEndEnd={cornerEndEnd}
        showWorkspace={isWorkspaceOpen}
        workspaceLocation={workspaceLocation}
        contentMaxWidth={contentMaxWidth}
      >
        <div slot="header" className="header slot-sample">
          {headerText}
        </div>
        <div slot="messages" className="messages slot-sample">
          <div className="messages-content">
            <p>{messagesText}</p>
            <button
              className="workspace-toggle-btn"
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            >
              {isWorkspaceOpen ? "Close workspace" : "Open workspace"}
            </button>
          </div>
        </div>
        <div slot="workspace" className="workspace slot-sample">
          <div className="workspace-content">
            <div className="workspace-header">
              <h3>{workspaceTitle}</h3>
              <button
                className="workspace-toggle-btn"
                onClick={() => setIsWorkspaceOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="workspace-body">
              <p>{workspaceBodyText}</p>
              <p>{workspaceBodyText2}</p>
            </div>
          </div>
        </div>
        <div slot="input" className="input slot-sample">
          {inputText}
        </div>
      </ChatShell>
    );
  },
};
