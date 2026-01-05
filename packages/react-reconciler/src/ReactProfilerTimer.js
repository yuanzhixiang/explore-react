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

/**
 * Tracks whether the current update was a nested/cascading update (scheduled from a layout effect).
 *
 * The overall sequence is:
 *   1. render
 *   2. commit (and call `onRender`, `onCommit`)
 *   3. check for nested updates
 *   4. flush passive effects (and call `onPostCommit`)
 *
 * Nested updates are identified in step 3 above,
 * but step 4 still applies to the work that was just committed.
 * We use two flags to track nested updates then:
 * one tracks whether the upcoming update is a nested update,
 * and the other tracks whether the current update was a nested update.
 * The first value gets synced to the second at the start of the render phase.
 */
// 标记当前正在进行的更新是否是嵌套更新。
let currentUpdateIsNested: boolean = false;
// 标记是否有嵌套更新被调度了（还没开始执行）。
let nestedUpdateScheduled: boolean = false;

// 重置两个标记，通常在一轮完整的更新结束后调用
export function resetNestedUpdateFlag(): void {
  if (enableProfilerNestedUpdatePhase) {
    currentUpdateIsNested = false;
    nestedUpdateScheduled = false;
  }
}

// 在 render 阶段开始时调用
// - 把"预约的嵌套标记"同步到"当前更新标记"
// - 清空预约标记
export function syncNestedUpdateFlag(): void {
  if (enableProfilerNestedUpdatePhase) {
    currentUpdateIsNested = nestedUpdateScheduled;
    nestedUpdateScheduled = false;
  }
}
