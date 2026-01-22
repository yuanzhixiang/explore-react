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
import {createCursor, push, pop} from './ReactFiberStack';
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

// When retrying a Suspense/Offscreen boundary, we restore the cache that was
// used during the previous render by placing it here, on the stack.
const resumedCache: StackCursor<Cache | null> = createCursor(null);

// During the render/synchronous commit phase, we don't actually process the
// transitions. Therefore, we want to lazily combine transitions. Instead of
// comparing the arrays of transitions when we combine them and storing them
// and filtering out the duplicates, we will instead store the unprocessed transitions
// in an array and actually filter them in the passive phase.
const transitionStack: StackCursor<Array<Transition> | null> =
  createCursor(null);

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

export function popRootTransition(
  workInProgress: Fiber,
  root: FiberRoot,
  renderLanes: Lanes,
) {
  if (enableTransitionTracing) {
    pop(transitionStack, workInProgress);
  }
}

export function popTransition(workInProgress: Fiber, current: Fiber | null) {
  if (current !== null) {
    if (enableTransitionTracing) {
      pop(transitionStack, workInProgress);
    }

    pop(resumedCache, workInProgress);
  }
}
