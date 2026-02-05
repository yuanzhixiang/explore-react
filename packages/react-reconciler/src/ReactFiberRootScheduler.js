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
  getHighestPriorityLane,
  getNextLanes,
  includesSyncLane,
  markStarvedLanesAsExpired,
  // claimNextTransitionUpdateLane,
  // getNextLanesToFlushSync,
  checkIfRootIsPrerendering,
  isGestureRender,
} from './ReactFiberLane';
import {
  CommitContext,
  NoContext,
  RenderContext,
  flushPendingEffects,
  flushPendingEffectsDelayed,
  getExecutionContext,
  getWorkInProgressRoot,
  getWorkInProgressRootRenderLanes,
  getRootWithPendingPassiveEffects,
  getPendingPassiveEffectsLanes,
  hasPendingCommitEffects,
  isWorkLoopSuspendedOnData,
  performWorkOnRoot,
} from './ReactFiberWorkLoop';
import {LegacyRoot} from './ReactRootTags';
import {
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  // cancelCallback as Scheduler_cancelCallback,
  scheduleCallback as Scheduler_scheduleCallback,
  now,
} from './Scheduler';
import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  lanesToEventPriority,
} from './ReactEventPriorities';
import {
  supportsMicrotasks,
  scheduleMicrotask,
  // shouldAttemptEagerTransition,
  trackSchedulerEvent,
  noTimeout,
} from './ReactFiberConfig';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  resetNestedUpdateFlag,
  syncNestedUpdateFlag,
} from './ReactProfilerTimer';
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
      // This root has no more pending work. Remove it from the schedule. To
      // guard against subtle reentrancy bugs, this microtask is the only place
      // we do this — you can add roots to the schedule whenever, but you can
      // only remove them here.

      // Null this out so we know it's been removed from the schedule.
      root.next = null;
      if (prev === null) {
        // This is the new head of the list
        firstScheduledRoot = next;
      } else {
        prev.next = next;
      }
      if (next === null) {
        // This is the new tail of the list
        lastScheduledRoot = prev;
      }
    } else {
      // This root still has work. Keep it in the list.
      // 保留这个 root 在链表中，因为它还有待处理的工作
      prev = root;

      // This is a fast-path optimization to early exit from
      // flushSyncWorkOnAllRoots if we can be certain that there is no remaining
      // synchronous work to perform. Set this to true if there might be sync
      // work left.
      if (
        // Skip the optimization if syncTransitionLanes is set
        // 有 transition 被当作同步处理
        syncTransitionLanes !== NoLanes ||
        // Common case: we're not treating any extra lanes as synchronous, so we
        // can just check if the next lanes are sync.
        // 下一个要处理的 lanes 包含同步优先级
        includesSyncLane(nextLanes) ||
        // 是手势渲染（需要同步响应）
        (enableGestureTransition && isGestureRender(nextLanes))
      ) {
        // mightHavePendingSyncWork 优化 - 这是一个快速路径优化标志：
        // - 用于 flushSyncWorkOnAllRoots 函数提前退出
        // - 如果能确定没有同步工作需要执行，就可以跳过不必要的遍历
        mightHavePendingSyncWork = true;
      }
    }
    root = next;
  }

  // At the end of the microtask, flush any pending synchronous work. This has
  // to come at the end, because it does actual rendering work that might throw.
  // If we're in the middle of a View Transition async sequence, we don't want to
  // interrupt that sequence. Instead, we'll flush any remaining work when it
  // completes.
  if (!hasPendingCommitEffects()) {
    flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
  }

  if (currentEventTransitionLane !== NoLane) {
    // Reset Event Transition Lane so that we allocate a new one next time.
    currentEventTransitionLane = NoLane;
    startDefaultTransitionIndicatorIfNeeded();
  }
}

function startDefaultTransitionIndicatorIfNeeded() {
  if (!enableDefaultTransitionIndicator) {
    return;
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

  if (
    // Check if there's nothing to work on
    nextLanes === NoLanes ||
    // If this root is currently suspended and waiting for data to resolve, don't
    // schedule a task to render it. We'll either wait for a ping, or wait to
    // receive an update.
    //
    // Suspended render phase
    (root === workInProgressRoot && isWorkLoopSuspendedOnData()) ||
    // Suspended commit phase
    root.cancelPendingCommit !== null
  ) {
    // Fast path: There's nothing to work on.
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return NoLane;
  }

  // Schedule a new callback in the host environment.
  if (
    includesSyncLane(nextLanes) &&
    // If we're prerendering, then we should use the concurrent work loop
    // even if the lanes are synchronous, so that prerendering never blocks
    // the main thread.
    !checkIfRootIsPrerendering(root, nextLanes)
  ) {
    // Synchronous work is always flushed at the end of the microtask, so we
    // don't need to schedule an additional task.
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    root.callbackPriority = SyncLane;
    root.callbackNode = null;
    return SyncLane;
  } else {
    // We use the highest priority lane to represent the priority of the callback.
    const existingCallbackPriority = root.callbackPriority;
    const newCallbackPriority = getHighestPriorityLane(nextLanes);

    if (
      newCallbackPriority === existingCallbackPriority &&
      // Special case related to `act`. If the currently scheduled task is a
      // Scheduler task, rather than an `act` task, cancel it and re-schedule
      // on the `act` queue.
      !(
        __DEV__ &&
        ReactSharedInternals.actQueue !== null &&
        existingCallbackNode !== fakeActCallbackNode
      )
    ) {
      // The priority hasn't changed. We can reuse the existing task.
      return newCallbackPriority;
    } else {
      // Cancel the existing callback. We'll schedule a new one below.
      cancelCallback(existingCallbackNode);
    }

    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      // Scheduler does have an "ImmediatePriority", but now that we use
      // microtasks for sync work we no longer use that. Any sync work that
      // reaches this path is meant to be time sliced.
      case DiscreteEventPriority:
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }

    const newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performWorkOnRootViaSchedulerTask.bind(null, root),
    );

    root.callbackPriority = newCallbackPriority;
    root.callbackNode = newCallbackNode;
    return newCallbackPriority;
  }
}

