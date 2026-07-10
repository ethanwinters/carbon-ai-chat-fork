/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */
import "../index";
import { LitElement, html, css } from "lit";
import styles from "./story-styles.scss?lit";
import { focusElementAfterRepaint } from "../../../globals/utils/focus-utils";

import {
  historyItemActions,
  pinnedHistoryItemActions,
  pinnedHistoryItems,
  historyItems,
} from "./story-data";

import PinFilled16 from "@carbon/icons/es/pin--filled/16.js";
import Search16 from "@carbon/icons/es/search/16.js";
import { iconLoader } from "@carbon/web-components/es/globals/internal/icon-loader.js";

// Return id of selected chat item or undefined if no item is selected
const findSelectedItemId = (pinnedItems, regularItems) => {
  // Check pinned items
  const selectedPinned = pinnedItems.find((item) => item.selected);
  if (selectedPinned) {
    return selectedPinned.id;
  }

  // Checked regular items
  for (const section of regularItems) {
    const selectedChat = section.chats.find((chat) => chat.selected);
    if (selectedChat) {
      return selectedChat.id;
    }
  }

  return undefined;
};

// Returns index that a chat item should be inserted within section ordered by descending lastUpdated timestamp
const getIndexByTimestamp = (items, timestamp) => {
  const index = items.findIndex(
    (item) => timestamp >= Date.parse(item.lastUpdated),
  );
  return index === -1 ? items.length : index;
};

class ChatHistoryDemo extends LitElement {
  static properties = {
    headerTitle: { type: String, attribute: "header-title" },
    resultsLabel: { type: String, attribute: "results-label" },
    panelAriaLabel: { type: String, attribute: "panel-aria-label" },
    searchResultsTitle: { type: String, attribute: "search-results-title" },
    noResultsText: { type: String, attribute: "no-results-text" },
    pinnedSectionTitle: { type: String, attribute: "pinned-section-title" },
    searchResults: { type: Array },
    searchTotalCount: { type: Number },
    searchValue: { type: String },
    searchOff: { type: Boolean, attribute: "search-off" },
    searchAttributes: { type: Object },
    overflowMenuLabel: { type: String, attribute: "overflow-menu-label" },
    selectedId: { type: String },
    showCloseAction: { type: Boolean, attribute: "show-close-action" },
    showActions: { type: Boolean, attribute: "show-actions" },
    showDeletePanel: { type: Boolean },
    itemToDelete: { type: String },
    pinnedItems: { type: Array },
    regularItems: { type: Array },
  };

  static styles = css`
    :host {
      display: block;
      block-size: 100%;
    }
  `;

  constructor() {
    super();
    this.headerTitle = "Chats";
    this.resultsLabel = "Results";
    this.panelAriaLabel = "Chat history";
    this.searchResultsTitle = "Search results";
    this.noResultsText = "No available chats";
    this.pinnedSectionTitle = "Pinned";
    this.searchOff = false;
    this.searchAttributes = {
      "label-text": "Search",
      placeholder: "Search",
      "close-button-label-text": "Clear search",
    };
    this.overflowMenuLabel = "Options";
    this.showCloseAction = true;
    this.showActions = false;
    this.startPanel = false;
    this.searchResults = [];
    this.searchTotalCount = 0;
    this.searchValue = "";
    this.selectedId = findSelectedItemId(pinnedHistoryItems, historyItems);
    this.showDeletePanel = false;
    this.itemToDelete = null;
    this.pinnedItems = pinnedHistoryItems.map((item) => ({
      ...item,
      rename: false,
    }));
    this.regularItems = historyItems.map((section) => ({
      ...section,
      chats: section.chats.map((chat) => ({ ...chat, rename: false })),
    }));
  }

  firstUpdated() {
    // Add event listeners after first render
    this.addEventListener(
      "history-item-menu-action",
      this._handleHistoryItemAction,
    );
    this.addEventListener("cds-search-input", this._handleSearchInput);
    this.addEventListener("history-delete-cancel", this._handleDeleteCancel);
    this.addEventListener("history-delete-confirm", this._handleDeleteConfirm);
    this.addEventListener("history-item-selected", this._handleSelectChat);
    this.addEventListener(
      "history-panel-item-input-save",
      this._handleRenameSave,
    );
  }

