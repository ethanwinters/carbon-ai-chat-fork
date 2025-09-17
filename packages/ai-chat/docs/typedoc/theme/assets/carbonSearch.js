/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* global lunr */

/**
 * Carbon Search Implementation
 *
 * Clean, maintainable search functionality using external Lunr.js
 * Replaces TypeDoc's bundled search with modular imports
 */

class CarbonSearch {
  constructor() {
    this.searchData = null;
    this.searchIndex = null;
    this.modal = null;
    this.input = null;
    this.results = null;
    this.status = null;
    this.initialized = false;
  }

  /**
   * Initialize search functionality
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Wait for Lunr to be available
    if (typeof lunr === "undefined") {
      console.log("Waiting for Lunr.js to load...");
      setTimeout(() => this.initialize(), 100);
      return;
    }

    // Setup DOM elements
    this.setupElements();

    // Load search data
    await this.loadSearchData();

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
    console.log("Carbon search initialized successfully");
  }

  /**
   * Setup DOM element references
   */
  setupElements() {
    this.modal = document.querySelector("#carbon-search-modal");
    this.input = document.querySelector(
      "#carbon-search-content #tsd-search-input",
    );
    this.results = document.querySelector(
      "#carbon-search-content #tsd-search-results",
    );
    this.status = document.querySelector(
      "#carbon-search-content #tsd-search-status",
    );

    if (!this.input || !this.results || !this.status) {
      throw new Error(
        "Search elements not found - ensure carbonSearchModal.js has run first",
      );
    }
  }

  /**
   * Load and process search data
   */
  async loadSearchData() {
    if (!window.searchData) {
      this.updateStatus("Search index not available");
      return;
    }

    try {
      // Fetch search data (this is provided by TypeDoc)
      const response = await this.fetchSearchData(window.searchData);
      this.searchData = response;

      // Build Lunr index
      this.searchIndex = lunr.Index.load(response.index);

      this.updateStatus("");
      console.log("Search data loaded successfully");
    } catch (error) {
      console.error("Failed to load search data:", error);
      this.updateStatus("Failed to load search index");
    }
  }

  /**
   * Fetch search data with proper error handling
   */
  async fetchSearchData(searchDataUrl) {
    // If searchData is already an object, return it
    if (typeof searchDataUrl === "object") {
      return searchDataUrl;
    }

    // If it's a URL string, fetch it
    if (typeof searchDataUrl === "string") {
      const response = await fetch(searchDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch search data: ${response.statusText}`);
      }
      return response.json();
    }

    throw new Error("Invalid search data format");
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    this.input.addEventListener(
      "input",
      this.debounce(() => {
        this.performSearch(this.input.value.trim());
      }, 200),
    );

    // Keyboard navigation
    this.input.addEventListener("keydown", (e) => {
      this.handleKeyNavigation(e);
    });

    // Clear selection on input change
    this.input.addEventListener("input", () => {
      this.clearSelection();
    });

    // Global search shortcuts
    document.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey && e.key === "k") ||
        (!e.ctrlKey && e.key === "/" && !this.isInputFocused())
      ) {
        e.preventDefault();
        this.openSearch();
      }
    });
  }

  /**
   * Perform search with Lunr
   */
  performSearch(query) {
    if (!this.searchIndex || !this.searchData) {
      return;
    }

    this.results.innerHTML = "";
    this.updateStatus("");

    if (!query) {
      return;
    }

    try {
      // Build Lunr query
      const lunrQuery = query
        .split(" ")
        .map((term) => (term.length ? `*${term}*` : ""))
        .join(" ");

      // Search with Lunr
      const searchResults = this.searchIndex.search(lunrQuery);

      // Filter and process results
      const filteredResults = searchResults
        .filter(({ ref }) => {
          const row = this.searchData.rows[Number(ref)];
          return !row.classes || !this.isFiltered(row.classes);
        })
        .map((result) => ({
          ...result,
          row: this.searchData.rows[Number(result.ref)],
        }));

      this.displayResults(filteredResults, query);
    } catch (error) {
      console.error("Search error:", error);
      this.updateStatus("Search error occurred");
    }
  }

  /**
   * Display search results
   */
  displayResults(results, query) {
    if (results.length === 0) {
      this.updateStatus(
        `No results found for "<strong>${this.escapeHtml(query)}</strong>"`,
      );
      return;
    }

    // Sort results by relevance
    results.sort((a, b) => {
      // Boost exact matches
      const aExact = a.row.name.toLowerCase().startsWith(query.toLowerCase())
        ? 10
        : 1;
      const bExact = b.row.name.toLowerCase().startsWith(query.toLowerCase())
        ? 10
        : 1;

      return b.score * bExact - a.score * aExact;
    });

    // Display top 10 results
    const maxResults = Math.min(10, results.length);

    for (let i = 0; i < maxResults; i++) {
      const { row } = results[i];
      const resultElement = this.createResultElement(row, query, i);
      this.results.appendChild(resultElement);
    }
  }

  /**
   * Create a search result element
   */
  createResultElement(row, query, index) {
    const li = document.createElement("li");
    li.id = `carbon-search-result-${index}`;
    li.role = "option";
    li.setAttribute("aria-selected", "false");
    li.classList.value = row.classes || "";

    const a = document.createElement("a");
    a.tabIndex = -1;
    a.href = this.getBaseUrl() + row.url;

    // Kind icon
    const icon = document.createElement("div");
    icon.innerHTML = this.getKindIcon(row.kind, row.icon);

    // Result text with highlighting
    const textSpan = document.createElement("span");
    textSpan.className = "text";
    textSpan.innerHTML = this.highlightText(row.name, query);

    // Parent context
    if (row.parent) {
      const parentSpan = document.createElement("span");
      parentSpan.className = "parent";
      parentSpan.innerHTML = this.highlightText(row.parent, query) + ".";
      textSpan.insertBefore(parentSpan, textSpan.firstChild);
    }

    a.appendChild(icon);
    a.appendChild(textSpan);
    li.appendChild(a);

    return li;
  }

  /**
   * Get kind icon SVG
   */
  getKindIcon(kind, icon) {
    const kindName = window.translations?.[`kind_${kind}`] || kind;
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="tsd-kind-icon" aria-label="${this.escapeHtml(kindName)}">
      <use href="#icon-${icon || kind}"></use>
    </svg>`;
  }

  /**
   * Highlight search terms in text
   */
  highlightText(text, query) {
    if (!query) {
      return this.escapeHtml(text);
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const parts = [];
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerQuery);

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(this.escapeHtml(text.substring(lastIndex, index)));
      }

      // Add highlighted match
      parts.push(
        `<mark>${this.escapeHtml(text.substring(index, index + query.length))}</mark>`,
      );

      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(this.escapeHtml(text.substring(lastIndex)));
    }

    return parts.join("");
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyNavigation(e) {
    const items = this.results.querySelectorAll('li[role="option"]');
    if (items.length === 0) {
      return;
    }

    const activeItem = this.results.querySelector('li[aria-selected="true"]');
    let newIndex = -1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        newIndex = activeItem
          ? Math.min(
              Array.from(items).indexOf(activeItem) + 1,
              items.length - 1,
            )
          : 0;
        break;

      case "ArrowUp":
        e.preventDefault();
        newIndex = activeItem
          ? Math.max(Array.from(items).indexOf(activeItem) - 1, 0)
          : items.length - 1;
        break;

      case "Enter":
        if (activeItem) {
          e.preventDefault();
          activeItem.querySelector("a")?.click();
        }
        break;

      case "Escape":
        this.closeSearch();
        break;
    }

    if (newIndex >= 0) {
      this.selectItem(items[newIndex]);
    }
  }

