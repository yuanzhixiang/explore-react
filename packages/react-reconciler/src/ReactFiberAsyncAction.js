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
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';
import type {Lane} from './ReactFiberLane';
import type {Transition} from 'react/src/ReactStartTransition';

// import {
//   requestTransitionLane,
//   ensureScheduleIsScheduled,
// } from './ReactFiberRootScheduler';
import {NoLane} from './ReactFiberLane';
// import {
//   hasScheduledTransitionWork,
//   clearAsyncTransitionTimer,
// } from './ReactProfilerTimer';
import {
  enableComponentPerformanceTrack,
  enableProfilerTimer,
  enableDefaultTransitionIndicator,
} from 'shared/ReactFeatureFlags';
// import {clearEntangledAsyncTransitionTypes} from './ReactFiberTransitionTypes';

import noop from 'shared/noop';
// import reportGlobalError from 'shared/reportGlobalError';

// If there are multiple, concurrent async actions, they are entangled. All
// transition updates that occur while the async action is still in progress
// are treated as part of the action.
//
// The ideal behavior would be to treat each async function as an independent
// action. However, without a mechanism like AsyncContext, we can't tell which
// action an update corresponds to. So instead, we entangle them all into one.

// The listeners to notify once the entangled scope completes.
let currentEntangledListeners: Array<() => mixed> | null = null;
// The number of pending async actions in the entangled scope.
let currentEntangledPendingCount: number = 0;
// The transition lane shared by all updates in the entangled scope.
let currentEntangledLane: Lane = NoLane;
// A thenable that resolves when the entangled scope completes. It does not
// resolve to a particular value because it's only used for suspending the UI
// until the async action scope has completed.
let currentEntangledActionThenable: Thenable<void> | null = null;

// Track the default indicator for every root. undefined means we haven't
// had any roots registered yet. null means there's more than one callback.
// If there's more than one callback we bailout to not supporting isomorphic
// default indicators.
let isomorphicDefaultTransitionIndicator:
  | void
  | null
  | (() => void | (() => void)) = undefined;
// The clean up function for the currently running indicator.
let pendingIsomorphicIndicator: null | (() => void) = null;
// The number of roots that have pending Transitions that depend on the
// started isomorphic indicator.
let pendingEntangledRoots: number = 0;
let needsIsomorphicIndicator: boolean = false;

// 这里的 Indicator 本质是一个回调函数，@why 后续要看这个东西到底在什么场景下回调
export function registerDefaultIndicator(
  onDefaultTransitionIndicator: () => void | (() => void),
): void {
  // 如果功能开关没开，直接退出，不做任何事
  if (!enableDefaultTransitionIndicator) {
    return;
  }
  // 如果还没注册过（初始值是 undefined），就记录当前这个回调
  if (isomorphicDefaultTransitionIndicator === undefined) {
    isomorphicDefaultTransitionIndicator = onDefaultTransitionIndicator;
  }
  // 如果已经注册过，但这次传进来的回调不是同一个函数引用，说明出现了多个不同的注册者
  else if (
    isomorphicDefaultTransitionIndicator !== onDefaultTransitionIndicator
  ) {
    // 把值设为 null
    isomorphicDefaultTransitionIndicator = null;
    // Stop any on-going indicator since it's now ambiguous.
    // 因为现在回调不唯一，指示器到底该用哪个不清楚，所以停止当前正在运行的指示器
    stopIsomorphicDefaultIndicator();
  }
}

function stopIsomorphicDefaultIndicator() {
  if (!enableDefaultTransitionIndicator) {
    return;
  }
  if (pendingIsomorphicIndicator !== null) {
    const cleanup = pendingIsomorphicIndicator;
    pendingIsomorphicIndicator = null;
    cleanup();
  }
}
