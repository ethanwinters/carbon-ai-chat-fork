/**
 * @license
 *
 * Copyright IBM Corp. 2025, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "../src/shell";
import "../src/panel";
import "../../card/src/card-footer";
import "../../toolbar/src/toolbar";
import { html, nothing } from "lit";
import styles from "./story-styles.scss?lit";

// Core slots for Default, No Header, and Panels stories
const coreSlotContent = (args) => html`
  <cds-aichat-toolbar slot="header">
    <div slot="title">${args.headerTitle}</div>
  </cds-aichat-toolbar>
  <div slot="history" class="history slot-sample">${args.historyText}</div>
  <div slot="workspace" class="workspace slot-sample">
    ${args.workspaceText}
  </div>
  <div slot="messages" class="messages slot-sample">${args.messagesText}</div>
  <div slot="input" class="input slot-sample">${args.inputText}</div>
`;

export default {
  title: "Preview/Chat shell",
  args: {
    aiEnabled: false,
    showFrame: true,
    cornerAll: "round",
    cornerStartStart: undefined,
    cornerStartEnd: undefined,
    cornerEndStart: undefined,
    cornerEndEnd: undefined,
    showHistory: false,
    showWorkspace: false,
    workspaceLocation: "start",
    historyLocation: "start",
    contentMaxWidth: true,
    headerTitle: "Header",
    historyText: "History",
    workspaceText: "Workspace",
    messagesText: "Messages",
    inputText: "Input",
  },
  argTypes: {
    aiEnabled: {
      control: "boolean",
      description: "Enable AI-specific theming",
    },
    showFrame: {
      control: "boolean",
      description: "Show visual frame around content",
    },
    cornerAll: {
      control: { type: "radio" },
      options: ["round", "square"],
      description: "Sets all corners (individual corners override this)",
    },
    cornerStartStart: {
      control: { type: "radio" },
      options: [undefined, "round", "square"],
      description: "Top-left corner in LTR (overrides cornerAll)",
    },
    cornerStartEnd: {
      control: { type: "radio" },
      options: [undefined, "round", "square"],
      description: "Top-right corner in LTR (overrides cornerAll)",
    },
    cornerEndStart: {
      control: { type: "radio" },
      options: [undefined, "round", "square"],
      description: "Bottom-left corner in LTR (overrides cornerAll)",
    },
    cornerEndEnd: {
      control: { type: "radio" },
      options: [undefined, "round", "square"],
      description: "Bottom-right corner in LTR (overrides cornerAll)",
    },
    showHistory: {
      control: "boolean",
      description: "Show history sidebar",
    },
    showWorkspace: {
      control: "boolean",
      description: "Show workspace sidebar",
    },
    contentMaxWidth: {
      control: "boolean",
      description: "Constrains content to a maximum width",
    },
    workspaceLocation: {
      control: { type: "radio" },
      options: ["start", "end"],
      description: "Position of workspace sidebar",
    },
    historyLocation: {
      control: { type: "radio" },
      options: ["start", "end"],
      description: "Position of history sidebar",
    },
    headerTitle: {
      control: "text",
      description: "Text shown in the header slot's toolbar title.",
      table: { defaultValue: { summary: "Header" } },
    },
    historyText: {
      control: "text",
      description: "Text shown in the history slot.",
      table: { defaultValue: { summary: "History" } },
    },
    workspaceText: {
      control: "text",
      description: "Text shown in the workspace slot.",
      table: { defaultValue: { summary: "Workspace" } },
    },
    messagesText: {
      control: "text",
      description: "Text shown in the messages slot.",
      table: { defaultValue: { summary: "Messages" } },
    },
    inputText: {
      control: "text",
      description: "Text shown in the input slot.",
      table: { defaultValue: { summary: "Input" } },
    },
  },
  decorators: [
    (story) => html`
      <style>
        ${styles}
      </style>
      ${story()}
    `,
  ],
};

export const Default = {
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
    } = args;

    return html`
      <cds-aichat-shell
        ?ai-enabled=${aiEnabled}
        ?show-frame=${showFrame}
        corner-all=${cornerAll}
        corner-start-start=${cornerStartStart || nothing}
        corner-start-end=${cornerStartEnd || nothing}
        corner-end-start=${cornerEndStart || nothing}
        corner-end-end=${cornerEndEnd || nothing}
        ?show-history=${showHistory}
        ?show-workspace=${showWorkspace}
        ?content-max-width=${contentMaxWidth}
        workspace-location=${workspaceLocation}
        history-location=${historyLocation}
      >
        ${coreSlotContent(args)}
      </cds-aichat-shell>
    `;
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

// Persistent state for slot visibility (survives re-renders)
const slotVisibilityState = new Map(
  SLOT_CONFIGS.map((slot) => [slot.name, true]),
);

/**
 * Creates a checkbox control for toggling slot visibility
 * @param {object} slot - Slot configuration
 * @param {boolean} isVisible - Current visibility state
 * @param {Function} onToggle - Callback when checkbox is toggled
 */