  /**
   * Select a search result item
   */
  selectItem(item) {
    // Clear previous selection
    this.results
      .querySelectorAll('li[aria-selected="true"]')
      .forEach((li) => li.setAttribute("aria-selected", "false"));

    // Select new item
    item.setAttribute("aria-selected", "true");
    item.scrollIntoView({ behavior: "smooth", block: "nearest" });

    this.input.setAttribute("aria-activedescendant", item.id);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.results
      .querySelectorAll('li[aria-selected="true"]')
      .forEach((li) => li.setAttribute("aria-selected", "false"));
    this.input.setAttribute("aria-activedescendant", "");
  }

  /**
   * Open search modal
   */
  openSearch() {
    if (this.modal) {
      this.modal.setAttribute("open", "");
      setTimeout(() => {
        this.input?.focus();
        this.input?.select();
      }, 100);
    }
  }

  /**
   * Close search modal
   */
  closeSearch() {
    if (this.modal) {
      this.modal.removeAttribute("open");
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    if (this.status) {
      this.status.innerHTML = message ? `<div>${message}</div>` : "";
    }
  }

  /**
   * Get base URL for links
   */
  getBaseUrl() {
    let base = document.documentElement.dataset.base || "./";
    if (!base.endsWith("/")) {
      base += "/";
    }
    return base;
  }

  /**
   * Check if classes are filtered
   */
  isFiltered(_classes) {
    // This would check against TypeDoc's filter settings
    // For now, return false (show all)
    return false;
  }

  /**
   * Check if an input element is focused
   */
  isInputFocused() {
    const active = document.activeElement;
    if (!active) {
      return false;
    }

    return (
      active.isContentEditable ||
      active.tagName === "TEXTAREA" ||
      active.tagName === "SEARCH" ||
      (active.tagName === "INPUT" &&
        ![
          "button",
          "checkbox",
          "file",
          "hidden",
          "image",
          "radio",
          "range",
          "reset",
          "submit",
        ].includes(active.type))
    );
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Debounce function calls
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize when DOM is ready
function initializeCarbonSearch() {
  const search = new CarbonSearch();

  // Wait for modal to be set up
  const waitForModal = () => {
    if (document.querySelector("#carbon-search-modal")) {
      search.initialize().catch(console.error);
    } else {
      setTimeout(waitForModal, 100);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForModal);
  } else {
    waitForModal();
  }

  // Expose for debugging
  window.carbonSearch = search;
}

// Start initialization
initializeCarbonSearch();
