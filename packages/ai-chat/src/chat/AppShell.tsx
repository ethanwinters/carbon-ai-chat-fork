/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import cx from "classnames";
import CDSButton from "@carbon/web-components/es/components/button/button.js";
import { useIntl } from "react-intl";

import AppShellErrorBoundary from "./AppShellErrorBoundary";
// import AssistantChat, { ChatClass } from "./components-legacy/AssistantChat"; // Kept for reference until Phase 5
import { LauncherContainer } from "./components-legacy/launcher/LauncherContainer";
// import { HideComponent } from "./components-legacy/util/HideComponent"; // No longer needed with CdsAiChatShell
import VisuallyHidden from "./components-legacy/util/VisuallyHidden";
import { InputFunctions } from "./components-legacy/input/Input";
import Layer from "./components/carbon/Layer";
import ChatShell from "@carbon/ai-chat-components/es/react/chat-shell.js";
import { AssistantHeader } from "./components-legacy/header/AssistantHeader";
import MessagesComponent, {
  MessagesComponentClass,
} from "./components-legacy/MessagesComponent";
import { Input } from "./components-legacy/input/Input";
import { AppShellWriteableElements } from "./AppShellWriteableElements";
import { EndHumanAgentChatModal } from "./components-legacy/modals/EndHumanAgentChatModal";
import { RequestScreenShareModal } from "./components-legacy/modals/RequestScreenShareModal";
import WorkspaceContainer from "./components-legacy/WorkspaceContainer";
import { createUnmappingMemoizer } from "./utils/memoizerUtils";
import { LocalMessageItem } from "../types/messaging/LocalMessageItem";
import { FileUpload } from "../types/state/AppState";
import { AppShellPanels } from "./AppShellPanels";

import { HasServiceManager } from "./hocs/withServiceManager";
import { useMobileViewportLayout } from "./hooks/useMobileViewportLayout";
import { useOnMount } from "./hooks/useOnMount";
import { usePrevious } from "./hooks/usePrevious";
import { useSelector } from "./hooks/useSelector";
import { ModalPortalRootProvider } from "./providers/ModalPortalRootProvider";
import actions from "./store/actions";
import {
  selectHumanAgentDisplayState,
  selectInputState,
  selectIsInputToHumanAgent,
} from "./store/selectors";
import { consoleError, createDidCatchErrorData } from "./utils/miscUtils";
import {
  IS_MOBILE,
  IS_PHONE,
  IS_PHONE_IN_PORTRAIT_MODE,
  isBrowser,
} from "./utils/browserUtils";
import { CornersType } from "./utils/constants";
import { doFocusRef, SCROLLBAR_WIDTH } from "./utils/domUtils";
import { arrayLastValue } from "./utils/lang/arrayUtils";
import {
  createMessageRequestForChoice,
  createMessageRequestForText,
} from "./utils/messageUtils";
import {
  convertCSSVariablesToString,
  getThemeClassNames,
} from "./utils/styleUtils";

import {
  AppState,
  ChatWidthBreakpoint,
  ViewType,
} from "../types/state/AppState";
import {
  AutoScrollOptions,
  HasDoAutoScroll,
} from "../types/utilities/HasDoAutoScroll";
import { HasRequestFocus } from "../types/utilities/HasRequestFocus";
import {
  BusEventType,
  MainWindowCloseReason,
  MessageSendSource,
  ViewChangeReason,
} from "../types/events/eventBusTypes";
import { SendOptions } from "../types/instance/ChatInstance";
import { SingleOption } from "../types/messaging/Messages";
import { CarbonTheme } from "../types/config/PublicConfig";

import styles from "./AppShell.scss";
import { PageObjectId } from "../testing/PageObjectId";

const applicationStylesheet =
  typeof CSSStyleSheet !== "undefined" ? new CSSStyleSheet() : null;
const cssVariableOverrideStylesheet =
  typeof CSSStyleSheet !== "undefined" ? new CSSStyleSheet() : null;
const visualViewportStylesheet =
  typeof CSSStyleSheet !== "undefined" ? new CSSStyleSheet() : null;

