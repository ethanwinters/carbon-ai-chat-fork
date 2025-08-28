/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { forwardRef, Ref, useEffect } from "react";

import { HasServiceManager } from "../hocs/withServiceManager";
import actions from "../store/actions";
import { selectIsInputToHumanAgent } from "../store/selectors";
import { FileUpload } from "../../../types/state/AppState";
import HasLanguagePack from "../../../types/utilities/HasLanguagePack";
import { BusEventType } from "../../../types/events/eventBusTypes";
import { OverlayPanelName } from "../components/OverlayPanel";
import { Input, InputFunctions as InternalInputFunctions } from "../components/input/Input";
import { InputProps as ExternalInputProps, InputFunctions } from "../../../types/external/input";

/**
 * Container props that include service manager and language pack integration.
 */
interface InputContainerProps extends HasServiceManager, HasLanguagePack {
  /**
   * Indicates if the input field should be disabled (the user cannot type anything). This will also hide any value
   * that may already be set in the field.
   */
  disableInput: boolean;

  /**
   * Indicates if the input field should be hidden or visible.
   */
  isInputVisible: boolean;

  /**
   * Indicates if the sending a message should be disabled. This will disable the send button as well as the send on
   * enter listener of the input field.
   */
  disableSend: boolean;

  /**
   * The callback to call when the user enters some text into the field, and it needs to be sent. This occurs if the
   * user presses the enter key or clicks the send button.
   *
   * @param text The text that was entered into the input field that should be sent.
   */
  onSendInput: (text: string) => void;

  /**
   * Indicates if the text area should blur when the text is sent.
   */
  blurOnSend?: boolean;

  /**
   * An optional placeholder to display in the field. If this is not set, then a default value will be used.
   */
  placeholder?: string;

  /**
   * A callback to use to indicate when the user is typing. The user is considered as stopping typing when no input
   * changes have been made for 5 seconds.
   *
   * @param isTyping If true, indicates that the user has started typing. If false, indicates that the user has
   * stopped typing.
   */
  onUserTyping?: (isTyping: boolean) => void;

  /**
   * Indicates if a button should be displayed that would allow a user to select a file to upload.
   */
  showUploadButton?: boolean;

  /**
   * Indicates if the file upload button should be disabled.
   */
  disableUploadButton?: boolean;

  /**
   * The filter to apply to choosing files for upload.
   */
  allowedFileUploadTypes?: string;

  /**
   * Indicates if the user should be allowed to choose multiple files to upload.
   */
  allowMultipleFileUploads?: boolean;

  /**
   * A list of pending file uploads to display in the input area.
   */
  pendingUploads?: FileUpload[];

  /**
   * The callback that is called when the user selects one or more files to be uploaded.
   */
  onFilesSelectedForUpload?: (files: FileUpload[]) => void;

  /**
   * Determines if the "stop streaming" button should be visible. This also indicates that a streamed response can be
   * cancelled.
   */
  isStopStreamingButtonVisible?: boolean;

  /**
   * Determines if the "stop streaming" button should be disabled. The button can be visible and disabled to show that
   * the process of cancelling a streamed response is in progress.
   */
  isStopStreamingButtonDisabled?: boolean;

  /**
   * Testing id used for e2e tests.
   */
  testIdPrefix: OverlayPanelName;
}

/**
 * Input container that handles integration with service manager, external components, and language packs.
 * This component decides whether to render internal or external input components.
 */
function InputContainer(props: InputContainerProps, ref: Ref<InputFunctions>) {
  const {
    serviceManager,
    languagePack,
    onSendInput,
    onUserTyping,
    onFilesSelectedForUpload,
    ...inputProps
  } = props;

  // Check if an external input component is registered
  const hasExternalInput = serviceManager.externalComponents?.hasExternalInput?.() || false;

  // Create external input props for both internal and external components
  const externalInputProps: ExternalInputProps = {
    ...inputProps,
    onSendInput,
    onUserTyping,
    onFilesSelectedForUpload,
    // Provide specific function instead of full serviceManager
    onStopStreaming: () => {
      const { store } = serviceManager;
      store.dispatch(actions.setStopStreamingButtonDisabled(true));
      serviceManager.fire({ type: BusEventType.STOP_STREAMING });
    },
    // Provide specific strings as flat props (following Carbon Design System pattern)
    inputPlaceholder: languagePack.input_placeholder,
    inputAriaLabel: languagePack.input_ariaLabel,
    sendButtonLabel: languagePack.input_buttonLabel,
    uploadButtonLabel: languagePack.input_uploadButtonLabel,
    stopStreamingLabel: languagePack.input_stopResponse,
    removeFileButtonLabel: languagePack.fileSharing_removeButtonTitle,
  };

  // Update external component with current props when they change
  useEffect(() => {
    if (hasExternalInput && serviceManager.externalComponents?.updateExternalInputProps) {
      serviceManager.externalComponents.updateExternalInputProps(externalInputProps);
    }
  }, [
    hasExternalInput,
    serviceManager,
    externalInputProps,
  ]);

  // If external input is registered, render nothing - the external component handles everything
  if (hasExternalInput) {
    return null;
  }

  // Render internal input component with converted props
  return (
    <Input
      ref={ref as Ref<InternalInputFunctions>}
      {...externalInputProps}
      serviceManager={serviceManager}
      languagePack={languagePack}
    />
  );
}

const InputContainerExport = React.memo(forwardRef(InputContainer));
export { InputContainerExport as InputContainer, InputFunctions };