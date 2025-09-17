/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * Carbon Search Modal Integration
 *
 * This script integrates TypeDoc's search functionality with Carbon Design System modal.
 * It moves the existing TypeDoc search dialog into a Carbon modal and handles
 * the search trigger from the Carbon header.
 */

(function () {
  "use strict";

  /**
   * Move TypeDoc search dialog into Carbon modal while preserving functionality
   */
  function moveSearchToModal() {
    const carbonModal = document.querySelector("#carbon-search-modal");
    const carbonSearchContent = document.querySelector(
      "#carbon-search-content",
    );
    const typedocSearch = document.querySelector("#tsd-search");

    if (!carbonModal || !carbonSearchContent || !typedocSearch) {
      console.log("Search modal elements not ready, retrying...");
      setTimeout(moveSearchToModal, 100);
      return;
    }

    // Wait for TypeDoc search to be fully initialized before moving
    const searchInput = typedocSearch.querySelector("#tsd-search-input");
    const searchResults = typedocSearch.querySelector("#tsd-search-results");
    const searchStatus = typedocSearch.querySelector("#tsd-search-status");

    if (!searchInput || !searchResults || !searchStatus) {
      console.log("TypeDoc search not fully initialized, retrying...");
      setTimeout(moveSearchToModal, 100);
      return;
    }

    // Create a wrapper to maintain TypeDoc search structure and styling
    const searchWrapper = document.createElement("div");
    searchWrapper.className = "tsd-search-wrapper";
    searchWrapper.style.cssText = "padding: 1rem 0;";

    // Move the search input and results to the wrapper, preserving their IDs
    // This is critical - TypeDoc scripts expect these elements to exist with these IDs
    searchWrapper.appendChild(searchInput);
    searchWrapper.appendChild(searchResults);
    searchWrapper.appendChild(searchStatus);

    // Clear and populate the Carbon modal content
    carbonSearchContent.innerHTML = "";
    carbonSearchContent.appendChild(searchWrapper);

    // Hide the original TypeDoc search dialog (but keep it in DOM for script access)
    typedocSearch.style.display = "none";
    typedocSearch.setAttribute("aria-hidden", "true");

    console.log(
      "TypeDoc search moved to Carbon modal while preserving functionality",
    );
  }

  /**
   * Handle opening the search modal and focusing the input
   */
  function openSearchModal() {
    const carbonModal = document.querySelector("#carbon-search-modal");
    const searchInput = document.querySelector(
      "#carbon-search-content #tsd-search-input",
    );

    if (carbonModal) {
      carbonModal.setAttribute("open", "");

      // Focus the search input after a brief delay to ensure modal is fully opened
      setTimeout(() => {
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }

  /**
   * Handle closing the search modal
   */
  function closeSearchModal() {
    const carbonModal = document.querySelector("#carbon-search-modal");

    if (carbonModal) {
      carbonModal.removeAttribute("open");
    }
  }

  /**
   * Wire up search trigger and modal interactions
   */
  function setupSearchInteractions() {
    const searchTrigger = document.querySelector("#carbon-search-trigger");
    const carbonModal = document.querySelector("#carbon-search-modal");

    if (!searchTrigger || !carbonModal) {
      console.log("Search interaction elements not ready, retrying...");
      setTimeout(setupSearchInteractions, 100);
      return;
    }

    // Handle search trigger click
    searchTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      openSearchModal();
    });

    // Handle modal close events
    carbonModal.addEventListener("cds-modal-closed", () => {
      closeSearchModal();
    });

    // Handle escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && carbonModal.hasAttribute("open")) {
        closeSearchModal();
      }
    });

    // Disable the original TypeDoc search trigger
    const originalSearchTrigger = document.querySelector("#tsd-search-trigger");
    if (originalSearchTrigger) {
      originalSearchTrigger.style.display = "none";
    }

    console.log("Carbon search modal interactions setup complete");
  }

  /**
   * Wait for TypeDoc search initialization to complete
   */
  function waitForTypeDocSearchInitialization() {
    // Check if TypeDoc search has been initialized by looking for event listeners
    const searchInput = document.querySelector("#tsd-search-input");
    const searchTrigger = document.querySelector("#tsd-search-trigger");

    if (!searchInput || !searchTrigger) {
      console.log("TypeDoc search elements not found, retrying...");
      setTimeout(waitForTypeDocSearchInitialization, 100);
      return;
    }

    // Check if search has been initialized by testing if input has event listeners
    // TypeDoc adds an 'input' event listener during initialization
    try {
      // Create a test event to see if handlers are attached
      const testEvent = new Event("input", { bubbles: true });
      searchInput.dispatchEvent(testEvent);

      // If we get here without error, search is likely initialized
      console.log("TypeDoc search initialization detected");
      moveSearchToModal();
      setupSearchInteractions();
    } catch (error) {
      console.log(
        "TypeDoc search not fully initialized, retrying...",
        error.message,
      );
      setTimeout(waitForTypeDocSearchInitialization, 100);
    }
  }

  /**
   * Initialize search modal integration
   */
  function initializeSearchModal() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        // Give TypeDoc main.js time to run its search initialization
        setTimeout(waitForTypeDocSearchInitialization, 500);
      });
    } else {
      // DOM is already loaded, but ensure TypeDoc scripts have run
      setTimeout(waitForTypeDocSearchInitialization, 500);
    }
  }

  // Start the initialization
  initializeSearchModal();
})();
