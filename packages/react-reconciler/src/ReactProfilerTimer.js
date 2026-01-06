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

import {
  isTransitionLane,
  // isBlockingLane,
  isGestureRender,
  // includesTransitionLane,
  includesBlockingLane,
  NoLanes,
} from './ReactFiberLane';

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

const {unstable_now: now} = Scheduler;

const createTask =
  // eslint-disable-next-line react-internal/no-production-logging
  __DEV__ && console.createTask
    ? // eslint-disable-next-line react-internal/no-production-logging
      console.createTask
    : (name: string) => null;

export const REGULAR_UPDATE: UpdateType = 0;
export const SPAWNED_UPDATE: UpdateType = 1;
export const PINGED_UPDATE: UpdateType = 2;
export opaque type UpdateType = 0 | 1 | 2;

export let renderStartTime: number = -0;
export let commitStartTime: number = -0;
export let commitEndTime: number = -0;
export let commitErrors: null | Array<CapturedValue<mixed>> = null;
export let profilerStartTime: number = -1.1;
export let profilerEffectDuration: number = -0;
export let componentEffectDuration: number = -0;
export let componentEffectStartTime: number = -1.1;
export let componentEffectEndTime: number = -1.1;
export let componentEffectErrors: null | Array<CapturedValue<mixed>> = null;
export let componentEffectSpawnedUpdate: boolean = false;

export let blockingClampTime: number = -0;
export let blockingUpdateTime: number = -1.1; // First sync setState scheduled.
export let blockingUpdateTask: null | ConsoleTask = null; // First sync setState's stack trace.
export let blockingUpdateType: UpdateType = 0;
export let blockingUpdateMethodName: null | string = null; // The name of the method that caused first sync update.
export let blockingUpdateComponentName: null | string = null; // The name of the component where first sync update happened.
export let blockingEventTime: number = -1.1; // Event timeStamp of the first setState.
export let blockingEventType: null | string = null; // Event type of the first setState.
export let blockingEventRepeatTime: number = -1.1;
export let blockingSuspendedTime: number = -1.1;

export let gestureClampTime: number = -0;
export let gestureUpdateTime: number = -1.1; // First setOptimistic scheduled inside startGestureTransition.
export let gestureUpdateTask: null | ConsoleTask = null; // First sync setState's stack trace.
export let gestureUpdateType: UpdateType = 0;
export let gestureUpdateMethodName: null | string = null; // The name of the method that caused first gesture update.
export let gestureUpdateComponentName: null | string = null; // The name of the component where first gesture update happened.
export let gestureEventTime: number = -1.1; // Event timeStamp of the first setState.
export let gestureEventType: null | string = null; // Event type of the first setState.
export let gestureEventRepeatTime: number = -1.1;
export let gestureSuspendedTime: number = -1.1;

// TODO: This should really be one per Transition lane.
export let transitionClampTime: number = -0;
export let transitionStartTime: number = -1.1; // First startTransition call before setState.
export let transitionUpdateTime: number = -1.1; // First transition setState scheduled.
export let transitionUpdateType: UpdateType = 0;
export let transitionUpdateTask: null | ConsoleTask = null; // First transition setState's stack trace.
export let transitionUpdateMethodName: null | string = null; // The name of the method that caused first transition update.
export let transitionUpdateComponentName: null | string = null; // The name of the component where first transition update happened.
export let transitionEventTime: number = -1.1; // Event timeStamp of the first transition.
export let transitionEventType: null | string = null; // Event type of the first transition.
export let transitionEventRepeatTime: number = -1.1;
export let transitionSuspendedTime: number = -1.1;

export let retryClampTime: number = -0;
export let idleClampTime: number = -0;

export let animatingLanes: Lanes = NoLanes;
export let animatingTask: null | ConsoleTask = null; // First ViewTransition applying an Animation.

export let yieldReason: SuspendedReason = (0: any);
export let yieldStartTime: number = -1.1; // The time when we yielded to the event loop

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

export function startProfilerTimer(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }

  profilerStartTime = now();

  if (((fiber.actualStartTime: any): number) < 0) {
    fiber.actualStartTime = profilerStartTime;
  }
}
