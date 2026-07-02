/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import dayjs from "dayjs";
import type React from "react";
import LocalizedFormat from "dayjs/plugin/localizedFormat.js";
import merge from "lodash-es/merge.js";
import isEqual from "lodash-es/isEqual.js";

import { setVarsForSelector } from "@carbon/ai-chat-components/es/components/shared/dynamic-css-var-sheet.js";

import { createServiceManager } from "../services/loadServices";

let bootContainerRulesInstalled = false;

/**
 * Per-namespace boot diagnostics for the accidental-remount warning. Tracks the last cold-boot time
 * (to suppress React StrictMode's rapid dev double-boot) and whether we have already warned.
 */
const bootDiagnosticsByNamespace = new Map<
  string,
  { warned: boolean; lastBootMs: number }
>();
const STRICTMODE_WINDOW_MS = 50;

/**
 * Install boot-container size rules on the shared dynamic stylesheet so a
 * strict CSP can drop style-src-attr 'unsafe-inline'. The container fills
 * the host element when one is provided and otherwise stays collapsed
 * (0×0) until the chat floats out.
 */
function ensureBootContainerStyleRules(): void {
  if (bootContainerRulesInstalled) {
    return;
  }
  setVarsForSelector(".cds-aichat--boot-container--filled", {
    width: "100% !important",
    height: "100% !important",
  });
  setVarsForSelector(".cds-aichat--boot-container--collapsed", {
    width: "0 !important",
    height: "0 !important",
  });
  bootContainerRulesInstalled = true;
}
import { ServiceManager } from "../services/ServiceManager";
import { createChatInstance } from "../instance/ChatInstanceImpl";
import { createAppConfig } from "../store/doCreateStore";
import { setIntl } from "./intlUtils";
import { consoleError, consoleWarn } from "./miscUtils";
import createHumanAgentService from "../services/haa/HumanAgentServiceImpl";
import {
  acquireServiceManager,
  registerServiceManager,
} from "../services/reuseInstanceRegistry";

import {
  BusEventChunkUserDefinedResponse,
  BusEventType,
  BusEventUserDefinedResponse,
  BusEventCustomFooterSlot,
  MainWindowOpenReason,
  ViewChangeReason,
} from "../../types/events/eventBusTypes";
import { VIEW_STATE_ALL_CLOSED } from "../store/reducerUtils";
import { PublicConfig } from "../../types/config/PublicConfig";
import { ChatInstance } from "../../types/instance/ChatInstance";
import { loadLocale } from "./languageUtils";

/**
 * Default values applied to the provided `PublicConfig` before boot. This keeps
 * the rest of the boot pipeline free from null checks for optional config
 * branches. Callers can override any of these via the incoming partial config.
 */
export const DEFAULT_PUBLIC_CONFIG: Partial<PublicConfig> = {
  assistantName: "watsonx",
  openChatByDefault: false,
  shouldTakeFocusIfOpensAutomatically: true,
  serviceDesk: {},
  messaging: {},
  launcher: {
    isOn: true,
  },
};

/**
 * Merges a user-supplied partial config with {@link DEFAULT_PUBLIC_CONFIG} to
 * produce a complete `PublicConfig` used throughout the app.
 */
export function mergePublicConfig(config: Partial<PublicConfig>): PublicConfig {
  return merge({}, DEFAULT_PUBLIC_CONFIG, config) as PublicConfig;
}

/**
 * Creates a {@link ServiceManager}, initializes localization, wires the
 * `humanAgentService`, and constructs the {@link ChatInstance}.
 *
 * This function does not render; the caller should call `instance.render()`
 * after setting up any lifecycle hooks.
 */
