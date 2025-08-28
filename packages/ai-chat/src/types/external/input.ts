/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { InstanceInputElement } from "../instance/ChatInstance";
import { OverlayPanelName } from "../../chat/shared/components/OverlayPanel";

/**
 * Props interface that external input components will receive.
 * This matches the InputProps interface from the Input component exactly.
 *
 * @internal
 * @experimental
 */
export interface InputProps {
  disableInput: boolean;
  isInputVisible: boolean;
  disableSend: boolean;
  onSendInput: (text: string) => void;
  blurOnSend?: boolean;
  placeholder?: string;
  onUserTyping?: (isTyping: boolean) => void;
  showUploadButton?: boolean;
  disableUploadButton?: boolean;
  allowedFileUploadTypes?: string;
  allowMultipleFileUploads?: boolean;
  pendingUploads?: any[];
  onFilesSelectedForUpload?: (files: any[]) => void;
  isStopStreamingButtonVisible?: boolean;
  isStopStreamingButtonDisabled?: boolean;
  testIdPrefix: OverlayPanelName;
  onStopStreaming: () => void;
  inputPlaceholder: string;
  inputAriaLabel: string;
  sendButtonLabel: string;
  uploadButtonLabel: string;
  stopStreamingLabel: string;
  removeFileButtonLabel: string;
}

/**
 * Render prop function for external input component.
 *
 * @internal
 * @experimental
 */
export type InputRenderProp = (props: InputProps) => React.ReactElement | HTMLElement;

/**
 * External components system for replacing internal components with external ones.
 *
 * @internal
 * @experimental
 */
export interface ExternalComponents {
  /**
   * Register an external input render function (used internally by React render props and web component slots).
   * The external input will be rendered in the light DOM and receive all InputProps.
   */
  registerInput: (renderFn: InputRenderProp, container?: HTMLElement) => void;
  
  /**
   * Unregister the external input component and revert to default.
   */
  unregisterInput: () => void;
  
  /**
   * Check if an external input is currently registered.
   */
  hasExternalInput: () => boolean;
  
  /**
   * Get reference to the external input component (for delegating InstanceInputElement methods).
   */
  getExternalInputRef: () => InstanceInputElement | null;
  
  /**
   * Update the props passed to the external input component.
   */
  updateExternalInputProps: (props: InputProps) => void;
}


/**
 * Interface that external input components must implement.
 * This matches the InputFunctions interface from the Input component.
 *
 * @internal
 * @experimental
 */
export interface InputFunctions {
  /**
   * Returns the {@link InstanceInputElement} object that controls access to the raw input.
   */
  getMessageInput: () => InstanceInputElement;

  /**
   * Instructs the input component to take focus.
   */
  takeFocus: () => void;
}