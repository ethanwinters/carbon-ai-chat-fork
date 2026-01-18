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

import ChatPanel from "@carbon/ai-chat-components/es/react/panel.js";
import { PanelHeader } from "./components-legacy/PanelHeader";
import HydrationPanel from "./panels/HydrationPanel";
import { CustomPanel } from "./panels/CustomPanel";
import DisclaimerPanel from "./panels/DisclaimerPanel";
import HomeScreenPanel from "./panels/HomeScreenPanel";
import IFramePanel from "./panels/IFramePanel";
import ViewSourcePanel from "./panels/ViewSourcePanel";
import CatastrophicErrorPanel from "./panels/CatastrophicErrorPanel";
import { BodyMessageComponents } from "./components-legacy/responseTypes/util/BodyMessageComponents";
import { FooterButtonComponents } from "./components-legacy/responseTypes/util/FooterButtonComponents";
import { MessageTypeComponent } from "./components-legacy/MessageTypeComponent";
import actions from "./store/actions";
import { DEFAULT_CUSTOM_PANEL_CONFIG_OPTIONS } from "./store/reducerUtils";
import type { SingleOption } from "../types/messaging/Messages";
import type { ButtonItem, MessageResponse } from "../types/messaging/Messages";
import type { AppState } from "../types/state/AppState";
import type { HasRequestFocus } from "../types/utilities/HasRequestFocus";
import type { InputFunctions } from "./components-legacy/input/Input";
import type { MessageTypeComponentProps } from "../types/messaging/MessageTypeComponentProps";
import { HasServiceManager } from "./hocs/withServiceManager";
import HasLanguagePack from "../types/utilities/HasLanguagePack";
import { BusEventType, MessageSendSource } from "../types/events/eventBusTypes";
import { consoleError } from "./utils/miscUtils";

interface AppShellPanelsProps extends HasServiceManager, HasLanguagePack {
  headerDisplayName: string;
  useHomeScreenVersion: boolean;
  isHydratingComplete: boolean;
  shouldShowHydrationPanel: boolean;
  onPanelOpenStart: (isPanel: boolean) => void;
  onPanelOpenEnd: () => void;
  onPanelCloseStart: () => void;
  onPanelCloseEnd: (isPanel: boolean) => void;
  onHydrationPanelClose: () => void;
  onClose: () => void;
  onRestart: () => void;
  customPanelState: AppState["customPanelState"];
  customPanelRef: React.RefObject<HasRequestFocus | null>;
  publicConfig: AppState["config"]["public"];
  showDisclaimer: boolean;
  disclaimerRef: React.RefObject<CDSButton | null>;
  onAcceptDisclaimer: () => void;
  responsePanelState: AppState["responsePanelState"];
  responsePanelRef: React.RefObject<HasRequestFocus | null>;
  requestFocus: () => void;
  showHomeScreen: boolean;
  onSendInput: (text: string, source: MessageSendSource) => void;
  onSendHomeButtonInput: (input: SingleOption) => void;
  homeScreenInputRef: React.RefObject<InputFunctions | null>;
  onToggleHomeScreen: () => void;
  isHydrationAnimationComplete: boolean;
  iFramePanelState: AppState["iFramePanelState"];
  iframePanelRef: React.RefObject<HasRequestFocus | null>;
  viewSourcePanelState: AppState["viewSourcePanelState"];
  viewSourcePanelRef: React.RefObject<HasRequestFocus | null>;
  allMessagesByID: AppState["allMessagesByID"];
  inputState: AppState["assistantInputState"];
  config: AppState["config"];
  catastrophicErrorType: AppState["catastrophicErrorType"];
  assistantName: string;
}

/**
 * Renders all ChatPanel instances inside the `panels` slot of ChatShell.
 */
