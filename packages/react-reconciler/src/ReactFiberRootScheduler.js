/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {Lane, Lanes} from './ReactFiberLane';
import type {PriorityLevel} from 'scheduler/src/SchedulerPriorities';
import type {Transition} from 'react/src/ReactStartTransition';

import {
  disableLegacyMode,
  disableSchedulerTimeoutInWorkLoop,
  enableProfilerTimer,
  enableProfilerNestedUpdatePhase,
  enableComponentPerformanceTrack,
  enableYieldingBeforePassive,
  enableGestureTransition,
  enableDefaultTransitionIndicator,
} from 'shared/ReactFeatureFlags';
import {
  NoLane,
  NoLanes,
  SyncLane,
  DefaultLane,
  // getHighestPriorityLane,
  // getNextLanes,
  // includesSyncLane,
  // markStarvedLanesAsExpired,
  // claimNextTransitionUpdateLane,
  // getNextLanesToFlushSync,
  // checkIfRootIsPrerendering,
  // isGestureRender,
} from './ReactFiberLane';
import {
  CommitContext,
  NoContext,
  RenderContext,
  // flushPendingEffects,
  // flushPendingEffectsDelayed,
  // getExecutionContext,
  // getWorkInProgressRoot,
  // getWorkInProgressRootRenderLanes,
  // getRootWithPendingPassiveEffects,
  // getPendingPassiveEffectsLanes,
  // hasPendingCommitEffects,
  // isWorkLoopSuspendedOnData,
  // performWorkOnRoot,
} from './ReactFiberWorkLoop';
import {LegacyRoot} from './ReactRootTags';
import {
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  // cancelCallback as Scheduler_cancelCallback,
  // scheduleCallback as Scheduler_scheduleCallback,
  now,
} from './Scheduler';
import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  // lanesToEventPriority,
} from './ReactEventPriorities';
import {
  supportsMicrotasks,
  scheduleMicrotask,
  // shouldAttemptEagerTransition,
  // trackSchedulerEvent,
  noTimeout,
} from './ReactFiberConfig';

import ReactSharedInternals from 'shared/ReactSharedInternals';
// import {
//   resetNestedUpdateFlag,
//   syncNestedUpdateFlag,
// } from './ReactProfilerTimer';
// import {peekEntangledActionLane} from './ReactFiberAsyncAction';

import noop from 'shared/noop';
// import reportGlobalError from 'shared/reportGlobalError';

// import {
//   startIsomorphicDefaultIndicatorIfNeeded,
//   hasOngoingIsomorphicIndicator,
//   retainIsomorphicIndicator,
//   markIsomorphicIndicatorHandled,
// } from './ReactFiberAsyncAction';

// A linked list of all the roots with pending work. In an idiomatic app,
// there's only a single root, but we do support multi root apps, hence this
// extra complexity. But this module is optimized for the single root case.
export let firstScheduledRoot: FiberRoot | null = null;
let lastScheduledRoot: FiberRoot | null = null;

// Used to prevent redundant mircotasks from being scheduled.
let didScheduleMicrotask: boolean = false;
// `act` "microtasks" are scheduled on the `act` queue instead of an actual
// microtask, so we have to dedupe those separately. This wouldn't be an issue
// if we required all `act` calls to be awaited, which we might in the future.
let didScheduleMicrotask_act: boolean = false;

// Used to quickly bail out of flushSync if there's no sync work to do.
let mightHavePendingSyncWork: boolean = false;

let isFlushingWork: boolean = false;

let currentEventTransitionLane: Lane = NoLane;

export function ensureRootIsScheduled(root: FiberRoot): void {
  // 每当某个 root 接收到一次更新时，都会调用这个函数。
  // 它做两件事情：
  // 1）确保这个 root 已经被加入到 root 调度队列中；
  // 2）确保已经存在一个待执行的 microtask，用来处理 root 调度队列。
  //
  // 实际的大部分调度逻辑，
  // 都要等到 `scheduleTaskForRootDuringMicrotask` 执行时才会发生。

  // This function is called whenever a root receives an update. It does two
  // things 1) it ensures the root is in the root schedule, and 2) it ensures
  // there's a pending microtask to process the root schedule.
  //
  // Most of the actual scheduling logic does not happen until
  // `scheduleTaskForRootDuringMicrotask` runs.

  // 把当前 root 加入调度队列
  // Add the root to the schedule
  // 如果这个 root 已经是队列尾部，或者它已经在链表里（next 非空）
  if (root === lastScheduledRoot || root.next !== null) {
    // 快速路径，不用重复加入
    // Fast path. This root is already scheduled.
  }
  // 否则需要入队
  else {
    // 如果队列为空
    if (lastScheduledRoot === null) {
      // 让 first 和 last 都指向这个 root，初始化链表
      firstScheduledRoot = lastScheduledRoot = root;
    } else {
      // 把当前 root 挂到链表尾部
      lastScheduledRoot.next = root;
      // 更新尾指针为当前 root
      lastScheduledRoot = root;
    }
  }

  // 每当某个 root 接收到一次更新时，
  // 我们就会把这个标志设置为 true，
  // 并一直保持到下一次处理调度队列为止。
  // 如果这个标志是 false，
  // 那么我们就可以在不查看调度队列的情况下，
  // 快速地从 flushSync 中直接退出。

  // Any time a root received an update, we set this to true until the next time
  // we process the schedule. If it's false, then we can quickly exit flushSync
  // without consulting the schedule.
  mightHavePendingSyncWork = true;

  ensureScheduleIsScheduled();

  if (
    __DEV__ &&
    !disableLegacyMode &&
    ReactSharedInternals.isBatchingLegacy &&
    root.tag === LegacyRoot
  ) {
    // Special `act` case: Record whenever a legacy update is scheduled.
    ReactSharedInternals.didScheduleLegacyUpdate = true;
  }
}

export function ensureScheduleIsScheduled(): void {
  // 在当前事件结束时，
  // 遍历所有的 root，
  // 并确保为每一个 root 都已经按照正确的优先级
  // 安排了一个对应的任务（task）。

  // At the end of the current event, go through each of the roots and ensure
  // there's a task scheduled for each one at the correct priority.
  if (__DEV__ && ReactSharedInternals.actQueue !== null) {
    // We're inside an `act` scope.
    if (!didScheduleMicrotask_act) {
      // didScheduleMicrotask_act = true;
      // scheduleImmediateRootScheduleTask();
      throw new Error('Not implemented');
    }
  } else {
    if (!didScheduleMicrotask) {
      didScheduleMicrotask = true;
      scheduleImmediateRootScheduleTask();
    }
  }
}

function scheduleImmediateRootScheduleTask() {
  if (__DEV__ && ReactSharedInternals.actQueue !== null) {
    throw new Error('Not implemented');
  }

  // TODO：我们能否正式落地（启用） supportsMicrotasks？
  // 哪些运行环境并不支持它？
  // 或者，是否可以把这项检查移动到 host config 里？

  // TODO: Can we land supportsMicrotasks? Which environments don't support it?
  // Alternatively, can we move this check to the host config?
  if (supportsMicrotasks) {
    scheduleMicrotask(() => {
      throw new Error('Not implemented');
    });
  } else {
    throw new Error('Not implemented');
  }
}
