/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React from "react";
import Restart16 from "@carbon/icons/es/restart/16.js";
import cx from "classnames";
import { useIntl } from "react-intl";

import ChatButton, {
  CHAT_BUTTON_KIND,
  CHAT_BUTTON_SIZE,
} from "../components/carbon/ChatButton";
import { ErrorMessageDark } from "../components-legacy/ErrorMessageDark";
import { ErrorMessageLight } from "../components-legacy/ErrorMessageLight";
import RichText from "../components-legacy/responseTypes/util/RichText";
import { useSelector } from "../hooks/useSelector";
import { carbonIconToReact } from "../utils/carbonIcon";
import type { AppState } from "../../types/state/AppState";
import { CarbonTheme, LanguagePack } from "../../types/config/PublicConfig";

interface CatastrophicErrorPanelProps {
  assistantName: string;
  languagePack: LanguagePack;
  onRestart: () => void;
}

const CatastrophicErrorPanel: React.FC<CatastrophicErrorPanelProps> = ({
  assistantName,
  languagePack,
  onRestart,
}) => {
  const intl = useIntl();
  const carbonTheme = useSelector(
    (state: AppState) =>
      state.config.derived.themeWithDefaults.derivedCarbonTheme,
  );
  const isDarkTheme =
    carbonTheme === CarbonTheme.G90 || carbonTheme === CarbonTheme.G100;

  const errorKey: keyof LanguagePack = "errors_communicating";
  const errorBodyText = intl.formatMessage({ id: errorKey }, { assistantName });
  const Restart = carbonIconToReact(Restart16);

  return (
    <div
      className={cx(
        "cds-aichat--catastrophic-error",
        "cds-aichat--panel-content",
      )}
    >
      <div className="cds-aichat--catastrophic-error__error-text-container">
        {isDarkTheme && <ErrorMessageDark />}
        {!isDarkTheme && <ErrorMessageLight />}
        <div className="cds-aichat--catastrophic-error__error-heading">
          {languagePack.errors_somethingWrong}
        </div>
        <div className="cds-aichat--catastrophic-error__error-body">
          <RichText text={errorBodyText} highlight={true} />
        </div>
        {onRestart && (
          <ChatButton
            className="cds-aichat--catastrophic-error__restart-button"
            kind={CHAT_BUTTON_KIND.TERTIARY}
            size={CHAT_BUTTON_SIZE.SMALL}
            aria-label={languagePack.buttons_restart}
            onClick={onRestart}
          >
            <Restart slot="icon" />
            {languagePack.buttons_retry}
          </ChatButton>
        )}
      </div>
    </div>
  );
};

export default CatastrophicErrorPanel;
