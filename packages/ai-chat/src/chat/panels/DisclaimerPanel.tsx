/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React from "react";
import type CDSButton from "@carbon/web-components/es/components/button/button.js";

import Button from "../components/carbon/Button";
import { ChatBubbleDark } from "../components-legacy/ChatBubbleDark";
import { ChatBubbleLight } from "../components-legacy/ChatBubbleLight";
import { useLanguagePack } from "../hooks/useLanguagePack";
import { useOnMount } from "../hooks/useOnMount";
import { useSelector } from "../hooks/useSelector";
import { PageObjectId } from "../../testing/PageObjectId";
import { AppState, ChatWidthBreakpoint } from "../../types/state/AppState";
import { CarbonTheme } from "../../types/config/PublicConfig";

interface DisclaimerPanelProps {
  disclaimerHTML?: string;
  disclaimerAcceptButtonRef: React.RefObject<CDSButton | null>;
  onAcceptDisclaimer: () => void;
}

const DisclaimerPanel: React.FC<DisclaimerPanelProps> = ({
  disclaimerHTML,
  disclaimerAcceptButtonRef,
  onAcceptDisclaimer,
}) => {
  const languagePack = useLanguagePack();
  const chatWidthBreakpoint = useSelector(
    (state: AppState) => state.chatWidthBreakpoint,
  );
  const { derivedCarbonTheme } = useSelector(
    (state: AppState) => state.config.derived.themeWithDefaults,
  );
  const isDarkTheme =
    derivedCarbonTheme === CarbonTheme.G90 ||
    derivedCarbonTheme === CarbonTheme.G100;

  const [hasReadDisclaimer, setHasReadDisclaimer] = React.useState(false);
  const disclaimerContent = React.useRef<HTMLDivElement | null>(null);

  const onScroll = () => {
    if (!disclaimerContent.current) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = disclaimerContent.current;
    const scrollBottom = clientHeight - scrollHeight + scrollTop;
    if (scrollBottom >= 0) {
      setHasReadDisclaimer(true);
    }
  };

  useOnMount(() => {
    onScroll();
  });

  return (
    <div className="cds-aichat--disclaimer-container">
      <div className="cds-aichat--disclaimer">
        <div
          className="cds-aichat--panel-content cds-aichat--disclaimer__content"
          onScroll={onScroll}
          ref={disclaimerContent}
        >
          <div className="cds-aichat--disclaimer__icon">
            {isDarkTheme ? <ChatBubbleDark /> : <ChatBubbleLight />}
          </div>
          <h1 className="cds-aichat--disclaimer__title">
            {languagePack.disclaimer_title}
          </h1>
          <div
            dangerouslySetInnerHTML={{ __html: disclaimerHTML }}
            className="cds-aichat--disclaimer__description"
          />
        </div>
        <div className="cds-aichat--disclaimer__buttons">
          <div className="cds-aichat--disclaimer__buttons-padding">
            <Button
              className="cds-aichat--disclaimer__accept-button"
              data-testid={PageObjectId.DISCLAIMER_ACCEPT_BUTTON}
              ref={disclaimerAcceptButtonRef}
              onClick={onAcceptDisclaimer}
              size={
                chatWidthBreakpoint === ChatWidthBreakpoint.WIDE ? "2xl" : "lg"
              }
              disabled={!hasReadDisclaimer}
            >
              {languagePack.disclaimer_accept}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPanel;
