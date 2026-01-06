/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {
  Thenable,
  GestureProvider,
  GestureOptions,
} from 'shared/ReactTypes';
import {NoLane, type Lanes} from './ReactFiberLane';
import type {StackCursor} from './ReactFiberStack';
import type {Cache, SpawnedCachePool} from './ReactFiberCacheComponent';
import type {Transition} from 'react/src/ReactStartTransition';
import type {ScheduledGesture} from './ReactFiberGestureScheduler';

import {
  enableTransitionTracing,
  enableViewTransition,
  enableGestureTransition,
} from 'shared/ReactFeatureFlags';
// import {isPrimaryRenderer} from './ReactFiberConfig';
// import {createCursor, push, pop} from './ReactFiberStack';
// import {
//   getWorkInProgressRoot,
//   getWorkInProgressTransitions,
//   markTransitionStarted,
// } from './ReactFiberWorkLoop';
// import {
//   createCache,
//   retainCache,
//   CacheContext,
// } from './ReactFiberCacheComponent';
// import {
//   queueTransitionTypes,
//   entangleAsyncTransitionTypes,
//   entangledTransitionTypes,
// } from './ReactFiberTransitionTypes';

import ReactSharedInternals from 'shared/ReactSharedInternals';
// import {
//   entangleAsyncAction,
//   peekEntangledActionLane,
// } from './ReactFiberAsyncAction';
// import {startAsyncTransitionTimer} from './ReactProfilerTimer';
// import {firstScheduledRoot} from './ReactFiberRootScheduler';
// import {
//   startScheduledGesture,
//   cancelScheduledGesture,
// } from './ReactFiberGestureScheduler';

export const NoTransition = null;

export function requestCurrentTransition(): Transition | null {
  return ReactSharedInternals.T;
}

export function pushRootTransition(
  workInProgress: Fiber,
  root: FiberRoot,
  renderLanes: Lanes,
) {
  if (enableTransitionTracing) {
    // const rootTransitions = getWorkInProgressTransitions();
    // push(transitionStack, rootTransitions, workInProgress);
    throw new Error('Not implemented yet.');
  }
}
