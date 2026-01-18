/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { useCallback } from "react";

import { HomeScreen } from "../components-legacy/homeScreen/HomeScreen";
import { useSelector } from "../hooks/useSelector";
import { THREAD_ID_MAIN } from "../utils/messageUtils";
import type { SingleOption } from "../../types/messaging/Messages";
import type { HomeScreenStarterButton } from "../../types/config/HomeScreenConfig";
import type { SendOptions } from "../../types/instance/ChatInstance";
import type { AppState } from "../../types/state/AppState";
import type { InputFunctions } from "../components-legacy/input/Input";

interface HomeScreenPanelProps {
  onClose: () => void;
  onSendBotInput: (text: string, options?: SendOptions) => void;
  onSendButtonInput: (input: SingleOption, threadID: string) => void;
  onRestart: () => void;
  homeScreenInputRef: React.RefObject<InputFunctions | null>;
  onToggleHomeScreen: () => void;
}

const HomeScreenPanel: React.FC<HomeScreenPanelProps> = ({
  onClose,
  onSendBotInput,
  onSendButtonInput,
  onRestart,
  homeScreenInputRef,
  onToggleHomeScreen,
}) => {
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

  const handleStarterClick = useCallback(
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
      onStarterClick={handleStarterClick}
      onClose={onClose}
      onRestart={onRestart}
      onToggleHomeScreen={onToggleHomeScreen}
      inputConfig={inputConfig}
    />
  );
};

export default HomeScreenPanel;
