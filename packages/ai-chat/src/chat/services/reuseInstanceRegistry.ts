/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import type { ServiceManager } from "./ServiceManager";
import { consoleError } from "../utils/miscUtils";

/**
 * Framework-agnostic registry that keeps a live {@link ServiceManager} alive across a host
 * unmount/remount when `featureFlags.reuseInstance` is enabled. It lives outside React (a plain module
 * `Map`), keyed by the chat's `namespace`, ref-counted by the number of live mounts. When the
 * last mount releases, a grace timer runs before the manager is disposed; a remount within the
 * grace window re-acquires the same manager instead of cold-booting a new one.
 *
 * This intentionally holds no React/Lit references so it can outlive the future React-to-Lit
 * migration.
 */

interface ReuseInstanceEntry {
  /** The live manager being kept alive for this namespace. */
  serviceManager: ServiceManager;
  /** Number of currently-mounted hosts using this manager. Disposal starts at 0. */
  refCount: number;
  /** Pending disposal timer while `refCount` is 0; cancelled on the next acquire. */
  graceTimer: ReturnType<typeof setTimeout> | null;
}

const registry = new Map<string, ReuseInstanceEntry>();

/**
 * Default grace window, in milliseconds, before a released manager is disposed. Short enough to
 * release the live connection promptly, long enough to absorb StrictMode double-mounts and route
 * transitions. Tunable per chat via `featureFlags.reuseInstanceGraceMs`.
 */
export const DEFAULT_REUSE_GRACE_MS = 3000;

function keyFor(namespace: string | undefined): string {
  return namespace ?? "";
}

/**
 * Returns the entry for a namespace without changing its ref-count. Used by tests to assert
 * registry bookkeeping (ref-count, the cached manager) without mutating it.
 */
export function peekReuseEntry(
  namespace: string | undefined,
): ReuseInstanceEntry | undefined {
  return registry.get(keyFor(namespace));
}

/**
 * Stores a freshly-created manager for a namespace with a ref-count of 1. Called on a cold boot
 * when no cached manager was available to acquire.
 */
export function registerServiceManager(
  namespace: string | undefined,
  serviceManager: ServiceManager,
): void {
  const key = keyFor(namespace);
  const existing = registry.get(key);
  if (existing?.graceTimer) {
    clearTimeout(existing.graceTimer);
  }
  registry.set(key, {
    serviceManager,
    refCount: 1,
    graceTimer: null,
  });
}

/**
 * Returns the live manager for a namespace and increments its ref-count, cancelling any pending
 * disposal. Returns `undefined` when nothing is cached (the caller then cold-boots). A concurrent
 * acquire while another mount still holds the manager is unsupported (fan-out rather than a
 * remount) and logs a dev error, but still shares the manager.
 */
export function acquireServiceManager(
  namespace: string | undefined,
): ServiceManager | undefined {
  const entry = registry.get(keyFor(namespace));
  if (!entry) {
    return undefined;
  }
  if (entry.refCount >= 1) {
    consoleError(
      `Two live Carbon AI Chat mounts share namespace "${keyFor(
        namespace,
      )}" with next.reuseInstance enabled. Concurrent mounts of the same namespace are not supported — give each chat a unique namespace.`,
    );
  }
  if (entry.graceTimer) {
    clearTimeout(entry.graceTimer);
    entry.graceTimer = null;
  }
  entry.refCount += 1;
  return entry.serviceManager;
}

/**
 * Decrements the ref-count for a namespace. When it reaches 0, starts a grace timer that disposes
 * the manager (via `dispose`) and evicts the entry; a later acquire cancels the timer and reuses
 * the manager. No-op if the namespace is not registered.
 */
export function releaseServiceManager(
  namespace: string | undefined,
  graceMs: number,
  dispose: (serviceManager: ServiceManager) => void,
): void {
  const key = keyFor(namespace);
  const entry = registry.get(key);
  if (!entry) {
    return;
  }
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0) {
    return;
  }
  if (entry.graceTimer) {
    clearTimeout(entry.graceTimer);
  }
  entry.graceTimer = setTimeout(() => {
    registry.delete(key);
    try {
      dispose(entry.serviceManager);
    } catch {
      // Disposal must never throw out of the timer.
    }
  }, graceMs);
}

/**
 * Disposes and evicts a namespace's manager immediately, skipping the grace window. Used by
 * `instance.destroy()`. No-op if the namespace is not registered.
 */
export function evictServiceManager(
  namespace: string | undefined,
  dispose: (serviceManager: ServiceManager) => void,
): void {
  const key = keyFor(namespace);
  const entry = registry.get(key);
  if (!entry) {
    return;
  }
  if (entry.graceTimer) {
    clearTimeout(entry.graceTimer);
  }
  registry.delete(key);
  try {
    dispose(entry.serviceManager);
  } catch {
    // Disposal must never throw.
  }
}

/**
 * Clears the entire registry, cancelling any pending disposal timers. Test-only.
 */
export function __resetReuseInstanceRegistry(): void {
  registry.forEach((entry) => {
    if (entry.graceTimer) {
      clearTimeout(entry.graceTimer);
    }
  });
  registry.clear();
}
