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
// import {
//   ImmediatePriority as ImmediateSchedulerPriority,
//   UserBlockingPriority as UserBlockingSchedulerPriority,
//   NormalPriority as NormalSchedulerPriority,
//   IdlePriority as IdleSchedulerPriority,
//   log,
//   unstable_setDisableYieldValue,
// } from './Scheduler';

declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: Object | void;

let rendererID = null;
let injectedHook = null;
let injectedProfilingHooks: DevToolsProfilingHooks | null = null;
let hasLoggedError = false;

export const isDevToolsPresent =
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
