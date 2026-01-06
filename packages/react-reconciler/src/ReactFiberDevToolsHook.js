/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lane, Lanes} from './ReactFiberLane';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {ReactNodeList, Wakeable} from 'shared/ReactTypes';
// import type {EventPriority} from './ReactEventPriorities';
// import type {DevToolsProfilingHooks} from 'react-devtools-shared/src/backend/types';
// TODO: This import doesn't work because the DevTools depend on the DOM version of React
// and to properly type check against DOM React we can't also type check again non-DOM
// React which this hook might be in.
type DevToolsProfilingHooks = any;

import {DidCapture} from './ReactFiberFlags';
import {
  enableProfilerTimer,
  enableSchedulingProfiler,
} from 'shared/ReactFeatureFlags';
// import {
//   DiscreteEventPriority,
//   ContinuousEventPriority,
//   DefaultEventPriority,
//   IdleEventPriority,
// } from './ReactEventPriorities';
import {
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  log,
  // unstable_setDisableYieldValue,
} from './Scheduler';

declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: Object | void;

let rendererID = null;
let injectedHook = null;
let injectedProfilingHooks: DevToolsProfilingHooks | null = null;
let hasLoggedError = false;

export const isDevToolsPresent =
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';

export function onScheduleRoot(root: FiberRoot, children: ReactNodeList) {
  if (__DEV__) {
    if (
      injectedHook &&
      typeof injectedHook.onScheduleFiberRoot === 'function'
    ) {
      try {
        injectedHook.onScheduleFiberRoot(rendererID, root, children);
      } catch (err) {
        if (__DEV__ && !hasLoggedError) {
          hasLoggedError = true;
          console.error('React instrumentation encountered an error: %o', err);
        }
      }
    }
  }
}

export function markRenderScheduled(lane: Lane): void {
  if (enableSchedulingProfiler) {
    if (
      injectedProfilingHooks !== null &&
      typeof injectedProfilingHooks.markRenderScheduled === 'function'
    ) {
      injectedProfilingHooks.markRenderScheduled(lane);
    }
  }
}

export function markRenderStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (
      injectedProfilingHooks !== null &&
      typeof injectedProfilingHooks.markRenderStarted === 'function'
    ) {
      injectedProfilingHooks.markRenderStarted(lanes);
    }
  }
}

export function setIsStrictModeForDevtools(newIsStrictMode: boolean) {
  if (typeof log === 'function') {
    // We're in a test because Scheduler.log only exists
    // in SchedulerMock. To reduce the noise in strict mode tests,
    // suppress warnings and disable scheduler yielding during the double render

    // 这个只是用来测试的，没专门设置不会走到这里
    // unstable_setDisableYieldValue(newIsStrictMode);
    throw new Error('Not implemented');
  }

  if (injectedHook && typeof injectedHook.setStrictMode === 'function') {
    try {
      injectedHook.setStrictMode(rendererID, newIsStrictMode);
    } catch (err) {
      if (__DEV__) {
        if (!hasLoggedError) {
          hasLoggedError = true;
          console.error('React instrumentation encountered an error: %o', err);
        }
      }
    }
  }
}
