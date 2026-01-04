/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import type {SuspendedReason} from './ReactFiberWorkLoop';

import type {Lane, Lanes} from './ReactFiberLane';

import type {CapturedValue} from './ReactCapturedValue';

// import {
//   isTransitionLane,
//   isBlockingLane,
//   isGestureRender,
//   includesTransitionLane,
//   includesBlockingLane,
//   NoLanes,
// } from './ReactFiberLane';

// import {resolveEventType, resolveEventTimeStamp} from './ReactFiberConfig';

import {
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableProfilerTimer,
  enableComponentPerformanceTrack,
} from 'shared/ReactFeatureFlags';

import getComponentNameFromFiber from './getComponentNameFromFiber';
// import {isAlreadyRendering} from './ReactFiberWorkLoop';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

export function startUpdateTimerByLane(
  lane: Lane,
  method: string,
  fiber: Fiber | null,
): void {
  if (!enableProfilerTimer || !enableComponentPerformanceTrack) {
    return;
  }
  throw new Error('Not implemented');
}
