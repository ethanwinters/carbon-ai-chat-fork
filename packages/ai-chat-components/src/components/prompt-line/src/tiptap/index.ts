/**
 * @license
 *
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Public barrel for the prompt-line's Tiptap layer — exactly the names
 * [../../index.ts] re-exports, so everything here is importable as
 * `import { carbonMention, ... } from "@carbon/ai-chat-components"`.
 * Internal modules deep-import their siblings instead of going through this
 * barrel.
 */

export { carbonMention, carbonCommand } from './carbon-mention.js';
export { carbonAutocomplete } from './carbon-autocomplete.js';
export { carbonStarterTrigger } from './carbon-starter-trigger.js';
export { carbonChatEnter } from './chat-enter.js';
export { dispatchTriggerChange } from './trigger-utils.js';
export { setHostOriginMeta, isHostOrigin } from './origin-meta.js';
export {
  buildCarbonExtensions,
  type BuildCarbonExtensionsConfig,
} from './build-extensions.js';
export {
  removeNodesByType,
  mapNodes,
  findNodesByType,
  getRawText,
  textToDoc,
  projectRawValue,
} from './json-utils.js';

export type {
  BaseSuggestionConfig,
  TriggerSuggestionConfig,
  AutocompleteConfig,
  StartersConfig,
  SuggestionItem,
  CustomListProps,
  TriggerChangeEventDetail,
} from './types.js';

export { renderTokenChip } from './render-token-chip.js';
export type {
  RenderTokenChipArgs,
  TokenChipAttrs,
} from './render-token-chip.js';
export {
  renderInLightDom,
  LIGHT_DOM_PORTAL_EVENT,
} from './render-in-light-dom.js';
export type {
  RenderInLightDomArgs,
  RenderInLightDomResult,
  LightDomPortalEventDetail,
} from './render-in-light-dom.js';
