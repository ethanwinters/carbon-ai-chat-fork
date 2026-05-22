/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { type ReactNode } from "react";
import { type ChatInstance, WriteableElements } from "../instance/ChatInstance";
import { GenericItem, Message, MessageResponse } from "../messaging/Messages";
import { PublicConfig } from "../config/PublicConfig";
import { DeepPartial } from "../utilities/DeepPartial";
import {
  BusEventViewChange,
  BusEventViewPreChange,
} from "../events/eventBusTypes";

/**
 * The user_defined message object passed into the renderUserDefinedResponse property on the main chat components.
 *
 * @category React
 */
interface RenderUserDefinedState {
  /**
   * The entire message object received when the entire message (not just the individual messageItem) has finished processing.
   */
  fullMessage?: Message;

  /**
   * The messageItem after all partial chunks are received. This will first be set to the value of the `complete_item`
   * chunk.
   * Once the fullMessage is resolved, this value will update to the value of the item in the fullMessage, which will
   * be the same value unless you have done any post-processing mutations.
   */
  messageItem?: GenericItem;

  /**
   * An array of each user defined item partial chunk. Each chunk contains the new chunk information, they are not
   * concatenated for you. When messageItem has been set an no more chunks are expected, this property is removed
   * to avoid memory leaks.
   */
  partialItems?: DeepPartial<GenericItem>[];
}

/**
 * The type of the render function that is used to render a custom footer. This function should return a
 * component that renders the custom message footer.
 *
 * @param slotName The unique identifier for this footer slot.
 * @param message The assistant response object that contains the messageItem.
 * @param messageItem The message item that is being rendered.
 * @param instance The current instance of the Carbon AI Chat.
 * @param additionalData Any additional data that was passed to the render function.
 *
 * @category React
 */
type RenderCustomMessageFooter = (
  slotName: string,
  message: MessageResponse,
  messageItem: GenericItem,
  instance: ChatInstance,
  additionalData?: Record<string, unknown>,
) => ReactNode | null;

/**
 * The type of the render function that is used to render user defined responses. This function should return a
 * component that renders the display for the message contained in the given event.
 *
 * @param state The BusEventUserDefinedResponse that was originally fired by Carbon AI Chat when the user defined response
 * was first fired.
 * @param instance The current instance of the Carbon AI Chat.
 *
 * @category React
 */
type RenderUserDefinedResponse = (
  state: RenderUserDefinedState,
  instance: ChatInstance,
) => ReactNode;

/**
 * The type of the render function used to render user defined responses in web components.
 * This function should return an HTMLElement to display for the given user defined state,
 * or null to render nothing.
 *
 * The callback is invoked on every state update (new chunk, complete item, full message).
 * If you return the same element reference, the DOM is not disturbed. If you return a
 * new element, the previous content is replaced.
 *
 * @param state The accumulated state for this user defined response slot.
 * @param instance The current instance of Carbon AI Chat.
 *
 * @category Web component
 */
type WCRenderUserDefinedResponse = (
  state: RenderUserDefinedState,
  instance: ChatInstance,
) => HTMLElement | null;

/**
 * The accumulated state for one custom message footer slot, passed to the
 * web component {@link WCRenderCustomMessageFooter} callback.
 *
 * @category Web component
 */
interface RenderCustomMessageFooterState {
  /** The unique identifier for this footer slot. */
  slotName: string;

  /** The assistant response object that contains the messageItem. */
  message: MessageResponse;

  /** The message item that the footer is attached to. */
  messageItem: GenericItem;

  /** Optional application data supplied with the footer slot. */
  additionalData?: Record<string, unknown>;
}

/**
 * The render function used to render a custom message footer in web
 * components. When provided, the library manages all event listening, slot
 * tracking, and element lifecycle. The callback receives the accumulated state
 * and should return an HTMLElement to display, or null to render nothing.
 *
 * This is the web component analogue of {@link RenderCustomMessageFooter} and
 * mirrors the contract of {@link WCRenderUserDefinedResponse}.
 *
 * @param state The accumulated state for this custom footer slot.
 * @param instance The current instance of Carbon AI Chat.
 *
 * @category Web component
 */
type WCRenderCustomMessageFooter = (
  state: RenderCustomMessageFooterState,
  instance: ChatInstance,
) => HTMLElement | null;

/**
 * A map of writeable element keys to a ReactNode to render to them.
 *
 * @category React
 */
type RenderWriteableElementResponse = {
  [K in keyof WriteableElements]?: ReactNode;
};

/**
 * Properties for the ChatContainer React component. This interface extends
 * {@link PublicConfig} with additional component-specific props, flattening all
 * config properties as top-level props for better TypeScript IntelliSense.
 *
 * Any additional DOM attributes passed to the component (for example
 * `className`, `id`, `style`, or `aria-*`) are forwarded to the underlying
 * host element.
 *
 * @category React
 */
interface ChatContainerProps extends PublicConfig {
  /**
   * This function is called before the render function of Carbon AI Chat is called. This function can return a Promise
   * which will cause Carbon AI Chat to wait for it before rendering.
   */
  onBeforeRender?: (instance: ChatInstance) => Promise<void> | void;

  /**
   * This function is called after the render function of Carbon AI Chat is called. This function can return a Promise
   * which will cause Carbon AI Chat to wait for it before rendering.
   */
  onAfterRender?: (instance: ChatInstance) => Promise<void> | void;

  /**
   * Called before a view change (the chat opening or closing). Async — return a
   * Promise to defer the view change until it resolves.
   *
   * This is an opt-in observation hook. Unlike {@link ChatCustomElementProps},
   * the container has no wrapping element to size, so no default visibility
   * behavior runs when this prop is omitted.
   */
  onViewPreChange?: (
    event: BusEventViewPreChange,
    instance: ChatInstance,
  ) => Promise<void> | void;

  /**
   * Called when a view change (the chat opening or closing) is complete.
   *
   * This is an opt-in observation hook. Unlike {@link ChatCustomElementProps},
   * the container has no wrapping element to size, so no default visibility
   * behavior runs when this prop is omitted.
   */
  onViewChange?: (event: BusEventViewChange, instance: ChatInstance) => void;

  /**
   * This is the function that this component will call when a custom footer should be rendered.
   */
  renderCustomMessageFooter?: RenderCustomMessageFooter;

  /**
   * This is the function that this component will call when a user defined response should be rendered.
   */
  renderUserDefinedResponse?: RenderUserDefinedResponse;

  /**
   * This is the render function this component will call when it needs to render a writeable element.
   */
  renderWriteableElements?: RenderWriteableElementResponse;

  /**
   * @internal
   * The optional HTML element to write the chat into.
   */
  element?: HTMLElement;
}

export {
  ChatContainerProps,
  RenderCustomMessageFooter,
  RenderCustomMessageFooterState,
  RenderUserDefinedResponse,
  RenderWriteableElementResponse,
  RenderUserDefinedState,
  WCRenderCustomMessageFooter,
  WCRenderUserDefinedResponse,
};