const WIDTH_BREAKPOINT_STANDARD = "cds-aichat--standard-width";
const WIDTH_BREAKPOINT_NARROW = "cds-aichat--narrow-width";
const WIDTH_BREAKPOINT_WIDE = "cds-aichat--wide-width";

interface AppShellProps extends HasServiceManager {
  hostElement?: Element;
}

/**
 * These are the public imperative functions that are available on the MainWindow component. This interface is
 * declared here to avoid taking a dependency on a specific React component implementation elsewhere.
 */
export interface MainWindowFunctions extends HasRequestFocus, HasDoAutoScroll {
  /**
   * Scrolls to the (full) message with the given ID. Since there may be multiple message items in a given
   * message, this will scroll the first message to the top of the message window.
   *
   * @param messageID The (full) message ID to scroll to.
   * @param animate Whether or not the scroll should be animated. Defaults to true.
   */
  doScrollToMessage(messageID: string, animate?: boolean): void;

  /**
   * Returns the current scrollBottom value for the message scroll panel.
   */
  getMessagesScrollBottom(): number;
}

export default function AppShell({
  hostElement,
  serviceManager,
}: AppShellProps) {
  const intl = useIntl();
  const appState = useSelector<AppState, AppState>((state) => state);
  const {
    config,
    persistedToBrowserStorage,
    isHydrated,
    assistantMessageState,
    humanAgentState,
    workspacePanelState,
    allMessageItemsByID,
    allMessagesByID,
    catastrophicErrorType,
    iFramePanelState,
    viewSourcePanelState,
    customPanelState,
    responsePanelState,
    chatWidthBreakpoint,
  } = appState;

  const {
    derived: {
      themeWithDefaults: theme,
      layout,
      languagePack,
      launcher,
      cssVariableOverrides,
      header,
    },
    public: publicConfig,
  } = config;
  const namespaceName = serviceManager.namespace.originalName;
  const languageKey = namespaceName
    ? "window_ariaChatRegionNamespace"
    : "window_ariaChatRegion";
  const regionLabel = intl.formatMessage(
    { id: languageKey },
    { namespace: namespaceName },
  );
  const viewState = persistedToBrowserStorage.viewState;
  const showLauncher = launcher.isOn && viewState.launcher;
  const cssVariableOverrideString = useMemo(
    () => convertCSSVariablesToString(cssVariableOverrides),
    [cssVariableOverrides],
  );
  const useMobileEnhancements =
    IS_PHONE && !publicConfig.disableCustomElementMobileEnhancements;
  const { style: visualViewportStyles } = useMobileViewportLayout({
    enabled: useMobileEnhancements,
    isOpen: viewState.mainWindow,
    margin: 4,
  });
  const dir = isBrowser() ? document.dir || "auto" : "auto";
  const mainWindowRef = useRef<MainWindowFunctions | null>(null);
  const [modalPortalHostElement, setModalPortalHostElement] =
    useState<Element | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const animationContainerRef = useRef<HTMLDivElement | null>(null);
  // const botChatRef = useRef<ChatClass | null>(null); // No longer needed with CdsAiChatShell
  const homeScreenInputRef = useRef<InputFunctions | null>(null);
  const disclaimerRef = useRef<CDSButton | null>(null);
  const iframePanelRef = useRef<HasRequestFocus | null>(null);
  const viewSourcePanelRef = useRef<HasRequestFocus | null>(null);
  const customPanelRef = useRef<HasRequestFocus | null>(null);
  const responsePanelRef = useRef<HasRequestFocus | null>(null);
  // New refs for CdsAiChatShell slots
  const messagesRef = useRef<MessagesComponentClass | null>(null);
  const inputRef = useRef<InputFunctions | null>(null);
  const [open, setOpen] = useState(viewState.mainWindow);
  const [closing, setClosing] = useState(false);
  const [isHydrationAnimationComplete, setIsHydrationAnimationComplete] =
    useState(isHydrated);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(
    publicConfig.shouldTakeFocusIfOpensAutomatically,
  );
  // State for modals extracted from AssistantChat
  const [showEndChatConfirmation, setShowEndChatConfirmation] = useState(false);
  // Memoizer for messages array
  const messagesToArray = useMemo(
    () => createUnmappingMemoizer<LocalMessageItem>(),
    [],
  );
  const useCustomHostElement = Boolean(hostElement);
  const headerDisplayName = header?.name || publicConfig.assistantName;
  const hostname = isBrowser() ? window.location.hostname : "localhost";
  const showDisclaimer =
    publicConfig.disclaimer?.isOn &&
    !persistedToBrowserStorage.disclaimersAccepted[hostname];
  const showHomeScreen =
    publicConfig.homescreen?.isOn &&
    persistedToBrowserStorage.homeScreenState.isHomeScreenOpen &&
    !showDisclaimer;
  const inputState = selectInputState(appState);
  const agentDisplayState = selectHumanAgentDisplayState(appState);
  const prevIsHydrated = usePrevious(isHydrated);
  const prevViewState = usePrevious(viewState);
  const prevHasSentNonWelcomeMessage = usePrevious(
    persistedToBrowserStorage.hasSentNonWelcomeMessage,
  );
  const prevMessageIDs = usePrevious(assistantMessageState.localMessageIDs);
  const lastMessageItemID = arrayLastValue(
    assistantMessageState.localMessageIDs,
  );
  const prevLastMessageItemID = usePrevious(lastMessageItemID);

  useOnMount(() => {
    function requestFocusWrapper() {
      try {
        const { persistedToBrowserStorage: persisted } =
          serviceManager.store.getState();
        const { viewState: storeViewState } = persisted;
        if (storeViewState.mainWindow) {
          mainWindowRef.current?.requestFocus();
        }
      } catch (error) {
        consoleError("An error occurred in App.requestFocus", error);
      }
    }
    serviceManager.appWindow = { requestFocus: requestFocusWrapper };
  });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (hostElement) {
      containerRef.current.style.setProperty("height", "100%", "important");
      containerRef.current.style.setProperty("width", "100%", "important");
    }

    const rootNode = containerRef.current.getRootNode();
    const appStyles = styles;
    const cssVariableStyles = cssVariableOverrideString || "";
    const visualViewportCSS = Object.keys(visualViewportStyles || {}).length
      ? `.cds-aichat--container--render { ${Object.entries(
          visualViewportStyles || {},
        )
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")} }`
      : "";

    if (rootNode instanceof ShadowRoot) {
      if (
        applicationStylesheet &&
        "replaceSync" in applicationStylesheet &&
        cssVariableOverrideStylesheet &&
        visualViewportStylesheet
      ) {
        applicationStylesheet.replaceSync(appStyles);
        cssVariableOverrideStylesheet.replaceSync(cssVariableStyles);
        visualViewportStylesheet.replaceSync(visualViewportCSS);
        rootNode.adoptedStyleSheets = [
          applicationStylesheet,
          cssVariableOverrideStylesheet,
          visualViewportStylesheet,
        ];
      } else {
        if (!rootNode.querySelector("style[data-base-styles]")) {
          const baseStyles = document.createElement("style");
          baseStyles.dataset.appStyles = "true";
          baseStyles.textContent = appStyles;
          rootNode.appendChild(baseStyles);
        }
        if (!rootNode.querySelector("style[data-variables-custom]")) {
          const variableCustomStyles = document.createElement("style");
          variableCustomStyles.dataset.overrideStyles = "true";
          variableCustomStyles.textContent = cssVariableStyles;
          rootNode.appendChild(variableCustomStyles);
        }
        const viewportStyle = rootNode.querySelector(
          "style[data-visual-viewport-styles]",
        );
        if (viewportStyle) {
          viewportStyle.textContent = visualViewportCSS;
        } else {
          const visualViewportStyle = document.createElement("style");
          visualViewportStyle.dataset.visualViewportStyles = "true";
          visualViewportStyle.textContent = visualViewportCSS;
          rootNode.appendChild(visualViewportStyle);
        }
      }
    } else if (
      visualViewportStyles &&
      Object.keys(visualViewportStyles).length &&
      containerRef.current
    ) {
      const renderEl = containerRef.current.querySelector<HTMLElement>(
        ".cds-aichat--container--render",
      );
      if (renderEl) {
        Object.entries(visualViewportStyles).forEach(([key, value]) => {
          renderEl.style.setProperty(key, String(value));
        });
      }
    }
  }, [cssVariableOverrideString, hostElement, visualViewportStyles]);

  const handleBoundaryError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      serviceManager.actions.errorOccurred(
        createDidCatchErrorData("AppShell", error, errorInfo, true),
      );
    },
    [serviceManager],
  );

  const requestFocus = useCallback(() => {
    try {
      if (shouldAutoFocus && !IS_MOBILE) {
        if (showDisclaimer) {
          if (disclaimerRef.current) {
            doFocusRef(disclaimerRef);
          }
        } else if (showHomeScreen) {
          if (homeScreenInputRef.current) {
            homeScreenInputRef.current.takeFocus();
          }
        } else if (iFramePanelState.isOpen) {
          iframePanelRef.current?.requestFocus();
        } else if (viewSourcePanelState.isOpen) {
          viewSourcePanelRef.current?.requestFocus();
        } else if (customPanelState.isOpen) {
          customPanelRef.current?.requestFocus();
        } else if (responsePanelState.isOpen) {
          responsePanelRef.current?.requestFocus();
        } else if (inputRef.current) {
          // Updated: direct input ref instead of botChatRef
          inputRef.current.takeFocus();
        }
      }
    } catch (error) {
      consoleError("An error occurred in MainWindow.requestFocus", error);
    }
  }, [
    customPanelState.isOpen,
    iFramePanelState.isOpen,
    responsePanelState.isOpen,
    shouldAutoFocus,
    showDisclaimer,
    showHomeScreen,
    viewSourcePanelState.isOpen,
  ]);

  const removeChatFromDom = useCallback(() => {
    const widgetEl = widgetContainerRef.current;
    if (widgetEl) {
      widgetEl.removeEventListener("animationend", removeChatFromDom);
    }
    setOpen(false);
    setClosing(false);
  }, []);

  useEffect(() => {
    if (!prevIsHydrated && isHydrated) {
      setIsHydrationAnimationComplete(true);
      requestAnimationFrame(() => {
        requestFocus();
      });
    }
  }, [isHydrated, prevIsHydrated, requestFocus]);

  useEffect(() => {
    const previouslyOpen = prevViewState?.mainWindow ?? open;
    if (viewState.mainWindow && (!previouslyOpen || !open)) {
      setOpen(true);
      requestFocus();
    } else if (!viewState.mainWindow && previouslyOpen && open) {
      setClosing(true);
      if (useCustomHostElement) {
        removeChatFromDom();
      } else {
        widgetContainerRef.current?.addEventListener(
          "animationend",
          removeChatFromDom,
        );
        requestFocus();
      }
    }
  }, [
    open,
    prevViewState,
    removeChatFromDom,
    requestFocus,
    useCustomHostElement,
    viewState.mainWindow,
  ]);

  useEffect(() => {
    if (!publicConfig.shouldTakeFocusIfOpensAutomatically) {
      return;
    }
    const prevMessageCount =
      prevMessageIDs?.length ?? assistantMessageState.localMessageIDs.length;
    const currentMessageCount = assistantMessageState.localMessageIDs.length;
    const previouslySentNonWelcome =
      prevHasSentNonWelcomeMessage ??
      persistedToBrowserStorage.hasSentNonWelcomeMessage;

    if (
      !previouslySentNonWelcome &&
      persistedToBrowserStorage.hasSentNonWelcomeMessage &&
      !shouldAutoFocus
    ) {
      setShouldAutoFocus(true);
    } else if (prevMessageCount > currentMessageCount && shouldAutoFocus) {
      setShouldAutoFocus(false);
    } else if (prevMessageCount < currentMessageCount && !shouldAutoFocus) {
      setShouldAutoFocus(true);
    }
  }, [
    assistantMessageState.localMessageIDs,
    persistedToBrowserStorage.hasSentNonWelcomeMessage,
    prevHasSentNonWelcomeMessage,
    prevMessageIDs,
    publicConfig.shouldTakeFocusIfOpensAutomatically,
    shouldAutoFocus,
  ]);

  useEffect(() => {
    if (
      lastMessageItemID &&
      lastMessageItemID !== prevLastMessageItemID &&
      shouldAutoFocus
    ) {
      const lastMessageItem = allMessageItemsByID[lastMessageItemID];
      const lastMessage = allMessagesByID[lastMessageItem?.fullMessageID];
      if (!lastMessage?.ui_state_internal?.from_history) {
        requestFocus();
      }
    }
  }, [
    allMessageItemsByID,
    allMessagesByID,
    lastMessageItemID,
    prevLastMessageItemID,
    requestFocus,
    shouldAutoFocus,
  ]);

  const doAutoScroll = useCallback((options?: AutoScrollOptions) => {
    messagesRef.current?.doAutoScroll(options);
  }, []);

  const getMessagesScrollBottom = useCallback(() => {
    return messagesRef.current?.getContainerScrollBottom() ?? 0;
  }, []);

  const doScrollToMessage = useCallback((messageID: string, animate = true) => {
    messagesRef.current?.doScrollToMessage(messageID, animate);
  }, []);

  const mainWindowFunctions = useMemo<MainWindowFunctions>(
    () => ({
      requestFocus,
      doAutoScroll,
      doScrollToMessage,
      getMessagesScrollBottom,
    }),
    [doAutoScroll, doScrollToMessage, getMessagesScrollBottom, requestFocus],
  );

  useEffect(() => {
    mainWindowRef.current = mainWindowFunctions;
    serviceManager.mainWindow = mainWindowFunctions;
  }, [mainWindowFunctions, serviceManager]);

  const handleResize = useCallback(() => {
    const container = widgetContainerRef.current;
    if (!container) {
      return;
    }

    const height = container.offsetHeight;
    const width = container.offsetWidth;
    let appChatWidthBreakpoint: ChatWidthBreakpoint;
    if (width >= 672 + 16 + 16) {
      appChatWidthBreakpoint = ChatWidthBreakpoint.WIDE;
    } else if (width >= 360) {
      appChatWidthBreakpoint = ChatWidthBreakpoint.STANDARD;
    } else {
      appChatWidthBreakpoint = ChatWidthBreakpoint.NARROW;
    }

    serviceManager.store.dispatch(actions.setAppStateValue("chatWidth", width));
    serviceManager.store.dispatch(
      actions.setAppStateValue("chatHeight", height),
    );
    serviceManager.store.dispatch(
      actions.setAppStateValue("chatWidthBreakpoint", appChatWidthBreakpoint),
    );
  }, [serviceManager]);

  useEffect(() => {
    const container = widgetContainerRef.current;
    if (!container) {
      return undefined;
    }
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    handleResize();
    return () => observer.disconnect();
  }, [handleResize]);

  useEffect(() => {
    const container = widgetContainerRef.current;
    if (container) {
      container.style.setProperty(
        "--cds-aichat-scrollbar-width",
        `${SCROLLBAR_WIDTH()}px`,
      );
    }
  }, []);

  const onSendInput = useCallback(
    async (text: string, source: MessageSendSource, options?: SendOptions) => {
      const isInputToHumanAgent = selectIsInputToHumanAgent(appState);
      const state = serviceManager.store.getState();
      const { files } = selectInputState(state);

      if (isInputToHumanAgent) {
        serviceManager.humanAgentService.sendMessageToAgent(text, files);
      } else {
        const messageRequest = createMessageRequestForText(text);
        serviceManager.actions.sendWithCatch(messageRequest, source, {
          ...options,
        });
      }

      if (files.length) {
        serviceManager.store.dispatch(
          actions.clearInputFiles(isInputToHumanAgent),
        );
      }
    },
    [appState, serviceManager],
  );

  const onSendHomeButtonInput = useCallback(
    (input: SingleOption) => {
      const messageRequest = createMessageRequestForChoice(input);
      serviceManager.actions.sendWithCatch(
        messageRequest,
        MessageSendSource.HOME_SCREEN_STARTER,
      );
    },
    [serviceManager],
  );

  const onHydrationPanelClose = useCallback(() => {
    setIsHydrationAnimationComplete(true);
    requestFocus();
  }, [requestFocus]);

  const onRestart = useCallback(async () => {
    await serviceManager.actions.restartConversation();
    requestFocus();
  }, [requestFocus, serviceManager]);

  const doClose = useCallback(async () => {
    await serviceManager.actions.changeView(ViewType.LAUNCHER, {
      viewChangeReason: ViewChangeReason.MAIN_WINDOW_MINIMIZED,
      mainWindowCloseReason: MainWindowCloseReason.DEFAULT_MINIMIZE,
    });
  }, [serviceManager]);

  const onClose = useCallback(async () => doClose(), [doClose]);

  const onToggleHomeScreen = useCallback(() => {
    serviceManager.store.dispatch(actions.toggleHomeScreen());
  }, [serviceManager]);

  const onUserTyping = useCallback(
    (isTyping: boolean) => {
      if (
        serviceManager.store.getState().persistedToBrowserStorage
          .humanAgentState.isConnected
      ) {
        serviceManager.humanAgentService.userTyping(isTyping);
      }
    },
    [serviceManager],
  );

  // Helper functions extracted from AssistantChat
  const showConfirmEndChat = useCallback(() => {
    setShowEndChatConfirmation(true);
  }, []);

  const hideConfirmEndChat = useCallback(() => {
    setShowEndChatConfirmation(false);
    setTimeout(() => {
      inputRef.current?.takeFocus();
    });
  }, []);

  const confirmHumanAgentEndChat = useCallback(() => {
    hideConfirmEndChat();
    serviceManager.humanAgentService.endChat(true);
  }, [hideConfirmEndChat, serviceManager]);

  const requestInputFocus = useCallback(() => {
    try {
      if (
        agentDisplayState.isConnectingOrConnected &&
        agentDisplayState.disableInput
      ) {
        if (messagesRef.current?.requestHumanAgentBannerFocus()) {
          return;
        }
      }
      if (inputRef.current && inputState.fieldVisible) {
        inputRef.current.takeFocus();
      }
    } catch (error) {
      consoleError("An error occurred in requestInputFocus", error);
    }
  }, [agentDisplayState, inputState.fieldVisible]);

  const shouldDisableInput = useCallback(() => {
    return inputState.isReadonly || agentDisplayState.disableInput;
  }, [inputState.isReadonly, agentDisplayState.disableInput]);

  const shouldDisableSend = useCallback(() => {
    return shouldDisableInput() || !isHydrated;
  }, [shouldDisableInput, isHydrated]);

  const onFilesSelectedForUpload = useCallback(
    (uploads: FileUpload[]) => {
      const isInputToHumanAgent = agentDisplayState.isConnectingOrConnected;
      if (isInputToHumanAgent) {
        serviceManager.humanAgentService.filesSelectedForUpload(uploads);
        if (!inputState.allowMultipleFileUploads) {
          requestInputFocus();
        }
      }
    },
    [
      agentDisplayState.isConnectingOrConnected,
      inputState.allowMultipleFileUploads,
      requestInputFocus,
      serviceManager,
    ],
  );

  const showUploadButtonDisabled = useMemo(() => {
    const numFiles = inputState.files?.length ?? 0;
    const anyCurrentFiles =
      numFiles > 0 || humanAgentState.fileUploadInProgress;
    return anyCurrentFiles && !inputState.allowMultipleFileUploads;
  }, [
    inputState.files,
    inputState.allowMultipleFileUploads,
    humanAgentState.fileUploadInProgress,
  ]);

  const onAcceptDisclaimer = useCallback(() => {
    serviceManager.store.dispatch(actions.acceptDisclaimer());
    serviceManager.fire({
      type: BusEventType.DISCLAIMER_ACCEPTED,
    });
  }, [serviceManager]);

  const onPanelOpenStart = () => {
    requestFocus();
  };

  const onPanelOpenEnd = () => {
    requestFocus();
  };

  const onPanelCloseStart = () => {
    requestFocus();
  };

  const onPanelCloseEnd = () => {
    requestFocus();
  };

  const useHomeScreenVersion =
    Boolean(publicConfig.homescreen?.isOn) &&
    !persistedToBrowserStorage.hasSentNonWelcomeMessage;
  const shouldShowHydrationPanel =
    Boolean(assistantMessageState.isHydratingCounter) &&
    !catastrophicErrorType &&
    viewState.mainWindow;
  const isHydratingComplete = assistantMessageState.isHydratingCounter === 0;

  return (
    <div
      className={cx(
        `cds-aichat--container--render`,
        getThemeClassNames(theme),
        {
          "cds-aichat--container-disable-mobile-enhancements":
            hostElement && publicConfig.disableCustomElementMobileEnhancements,
          "cds-aichat--is-phone":
            IS_PHONE && !publicConfig.disableCustomElementMobileEnhancements,
          "cds-aichat--is-phone-portrait-mode":
            IS_PHONE_IN_PORTRAIT_MODE &&
            !publicConfig.disableCustomElementMobileEnhancements,
        },
      )}
      data-theme={theme.derivedCarbonTheme}
      dir={dir}
      data-namespace={namespaceName}
      ref={containerRef}
      role="region"
      aria-label={regionLabel}
    >
      <AppShellErrorBoundary onError={handleBoundaryError}>
        <ModalPortalRootProvider hostElement={modalPortalHostElement}>
          <Layer
            className="cds-aichat--widget__layer"
            level={
              theme.derivedCarbonTheme === CarbonTheme.G10 ||
              theme.derivedCarbonTheme === CarbonTheme.G100
                ? 1
                : 0
            }
          >
            <div
              data-testid={PageObjectId.CHAT_WIDGET}
              className={cx("cds-aichat--widget", {
                "cds-aichat--widget--rounded":
                  theme.corners === CornersType.ROUND,
                "cds-aichat--widget--frameless": !layout?.showFrame,
                "cds-aichat--widget--default-element": !useCustomHostElement,
                "cds-aichat--widget--launched": !closing,
                "cds-aichat--widget--closing": closing,
                "cds-aichat--widget--closed": !open,
                "cds-aichat--widget--max-width":
                  chatWidthBreakpoint === ChatWidthBreakpoint.WIDE &&
                  layout.hasContentMaxWidth,
                [WIDTH_BREAKPOINT_NARROW]:
                  chatWidthBreakpoint === ChatWidthBreakpoint.NARROW,
                [WIDTH_BREAKPOINT_STANDARD]:
                  chatWidthBreakpoint === ChatWidthBreakpoint.STANDARD,
                [WIDTH_BREAKPOINT_WIDE]:
                  chatWidthBreakpoint === ChatWidthBreakpoint.WIDE,
              })}
              ref={widgetContainerRef}
            >
              <VisuallyHidden>
                <h1>{languagePack.window_title}</h1>
              </VisuallyHidden>
              <div
                ref={animationContainerRef}
                className="cds-aichat--widget__animation-container"
                onScroll={() => {
                  if (animationContainerRef.current?.scrollTop !== 0) {
                    animationContainerRef.current.scrollTop = 0;
                  }
                }}
              >
                <div className="cds-aichat--widget--content">
                  <ChatShell
                    aiEnabled={theme.aiEnabled}
                    showFrame={layout?.showFrame}
                    roundedCorners={theme.corners === CornersType.ROUND}
                    showWorkspace={workspacePanelState.isOpen}
                    workspaceLocation={
                      workspacePanelState.options.preferredLocation
                    }
                  >
                    <AppShellPanels
                      serviceManager={serviceManager}
                      languagePack={languagePack}
                      headerDisplayName={headerDisplayName}
                      assistantName={publicConfig.assistantName}
                      useHomeScreenVersion={useHomeScreenVersion}
                      isHydratingComplete={isHydratingComplete}
                      shouldShowHydrationPanel={shouldShowHydrationPanel}
                      onPanelOpenStart={onPanelOpenStart}
                      onPanelOpenEnd={onPanelOpenEnd}
                      onPanelCloseStart={onPanelCloseStart}
                      onPanelCloseEnd={onPanelCloseEnd}
                      onHydrationPanelClose={onHydrationPanelClose}
                      onClose={onClose}
                      onRestart={onRestart}
                      customPanelState={customPanelState}
                      customPanelRef={customPanelRef}
                      publicConfig={publicConfig}
                      showDisclaimer={showDisclaimer}
                      disclaimerRef={disclaimerRef}
                      onAcceptDisclaimer={onAcceptDisclaimer}
                      responsePanelState={responsePanelState}
                      responsePanelRef={responsePanelRef}
                      requestFocus={requestFocus}
                      showHomeScreen={showHomeScreen}
                      onSendInput={onSendInput}
                      onSendHomeButtonInput={onSendHomeButtonInput}
                      homeScreenInputRef={homeScreenInputRef}
                      onToggleHomeScreen={onToggleHomeScreen}
                      isHydrationAnimationComplete={
                        isHydrationAnimationComplete
                      }
                      iFramePanelState={iFramePanelState}
                      iframePanelRef={iframePanelRef}
                      viewSourcePanelState={viewSourcePanelState}
                      viewSourcePanelRef={viewSourcePanelRef}
                      allMessagesByID={allMessagesByID}
                      inputState={inputState}
                      config={config}
                      catastrophicErrorType={catastrophicErrorType}
                    />

                    <div slot="header">
                      <AssistantHeader
                        onClose={onClose}
                        onRestart={onRestart}
                        headerDisplayName={headerDisplayName}
                        onToggleHomeScreen={onToggleHomeScreen}
                        includeWriteableElement={false}
                      />
                    </div>

                    <AppShellWriteableElements
                      serviceManager={serviceManager}
                    />

                    <div slot="messages">
                      <MessagesComponent
                        ref={messagesRef}
                        messageState={assistantMessageState}
                        localMessageItems={messagesToArray(
                          assistantMessageState.localMessageIDs,
                          allMessageItemsByID,
                        )}
                        requestInputFocus={requestInputFocus}
                        assistantName={publicConfig.assistantName}
                        intl={intl}
                        onEndHumanAgentChat={showConfirmEndChat}
                        locale={publicConfig.locale || "en"}
                        useAITheme={theme.aiEnabled}
                        carbonTheme={theme.derivedCarbonTheme}
                      />
                    </div>

                    <div slot="input">
                      <Input
                        ref={inputRef}
                        languagePack={languagePack}
                        serviceManager={serviceManager}
                        disableInput={shouldDisableInput()}
                        disableSend={shouldDisableSend()}
                        isInputVisible={inputState.fieldVisible}
                        onSendInput={(text: string) =>
                          onSendInput(text, MessageSendSource.MESSAGE_INPUT)
                        }
                        onUserTyping={onUserTyping}
                        showUploadButton={inputState.allowFileUploads}
                        disableUploadButton={showUploadButtonDisabled}
                        allowedFileUploadTypes={
                          inputState.allowedFileUploadTypes
                        }
                        allowMultipleFileUploads={
                          inputState.allowMultipleFileUploads
                        }
                        pendingUploads={inputState.files}
                        onFilesSelectedForUpload={onFilesSelectedForUpload}
                        placeholder={
                          languagePack[agentDisplayState.inputPlaceholderKey]
                        }
                        isStopStreamingButtonVisible={
                          inputState.stopStreamingButtonState.isVisible
                        }
                        isStopStreamingButtonDisabled={
                          inputState.stopStreamingButtonState.isDisabled
                        }
                        maxInputChars={config.public.input?.maxInputCharacters}
                        trackInputState
                      />
                    </div>

                    <div slot="workspace">
                      <WorkspaceContainer serviceManager={serviceManager} />
                    </div>
                  </ChatShell>
                  {/* Modals rendered outside shell */}
                  {showEndChatConfirmation && (
                    <EndHumanAgentChatModal
                      onConfirm={confirmHumanAgentEndChat}
                      onCancel={hideConfirmEndChat}
                    />
                  )}
                  {humanAgentState.showScreenShareRequest && (
                    <RequestScreenShareModal />
                  )}
                </div>
              </div>
            </div>
          </Layer>
        </ModalPortalRootProvider>
      </AppShellErrorBoundary>
      {showLauncher && <LauncherContainer />}
      <div className="cds-aichat--modal-host" ref={setModalPortalHostElement} />
    </div>
  );
}