  _handleSelectChat = (event) => {
    const itemId = event.detail.itemId;

    if (this.selectedId === itemId) {
      return;
    }

    const itemExists =
      this.pinnedItems.some((item) => item.id === itemId) ||
      this.regularItems.some((section) =>
        section.chats.some((chat) => chat.id === itemId),
      );

    if (itemExists) {
      this.selectedId = itemId;

      // Update pinned items
      this.pinnedItems = this.pinnedItems.map((item) => ({
        ...item,
        selected: item.id === itemId,
      }));

      // Update regular items
      this.regularItems = this.regularItems.map((section) => ({
        ...section,
        chats: section.chats.map((chat) => ({
          ...chat,
          selected: chat.id === itemId,
        })),
      }));
    }
  };

  _handlePinToTop = (itemId) => {
    const itemToPin = this.regularItems
      .flatMap((section) => section.chats)
      .find((chat) => chat.id === itemId);

    if (itemToPin !== undefined) {
      // Remove from regular items
      this.regularItems = this.regularItems.map((section) => ({
        ...section,
        chats: section.chats.filter((chat) => chat.id !== itemToPin.id),
      }));

      // Add to start of pinned items
      this.pinnedItems = [
        { ...itemToPin, isPinned: true },
        ...this.pinnedItems,
      ];
      this.requestUpdate();

      focusElementAfterRepaint(
        this.renderRoot,
        `cds-aichat-history-panel-item#${CSS.escape(itemId)}`,
      );
    }
  };

  _handleUnpin = (itemId) => {
    const itemToUnpin = this.pinnedItems.find((chat) => chat.id === itemId);

    if (itemToUnpin !== undefined) {
      // Remove from pinned items
      this.pinnedItems = this.pinnedItems.filter(
        (chat) => chat.id !== itemToUnpin.id,
      );

      // Add to regular items
      const now = new Date("Feb 10, 7:30 PM");
      const today = now.setHours(0, 0, 0, 0);
      const yesterday = today - 24 * 60 * 60 * 1000;
      const itemToUnpinTs = Date.parse(itemToUnpin.lastUpdated);

      let sectionMatch = "";
      if (itemToUnpinTs > today) {
        sectionMatch = "Today";
      } else if (itemToUnpinTs > yesterday) {
        sectionMatch = "Yesterday";
      } else {
        sectionMatch = "Previous 7 days";
      }

      const newRegularItems = this.regularItems.map((item) => {
        if (item.section === sectionMatch) {
          const index = getIndexByTimestamp(item.chats, itemToUnpinTs);
          const chats = [...item.chats];
          chats.splice(index, 0, { ...itemToUnpin, isPinned: false });
          return {
            ...item,
            chats,
          };
        }
        return item;
      });

      this.regularItems = newRegularItems;
      this.requestUpdate();

      focusElementAfterRepaint(
        this.renderRoot,
        `cds-aichat-history-panel-item#${CSS.escape(itemId)}`,
      );
    }
  };

  _handleHistoryItemAction = (event) => {
    const action = event.detail.action;

    switch (action) {
      case "Delete":
        this.itemToDelete = event.detail.itemId;
        this.showDeletePanel = true;
        break;
      case "Rename":
        if (event.detail.element) {
          event.detail.element.rename = true;
        }
        break;
      case "Pin to top":
        this._handlePinToTop(event.detail.itemId);
        break;
      case "Unpin":
        this._handleUnpin(event.detail.itemId);
        break;
      default:
        break;
    }
  };

  _handleDeleteCancel = () => {
    this.showDeletePanel = false;
    this.itemToDelete = null;
    this.requestUpdate();
  };

  _handleDeleteConfirm = () => {
    if (this.itemToDelete) {
      // Remove from pinned items
      this.pinnedItems = this.pinnedItems.filter(
        (item) => item.id !== this.itemToDelete,
      );

      // Remove from regular items
      this.regularItems = this.regularItems.map((section) => ({
        ...section,
        chats: section.chats.filter((chat) => chat.id !== this.itemToDelete),
      }));
    }

    this.showDeletePanel = false;
    this.itemToDelete = null;
    this.requestUpdate();
  };

  _handleRenameSave = (event) => {
    const itemId = event.detail.itemId;

    if (itemId) {
      this.pinnedItems = this.pinnedItems.map((chat) =>
        chat.id === itemId
          ? {
              ...chat,
              name: event.detail.newName,
            }
          : chat,
      );

      this.regularItems = this.regularItems.map((section) => ({
        ...section,
        chats: section.chats.map((chat) =>
          chat.id === itemId
            ? {
                ...chat,
                name: event.detail.newName,
              }
            : chat,
        ),
      }));
    }
  };

