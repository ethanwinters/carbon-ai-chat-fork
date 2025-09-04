/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * Valid public CSS variables that can be controlled when white labeling is disabled.
 * These variables map to CSS custom properties used in styling the AI chat interface.
 *
 * Keys map to the underlying `--cds-chat-…` custom properties.
 *
 * @category Config
 */
export enum LayoutCSSVariables {
  /** Minimum height of the chat container (float layout). */
  BASE_HEIGHT = "BASE-height",
  /** Maximum height of the chat container (float layout). */
  BASE_MAX_HEIGHT = "BASE-max-height",
  /** Width of the chat panel (float layout). */
  BASE_WIDTH = "BASE-width",
  /** z-index of the chat overlay or container (float layout). */
  BASE_Z_INDEX = "BASE-z-index",
}