export async function initServiceManagerAndInstance(options: {
  publicConfig: PublicConfig;
  container: HTMLElement;
  customHostElement?: HTMLElement;
}): Promise<{
  serviceManager: ServiceManager;
  instance: ChatInstance;
  adopted: boolean;
}> {
  const { publicConfig, container, customHostElement } = options;

  // Extend dayjs with LocalizedFormat plugin once before usage
  dayjs.extend(LocalizedFormat);

  // Reuse a cached ServiceManager across a host remount when opted in and one is available.
  if (publicConfig.featureFlags?.reuseInstance) {
    const cached = acquireServiceManager(publicConfig.namespace);
    if (cached) {
      reattachServiceManager(cached, { container, customHostElement });
      return {
        serviceManager: cached,
        instance: cached.instance,
        adopted: true,
      };
    }
  }

  // Diagnose accidental remounts (debug only): a second cold boot for the same namespace means the
  // host unmounted and remounted the chat, discarding the conversation.
  maybeWarnAccidentalReboot(publicConfig);

  // Create service manager
  const appConfig = createAppConfig(publicConfig);
  const serviceManager = createServiceManager(appConfig);

  // Set container + hosting information
  serviceManager.container = container;
  serviceManager.customHostElement = customHostElement;
  applyBootContainerClasses(container, serviceManager);

  // Load language and locale
  const languagePack = serviceManager.store.getState().languagePack;
  const localePack = await loadLocale(
    serviceManager.store.getState().config.public.locale || "en",
  );

  // Set up human agent service (created once here; may be recreated
  // dynamically later by config updates)
  serviceManager.humanAgentService = createHumanAgentService(serviceManager);

  // Update Redux with new values for language, locale, and messages
  setIntl(serviceManager, localePack.name, languagePack);

  // Tell dayjs to globally use the locale
  dayjs.locale(localePack);

  // Validate UploadConfig at startup so misconfiguration is surfaced early,
  // regardless of whether the main window is open.
  const uploadConfig = serviceManager.store.getState().config.public.upload;
  if (uploadConfig?.is_on && !uploadConfig.onFileUpload) {
    consoleError(
      "[upload] UploadConfig.is_on is true but onFileUpload is not provided. " +
        "File upload will be disabled. Please provide an onFileUpload handler in config.upload.",
    );
  }

  // Create the chat instance
  const instance = createChatInstance({ serviceManager });
  serviceManager.instance = instance;

  // Register the fresh manager so a future remount can reuse it when opted in.
  if (publicConfig.featureFlags?.reuseInstance) {
    registerServiceManager(publicConfig.namespace, serviceManager);
  }

  return { serviceManager, instance, adopted: false };
}

/**
 * Applies the boot-container CSS classes to the host container. Shared by cold boot and re-attach
 * so a reused manager's new container gets the same sizing rules.
 */
function applyBootContainerClasses(
  container: HTMLElement,
  serviceManager: ServiceManager,
): void {
  ensureBootContainerStyleRules();
  container.classList.add("cds-aichat--boot-container");
  container.classList.toggle(
    "cds-aichat--boot-container--filled",
    !!serviceManager.customHostElement,
  );
  container.classList.toggle(
    "cds-aichat--boot-container--collapsed",
    !serviceManager.customHostElement,
  );
}

/**
 * Re-binds a reused {@link ServiceManager} to a freshly-mounted host: points it at the new
 * container/host element and re-applies the boot-container classes. Does not re-create services,
 * re-run localization, or touch the live connection — the manager is reused as-is.
 */
function reattachServiceManager(
  serviceManager: ServiceManager,
  {
    container,
    customHostElement,
  }: { container: HTMLElement; customHostElement?: HTMLElement },
): void {
  serviceManager.container = container;
  serviceManager.customHostElement = customHostElement;
  applyBootContainerClasses(container, serviceManager);
}

/**
 * Emits a one-time, debug-gated warning when a namespace cold-boots a second time — a sign the host
 * unmounted and remounted the chat (React StrictMode, a changing `key`, a component defined inside
 * render, or conditional rendering), which discards the conversation. Suppressed when
 * `featureFlags.reuseInstance` is enabled (a remount then reuses the instance) and within a short
 * window after the previous boot (to ignore React StrictMode's rapid dev double-boot).
 */
function maybeWarnAccidentalReboot(publicConfig: PublicConfig): void {
  const namespace = publicConfig.namespace ?? "";
  const now = Date.now();
  const prior = bootDiagnosticsByNamespace.get(namespace);

  const shouldWarn =
    prior !== undefined &&
    !prior.warned &&
    now - prior.lastBootMs > STRICTMODE_WINDOW_MS &&
    Boolean(publicConfig.debug) &&
    !publicConfig.featureFlags?.reuseInstance;

  bootDiagnosticsByNamespace.set(namespace, {
    warned: (prior?.warned ?? false) || shouldWarn,
    lastBootMs: now,
  });

  if (shouldWarn) {
    consoleWarn(
      `Carbon AI Chat re-initialized from scratch for namespace "${namespace}", discarding the ` +
        "conversation. Its host element was unmounted and remounted (React StrictMode, a changing " +
        "`key`, a component defined inside render, or conditional rendering). Mount the chat once " +
        "and keep it mounted — toggle visibility with CSS or the view API. To make a remount reuse " +
        "the existing conversation, set `featureFlags.reuseInstance: true`.",
    );
  }
}

/**
 * Applies the first view transition after boot, deciding between restoring a
 * session or opening the default view. Keeps this sequencing in one place so
 * tests and callers can reason about what happens immediately after boot.
 */
export async function performInitialViewChange(serviceManager: ServiceManager) {
  const initialState = serviceManager.store.getState();
  const { wasLoadedFromBrowser } = initialState.persistedToBrowserStorage;
  const { targetViewState } = initialState;
  const { openChatByDefault } = initialState.config.public;

  if (targetViewState.mainWindow) {
    let mainWindowOpenReason = MainWindowOpenReason.SESSION_HISTORY;
    if (openChatByDefault && !wasLoadedFromBrowser) {
      mainWindowOpenReason = MainWindowOpenReason.OPEN_BY_DEFAULT;
    }
    await serviceManager.actions.changeView(targetViewState, {
      viewChangeReason: ViewChangeReason.WEB_CHAT_LOADED,
      mainWindowOpenReason,
    });
  } else {
    const viewChangeReason = ViewChangeReason.WEB_CHAT_LOADED;
    const tryHydrating = false;
    const forceViewChange = isEqual(targetViewState, VIEW_STATE_ALL_CLOSED);

    await serviceManager.actions.changeView(
      targetViewState,
      { viewChangeReason },
      tryHydrating,
      forceViewChange,
    );
  }
}

