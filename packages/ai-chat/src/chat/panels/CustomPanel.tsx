/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { useEffect } from "react";
import cx from "classnames";
import { useSelector } from "../hooks/useSelector";

import { useAriaAnnouncer } from "../hooks/useAriaAnnouncer";
import { useLanguagePack } from "../hooks/useLanguagePack";
import { usePrevious } from "../hooks/usePrevious";
import { AppState } from "../../types/state/AppState";
import WriteableElement from "../components-legacy/WriteableElement";

/**
 * This component is a custom panel that renders external content similar to custom response types.
 */
function CustomPanel() {
  const languagePack = useLanguagePack();
  const { isOpen, options } = useSelector(
    (state: AppState) => state.customPanelState,
  );
  const { title, hidePanelHeader, onClickBack } = options;
  const ariaAnnouncer = useAriaAnnouncer();
  const prevIsOpen = usePrevious(isOpen);
  const hasCustomTitle = title !== undefined && title !== null;
  const enableChatHeaderConfig = !hasCustomTitle;
  const shouldShowBackButton = !options.hideBackButton;
  const panelClassName = cx("cds-aichat--custom-panel", {
    "cds-aichat--custom-panel--no-back-button": !shouldShowBackButton,
  });

  useEffect(() => {
    if (prevIsOpen !== isOpen && isOpen) {
      // Announce the title if it's visible.
      if (!hidePanelHeader && title) {
        ariaAnnouncer(title);
      }
    }
  }, [ariaAnnouncer, hidePanelHeader, isOpen, prevIsOpen, title]);

  return (
    <div
      className={panelClassName}
      data-enable-chat-header-config={enableChatHeaderConfig}
      data-hide-panel-header={hidePanelHeader}
      data-title={title ?? undefined}
      data-announce-label={languagePack.general_returnToAssistant}
      data-has-back-button={shouldShowBackButton}
      data-on-click-back={Boolean(onClickBack)}
    >
      <WriteableElement
        slotName="customPanelElement"
        className="cds-aichat--custom-panel__content-container"
      />
    </div>
  );
}

const CustomPanelExport = React.memo(CustomPanel);

export { CustomPanelExport as CustomPanel };
