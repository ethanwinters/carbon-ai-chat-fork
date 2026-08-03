/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

/**
 * The internal headless lifecycle layer. `acquireChatSDK` (create-or-adopt) hands back a
 * {@link HeadlessChatInstance} — the core {@link ChatInstance} extended with the lifecycle members
 * only the acquiring owner should hold. This module's shape is what becomes the public
 * `@carbon/ai-chat/sdk` surface in 2.x; it is internal until then and is never exported from
 * `aiChatEntry.tsx`/`serverEntry.ts`. Deliberately DOM-free: host elements are the shell's
 * business (`ChatAppEntry` keeps them as props), so this layer never names a DOM type.
 *
 * A shell needs two things the published surface deliberately withholds — whether this acquire
 * adopted a reused manager (it feeds the public `onAttach({ remount })`) and the `ServiceManager`
 * itself — so shells call {@link acquireChatForShell} and `acquireChatSDK` is the thin wrapper
 * that drops both.
 */

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat.js';
import isEqual from 'lodash-es/isEqual.js';

import { createServiceManager } from '../services/loadServices';
import { ServiceManager } from '../services/ServiceManager';
import { createChatInstance } from '../instance/ChatInstanceImpl';
import { createAppConfig } from '../store/doCreateStore';
import { setIntl } from '../utils/intlUtils';
import { consoleError } from '../utils/miscUtils';
import createHumanAgentService from '../services/haa/HumanAgentServiceImpl';
import {
  acquireServiceManager,
  DEFAULT_REUSE_GRACE_MS,
  evictServiceManager,
  registerServiceManager,
  releaseServiceManager,
} from '../services/reuseInstanceRegistry';
import { attachSlotStateTracking } from './slotStates.js';
import { attachMessagesStateTracking } from './messagesState.js';

import {
  MainWindowOpenReason,
  ViewChangeReason,
} from '../../types/events/eventBusTypes';
import { VIEW_STATE_ALL_CLOSED } from '../store/reducerUtils';
import { PublicConfig } from '../../types/config/PublicConfig';
import { ChatInstance } from '../../types/instance/ChatInstance';
import { loadLocale } from '../utils/languageUtils';
import { applyConfigChangesDynamically } from '../utils/dynamicConfigUpdates';

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
      forceViewChange
    );
  }
}

/**
 * The core {@link ChatInstance} extended with the lifecycle members only the acquiring owner
 * should hold. Handed back by {@link acquireChatSDK}.
 *
 * The extension exists so these members do **not** ride the core instance: `customSendMessage`,
 * `customLoadHistory`, event-bus handlers, and the shells' `onAttach` all receive a plain
 * `ChatInstance`, so app code running under a shell-managed mount cannot reach in and desync the
 * shell's lifecycle.
 *
 * One consequence of that split: the chainable `on` / `off` / `once` return the core instance, so
 * a chain does not carry the lifecycle members. Keep the handle itself if you need `release()` or
 * `updateConfig()` later.
 */
export interface HeadlessChatInstance extends ChatInstance {
  /**
   * Done with this handle, but something may come back for it. With `featureFlags.reuseInstance`
   * on, this hands the live chat to the reuse registry and starts the grace window
   * (`featureFlags.reuseInstanceGraceMs`), so a re-acquire inside that window adopts the same
   * conversation, connection, and state; only an elapsed window disposes. Pair it with
   * {@link ChatInstance.destroy}, which is the "gone for good" verb.
   *
   * **With `featureFlags.reuseInstance` off — the default — `release()` and `destroy()` are the
   * same immediate teardown**, so testing without the flag cannot tell you which one you meant.
   */
  release(): void;

  /**
   * Applies a runtime config change: the full `next` config replaces the current one, and the
   * difference drives both the reactive store write and the out-of-store side effects (language
   * pack, namespace, human-agent service, and friends).
   *
   * Pass a complete config, not a patch — anything omitted from `next` is treated as removed.
   * Carbon AI Chat snapshots what you pass — plain objects and arrays are copied, functions and
   * class instances kept by identity — so hand over a new one instead of editing yours in place.
   */
  updateConfig(next: PublicConfig): Promise<void>;
}

/**
 * The handle for a given manager. Owned here, in the lifecycle layer, rather than as a field on
 * `ServiceManager`: the core must not name the layer built on top of it, or `sdk/` could not be
 * lifted out as `@carbon/ai-chat/sdk` in 2.x. A reuse re-acquire maps the cached manager back to
 * its original handle through this map, so re-adopting hands back the same object.
 */