  _handleSearchInput = (event) => {
    const inputValue = event.detail.value.toLowerCase();

    // Combine all results into a single array
    const results = [];

    // Add matching pinned items
    this.pinnedItems.forEach((item) => {
      if (item.name.toLowerCase().includes(inputValue)) {
        results.push({
          ...item,
          isPinned: true,
        });
      }
    });

    // Add matching history items
    this.regularItems.forEach((section) => {
      section.chats.forEach((chat) => {
        if (chat.name.toLowerCase().includes(inputValue)) {
          results.push({
            ...chat,
            section: section.section,
            isPinned: false,
          });
        }
      });
    });

    this.searchResults = results;
    this.searchTotalCount = results.length;
    this.searchValue = inputValue;
  };

  render() {
    const showSearchResults = this.searchTotalCount > 0 && this.searchValue;
    const noSearchResults = this.searchTotalCount === 0 && this.searchValue;

    return html`
      <cds-aichat-history-shell>
        <cds-aichat-history-header
          header-title="${this.headerTitle}"
          ?show-close-action=${this.showCloseAction}
        ></cds-aichat-history-header>
        <cds-aichat-history-toolbar
          ?search-off=${this.searchOff}
          .searchAttributes=${this.searchAttributes}
        >
        </cds-aichat-history-toolbar>
        <cds-aichat-history-content
          results-label="${this.resultsLabel}"
          results-count="${showSearchResults || noSearchResults
            ? this.searchTotalCount
            : ""}"
        >
          <cds-aichat-history-panel
            ?show-actions=${this.showActions}
            aria-label="${this.panelAriaLabel}"
          >
            <cds-aichat-history-panel-items>
              ${noSearchResults
                ? html`
                    <cds-aichat-history-panel-menu
                      expanded
                      title="${this.searchResultsTitle}"
                    >
                      ${iconLoader(Search16, {
                        slot: "title-icon",
                      })}
                      <cds-aichat-history-search-item disabled>
                        ${this.noResultsText}
                      </cds-aichat-history-search-item>
                    </cds-aichat-history-panel-menu>
                  `
                : ""}
              ${showSearchResults
                ? html`
                    <cds-aichat-history-panel-menu
                      expanded
                      title="${this.searchResultsTitle}"
                    >
                      ${iconLoader(Search16, {
                        slot: "title-icon",
                      })}
                      ${this.searchResults.map(
                        (result) => html`
                          <cds-aichat-history-search-item
                            name="${result.name}"
                            date="${result.lastUpdated}"
                          >
                          </cds-aichat-history-search-item>
                        `,
                      )}
                    </cds-aichat-history-panel-menu>
                  `
                : ""}
              ${!showSearchResults && !noSearchResults
                ? html`
                    ${this.pinnedItems.length > 0
                      ? html`
                          <cds-aichat-history-panel-menu
                            expanded
                            title="${this.pinnedSectionTitle}"
                          >
                            ${iconLoader(PinFilled16, {
                              slot: "title-icon",
                            })}
                            ${this.pinnedItems.map(
                              (item) => html`
                                <cds-aichat-history-panel-item
                                  id="${item.id}"
                                  name="${item.name}"
                                  ?selected=${item.selected}
                                  ?rename=${item.rename}
                                  overflow-menu-label="${this
                                    .overflowMenuLabel}"
                                  .actions=${pinnedHistoryItemActions}
                                ></cds-aichat-history-panel-item>
                              `,
                            )}
                          </cds-aichat-history-panel-menu>
                        `
                      : ""}
                    ${this.regularItems
                      .filter((item) => item.chats.length > 0)
                      .map(
                        (item) => html`
                          <cds-aichat-history-panel-menu
                            expanded
                            title="${item.section}"
                          >
                            ${item.icon}
                            ${item.chats.map(
                              (chat) => html`
                                <cds-aichat-history-panel-item
                                  id="${chat.id}"
                                  name="${chat.name}"
                                  ?selected=${chat.selected}
                                  overflow-menu-label="${this
                                    .overflowMenuLabel}"
                                  .actions=${historyItemActions}
                                ></cds-aichat-history-panel-item>
                              `,
                            )}
                          </cds-aichat-history-panel-menu>
                        `,
                      )}
                  `
                : ""}
            </cds-aichat-history-panel-items>
          </cds-aichat-history-panel>
        </cds-aichat-history-content>
        ${this.showDeletePanel
          ? html`
              <cds-aichat-history-delete-panel
                item-id=${this.itemToDelete ?? ""}
              ></cds-aichat-history-delete-panel>
            `
          : ""}
      </cds-aichat-history-shell>
    `;
  }
}

