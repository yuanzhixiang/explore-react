/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
  ReactIOInfo,
} from 'shared/ReactTypes';

import type {LazyComponent as LazyComponentType} from 'react/src/ReactLazy';

// import {callLazyInitInDEV} from './ReactFiberCallUserSpace';

import {getWorkInProgressRoot} from './ReactFiberWorkLoop';

import ReactSharedInternals from 'shared/ReactSharedInternals';

import {enableAsyncDebugInfo} from 'shared/ReactFeatureFlags';

import noop from 'shared/noop';

opaque type ThenableStateDev = {
  didWarnAboutUncachedPromise: boolean,
  thenables: Array<Thenable<any>>,
};

opaque type ThenableStateProd = Array<Thenable<any>>;

export opaque type ThenableState = ThenableStateDev | ThenableStateProd;

// An error that is thrown (e.g. by `use`) to trigger Suspense. If we
// detect this is caught by userspace, we'll log a warning in development.
export const SuspenseException: mixed = new Error(
  "Suspense Exception: This is not a real error! It's an implementation " +
    'detail of `use` to interrupt the current render. You must either ' +
    'rethrow it immediately, or move the `use` call outside of the ' +
    '`try/catch` block. Capturing without rethrowing will lead to ' +
    'unexpected behavior.\n\n' +
    'To handle async errors, wrap your component in an error boundary, or ' +
    "call the promise's `.catch` method and pass the result to `use`.",
);

export const SuspenseyCommitException: mixed = new Error(
  'Suspense Exception: This is not a real error, and should not leak into ' +
    "userspace. If you're seeing this, it's likely a bug in React.",
);

export const SuspenseActionException: mixed = new Error(
  "Suspense Exception: This is not a real error! It's an implementation " +
    'detail of `useActionState` to interrupt the current render. You must either ' +
    'rethrow it immediately, or move the `useActionState` call outside of the ' +
    '`try/catch` block. Capturing without rethrowing will lead to ' +
    'unexpected behavior.\n\n' +
    'To handle async errors, wrap your component in an error boundary.',
);

export function resolveLazy<T>(lazyType: LazyComponentType<T, any>): T {
  try {
    if (__DEV__) {
      // return callLazyInitInDEV(lazyType);
      throw new Error('Not implemented yet.');
    }
    const payload = lazyType._payload;
    const init = lazyType._init;
    return init(payload);
  } catch (x) {
    if (x !== null && typeof x === 'object' && typeof x.then === 'function') {
      // This lazy Suspended. Treat this as if we called use() to unwrap it.
      // suspendedThenable = x;
      // if (__DEV__) {
      //   needsToResetSuspendedThenableDEV = true;
      // }
      // throw SuspenseException;
      throw new Error('Not implemented yet.');
    }
    throw x;
  }
}