const handleByManager = new WeakMap<ServiceManager, HeadlessChatInstance>();

/**
 * Set when (and only when) an acquire registered a manager in the reuse registry, with the
 * namespace it was registered under. Teardown branches on this boot-time record rather than the
 * live config: `featureFlags`/`namespace` are dynamically updatable, and deriving the path from
 * the store would desynchronize release/destroy from the registration (leaking the manager or
 * stranding a registry entry pointing at a disposed one).
 */
const reuseRegistrationByManager = new WeakMap<
  ServiceManager,
  { namespace: string | undefined }
>();

/**
 * Host unmounted: grace-release to the registry when this manager was registered for reuse, else
 * dispose now. Idempotent per mount (guarded by `serviceManager.disposed`).
 */
function releaseChat(serviceManager: ServiceManager): void {
  if (serviceManager.disposed) {
    return;
  }
  const registration = reuseRegistrationByManager.get(serviceManager);
  if (registration) {
    const { featureFlags } = serviceManager.store.getState().config.public;
    releaseServiceManager(
      registration.namespace,
      serviceManager,
      featureFlags?.reuseInstanceGraceMs ?? DEFAULT_REUSE_GRACE_MS,
      (manager) => manager.actions.unloadServices()
    );
  } else {
    serviceManager.actions.unloadServices();
  }
}

/**
 * Hard teardown: evict + `unloadServices` immediately, skipping any grace window.
 * `instance.destroy()` delegates here via `serviceManager.onDestroy`.
 */
function destroyChat(serviceManager: ServiceManager): void {
  if (serviceManager.disposed) {
    return;
  }
  const registration = reuseRegistrationByManager.get(serviceManager);
  if (registration) {
    evictServiceManager(registration.namespace, serviceManager, (manager) =>
      manager.actions.unloadServices()
    );
  } else {
    serviceManager.actions.unloadServices();
  }
}

/**
 * Applies a runtime config change. The previous config comes from the store rather than a field
 * held here: the store already holds exactly what was last applied (`createAppConfig` snapshotted
 * it), so there is no second source of truth to drift — and a manager adopted across a host
 * remount diffs against the config it actually has, not the new mount's.
 *
 * No-ops on a disposed manager, like its release/destroy siblings: teardown leaves the store and
 * the human-agent service in place, so a late call would otherwise re-initialize a service desk
 * that nothing can ever tear down.
 */
function updateChatConfig(
  serviceManager: ServiceManager,
  next: PublicConfig
): Promise<void> {
  if (serviceManager.disposed) {
    return Promise.resolve();
  }
  const previous = serviceManager.store.getState().config.public;
  return applyConfigChangesDynamically(previous, next, serviceManager);
}

/**
 * Builds the handle over the manager's instance. Delegation rather than a copy: the handle's
 * prototype IS the instance, so every core member stays live (and singly-owned), while the
 * lifecycle members are own properties of the handle alone and never appear on the instance the
 * shells hand to host code.
 *
 * One behavior note versus the facade this replaced, whose `instance` getter read
 * `serviceManager.instance` on every access: the prototype link is captured once, so a handle kept
 * past `destroy()` still exposes core members through the (now torn-down) instance rather than
 * failing fast on the `undefined` that teardown assigns. Calling them on a disposed chat was
 * already unsupported — host code holds that same object either way — so this changes only how the
 * misuse surfaces.
 */
function createHeadlessHandle(
  serviceManager: ServiceManager
): HeadlessChatInstance {
  const chat = Object.create(serviceManager.instance) as HeadlessChatInstance;
  chat.release = () => releaseChat(serviceManager);
  chat.updateConfig = (next: PublicConfig) =>
    updateChatConfig(serviceManager, next);
  return chat;
}

/** What a shell's boot needs on top of the handle itself. Internal; see {@link acquireChatSDK}. */
export interface AcquiredChatForShell {
  /** The handle the acquiring owner holds. */
  chat: HeadlessChatInstance;
  /**
   * Whether this acquire adopted a manager reused across a host remount. Internal on purpose: it
   * is a per-call fact, so it cannot live on a handle that a re-acquire hands back unchanged, and
   * it is the wrong primitive for "should I skip my boot-once work?" — that question has a durable
   * answer in the store. Its one legitimate consumer is the shells' public
   * `onAttach(instance, { remount })`.
   */
  adopted: boolean;
  /** The manager backing the handle. Shell plumbing (providers, store reads) needs it directly. */
  serviceManager: ServiceManager;
}

/**
 * Create-or-adopt for a shell: same as {@link acquireChatSDK}, plus the two values a shell's boot
 * needs and the published surface withholds. See {@link AcquiredChatForShell}.
 */