/**
 * A minimal shallow-equivalence checker for plain objects used during initial
 * view-change decision making. Avoids pulling in a deep-equality dependency for
 * this narrow use.
 */
// Note: use lodash `isEqual` for stable, predictable equality checks

/**
 * Registers the event handlers that track user-defined response items in React state so they can
 * be rendered via portals. The handlers are registered once on the instance's event bus and read
 * the current mount's setter from the service manager, which is repointed on every call — so a
 * reused instance (after a remount) always drives the live mount rather than a stale one. On
 * restart events, the tracked state is cleared.
 */
export function attachUserDefinedResponseHandlers(
  serviceManager: ServiceManager,
  setBySlot: React.Dispatch<
    React.SetStateAction<{
      [key: string]: {
        fullMessage?: any;
        messageItem?: any;
        partialItems?: any[];
        state?: any;
      };
    }>
  >,
) {
  // Repoint the current mount's setter every call so a reused instance drives the live mount.
  serviceManager.userDefinedResponseSetter = setBySlot;
  if (serviceManager.userDefinedResponseHandlersAttached) {
    return;
  }
  serviceManager.userDefinedResponseHandlersAttached = true;

  function userDefinedResponseHandler(event: BusEventUserDefinedResponse) {
    serviceManager.userDefinedResponseSetter?.((bySlot: any) => {
      return {
        ...bySlot,
        [event.data.slot]: {
          fullMessage: event.data.fullMessage,
          messageItem: event.data.message,
          state: event.data.state,
        },
      };
    });
  }

  function userDefinedChunkHandler(event: BusEventChunkUserDefinedResponse) {
    if ("complete_item" in event.data.chunk) {
      const messageItem = event.data.chunk.complete_item;
      serviceManager.userDefinedResponseSetter?.((bySlot: any) => {
        return {
          ...bySlot,
          [event.data.slot]: {
            messageItem,
          },
        };
      });
    } else if ("partial_item" in event.data.chunk) {
      const itemChunk = event.data.chunk.partial_item;
      serviceManager.userDefinedResponseSetter?.((bySlot: any) => {
        return {
          ...bySlot,
          [event.data.slot]: {
            partialItems: [
              ...(bySlot[event.data.slot]?.partialItems || []),
              itemChunk,
            ],
          },
        };
      });
    }
  }

  function restartHandler() {
    serviceManager.userDefinedResponseSetter?.({});
  }

  serviceManager.instance.on({
    type: BusEventType.CHUNK_USER_DEFINED_RESPONSE,
    handler: userDefinedChunkHandler,
  });
  serviceManager.instance.on({
    type: BusEventType.USER_DEFINED_RESPONSE,
    handler: userDefinedResponseHandler,
  });
  serviceManager.instance.on({
    type: BusEventType.RESTART_CONVERSATION,
    handler: restartHandler,
  });
}

/**
 * Attaches event handlers to the `ChatInstance` that track custom
 * message footers in React state so they can be rendered via portals.
 *
 * On restart events, the tracked state is cleared.
 */
export function attachCustomFooterHandler(
  serviceManager: ServiceManager,
  setBySlot: React.Dispatch<
    React.SetStateAction<{
      [key: string]: {
        slotName: string;
        message: any;
        messageItem: any;
        additionalData?: Record<string, unknown>;
      };
    }>
  >,
) {
  // Repoint the current mount's setter every call so a reused instance drives the live mount.
  serviceManager.customFooterSetter = setBySlot;
  if (serviceManager.customFooterHandlersAttached) {
    return;
  }
  serviceManager.customFooterHandlersAttached = true;

  function customFooterSlotHandler(event: BusEventCustomFooterSlot) {
    serviceManager.customFooterSetter?.((bySlot: any) => {
      return {
        ...bySlot,
        [event.data.slotName]: {
          slotName: event.data.slotName,
          message: event.data.message,
          messageItem: event.data.messageItem,
          additionalData: event.data.additionalData as
            | Record<string, unknown>
            | undefined,
        },
      };
    });
  }

  function restartHandler() {
    serviceManager.customFooterSetter?.({});
  }

  serviceManager.instance.on({
    type: BusEventType.CUSTOM_FOOTER_SLOT,
    handler: customFooterSlotHandler,
  });

  serviceManager.instance.on({
    type: BusEventType.RESTART_CONVERSATION,
    handler: restartHandler,
  });
}
