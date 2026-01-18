/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { RefObject, useCallback } from "react";
import { useSelector } from "../../hooks/useSelector";

import { AppState } from "../../../types/state/AppState";
import { InputFunctions } from "../input/Input";
import { HomeScreen } from "./HomeScreen";
import { HomeScreenStarterButton } from "../../../types/config/HomeScreenConfig";
import { SingleOption } from "../../../types/messaging/Messages";
import { SendOptions } from "../../../types/instance/ChatInstance";
import { THREAD_ID_MAIN } from "../../utils/messageUtils";

interface HomeScreenContainerProps {
  onClose: () => void;

  /**
   * Handling sending information from the text input.
   */
  onSendBotInput: (text: string, options?: SendOptions) => void;

  /**
   * Handling sending information from the home screen conversation starter buttons.
   */
  onSendButtonInput: (input: SingleOption, threadID: string) => void;

  /**
   * Method to call when restart button is pressed.
   */
  onRestart: () => void;

  /**
   * The callback that can be called to toggle between the home screen and the bot view.
   */
  onToggleHomeScreen: () => void;

  /**
   * A React ref to the bot {@link Disclaimer} component.
   */
  homeScreenInputRef: RefObject<InputFunctions | null>;

  /**
   * The callback that can be called when this component wants the Carbon AI Chat to regain focus after a homescreen overflow
   * menu item is clicked.
   */
  requestFocus?: () => void;
}

/**
 * This home screen container renders the home screen content.
 * Note: Animation and visibility are now handled by CdsAiChatPanel wrapper.
 */
function HomeScreenContainer({
  onClose,
  onSendBotInput,
  onSendButtonInput,
  onRestart,
  homeScreenInputRef,
  onToggleHomeScreen,
}: HomeScreenContainerProps) {
  const homescreen = useSelector(
    (state: AppState) => state.config.public.homescreen,
  );

  const inputConfig = useSelector(
    (state: AppState) => state.config.public.input,
  );

  const handleSendInput = useCallback(
    (text: string) => {
      onSendBotInput(text);
    },
    [onSendBotInput],
  );

  const handlerStarterClick = useCallback(
    (starter: HomeScreenStarterButton) => {
      onSendButtonInput(
        {
          label: starter.label,
          value: {
            input: {
              text: starter.label,
            },
          },
        },
        THREAD_ID_MAIN,
      );
    },
    [onSendButtonInput],
  );

  return (
    <HomeScreen
      isHydrated={true}
      homeScreenMessageInputRef={homeScreenInputRef}
      homescreen={homescreen}
      onSendInput={handleSendInput}
      onStarterClick={handlerStarterClick}
      onClose={onClose}
      onRestart={onRestart}
      onToggleHomeScreen={onToggleHomeScreen}
      inputConfig={inputConfig}
    />
  );
}

export { HomeScreenContainer };

export default HomeScreenContainer;