const createSlotCheckbox = (slot, isVisible, onToggle) => html`
  <label>
    <input
      type="checkbox"
      .checked=${isVisible}
      @change=${() => onToggle(slot.name)}
    />
    ${slot.label}
  </label>
`;

/**
 * Creates a slot element if it should be rendered
 * @param {object} slot - Slot configuration
 * @param {boolean} shouldRender - Whether to render the slot
 */
const createSlotElement = (slot, shouldRender) => {
  if (!shouldRender) {
    return nothing;
  }
  return html`
    <div slot="${slot.name}" class="${slot.name} slot-sample">
      ${slot.label}
    </div>
  `;
};

export const Slots = {
  args: {
    messagesMaxWidth: "672px",
    messagesMinWidth: "320px",
    workspaceMinWidth: "640px",
    historyWidth: "320px",
  },
  argTypes: {
    messagesMaxWidth: {
      control: { type: "select" },
      options: ["480px", "560px", "672px", "800px", "960px"],
      description: "CSS custom property: --cds-aichat-messages-max-width",
      table: {
        category: "CSS Custom Properties",
        defaultValue: { summary: "672px" },
      },
    },
    messagesMinWidth: {
      control: { type: "select" },
      options: ["280px", "320px", "400px", "480px"],
      description: "CSS custom property: --cds-aichat-messages-min-width",
      table: {
        category: "CSS Custom Properties",
        defaultValue: { summary: "320px" },
      },
    },
    workspaceMinWidth: {
      control: { type: "select" },
      options: ["480px", "560px", "640px", "800px", "960px"],
      description: "CSS custom property: --cds-aichat-workspace-min-width",
      table: {
        category: "CSS Custom Properties",
        defaultValue: { summary: "640px" },
      },
    },
    historyWidth: {
      control: { type: "select" },
      options: ["256px", "320px", "400px", "480px"],
      description: "CSS custom property: --cds-aichat-history-width",
      table: {
        category: "CSS Custom Properties",
        defaultValue: { summary: "320px" },
      },
    },
  },
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

    /**
     * Toggle slot visibility and force re-render
     * @param {string} slotName - Name of the slot to toggle
     */
    const toggleSlot = (slotName) => {
      const currentState = slotVisibilityState.get(slotName);
      slotVisibilityState.set(slotName, !currentState);

      // Force re-render by finding and updating the DOM directly
      const container = document.querySelector(".story-container");
      const shell = container?.querySelector("cds-aichat-shell");
      const slotElement = shell?.querySelector(`[slot="${slotName}"]`);

      if (slotElement) {
        slotElement.remove();
      } else if (shell) {
        const slot = SLOT_CONFIGS.find((s) => s.name === slotName);
        if (slot) {
          const newSlot = document.createElement("div");
          newSlot.setAttribute("slot", slotName);
          newSlot.className = `${slotName} slot-sample`;
          newSlot.textContent = slot.label;
          shell.appendChild(newSlot);
        }
      }
    };

    return html`
      <div class="story-container">
        <div class="slot-controls">
          <div class="control-section">
            <h4>Slot Visibility</h4>
            <div class="control-group">
              ${SLOT_CONFIGS.filter((slot) => slot.hasCheckbox).map((slot) =>
                createSlotCheckbox(
                  slot,
                  slotVisibilityState.get(slot.name),
                  toggleSlot,
                ),
              )}
            </div>
          </div>
        </div>
        <cds-aichat-shell
          ?ai-enabled=${aiEnabled}
          ?show-frame=${showFrame}
          corner-all=${cornerAll}
          corner-start-start=${cornerStartStart || nothing}
          corner-start-end=${cornerStartEnd || nothing}
          corner-end-start=${cornerEndStart || nothing}
          corner-end-end=${cornerEndEnd || nothing}
          ?show-history=${showHistory}
          ?show-workspace=${showWorkspace}
          ?content-max-width=${contentMaxWidth}
          workspace-location=${workspaceLocation}
          history-location=${historyLocation}
          style="
            --cds-aichat-messages-max-width: ${messagesMaxWidth};
            --cds-aichat-messages-min-width: ${messagesMinWidth};
            --cds-aichat-workspace-min-width: ${workspaceMinWidth};
            --cds-aichat-history-width: ${historyWidth};
          "
        >
          ${SLOT_CONFIGS.map((slot) =>
            createSlotElement(slot, slotVisibilityState.get(slot.name)),
          )}
        </cds-aichat-shell>
      </div>
    `;
  },
};