// Register the demo component
if (!customElements.get("cds-aichat-history-demo")) {
  customElements.define("cds-aichat-history-demo", ChatHistoryDemo);
}

export default {
  title: "Components/Chat History",
  component: "cds-aichat-history-shell",
  decorators: [
    (story) => html`
      <style>
        ${styles}
      </style>
      <div class="chat-history-story-container">${story()}</div>
    `,
  ],
};

export const Default = {
  argTypes: {
    headerTitle: {
      control: "text",
      description: "Header title text of the chat history shell.",
      table: { defaultValue: { summary: "Chats" } },
    },
    resultsLabel: {
      control: "text",
      description:
        "Label displayed before the results count in the history content header.",
      table: { defaultValue: { summary: "Results" } },
    },
    panelAriaLabel: {
      control: "text",
      description: "Accessible label for the chat history panel.",
      table: { defaultValue: { summary: "Chat history" } },
    },
    searchResultsTitle: {
      control: "text",
      description: "Title text of the search results panel menu.",
      table: { defaultValue: { summary: "Search results" } },
    },
    noResultsText: {
      control: "text",
      description: "Message shown when a search returns no matching chats.",
      table: { defaultValue: { summary: "No available chats" } },
    },
    pinnedSectionTitle: {
      control: "text",
      description: "Title text of the pinned items section.",
      table: { defaultValue: { summary: "Pinned" } },
    },
    searchOff: {
      control: "boolean",
      description:
        "true if search should be turned off in chat history toolbar.",
    },
    searchAttributes: {
      control: "object",
      description:
        "Optional attributes to pass to the cds-search component. Allows customization of search behavior and appearance (e.g., label-text, placeholder, disabled, value, close-button-label-text).",
    },
    overflowMenuLabel: {
      control: "text",
      description: "Overflow menu tooltip label for history panel items.",
    },
    showCloseAction: {
      control: "boolean",
      description: "renders close chat history action in header.",
    },
    showActions: {
      control: "boolean",
      description: "Show actions on all history panel items.",
    },
  },
  args: {
    headerTitle: "Chats",
    resultsLabel: "Results",
    panelAriaLabel: "Chat history",
    searchResultsTitle: "Search results",
    noResultsText: "No available chats",
    pinnedSectionTitle: "Pinned",
    searchOff: false,
    searchAttributes: {
      "label-text": "Search",
      placeholder: "Search",
      "close-button-label-text": "Clear search",
    },
    overflowMenuLabel: "Options",
    showCloseAction: true,
    showActions: false,
  },
  render: (args) => html`
    <cds-aichat-history-demo
      header-title="${args.headerTitle}"
      results-label="${args.resultsLabel}"
      panel-aria-label="${args.panelAriaLabel}"
      search-results-title="${args.searchResultsTitle}"
      no-results-text="${args.noResultsText}"
      pinned-section-title="${args.pinnedSectionTitle}"
      ?search-off=${args.searchOff}
      .searchAttributes=${args.searchAttributes}
      overflow-menu-label="${args.overflowMenuLabel}"
      ?show-close-action=${args.showCloseAction}
      ?show-actions=${args.showActions}
    ></cds-aichat-history-demo>
  `,
};

