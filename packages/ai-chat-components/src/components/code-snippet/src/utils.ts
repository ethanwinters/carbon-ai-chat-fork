/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { detect } from "program-language-detector";

/**
 * Observes resize of the given element with the given resize observer.
 * Returns an object with a release() method to clean up the observer.
 */
export const observeResize = (
  observer: ResizeObserver,
  elem: Element,
): { release(): null } | null => {
  if (!elem) {
    return null;
  }
  observer.observe(elem);
  return {
    release() {
      observer.unobserve(elem);
      return null;
    },
  };
};

/**
 * Gets scroll and dimension information from a code reference element.
 */
export function getCodeRefDimensions(ref: Element) {
  const {
    clientWidth: codeClientWidth,
    scrollLeft: codeScrollLeft,
    scrollWidth: codeScrollWidth,
  } = ref as HTMLElement;

  return {
    horizontalOverflow: codeScrollWidth > codeClientWidth,
    codeClientWidth,
    codeScrollWidth,
    codeScrollLeft,
  };
}

/**
 * Extracts text content from child nodes of an element.
 * Filters for text and element nodes, then joins their text content.
 */
export function extractTextContent(element: Element): string {
  const textContent = Array.from(element.childNodes)
    .filter(
      (node) =>
        node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE,
    )
    .map((node) => node.textContent || "")
    .join("");

  return textContent.trim();
}

/**
 * Extracts text content from slot's assigned nodes.
 */
export function extractSlotContent(slot: HTMLSlotElement): string {
  const nodes = slot.assignedNodes({ flatten: true });
  const textContent = nodes.map((node) => node.textContent || "").join("");

  return textContent.trim();
}

/**
 * Detects the programming language from code content.
 * Returns null if no confident match is found.
 */
export function detectLanguage(code: string): string | null {
  if (!code || code.trim().length === 0) {
    return null;
  }

  try {
    const result = detect(code);
    return result || null;
  } catch (error) {
    return null;
  }
}