export const SidebarWorkspace = {
  args: {
    showWorkspace: undefined,
    showHistory: undefined,
    historyLocation: undefined,
    headerText: "Chat Header",
    messagesText: "Messages area",
    workspaceTitle: "Workspace",
    workspaceBodyText: "Workspace content goes here",
    workspaceBodyText2:
      "This area can contain any additional tools or information.",
    inputText: "Input area",
  },
  argTypes: {
    showHistory: { control: false, table: { disable: true } },
    historyLocation: { control: false, table: { disable: true } },
    showWorkspace: { control: false, table: { disable: true } },
    headerText: {
      control: "text",
      description: "Text shown in the header slot.",
      table: { defaultValue: { summary: "Chat Header" } },
    },
    workspaceTitle: {
      control: "text",
      description: "Title shown in the workspace panel.",
      table: { defaultValue: { summary: "Workspace" } },
    },
    workspaceBodyText: {
      control: "text",
      description: "First body paragraph in the workspace panel.",
      table: { defaultValue: { summary: "Workspace content goes here" } },
    },
    workspaceBodyText2: {
      control: "text",
      description: "Second body paragraph in the workspace panel.",
      table: {
        defaultValue: {
          summary: "This area can contain any additional tools or information.",
        },
      },
    },
  },
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

    // Configuration constants
    const CONFIG = {
      SHELL_ID: "sidebar-workspace-shell",
    };

    // State management for workspace visibility
    let isWorkspaceOpen = false;

    const toggleWorkspace = () => {
      const shell = document.getElementById(CONFIG.SHELL_ID);
      if (!shell) {
        return;
      }

      isWorkspaceOpen = !isWorkspaceOpen;

      // Toggle CSS class for width animation
      shell.classList.toggle("expanded", isWorkspaceOpen);

      // Toggle component attribute for workspace visibility
      if (isWorkspaceOpen) {
        shell.setAttribute("show-workspace", "");
      } else {
        shell.removeAttribute("show-workspace");
      }
    };

    return html`
      <cds-aichat-shell
        id=${CONFIG.SHELL_ID}
        class="sidebar-workspace-shell"
        ?ai-enabled=${aiEnabled}
        ?show-frame=${showFrame}
        corner-all=${cornerAll}
        corner-start-start=${cornerStartStart || nothing}
        corner-start-end=${cornerStartEnd || nothing}
        corner-end-start=${cornerEndStart || nothing}
        corner-end-end=${cornerEndEnd || nothing}
        ?content-max-width=${contentMaxWidth}
        workspace-location=${workspaceLocation}
      >
        <div slot="header" class="header slot-sample">${headerText}</div>
        <div slot="messages" class="messages slot-sample">
          <div class="messages-content">
            <p>${messagesText}</p>
            <button class="workspace-toggle-btn" @click=${toggleWorkspace}>
              Open workspace
            </button>
          </div>
        </div>
        <div slot="workspace" class="workspace slot-sample">
          <div class="workspace-content">
            <div class="workspace-header">
              <h3>${workspaceTitle}</h3>
              <button class="workspace-toggle-btn" @click=${toggleWorkspace}>
                Close
              </button>
            </div>
            <div class="workspace-body">
              <p>${workspaceBodyText}</p>
              <p>${workspaceBodyText2}</p>
            </div>
          </div>
        </div>
        <div slot="input" class="input slot-sample">${inputText}</div>
      </cds-aichat-shell>
    `;
  },
};