export async function acquireChatForShell(
  config: PublicConfig
): Promise<AcquiredChatForShell> {
  // Extend dayjs with LocalizedFormat plugin once before usage
  dayjs.extend(LocalizedFormat);

  // Reuse a cached ServiceManager across a host remount when opted in and one is available.
  if (config.featureFlags?.reuseInstance) {
    const cached = acquireServiceManager(config.namespace);
    if (cached) {
      // The registry deals in managers, so map back to the handle this layer owns. Handing back
      // the SAME object matters: a host that kept the handle across the remount must not end up
      // with two handles onto one manager.
      return {
        chat: handleByManager.get(cached),
        adopted: true,
        serviceManager: cached,
      };
    }
  }

  // Create service manager
  const appConfig = createAppConfig(config);
  const serviceManager = createServiceManager(appConfig);

  // From here the manager holds live resources (store subscriptions, the theme watcher), so a
  // failed boot must unload them before propagating — nothing else can reach a manager whose
  // acquire never returned.
  try {
    // Load language and locale
    const languagePack = serviceManager.store.getState().languagePack;
    const localePack = await loadLocale(
      serviceManager.store.getState().config.public.locale || 'en'
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
        '[upload] UploadConfig.is_on is true but onFileUpload is not provided. ' +
          'File upload will be disabled. Please provide an onFileUpload handler in config.upload.'
      );
    }

    // Reduce the conversation's messages, status, and error into a framework-agnostic snapshot
    // owned by the manager. Unlike the slot stores below this subscribes to the app store rather
    // than the event bus, so it needs only `serviceManager.store` and can run before the instance
    // exists — which it must, because `createChatInstance` snapshots the manager for the
    // `exposeServiceManagerForTesting` copy and would miss a field assigned afterwards. The seeding
    // recompute fires no event (there is no prior snapshot to have changed from), so the fact that
    // `serviceManager.instance` is still undefined here is safe: by the time a real dispatch
    // triggers a later recompute, boot has finished and the instance exists.
    attachMessagesStateTracking(serviceManager);

    // Create the chat instance
    const instance = createChatInstance({ serviceManager });
    serviceManager.instance = instance;

    // Reduce the portal-slot bus events (user-defined responses, custom footers) into
    // framework-agnostic value stores owned by the manager. Done here, before the view subscribes,
    // so events fired during boot are still captured; the stores survive a host remount.
    attachSlotStateTracking(serviceManager);

    // Track the handle for this manager so a future reuse re-attach returns this same object.
    const chat = createHeadlessHandle(serviceManager);
    handleByManager.set(serviceManager, chat);

    // Give the core a way to trigger a full teardown (including registry eviction) without naming
    // this layer: `ChatInstanceImpl.destroy` calls `serviceManager.onDestroy`.
    serviceManager.onDestroy = () => destroyChat(serviceManager);

    // Register the fresh manager so a future remount can reuse it when opted in, recording the
    // decision so release/destroy branch on it rather than on the live config.
    if (config.featureFlags?.reuseInstance) {
      registerServiceManager(config.namespace, serviceManager, (manager) =>
        manager.actions.unloadServices()
      );
      reuseRegistrationByManager.set(serviceManager, {
        namespace: config.namespace,
      });
    }

    return { chat, adopted: false, serviceManager };
  } catch (error) {
    try {
      serviceManager.actions.unloadServices();
    } catch {
      // Teardown of a partially-initialized manager must not mask the boot error.
    }
    throw error;
  }
}

/**
 * Create-or-adopt, headless: returns the handle for the namespace when reuse is on and one is
 * available, else cold-boots services and the instance. Binds no DOM — host elements stay in the
 * shell (`ChatAppEntry` holds them as props), a view concern this layer never names.
 *
 * `config` is the already-merged `PublicConfig` (see `src/chat/boot/appBoot.ts`'s
 * `mergePublicConfig`). It is snapshotted at handover — see
 * {@link HeadlessChatInstance.updateConfig} for what "snapshot" copies — so hand a new config
 * there instead of editing yours in place.
 *
 * Resolves to the handle itself — there is no `{ chat, adopted }` envelope on this surface; see
 * {@link acquireChatForShell} for the shell-only extras and {@link AcquiredChatForShell.adopted}
 * for why `adopted` is not one of them.
 */
export async function acquireChatSDK(
  config: PublicConfig
): Promise<HeadlessChatInstance> {
  const { chat } = await acquireChatForShell(config);
  return chat;
}