export const SearchResults = {
  argTypes: {
    headerTitle: Default.argTypes.headerTitle,
    resultsLabel: Default.argTypes.resultsLabel,
    panelAriaLabel: Default.argTypes.panelAriaLabel,
    searchResultsTitle: Default.argTypes.searchResultsTitle,
  },
  args: {
    headerTitle: Default.args.headerTitle,
    resultsLabel: Default.args.resultsLabel,
    panelAriaLabel: "Search results",
    searchResultsTitle: Default.args.searchResultsTitle,
  },
  render: (args) => {
    return html`
      <cds-aichat-history-shell>
        <cds-aichat-history-header
          header-title="${args.headerTitle}"
        ></cds-aichat-history-header>
        <cds-aichat-history-toolbar></cds-aichat-history-toolbar>
        <cds-aichat-history-content
          results-label="${args.resultsLabel}"
          results-count="4"
        >
          <cds-aichat-history-panel aria-label="${args.panelAriaLabel}">
            <cds-aichat-history-panel-items>
              <cds-aichat-history-panel-menu
                expanded
                title="${args.searchResultsTitle}"
              >
                ${iconLoader(Search16, {
                  slot: "title-icon",
                })}
                <cds-aichat-history-search-item date="Monday, 12:04 PM">
                  Here's the onboarding doc that includes all the information to
                  get started.
                </cds-aichat-history-search-item>
                <cds-aichat-history-search-item date="Monday, 12:04 PM">
                  Let's use this as the master invoice document.
                </cds-aichat-history-search-item>
                <cds-aichat-history-search-item date="Monday, 12:04 PM">
                  Noticed some discrepancies between these two files.
                </cds-aichat-history-search-item>
                <cds-aichat-history-search-item date="Monday, 12:04 PM">
                  Do we need a PO number on every documentation here?
                </cds-aichat-history-search-item>
              </cds-aichat-history-panel-menu>
            </cds-aichat-history-panel-items>
          </cds-aichat-history-panel>
        </cds-aichat-history-content>
      </cds-aichat-history-shell>
    `;
  },
};

export const Loading = {
  argTypes: {
    headerTitle: Default.argTypes.headerTitle,
  },
  args: {
    headerTitle: Default.args.headerTitle,
  },
  render: (args) => {
    return html`
      <cds-aichat-history-shell>
        <cds-aichat-history-header
          header-title="${args.headerTitle}"
        ></cds-aichat-history-header>
        <cds-aichat-history-toolbar></cds-aichat-history-toolbar>
        <cds-aichat-history-loading></cds-aichat-history-loading>
      </cds-aichat-history-shell>
    `;
  },
};

export const EmptyState = {
  argTypes: {
    headerTitle: Default.argTypes.headerTitle,
  },
  args: {
    headerTitle: Default.args.headerTitle,
  },
  render: (args) => {
    return html`
      <cds-aichat-history-shell>
        <cds-aichat-history-header
          header-title="${args.headerTitle}"
        ></cds-aichat-history-header>
        <cds-aichat-history-toolbar></cds-aichat-history-toolbar>
        <cds-aichat-history-content> </cds-aichat-history-content>
      </cds-aichat-history-shell>
    `;
  },
};

export const DeleteFlow = {
  argTypes: {
    headerTitle: Default.argTypes.headerTitle,
    pinnedSectionTitle: Default.argTypes.pinnedSectionTitle,
  },
  args: {
    headerTitle: Default.args.headerTitle,
    pinnedSectionTitle: Default.args.pinnedSectionTitle,
  },
  render: (args) => {
    return html`
      <cds-aichat-history-shell>
        <cds-aichat-history-header
          header-title="${args.headerTitle}"
        ></cds-aichat-history-header>
        <cds-aichat-history-toolbar></cds-aichat-history-toolbar>
        <cds-aichat-history-content>
          <cds-aichat-history-panel>
            <cds-aichat-history-panel-items>
              <cds-aichat-history-panel-menu
                expanded
                title="${args.pinnedSectionTitle}"
              >
                ${iconLoader(PinFilled16, {
                  slot: "title-icon",
                })}
                ${pinnedHistoryItems.map(
                  (item) => html`
                    <cds-aichat-history-panel-item
                      id="${item.id}"
                      name="${item.name}"
                      ?selected=${item.selected}
                      ?rename=${item.rename}
                      .actions=${pinnedHistoryItemActions}
                    ></cds-aichat-history-panel-item>
                  `,
                )}
              </cds-aichat-history-panel-menu>
              ${historyItems.map(
                (item) => html`
                  <cds-aichat-history-panel-menu
                    expanded
                    title="${item.section}"
                  >
                    ${item.icon}
                    ${item.chats.map(
                      (chat) => html`
                        <cds-aichat-history-panel-item
                          id="${chat.id}"
                          name="${chat.name}"
                          .actions=${historyItemActions}
                        ></cds-aichat-history-panel-item>
                      `,
                    )}
                  </cds-aichat-history-panel-menu>
                `,
              )}
            </cds-aichat-history-panel-items>
          </cds-aichat-history-panel>
        </cds-aichat-history-content>
        <cds-aichat-history-delete-panel
          item-id="today-0"
        ></cds-aichat-history-delete-panel>
      </cds-aichat-history-shell>
    `;
  },
};
