/*
 *  Copyright IBM Corp. 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

// This spec is intentionally focused on compile-time checks.
// If any of the type assertions fail, ts-jest will surface a
// compilation error and fail the test suite.
//
// `PublicConfig` is split into a core half a headless consumer supplies and a
// shell half that configures the shipped UI. The split has to stay a pure
// reorganization: `PublicConfig` keeps every field it had, at the type it had,
// so existing consumers compile untouched.
//
// `_AssertTableCoversPublicConfig` in `src/web-components/shared/flattenedPublicConfig.ts`
// already pins `keyof PublicConfig` against the flattened-prop table, so a field
// dropped from or added to the top level breaks the build there. What it cannot
// see is the nested `messaging` object — the one place the boundary runs through
// a child config rather than between top-level fields — or whether the halves
// stay projectable. Those are what this spec holds.

import type {
  ChatCoreConfig,
  ChatShellConfig,
  PublicConfig,
} from '../../../src/types/config/PublicConfig';
import type {
  ChatCoreConfigMessaging,
  ChatShellConfigMessaging,
  PublicConfigMessaging,
} from '../../../src/types/config/PublicConfigMessaging';

// Utility types for compile-time assertions, matching `exports_compat_spec.ts`.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type AssertTrue<T extends true> = T;

// 1) Every top-level field lands in exactly one half — no field is dropped, and
//    none is declared on both. `messaging` is the sole deliberate exception: it
//    is the nested config the boundary runs through, so both halves carry it.
type SharedTopLevelKeys = Extract<keyof ChatCoreConfig, keyof ChatShellConfig>;
type _OnlyMessagingIsShared = AssertTrue<
  Equals<SharedTopLevelKeys, 'messaging'>
>;

type _HalvesCoverPublicConfig = AssertTrue<
  Equals<keyof ChatCoreConfig | keyof ChatShellConfig, keyof PublicConfig>
>;

// 2) The same holds one level down, for the messaging halves.
type _MessagingHalvesAreDisjoint = AssertTrue<
  Equals<
    Extract<keyof ChatCoreConfigMessaging, keyof ChatShellConfigMessaging>,
    never
  >
>;

type _MessagingHalvesRecompose = AssertTrue<
  Equals<
    keyof ChatCoreConfigMessaging | keyof ChatShellConfigMessaging,
    keyof PublicConfigMessaging
  >
>;

// 3) `PublicConfig.messaging` is still the full messaging type, not a half. This
//    is what the `extends` clause alone would get wrong: without the explicit
//    redeclaration on `PublicConfig`, TypeScript rejects the two halves as
//    conflicting declarations of the same property (TS2320).
type _PublicMessagingIsWhole = AssertTrue<
  Equals<PublicConfig['messaging'], PublicConfigMessaging | undefined>
>;

// 4) A `PublicConfig` is usable as either half — the projection the shells will
//    need to route the core subset down to `acquireChatSDK` while keeping the
//    shell half for themselves (issue #1834). Kept type-level rather than an
//    annotated value, so nothing here emits runtime code.
type _CoreIsProjectable = AssertTrue<
  PublicConfig extends ChatCoreConfig ? true : false
>;
type _ShellIsProjectable = AssertTrue<
  PublicConfig extends ChatShellConfig ? true : false
>;

// Keep a minimal runtime test so Jest reports a passing spec when compilation succeeds.
describe('PublicConfig core/shell split', () => {
  it('compiles with the two halves recomposing to the original type', () => {
    // A config literal mixing both halves — including a `messaging` object whose
    // fields straddle the boundary — is what every existing consumer passes today.
    const config: PublicConfig = {
      namespace: 'core-side',
      launcher: { isOn: true },
      messaging: {
        customSendMessage: () => Promise.resolve(),
        showStopButtonImmediately: true,
      },
    };

    expect(config.namespace).toBe('core-side');
    expect(config.messaging?.showStopButtonImmediately).toBe(true);
  });
});