function cancelCallback(callbackNode: mixed) {
  if (__DEV__ && callbackNode === fakeActCallbackNode) {
    // Special `act` case: check if this is the fake callback node used by
    // the `act` implementation.
  } else if (callbackNode !== null) {
    throw new Error('Not implemented');
  }
}

type RenderTaskFn = (didTimeout: boolean) => RenderTaskFn | null;

function performWorkOnRootViaSchedulerTask(
  root: FiberRoot,
  didTimeout: boolean,
): RenderTaskFn | null {
  // This is the entry point for concurrent tasks scheduled via Scheduler (and
  // postTask, in the future).

  // 重置嵌套更新标记
  if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
    resetNestedUpdateFlag();
  }

  // 记录当前正在执行的 Scheduler 事件
  if (enableProfilerTimer && enableComponentPerformanceTrack) {
    // Track the currently executing event if there is one so we can ignore this
    // event when logging events.
    trackSchedulerEvent();
  }

  // 检查是否有待处理的 commit 副作用（正在进行异步提交）
  if (hasPendingCommitEffects()) {
    // 前正处于异步 commit 中，比如 View Transition（视图过渡动画）。
    // 可以强制立即执行，但延迟到异步 commit 完成后再做更好。

    // We are currently in the middle of an async committing (such as a View Transition).
    // We could force these to flush eagerly but it's better to defer any work until
    // it finishes. This may not be the same root as we're waiting on.

    // 正在等待的 root 可能不是当前这个 root（多个 React 根节点的情况）。
    // TODO: This relies on the commit eventually calling ensureRootIsScheduled which
    // always calls processRootScheduleInMicrotask which in turn always loops through
    // all the roots to figure out. This is all a bit inefficient and if optimized
    // it'll need to consider rescheduling a task for any skipped roots.
    // 清空当前 root 的调度信息
    root.callbackNode = null; // 取消当前调度的任务
    root.callbackPriority = NoLane; // 重置优先级
    return null;
  }

  // 在渲染前先执行待处理的 passive effects（比如 useEffect）
  // 在决定处理哪些 lanes 之前，先执行待处理的 passive effects，因为它们可能会调度额外的工作
  // Flush any pending passive effects before deciding which lanes to work on,
  // in case they schedule additional work.

  // 保存当前的 callbackNode（当前调度任务的引用），用于后面比较
  const originalCallbackNode = root.callbackNode;
  // 执行待处理的 passive effects（useEffect 回调）。返回值表示是否真的执行了
  const didFlushPassiveEffects = flushPendingEffectsDelayed();
  // 如果确实执行了 passive effects，需要做检查
  if (didFlushPassiveEffects) {
    // Something in the passive effect phase may have canceled the current task.
    // Check if the task node for this root was changed.
    // 检查 callbackNode 是否变了
    /*
      // useEffect 里可能这样：
      useEffect(() => {
        setState(newValue);  // 触发新的调度，可能改变 callbackNode
      }, []);
    */
    // 如果 callbackNode 变了，说明要么有新任务被调度了（会用新的 callbackNode），要么没有剩余工作了
    if (root.callbackNode !== originalCallbackNode) {
      // The current task was canceled. Exit. We don't need to call
      // `ensureRootIsScheduled` because the check above implies either that
      // there's a new task, or that there's no remaining work on this root.
      // 直接返回 null，当前任务作废。
      return null;
    } else {
      // Current task was not canceled. Continue.
    }
  }

  // Determine the next lanes to work on, using the fields stored on the root.
  // TODO: We already called getNextLanes when we scheduled the callback; we
  // should be able to avoid calling it again by stashing the result on the
  // root object. However, because we always schedule the callback during
  // a microtask (scheduleTaskForRootDuringMicrotask), it's possible that
  // an update was scheduled earlier during this same browser task (and
  // therefore before the microtasks have run). That's because Scheduler batches
  // together multiple callbacks into a single browser macrotask, without
  // yielding to microtasks in between. We should probably change this to align
  // with the postTask behavior (and literally use postTask when
  // it's available).
  const workInProgressRoot = getWorkInProgressRoot();
  const workInProgressRootRenderLanes = getWorkInProgressRootRenderLanes();
  const rootHasPendingCommit =
    root.cancelPendingCommit !== null || root.timeoutHandle !== noTimeout;
  const lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
    rootHasPendingCommit,
  );
  if (lanes === NoLanes) {
    // No more work on this root.
    return null;
  }

  // Enter the work loop.
  // TODO: We only check `didTimeout` defensively, to account for a Scheduler
  // bug we're still investigating. Once the bug in Scheduler is fixed,
  // we can remove this, since we track expiration ourselves.
  const forceSync = !disableSchedulerTimeoutInWorkLoop && didTimeout;
  performWorkOnRoot(root, lanes, forceSync);

  // The work loop yielded, but there may or may not be work left at the current
  // priority. Need to determine whether we need to schedule a continuation.
  // Usually `scheduleTaskForRootDuringMicrotask` only runs inside a microtask;
  // however, since most of the logic for determining if we need a continuation
  // versus a new task is the same, we cheat a bit and call it here. This is
  // only safe to do because we know we're at the end of the browser task.
  // So although it's not an actual microtask, it might as well be.
  scheduleTaskForRootDuringMicrotask(root, now());
  if (root.callbackNode != null && root.callbackNode === originalCallbackNode) {
    // The task node scheduled for this root is the same one that's
    // currently executed. Need to return a continuation.
    return performWorkOnRootViaSchedulerTask.bind(null, root);
  }
  return null;
}

