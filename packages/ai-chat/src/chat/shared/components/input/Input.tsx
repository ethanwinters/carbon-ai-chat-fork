/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import Attachment from "@carbon/icons-react/es/Attachment.js";
import Send from "@carbon/icons-react/es/Send.js";
import SendFilled from "@carbon/icons-react/es/SendFilled.js";
import { Button, FileUploaderItem } from "@carbon/react";
import cx from "classnames";
import React, {
  ChangeEvent,
  forwardRef,
  Ref,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";

import { StopStreamingButton } from "../../../react/components/stopStreamingButton/StopStreamingButton";
import { HasServiceManager } from "../../hocs/withServiceManager";
import { useCounter } from "../../hooks/useCounter";
import actions from "../../store/actions";
import { selectIsInputToHumanAgent } from "../../store/selectors";
import { FileUpload } from "../../../../types/state/AppState";
import HasLanguagePack from "../../../../types/utilities/HasLanguagePack";
import { IS_MOBILE } from "../../utils/browserUtils";
import { FileStatusValue } from "../../utils/constants";
import { uuid, UUIDType } from "../../utils/lang/uuid";
import { ListenerList } from "../../utils/ListenerList";
import { isValidForUpload } from "../../utils/miscUtils";
import { ContentEditableInput } from "../../../react/components/contentEditableInput/ContentEditableInput";
import { InstanceInputElement } from "../../../../types/instance/ChatInstance";
import { InputProps as ExternalInputProps } from "../../../../types/external/input";
import {
  ButtonKindEnum,
  ButtonSizeEnum,
} from "../../../../types/utilities/carbonTypes";
import { BusEventType } from "../../../../types/events/eventBusTypes";
import { OverlayPanelName } from "../OverlayPanel";
import { makeTestId, PageObjectId } from "../../utils/PageObjectId";

/**
 * The size of the gap between input changes before we indicate that the user has stopped typing.
 */
const STOP_TYPING_PERIOD = 5000;

/**
 * The maximum number of characters to all the user to enter into the input field. The number was chosen to match
 * the limit imposed by the API.
 */
const INPUT_MAX_CHARS = 2048;

/**
 * Props for the pure Input component. This extends ExternalInputProps and adds
 * serviceManager and languagePack for internal use.
 */
interface InputProps extends ExternalInputProps, HasServiceManager, HasLanguagePack {
  // ExternalInputProps already contains all the input-specific props
  // We just need serviceManager and languagePack for internal functionality
}

interface InputFunctions {
  /**
   * Returns the {@link InstanceInputElement} object that controls access to the raw input.
   */
  getMessageInput: () => InstanceInputElement;

  /**
   * Instructs the text area to take focus.
   */
  takeFocus: () => void;
}

function Input(props: InputProps, ref: Ref<InputFunctions>) {
  const {
    isInputVisible,
    placeholder,
    disableInput,
    disableSend,
    disableUploadButton,
    pendingUploads,
    allowedFileUploadTypes,
    allowMultipleFileUploads,
    showUploadButton,
    onFilesSelectedForUpload,
    onSendInput,
    blurOnSend,
    serviceManager,
    onUserTyping,
    languagePack,
    isStopStreamingButtonVisible,
    isStopStreamingButtonDisabled,
    testIdPrefix,
  } = props;

  const inputID = `${serviceManager.namespace.suffix}-${useCounter()}`;

  // Indicates if the text area currently has focus.
  const [textAreaHasFocus, setTextAreaHasFocus] = useState(false);

  // The current controlled value of the text area.
  const [inputValue, setInputValue] = useState("");

  // Indicates if handling of the enter key is enabled or not. If it's enabled, this component will call the
  // onSendInput prop when a press of the enter key is detected.
  const enterKeyEnabled = useRef(true);

  // Indicates the user is currently typing.
  const isTypingTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // A React ref to the ContentEditableInput component.
  const textAreaRef = useRef<any>();

  // A React ref to the file Input element.
  const fileInputRef = useRef<HTMLInputElement>();

  // An array of functions that will be called when the text value changes.
  const changeListeners = useRef<ListenerList<[string]>>(
    new ListenerList<[string]>(),
  );

  // The last text value that was sent to the change listeners.
  const lastValue = useRef("");

  // The reusable {@link InstanceInputElement} object that allows access and control over the input.
  const instanceInputElement = useRef(createInstanceInputElement());

  /**
   * This is called when we have detected that the user has stopped typing.
   */
  function doTypingStopped() {
    if (isTypingTimeout.current) {
      clearTimeout(isTypingTimeout.current);
      isTypingTimeout.current = null;
      onUserTyping?.(false);
    }
  }

  /**
   * This is a callback which is called on each keydown event that occurs on the text area. This is used to capture
   * the enter key, so we can send the entered text to the server.
   */
  function onKeyDown(event: CustomEvent) {
    // The Lit component passes keyboard event details in the custom event detail
    const keyboardDetails = event.detail;
    
    if (keyboardDetails.key === 'Enter') {
      if (disableSend || !enterKeyEnabled.current) {
        // If sending is disabled, stop the field from inserting a newline into the field.
        keyboardDetails.preventDefault();
      } else {
        // Call send function directly - we'll handle preventDefault there
        sendMessage();
      }
    }
  }

  function sendMessage() {
    if (doHasValidInput()) {
      doTypingStopped();

      const text = inputValue.trim();
      onSendInput(text);
      // Reset the value of the field.
      setInputValue("");
      if (blurOnSend) {
        textAreaRef.current.doBlur();
      } else {
        textAreaRef.current.takeFocus();
      }
    }
  }

  /**
   * This is a callback which is called when a change event occurs on the textarea inside this input.
   */
  function onChange(event: CustomEvent) {
    const inputText = event.detail.value;

    if (onUserTyping) {
      if (!isTypingTimeout.current) {
        onUserTyping(true);
      } else {
        clearTimeout(isTypingTimeout.current);
      }
      isTypingTimeout.current = setTimeout(doTypingStopped, STOP_TYPING_PERIOD);
    }

    setInputValue(inputText);
  }


  /**
   * Called when the input field gets focus.
   */
  function onInputFocus(_event: CustomEvent) {
    setTextAreaHasFocus(true);
  }

  /**
   * Called when the input field loses focus.
   */
  function onInputBlur(_event: CustomEvent) {
    setTextAreaHasFocus(false);
  }

  /**
   * Instructs this component to put focus into the input text area. This only applies to desktop devices.
   */
  function takeFocus() {
    if (!IS_MOBILE && isInputVisible) {
      textAreaRef.current.takeFocus();
    }
  }

  /**
   * Creates an instance of {@link InstanceInputElement}.
   */
  function createInstanceInputElement(): InstanceInputElement {
    return {
      getHTMLElement: () => textAreaRef?.current?.getHTMLElement(),
      setValue: (value: string) => setInputValue(value),
      setEnableEnterKey: (isEnabled: boolean) => {
        enterKeyEnabled.current = isEnabled;
      },
      addChangeListener: (listener: (value: string) => void) =>
        changeListeners.current.addListener(listener),
      removeChangeListener: (listener: (value: string) => void) =>
        changeListeners.current.removeListener(listener),
      // Extended methods for rich text editor support
      getTextContent: () => inputValue,
      getDisplayContent: () => inputValue,
      setDisplayContent: (content: string) => setInputValue(content),
      takeFocus: () => {
        if (!IS_MOBILE && isInputVisible) {
          textAreaRef.current?.takeFocus();
        }
      },
      doBlur: () => textAreaRef.current?.doBlur(),
    };
  }

  /**
   * The callback that is called when the user removes a file from the upload area.
   */
  function onRemoveFile(fileID: string) {
    const isInputToHumanAgent = selectIsInputToHumanAgent(
      serviceManager.store.getState(),
    );
    serviceManager.store.dispatch(
      actions.removeFileUpload(fileID, isInputToHumanAgent),
    );
    // After we remove the file, we need to move focus back to the input field.
    textAreaRef.current.takeFocus();
  }

  /**
   * The callback that is called when the user selects a file using the file input.
   */
  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const isInputToHumanAgent = selectIsInputToHumanAgent(
      serviceManager.store.getState(),
    );
    const { dispatch } = serviceManager.store;
    const { files } = event.target;
    const newFiles: FileUpload[] = [];
    for (let index = 0; index < files.length; index++) {
      const newFile: FileUpload = {
        id: uuid(UUIDType.FILE),
        status: FileStatusValue.EDIT,
        file: files[index],
      };
      newFiles.push(newFile);
      dispatch(actions.addInputFile(newFile, isInputToHumanAgent));
    }
    onFilesSelectedForUpload?.(newFiles);

    // Clear the file input. We're controlling the file list.
    fileInputRef.current.value = null;
  }

  /**
   * Determines if there is anything valid that the user could send.
   */
  function doHasValidInput() {
    const hasUploads = Boolean(pendingUploads?.length);
    if (hasUploads) {
      if (pendingUploads.find((upload) => !isValidForUpload(upload))) {
        // If there are any files that are in error, the user cannot send the message.
        return false;
      }
    }

    return Boolean(inputValue.trim()) || hasUploads;
  }

  // If the input field becomes disabled, we don't get a blur event so make sure to remove the focus indicator.
  if (textAreaHasFocus && disableInput) {
    setTextAreaHasFocus(false);
  }

  useImperativeHandle(ref, () => ({
    takeFocus,
    getMessageInput: () => instanceInputElement.current,
  }));

  const {
    sendButtonLabel,
    inputPlaceholder,
    inputAriaLabel,
    uploadButtonLabel,
    stopStreamingLabel,
    removeFileButtonLabel,
  } = props;
  const useInputValue = disableInput ? "" : inputValue;
  const hasValidInput = doHasValidInput();
  const showDisabledSend = !hasValidInput || disableInput || disableSend;
  const showUploadButtonDisabled = disableUploadButton || disableInput;
  const uploadButtonID = `WACInputContainer__UploadInput-${inputID}`;
  const isRTL = document.dir === "rtl";

  // If the input field is disabled, don't show a placeholder (unless one is provided).
  const usePlaceHolder =
    placeholder || (disableInput ? undefined : inputPlaceholder);

  if (lastValue.current !== inputValue) {
    lastValue.current = inputValue;
    changeListeners.current.fireListeners(inputValue);
  }

  return (
    isInputVisible && (
      <div className="WACInputAndCompletions">
        <div
          className={cx("WACInputContainer", {
            "WACInputContainer--hasFocus": textAreaHasFocus,
            "WACInputContainer--showUploadButton": showUploadButton,
          })}
        >
          <div className="WACInputContainer__LeftContainer">
            <div className="WACInputContainer__TextAndUpload">
              {showUploadButton && (
                <div className="WACInputContainer__UploadButtonContainer">
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <input
                    ref={fileInputRef}
                    accept={allowedFileUploadTypes}
                    id={uploadButtonID}
                    className="WACVisuallyHidden WACInputContainer__UploadInput"
                    type="file"
                    aria-label={uploadButtonLabel}
                    onChange={onFileChange}
                    multiple={allowMultipleFileUploads}
                    disabled={showUploadButtonDisabled}
                  />
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label
                    className={cx("WACInputContainer__UploadButton", {
                      "WACInputContainer__UploadButton--disabled":
                        showUploadButtonDisabled,
                    })}
                    htmlFor={uploadButtonID}
                  >
                    <Attachment />
                  </label>
                </div>
              )}
              <ContentEditableInput
                autoSize
                aria-label={inputAriaLabel}
                disabled={disableInput}
                maxLength={INPUT_MAX_CHARS}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={usePlaceHolder}
                value={useInputValue}
                ref={textAreaRef}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                testId={makeTestId(PageObjectId.INPUT, testIdPrefix)}
              />
            </div>
            {Boolean(pendingUploads?.length) && (
              <div className="WACInputContainer__FilesContainer">
                {pendingUploads.map((fileUpload, index) => {
                  return (
                    <FileUploaderItem
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      iconDescription={
                        removeFileButtonLabel
                      }
                      name={fileUpload.file.name}
                      status={FileStatusValue.EDIT}
                      errorSubject={fileUpload.errorMessage}
                      invalid={fileUpload.isError}
                      size={ButtonSizeEnum.SMALL}
                      onDelete={() => onRemoveFile(fileUpload.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="WACInputContainer__SendButtonContainer">
            {isStopStreamingButtonVisible && (
              <StopStreamingButton
                label={stopStreamingLabel}
                disabled={isStopStreamingButtonDisabled}
                tooltipAlignment="top"
                onClick={() => {
                  const { store } = serviceManager;
                  store.dispatch(actions.setStopStreamingButtonDisabled(true));
                  serviceManager.fire({ type: BusEventType.STOP_STREAMING });
                }}
              />
            )}
            <Button
              className="WACInputContainer__SendButton"
              kind={ButtonKindEnum.GHOST}
              size={ButtonSizeEnum.SMALL}
              type="button"
              onClick={sendMessage}
              aria-label={sendButtonLabel}
              disabled={showDisabledSend}
              renderIcon={hasValidInput ? SendFilled : Send}
              iconDescription={sendButtonLabel}
              tooltipAlignment={isRTL ? "start" : "end"}
              tooltipPosition="top"
              hasIconOnly
              data-testid={makeTestId(PageObjectId.INPUT_SEND, testIdPrefix)}
            />
          </div>
        </div>
      </div>
    )
  );
}

const InputExport = React.memo(forwardRef(Input));
export { InputExport as Input, InputFunctions };
