/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * The internal `ChatSDK` lifecycle facade. This is the module whose shape becomes the public
 * `@carbon/ai-chat/sdk` surface in 2.0 — see `.plans/1.x/sdk-foundations.md` for the locked shape
 * and decisions. Internal only until 2.0: never exported from `aiChatEntry.tsx`/`serverEntry.ts`.
 */

import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat.js";
import merge from "lodash-es/merge.js";
import isEqual from "lodash-es/isEqual.js";

import { setVarsForSelector } from "@carbon/ai-chat-components/es/components/shared/dynamic-css-var-sheet.js";

import { createServiceManager } from "../services/loadServices";
import { ServiceManager } from "../services/ServiceManager";
import { createChatInstance } from "../instance/ChatInstanceImpl";
import { createAppConfig } from "../store/doCreateStore";
import { setIntl } from "../utils/intlUtils";
import { consoleError, consoleWarn } from "../utils/miscUtils";
import createHumanAgentService from "../services/haa/HumanAgentServiceImpl";
import {
  acquireServiceManager,
  DEFAULT_REUSE_GRACE_MS,
  evictServiceManager,
  registerServiceManager,
  releaseServiceManager,
} from "../services/reuseInstanceRegistry";
import { attachSlotStateTracking } from "./slotStates.js";
import { attachMessagesStateTracking } from "./messagesState.js";

import {
  MainWindowOpenReason,
  ViewChangeReason,
} from "../../types/events/eventBusTypes";
import { VIEW_STATE_ALL_CLOSED } from "../store/reducerUtils";
import { PublicConfig } from "../../types/config/PublicConfig";
import { ChatInstance } from "../../types/instance/ChatInstance";
import { loadLocale } from "../utils/languageUtils";
import { ChatSlotStates } from "./slotStates.js";

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
 * The host DOM anchors a `ChatSDK` binds/rebinds to: the boot-container element, and (for a WC
 * surface) the custom host element the container fills.
 */
export interface ChatSDKHost {
  container: HTMLElement;
  customHostElement?: HTMLElement;
}

/**
 * Internal lifecycle facade over a {@link ServiceManager}. One `ChatSDK` per `ServiceManager` —
 * cached on `serviceManager.sdk` so a reuse re-attach returns the same facade instance. Construct
 * only via {@link acquireChatSDK}.
 */
export class ChatSDK {
  constructor(readonly serviceManager: ServiceManager) {}

  get instance(): ChatInstance {
    return this.serviceManager.instance;
  }

  get slotStates(): ChatSlotStates {
    return this.serviceManager.slotStates!;
  }

  /** Boot-once post-render sequencing. Caller runs only when `!adopted`. */
  runInitialViewChange(): Promise<void> {
    return performInitialViewChange(this.serviceManager);
  }

  /**
   * Rebinds a live sdk to a new host: points it at the new container/host element and re-applies
   * the boot-container classes. Does not re-create services, re-run localization, or touch the
   * live connection — the manager is reused as-is.
   */
  attach(host: ChatSDKHost): void {
    this.serviceManager.container = host.container;
    this.serviceManager.customHostElement = host.customHostElement;
    applyBootContainerClasses(host.container, this.serviceManager);
  }

  /**
   * Host unmounted: grace-release to the registry when reuse is on, else dispose now. Idempotent
   * per mount (guarded by `serviceManager.disposed`).
   */
  release(): void {
    if (this.serviceManager.disposed) {
      return;
    }
    const { featureFlags, namespace } =
      this.serviceManager.store.getState().config.public;
    if (featureFlags?.reuseInstance) {
      releaseServiceManager(
        namespace,
        featureFlags.reuseInstanceGraceMs ?? DEFAULT_REUSE_GRACE_MS,
        (manager) => manager.actions.unloadServices(),
      );
    } else {
      this.serviceManager.actions.unloadServices();
    }
  }

  /**
   * Hard teardown: evict + `unloadServices` immediately, skipping any grace window.
   * `instance.destroy()` delegates here.
   */
  destroy(): void {
    if (this.serviceManager.disposed) {
      return;
    }
    const { featureFlags, namespace } =
      this.serviceManager.store.getState().config.public;
    if (featureFlags?.reuseInstance) {
      evictServiceManager(namespace, (manager) =>
        manager.actions.unloadServices(),
      );
    } else {
      this.serviceManager.actions.unloadServices();
    }
  }
}

/**
 * Create-or-adopt. Subsumes the former `initServiceManagerAndInstance` + registry acquire/register
 * + `maybeWarnAccidentalReboot`. `config` is the already-merged `PublicConfig`.
 */
export async function acquireChatSDK(
  config: PublicConfig,
  host: ChatSDKHost,
): Promise<{ sdk: ChatSDK; adopted: boolean }> {
  const { container, customHostElement } = host;

  // Extend dayjs with LocalizedFormat plugin once before usage
  dayjs.extend(LocalizedFormat);

  // Reuse a cached ServiceManager across a host remount when opted in and one is available.
  if (config.featureFlags?.reuseInstance) {
    const cached = acquireServiceManager(config.namespace);
    if (cached) {
      const sdk = cached.sdk!;
      sdk.attach({ container, customHostElement });
      return { sdk, adopted: true };
    }
  }

  // Diagnose accidental remounts (debug only): a second cold boot for the same namespace means the
  // host unmounted and remounted the chat, discarding the conversation.
  maybeWarnAccidentalReboot(config);

  // Create service manager
  const appConfig = createAppConfig(config);
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

  // Reduce the messages/status/error state into framework-agnostic value stores owned by the
  // manager. Done here, before createChatInstance (unlike attachSlotStateTracking below), because it
  // only needs serviceManager.store, not serviceManager.instance — it subscribes to the app store
  // directly rather than to bus events. It never fires MESSAGES_STATE_CHANGE on this first, seeding
  // recompute (there's nothing to compare against yet), so the fact serviceManager.instance doesn't
  // exist until after createChatInstance below is safe: by the time any real dispatch triggers a
  // later recompute, boot has finished and the instance exists.
  attachMessagesStateTracking(serviceManager);

  // Create the chat instance
  const instance = createChatInstance({ serviceManager });
  serviceManager.instance = instance;

  // Reduce the portal-slot bus events (user-defined responses, custom footers) into
  // framework-agnostic value stores owned by the manager. Done here, before the view subscribes,
  // so events fired during boot are still captured; the stores survive a host remount.
  attachSlotStateTracking(serviceManager);

  // Cache the facade on the manager so a future reuse re-attach returns this same instance.
  const sdk = new ChatSDK(serviceManager);
  serviceManager.sdk = sdk;

  // Register the fresh manager so a future remount can reuse it when opted in.
  if (config.featureFlags?.reuseInstance) {
    registerServiceManager(config.namespace, serviceManager);
  }

  return { sdk, adopted: false };
}