const fakeActCallbackNode = {};

function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: RenderTaskFn,
) {
  if (__DEV__ && ReactSharedInternals.actQueue !== null) {
    // Special case: We're inside an `act` scope (a testing utility).
    // Instead of scheduling work in the host environment, add it to a
    // fake internal queue that's managed by the `act` implementation.
    ReactSharedInternals.actQueue.push(callback);
    return fakeActCallbackNode;
  } else {
    return Scheduler_scheduleCallback(priorityLevel, callback);
  }
}

function flushSyncWorkAcrossRoots_impl(
  syncTransitionLanes: Lanes | Lane,
  onlyLegacy: boolean,
) {
  if (isFlushingWork) {
    // Prevent reentrancy.
    // TODO: Is this overly defensive? The callers must check the execution
    // context first regardless.
    return;
  }

  if (!mightHavePendingSyncWork) {
    // Fast path. There's no sync work to do.
    return;
  }

  // There may or may not be synchronous work scheduled. Let's check.
  let didPerformSomeWork;
  isFlushingWork = true;
  do {
    didPerformSomeWork = false;
    let root = firstScheduledRoot;
    while (root !== null) {
      if (onlyLegacy && (disableLegacyMode || root.tag !== LegacyRoot)) {
        // Skip non-legacy roots.
      } else {
        if (syncTransitionLanes !== NoLanes) {
          throw new Error('Not implemented');
        } else {
          const workInProgressRoot = getWorkInProgressRoot();
          const workInProgressRootRenderLanes =
            getWorkInProgressRootRenderLanes();
          const rootHasPendingCommit =
            root.cancelPendingCommit !== null ||
            root.timeoutHandle !== noTimeout;
          const nextLanes = getNextLanes(
            root,
            root === workInProgressRoot
              ? workInProgressRootRenderLanes
              : NoLanes,
            rootHasPendingCommit,
          );
          if (
            (includesSyncLane(nextLanes) ||
              (enableGestureTransition && isGestureRender(nextLanes))) &&
            !checkIfRootIsPrerendering(root, nextLanes)
          ) {
            // This root has pending sync work. Flush it now.
            didPerformSomeWork = true;
            performSyncWorkOnRoot(root, nextLanes);
          }
        }
      }
      root = root.next;
    }
  } while (didPerformSomeWork);
  isFlushingWork = false;
}

function performSyncWorkOnRoot(root: FiberRoot, lanes: Lanes) {
  // This is the entry point for synchronous tasks that don't go
  // through Scheduler.
  const didFlushPassiveEffects = flushPendingEffects();
  if (didFlushPassiveEffects) {
    // If passive effects were flushed, exit to the outer work loop in the root
    // scheduler, so we can recompute the priority.
    return null;
  }
  if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
    syncNestedUpdateFlag();
  }
  const forceSync = true;
  performWorkOnRoot(root, lanes, forceSync);
}

export function flushSyncWorkOnAllRoots() {
  // This is allowed to be called synchronously, but the caller should check
  // the execution context first.
  flushSyncWorkAcrossRoots_impl(NoLanes, false);
}

export function markIndicatorHandled(root: FiberRoot): void {
  if (enableDefaultTransitionIndicator) {
    // The current transition event rendered a synchronous loading state.
    // Clear it from the indicator lanes. We don't need to show a separate
    // loading state for this lane.
    root.indicatorLanes &= ~currentEventTransitionLane;
    // markIsomorphicIndicatorHandled();
    throw new Error('Not implemented yet.');
  }
}