export function AppShellPanels({
  serviceManager,
  languagePack,
  headerDisplayName,
  useHomeScreenVersion,
  isHydratingComplete,
  shouldShowHydrationPanel,
  onPanelOpenStart,
  onPanelOpenEnd,
  onPanelCloseStart,
  onPanelCloseEnd,
  onHydrationPanelClose,
  onClose,
  onRestart,
  customPanelState,
  customPanelRef,
  publicConfig,
  showDisclaimer,
  disclaimerRef,
  onAcceptDisclaimer,
  responsePanelState,
  responsePanelRef,
  requestFocus,
  showHomeScreen,
  onSendInput,
  onSendHomeButtonInput,
  homeScreenInputRef,
  onToggleHomeScreen,
  isHydrationAnimationComplete,
  iFramePanelState,
  iframePanelRef,
  viewSourcePanelState,
  viewSourcePanelRef,
  allMessagesByID,
  inputState,
  config,
  catastrophicErrorType,
  assistantName,
}: AppShellPanelsProps) {
  return (
    <div slot="panels">
      <ChatPanel
        open={Boolean(catastrophicErrorType)}
        priority={100}
        fullWidth={true}
        showChatHeader={false}
      >
        <div slot="header">
          <PanelHeader
            title={headerDisplayName}
            onClickClose={onClose}
            onClickRestart={onRestart}
            showBackButton={false}
            showRestartButton={true}
          />
        </div>
        <div slot="body">
          <CatastrophicErrorPanel
            assistantName={assistantName}
            languagePack={languagePack}
            onRestart={onRestart}
          />
        </div>
      </ChatPanel>
      <ChatPanel
        open={shouldShowHydrationPanel}
        priority={90}
        fullWidth={true}
        showChatHeader={true}
        animationOnOpen="fade-in"
        animationOnClose="fade-out"
        onOpenStart={() => onPanelOpenStart(false)}
        onOpenEnd={onPanelOpenEnd}
        onCloseStart={onPanelCloseStart}
        onCloseEnd={() => {
          onHydrationPanelClose();
          onPanelCloseEnd(false);
        }}
      >
        <div slot="header">
          <PanelHeader
            title={headerDisplayName}
            labelBackButton={languagePack.general_returnToAssistant}
            onClickBack={undefined}
            onClickClose={onClose}
            showBackButton={false}
            showRestartButton={false}
          />
        </div>
        <div slot="body">
          <HydrationPanel
            isHydrated={isHydratingComplete}
            useHomeScreenVersion={useHomeScreenVersion}
            languagePack={languagePack}
          />
        </div>
      </ChatPanel>

      <ChatPanel
        open={customPanelState.isOpen}
        priority={60}
        fullWidth={true}
        showChatHeader={true}
        animationOnOpen="slide-in-from-bottom"
        animationOnClose="slide-out-to-bottom"
        onOpenStart={() => {
          serviceManager.eventBus.fire(
            { type: BusEventType.CUSTOM_PANEL_PRE_OPEN },
            serviceManager.instance,
          );
          onPanelOpenStart(true);
        }}
        onOpenEnd={() => {
          serviceManager.eventBus.fire(
            { type: BusEventType.CUSTOM_PANEL_OPEN },
            serviceManager.instance,
          );
          onPanelOpenEnd();
        }}
        onCloseStart={() => {
          serviceManager.eventBus.fire(
            { type: BusEventType.CUSTOM_PANEL_PRE_CLOSE },
            serviceManager.instance,
          );
          onPanelCloseStart();
        }}
        onCloseEnd={() => {
          serviceManager.eventBus.fire(
            { type: BusEventType.CUSTOM_PANEL_CLOSE },
            serviceManager.instance,
          );
          serviceManager.store.dispatch(
            actions.setCustomPanelConfigOptions(
              DEFAULT_CUSTOM_PANEL_CONFIG_OPTIONS,
            ),
          );
          onPanelCloseEnd(true);
        }}
      >
        {!customPanelState.options.hidePanelHeader && (
          <div slot="header">
            <PanelHeader
              ref={customPanelRef}
              title={customPanelState.options.title}
              labelBackButton={languagePack.general_returnToAssistant}
              onClickBack={() => {
                serviceManager.store.dispatch(
                  actions.setCustomPanelOpen(false),
                );
                customPanelState.options.onClickBack?.();
              }}
              onClickClose={() => {
                const { disableDefaultCloseAction, onClickClose } =
                  customPanelState.options;
                if (!disableDefaultCloseAction) {
                  const { viewChanging } = serviceManager.store.getState();
                  if (viewChanging) {
                    const message =
                      "You are attempting to close Carbon AI Chat from a custom panel while Carbon AI Chat is currently running a view change event which is not permitted. Please use the disableDefaultCloseAction option to disable this behavior for the custom panel and then use onClickClose to resolve your Promise that is handling the event; that Promise will allow you to close Carbon AI Chat.";
                    consoleError(message);
                    throw new Error(message);
                  }
                  onClose();
                }
                onClickClose?.();
              }}
              showBackButton={!customPanelState.options.hideBackButton}
              hideCloseButton={customPanelState.options.hideCloseButton}
              enableChatHeaderConfig={
                customPanelState.options.title === undefined ||
                customPanelState.options.title === null
              }
              onClickRestart={onRestart}
            />
          </div>
        )}
        <div slot="body">
          <CustomPanel />
        </div>
      </ChatPanel>

      {publicConfig.disclaimer?.isOn && (
        <ChatPanel
          open={showDisclaimer}
          priority={80}
          fullWidth={true}
          showChatHeader={true}
          animationOnOpen="fade-in"
          animationOnClose="fade-out"
          onOpenStart={() => onPanelOpenStart(false)}
          onOpenEnd={onPanelOpenEnd}
          onCloseStart={onPanelCloseStart}
          onCloseEnd={() => onPanelCloseEnd(false)}
        >
          <div slot="header">
            <PanelHeader
              title={headerDisplayName}
              labelBackButton={languagePack.general_returnToAssistant}
              onClickClose={onClose}
              showBackButton={false}
              showRestartButton={false}
            />
          </div>
          <div slot="body">
            <DisclaimerPanel
              disclaimerHTML={publicConfig.disclaimer?.disclaimerHTML}
              disclaimerAcceptButtonRef={disclaimerRef}
              onAcceptDisclaimer={onAcceptDisclaimer}
            />
          </div>
        </ChatPanel>
      )}

      <ChatPanel
        open={responsePanelState.isOpen}
        priority={50}
        fullWidth={false}
        showChatHeader={true}
        animationOnOpen="slide-in-from-right"
        animationOnClose="slide-out-to-right"
        onOpenStart={() => onPanelOpenStart(true)}
        onOpenEnd={onPanelOpenEnd}
        onCloseStart={onPanelCloseStart}
        onCloseEnd={() => {
          onPanelCloseEnd(true);
          serviceManager.store.dispatch(
            actions.setResponsePanelContent(null, false),
          );
        }}
      >
        <div slot="header">
          <PanelHeader
            ref={responsePanelRef}
            title={
              (
                responsePanelState.localMessageItem?.item as
                  | ButtonItem
                  | undefined
              )?.panel?.title
            }
            labelBackButton={languagePack.general_returnToAssistant}
            onClickBack={() =>
              serviceManager.store.dispatch(
                actions.setResponsePanelIsOpen(false),
              )
            }
            onClickClose={onClose}
            showAiLabel={false}
            showRestartButton={false}
          />
        </div>
        {responsePanelState.localMessageItem &&
          (allMessagesByID[
            responsePanelState.localMessageItem?.fullMessageID
          ] as MessageResponse | undefined) && (
            <>
              <div slot="body">
                <BodyMessageComponents
                  message={responsePanelState.localMessageItem}
                  originalMessage={
                    allMessagesByID[
                      responsePanelState.localMessageItem?.fullMessageID
                    ] as MessageResponse
                  }
                  languagePack={languagePack}
                  requestInputFocus={requestFocus}
                  disableUserInputs={inputState.isReadonly}
                  config={config}
                  isMessageForInput={responsePanelState.isMessageForInput}
                  scrollElementIntoView={() => {
                    /* no-op; shell handles layout */
                  }}
                  serviceManager={serviceManager}
                  hideFeedback
                  showChainOfThought={false}
                  allowNewFeedback={false}
                  renderMessageComponent={(
                    childProps: MessageTypeComponentProps,
                  ) => <MessageTypeComponent {...childProps} />}
                />
              </div>
              <div slot="footer">
                <FooterButtonComponents
                  message={responsePanelState.localMessageItem}
                  originalMessage={
                    allMessagesByID[
                      responsePanelState.localMessageItem?.fullMessageID
                    ] as MessageResponse
                  }
                  languagePack={languagePack}
                  requestInputFocus={requestFocus}
                  disableUserInputs={inputState.isReadonly}
                  config={config}
                  isMessageForInput={responsePanelState.isMessageForInput}
                  scrollElementIntoView={() => {
                    /* no-op; shell handles layout */
                  }}
                  serviceManager={serviceManager}
                  hideFeedback
                  showChainOfThought={false}
                  allowNewFeedback={false}
                  renderMessageComponent={(
                    childProps: MessageTypeComponentProps,
                  ) => <MessageTypeComponent {...childProps} />}
                />
              </div>
            </>
          )}
      </ChatPanel>

      <ChatPanel
        open={showHomeScreen && isHydrationAnimationComplete}
        priority={70}
        fullWidth={true}
        showChatHeader={true}
        animationOnOpen="fade-in"
        animationOnClose="fade-out"
        onOpenStart={() => onPanelOpenStart(false)}
        onOpenEnd={onPanelOpenEnd}
        onCloseStart={onPanelCloseStart}
        onCloseEnd={() => onPanelCloseEnd(false)}
      >
        <div slot="body">
          <HomeScreenPanel
            onClose={onClose}
            onSendBotInput={(text: string) =>
              onSendInput(text, MessageSendSource.HOME_SCREEN_INPUT)
            }
            onSendButtonInput={onSendHomeButtonInput}
            onRestart={onRestart}
            homeScreenInputRef={homeScreenInputRef}
            onToggleHomeScreen={onToggleHomeScreen}
          />
        </div>
      </ChatPanel>

      <ChatPanel
        open={iFramePanelState.isOpen}
        priority={40}
        fullWidth={true}
        showChatHeader={true}
        animationOnOpen="slide-in-from-bottom"
        animationOnClose="slide-out-to-bottom"
        onOpenStart={() => onPanelOpenStart(true)}
        onOpenEnd={onPanelOpenEnd}
        onCloseStart={onPanelCloseStart}
        onCloseEnd={() => onPanelCloseEnd(true)}
      >
        <div slot="header">
          <PanelHeader
            ref={iframePanelRef}
            title={
              iFramePanelState.messageItem?.title ??
              iFramePanelState.messageItem?.source
            }
            labelBackButton={languagePack.iframe_ariaClosePanel}
            onClickBack={() =>
              serviceManager.store.dispatch(actions.closeIFramePanel())
            }
            onClickClose={onClose}
            showAiLabel={false}
            showRestartButton={false}
          />
        </div>
        <div slot="body">
          <IFramePanel messageItem={iFramePanelState.messageItem} />
        </div>
      </ChatPanel>

      <ChatPanel
        open={viewSourcePanelState.isOpen}
        priority={30}
        fullWidth={true}
        showChatHeader={true}
        animationOnOpen="slide-in-from-bottom"
        animationOnClose="slide-out-to-bottom"
        onOpenStart={() => onPanelOpenStart(true)}
        onOpenEnd={onPanelOpenEnd}
        onCloseStart={onPanelCloseStart}
        onCloseEnd={() => onPanelCloseEnd(true)}
      >
        <div slot="header">
          <PanelHeader
            ref={viewSourcePanelRef}
            title={viewSourcePanelState.citationItem?.title}
            labelBackButton={languagePack.general_ariaCloseInformationOverlay}
            onClickBack={() =>
              serviceManager.store.dispatch(
                actions.setViewSourcePanelIsOpen(false),
              )
            }
            onClickClose={onClose}
            showAiLabel={false}
            showRestartButton={false}
          />
        </div>
        <div slot="body">
          <ViewSourcePanel
            citationItem={viewSourcePanelState.citationItem}
            relatedSearchResult={viewSourcePanelState.relatedSearchResult}
          />
        </div>
      </ChatPanel>
    </div>
  );
}
