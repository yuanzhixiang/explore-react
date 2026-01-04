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
  getNextLanes,
  // includesSyncLane,
  markStarvedLanesAsExpired,
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
  getExecutionContext,
  getWorkInProgressRoot,
  getWorkInProgressRootRenderLanes,
  getRootWithPendingPassiveEffects,
  getPendingPassiveEffectsLanes,
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
      // 在 Safari 中，向 DOM 里追加一个 iframe 会强制触发 microtask 的执行。
      // https://github.com/facebook/react/issues/22459
      // 我们不支持在 render 或 commit 的过程中执行回调，
      // 因此需要对此进行检查和防护。

      // In Safari, appending an iframe forces microtasks to run.
      // https://github.com/facebook/react/issues/22459
      // We don't support running callbacks in the middle of render
      // or commit so we need to check against that.
      const executionContext = getExecutionContext();
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error('Not implemented');
      }
      processRootScheduleInMicrotask();
    });
  } else {
    throw new Error('Not implemented');
  }
}

function processRootScheduleInMicrotask() {
  // This function is always called inside a microtask. It should never be
  // called synchronously.
  didScheduleMicrotask = false;
  if (__DEV__) {
    didScheduleMicrotask_act = false;
  }

  // We'll recompute this as we iterate through all the roots and schedule them.
  mightHavePendingSyncWork = false;

  let syncTransitionLanes = NoLanes;
  if (currentEventTransitionLane !== NoLane) {
    throw new Error('Not implemented');
  }

  const currentTime = now();

  let prev = null;
  let root = firstScheduledRoot;
  while (root !== null) {
    const next = root.next;
    const nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
    if (nextLanes === NoLane) {
      throw new Error('Not implemented');
    } else {
      throw new Error('Not implemented');
    }
  }
  throw new Error('Not implemented');
}

function scheduleTaskForRootDuringMicrotask(
  root: FiberRoot,
  currentTime: number,
): Lane {
  // 这个函数总是在 microtask 中被调用，
  // 或者是在一次渲染任务结束的最后阶段、
  // 在即将把控制权让回主线程之前被调用。
  // 它绝不应该以同步方式被调用。
  // This function is always called inside a microtask, or at the very end of a
  // rendering task right before we yield to the main thread. It should never be
  // called synchronously.

  // 这个函数本身也从不以同步方式执行任何 React 工作；
  // 它只负责安排（schedule）之后要执行的工作，
  // 而这些工作会在另一个 task 或 microtask 中完成。
  // This function also never performs React work synchronously; it should
  // only schedule work to be performed later, in a separate task or microtask.

  // 检查是否有某些 lanes 被其他工作长期挤压（starved）。
  // 如果有，就把它们标记为已过期（expired），
  // 以便我们知道接下来应该优先处理这些 lanes。
  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.
  // 取出当前还有待处理 passive effects（useEffect） 的根节点
  const rootWithPendingPassiveEffects = getRootWithPendingPassiveEffects();
  // 取出这些待处理 passive effects 所在的 lanes（优先级通道集合）
  const pendingPassiveEffectsLanes = getPendingPassiveEffectsLanes();
  // 取出当前正在渲染中的 root（WIP root）
  const workInProgressRoot = getWorkInProgressRoot();
  // 取出当前这次渲染使用的 lanes 集合
  const workInProgressRootRenderLanes = getWorkInProgressRootRenderLanes();
  // 计算当前 root 是否还有待提交的状态
  const rootHasPendingCommit =
    // 如果有取消提交的回调，或有未清的超时句柄，就认为有 pending commit
    root.cancelPendingCommit !== null || root.timeoutHandle !== noTimeout;
  // 计算下一批要调度的 lanes
  const nextLanes =
    // 如果开启了在 passive effects 前让出的特性，并且当前 root 就是那个有 pending passive effects 的 root
    enableYieldingBeforePassive && root === rootWithPendingPassiveEffects
      ? // 这里会按照对应 lane 的优先级来调度这个回调，
        // 但我们过去一直是用 NormalPriority 来调度的。
        // 对于 Discrete（离散）更新来说，反正都会同步 flush，
        // 所以其实没有区别。
        // 真正有区别的只有 Idle，
        // 而且仅仅因为我们已经过了 commit 阶段，
        // 就把一个 Idle 的工作升级到比更重要的事情还高的优先级，
        // 这看起来并不一定是合理的。

        // This will schedule the callback at the priority of the lane but we used to
        // always schedule it at NormalPriority. Discrete will flush it sync anyway.
        // So the only difference is Idle and it doesn't seem necessarily right for that
        // to get upgraded beyond something important just because we're past commit.

        // 那就直接用 pending passive effects 的 lanes 来调度
        pendingPassiveEffectsLanes
      : // 否则走常规逻辑，通过 getNextLanes 计算
        getNextLanes(
          // 传入当前 root
          root,
          // 如果当前 root 正在渲染，传入正在渲染的 lanes；否则传 NoLanes
          root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
          // 传入是否存在 pending commit 的标志
          rootHasPendingCommit,
        );

  const existingCallbackNode = root.callbackNode;
  throw new Error('Not implemented');
}
