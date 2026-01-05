/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {Transition} from 'react/src/ReactStartTransition';
import type {ConcurrentUpdate} from './ReactFiberConcurrentUpdates';

// TODO: Ideally these types would be opaque but that doesn't work well with
// our reconciler fork infra, since these leak into non-reconciler packages.

export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;

import {
  enableRetryLaneExpiration,
  enableSchedulingProfiler,
  enableTransitionTracing,
  enableUpdaterTracking,
  syncLaneExpirationMs,
  transitionLaneExpirationMs,
  retryLaneExpirationMs,
  disableLegacyMode,
  enableDefaultTransitionIndicator,
  enableGestureTransition,
} from 'shared/ReactFeatureFlags';
import {isDevToolsPresent} from './ReactFiberDevToolsHook';
import {clz32} from './clz32';
import {LegacyRoot} from './ReactRootTags';

// Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.

export const TotalLanes = 31;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncHydrationLane: Lane = /*               */ 0b0000000000000000000000000000001;
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000010;
export const SyncLaneIndex: number = 1;

export const InputContinuousHydrationLane: Lane = /*    */ 0b0000000000000000000000000000100;
export const InputContinuousLane: Lane = /*             */ 0b0000000000000000000000000001000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000000010000;
export const DefaultLane: Lane = /*                     */ 0b0000000000000000000000000100000;

export const SyncUpdateLanes: Lane =
  SyncLane | InputContinuousLane | DefaultLane;

export const GestureLane: Lane = /*                     */ 0b0000000000000000000000001000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000000000010000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111111111100000000;
const TransitionLane1: Lane = /*                        */ 0b0000000000000000000000100000000;
const TransitionLane2: Lane = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane3: Lane = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane4: Lane = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane5: Lane = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane6: Lane = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane7: Lane = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane8: Lane = /*                        */ 0b0000000000000001000000000000000;
const TransitionLane9: Lane = /*                        */ 0b0000000000000010000000000000000;
const TransitionLane10: Lane = /*                       */ 0b0000000000000100000000000000000;
const TransitionLane11: Lane = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane12: Lane = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane13: Lane = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane14: Lane = /*                       */ 0b0000000001000000000000000000000;

export const SomeTransitionLane: Lane = TransitionLane1;

const TransitionUpdateLanes =
  TransitionLane1 |
  TransitionLane2 |
  TransitionLane3 |
  TransitionLane4 |
  TransitionLane5 |
  TransitionLane6 |
  TransitionLane7 |
  TransitionLane8 |
  TransitionLane9 |
  TransitionLane10;
const TransitionDeferredLanes =
  TransitionLane11 | TransitionLane12 | TransitionLane13 | TransitionLane14;

const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;
const RetryLane1: Lane = /*                             */ 0b0000000010000000000000000000000;
const RetryLane2: Lane = /*                             */ 0b0000000100000000000000000000000;
const RetryLane3: Lane = /*                             */ 0b0000001000000000000000000000000;
const RetryLane4: Lane = /*                             */ 0b0000010000000000000000000000000;

export const SomeRetryLane: Lane = RetryLane1;

export const SelectiveHydrationLane: Lane = /*          */ 0b0000100000000000000000000000000;

const NonIdleLanes: Lanes = /*                          */ 0b0000111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0001000000000000000000000000000;
export const IdleLane: Lane = /*                        */ 0b0010000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b0100000000000000000000000000000;
export const DeferredLane: Lane = /*                    */ 0b1000000000000000000000000000000;

// Any lane that might schedule an update. This is used to detect infinite
// update loops, so it doesn't include hydration lanes or retries.
export const UpdateLanes: Lanes =
  SyncLane | InputContinuousLane | DefaultLane | TransitionUpdateLanes;

export const HydrationLanes =
  SyncHydrationLane |
  InputContinuousHydrationLane |
  DefaultHydrationLane |
  TransitionHydrationLane |
  SelectiveHydrationLane |
  IdleHydrationLane;

export const NoTimestamp = -1;

let nextTransitionUpdateLane: Lane = TransitionLane1;
let nextTransitionDeferredLane: Lane = TransitionLane11;
let nextRetryLane: Lane = RetryLane1;

function getHighestPriorityLanes(lanes: Lanes | Lane): Lanes {
  const pendingSyncLanes = lanes & SyncUpdateLanes;
  if (pendingSyncLanes !== 0) {
    return pendingSyncLanes;
  }
  switch (getHighestPriorityLane(lanes)) {
    case SyncHydrationLane:
      return SyncHydrationLane;
    case SyncLane:
      return SyncLane;
    case InputContinuousHydrationLane:
      return InputContinuousHydrationLane;
    case InputContinuousLane:
      return InputContinuousLane;
    case DefaultHydrationLane:
      return DefaultHydrationLane;
    case DefaultLane:
      return DefaultLane;
    case GestureLane:
      return GestureLane;
    case TransitionHydrationLane:
      return TransitionHydrationLane;
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
      return lanes & TransitionUpdateLanes;
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
      return lanes & TransitionDeferredLanes;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
      return lanes & RetryLanes;
    case SelectiveHydrationLane:
      return SelectiveHydrationLane;
    case IdleHydrationLane:
      return IdleHydrationLane;
    case IdleLane:
      return IdleLane;
    case OffscreenLane:
      return OffscreenLane;
    case DeferredLane:
      // This shouldn't be reachable because deferred work is always entangled
      // with something else.
      return NoLanes;
    default:
      if (__DEV__) {
        console.error(
          'Should have found matching lanes. This is a bug in React.',
        );
      }
      // This shouldn't be reachable, but as a fallback, return the entire bitmask.
      return lanes;
  }
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;
}

export function createLaneMap<T>(initial: T): LaneMap<T> {
  // Intentionally pushing one by one.
  // https://v8.dev/blog/elements-kinds#avoid-creating-holes
  const laneMap = [];
  // 初始化一个长度为 TotalLanes 的数组，所有元素初始值都等于 initial
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}

export function pickArbitraryLane(lanes: Lanes): Lane {
  // This wrapper function gets inlined. Only exists so to communicate that it
  // doesn't matter which bit is selected; you can pick any bit without
  // affecting the algorithms where its used. Here I'm using
  // getHighestPriorityLane because it requires the fewest operations.
  // return getHighestPriorityLane(lanes);
  throw new Error('Not implemented');
}

export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

// 用来从一组 lanes（位掩码）里选一个索引
function pickArbitraryLaneIndex(lanes: Lanes) {
  // 返回 32 位整数前导零的数量
  // 31 - clz32(lanes) 等价于最高位的 1 的索引，也就是选出最高优先级的 lane
  return 31 - clz32(lanes);
}

// 把单个 lane 转成索引
function laneToIndex(lane: Lane) {
  // 复用上面的逻辑
  return pickArbitraryLaneIndex(lane);
}

export function markRootUpdated(root: FiberRoot, updateLane: Lane) {
  root.pendingLanes |= updateLane;
  if (enableDefaultTransitionIndicator) {
    // Mark that this lane might need a loading indicator to be shown.
    root.indicatorLanes |= updateLane & TransitionLanes;
  }

  // If there are any suspended transitions, it's possible this new update
  // could unblock them. Clear the suspended lanes so that we can try rendering
  // them again.
  //
  // TODO: We really only need to unsuspend only lanes that are in the
  // `subtreeLanes` of the updated fiber, or the update lanes of the return
  // path. This would exclude suspended updates in an unrelated sibling tree,
  // since there's no way for this update to unblock it.
  //
  // We don't do this if the incoming update is idle, because we never process
  // idle updates until after all the regular updates have finished; there's no
  // way it could unblock a transition.
  if (updateLane !== IdleLane) {
    root.suspendedLanes = NoLanes;
    root.pingedLanes = NoLanes;
    root.warmLanes = NoLanes;
  }
}

// @why 这个看起来还挺重要的方法，但是我没看懂什么意思？
export function addFiberToLanesMap(
  root: FiberRoot,
  fiber: Fiber,
  lanes: Lanes | Lane,
) {
  // 如果没有开启更新追踪特性，直接跳过
  if (!enableUpdaterTracking) {
    return;
  }
  // 如果没有检测到 React DevTools，没必要记录更新者
  if (!isDevToolsPresent) {
    return;
  }
  // 取出 root 上的按 lane 记录更新者的映射结构
  const pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
  // 只要 lanes 里还有待处理的位（lane）
  while (lanes > 0) {
    // 取出当前 lanes 中一个 lane 的索引（通常是最高位的 1）
    const index = laneToIndex(lanes);
    // 把索引转回单个 lane 的位掩码
    const lane = 1 << index;

    // 拿到这个 lane 对应的更新者集合
    const updaters = pendingUpdatersLaneMap[index];
    // 把触发更新的 fiber 加入集合，方便 DevTools 显示谁触发了更新
    updaters.add(fiber);

    // 把刚处理过的 lane 位从 lanes 中清掉，继续循环下一个
    lanes &= ~lane;
  }
}

export function markRootEntangled(root: FiberRoot, entangledLanes: Lanes) {
  // 除了要让传入的各个 lanes 彼此纠缠（entangle）之外，
  // 我们还必须考虑「传递性的」纠缠关系。
  // 对于任何已经与这些 lanes 中 *任意一个* 发生纠缠的 lane，
  // 它现在都会通过传递关系，与 *所有* 传入的 lanes 发生纠缠。
  //
  // 换句话说：如果 C 已经和 A 纠缠在一起，
  // 那么当我们把 A 和 B 纠缠时，
  // C 也会随之和 B 纠缠。
  //
  // 如果这件事不太好理解，
  // 一个可能有帮助的方法是：
  // 故意把这个函数写坏，
  // 然后去看看 ReactTransition-test.js 里有哪些测试会失败。
  // 比如，尝试把下面的某一个条件注释掉。

  // In addition to entangling each of the given lanes with each other, we also
  // have to consider _transitive_ entanglements. For each lane that is already
  // entangled with *any* of the given lanes, that lane is now transitively
  // entangled with *all* the given lanes.
  //
  // Translated: If C is entangled with A, then entangling A with B also
  // entangles C with B.
  //
  // If this is hard to grasp, it might help to intentionally break this
  // function and look at the tests that fail in ReactTransition-test.js. Try
  // commenting out one of the conditions below.

  // 把新传入的 entangledLanes 合并进 root.entangledLanes，并把结果保存为 rootEntangledLanes
  const rootEntangledLanes = (root.entangledLanes |= entangledLanes);
  // 取出 root 上的 entanglements 数组（每个 lane 对应一份纠缠的 lanes 位掩码）
  const entanglements = root.entanglements;
  // 准备遍历所有已纠缠的 lanes
  let lanes = rootEntangledLanes;
  // 只要还有未处理的 lane 位，就继续循环
  while (lanes) {
    // 取出当前 lanes 中任意一个 lane 的索引（通常是最高位）
    const index = pickArbitraryLaneIndex(lanes);
    // 把索引转回单个 lane 的位掩码
    const lane = 1 << index;
    if (
      // Is this one of the newly entangled lanes?
      // 判断这个 lane 是否属于新纠缠的那批 lanes
      (lane & entangledLanes) |
      // Is this lane transitively entangled with the newly entangled lanes?
      // 这个 lane 是否已经与新纠缠 lanes 中的某个 lane 有纠缠关系（传递纠缠）
      (entanglements[index] & entangledLanes)
    ) {
      // 把新纠缠的 lanes 合并到该 lane 的纠缠集合里
      entanglements[index] |= entangledLanes;
    }
    // 清掉刚处理过的 lane 位，继续下一个
    lanes &= ~lane;
  }
}

export function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number,
): void {
  // TODO：这个函数在每一次 yield（让出执行权）时都会被调用。
  // 我们可以通过一种方式来优化：
  // 在 root 上保存最早的过期时间（earliest expiration time）。
  // 然后利用这个时间点，
  // 快速地从这个函数中直接返回（bail out），避免不必要的计算。

  // TODO: This gets called every time we yield. We can optimize by storing
  // the earliest expiration time on the root. Then use that to quickly bail out
  // of this function.

  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  const expirationTimes = root.expirationTimes;

  // Iterate through the pending lanes and check if we've reached their
  // expiration time. If so, we'll assume the update is being starved and mark
  // it as expired to force it to finish.
  // TODO: We should be able to replace this with upgradePendingLanesToSync
  //
  // We exclude retry lanes because those must always be time sliced, in order
  // to unwrap uncached promises.
  // TODO: Write a test for this
  // 声明变量 lanes，取值取决于 enableRetryLaneExpiration 开关
  // 开关打开就保留所有 pending lanes；否则忽略 RetryLanes
  let lanes = enableRetryLaneExpiration
    ? // 如果开启了 Retry lane 过期特性，就直接用 pendingLanes（包含所有待处理的 lanes）
      pendingLanes
    : // 否则从 pendingLanes 中把 RetryLanes 这类 lane 排除掉（位运算清掉对应位）
      pendingLanes & ~RetryLanes;

  // 只要还有待处理的 lane 位，就继续循环
  while (lanes > 0) {
    // 从 lanes 位掩码里取出一个 lane 的索引（通常是最高位的 1）
    const index = pickArbitraryLaneIndex(lanes);
    // 把索引转成单个 lane 的位掩码
    const lane = 1 << index;

    // 取出这个 lane 当前的过期时间
    const expirationTime = expirationTimes[index];
    // 如果还没有设置过期时间
    if (expirationTime === NoTimestamp) {
      // 发现了一个没有过期时间的待处理 lane；如果它没被挂起，或者已经被 ping，
      // 就认为它是 CPU-bound 的，给它计算一个新的过期时间
      // Found a pending lane with no expiration time. If it's not suspended, or
      // if it's pinged, assume it's CPU-bound. Compute a new expiration time
      // using the current time.
      if (
        // 如果这个 lane 没有被挂起
        (lane & suspendedLanes) === NoLanes ||
        // 或者这个 lane 已经被 ping 过（从挂起状态恢复信号）
        (lane & pingedLanes) !== NoLanes
      ) {
        // Assumes timestamps are monotonically increasing.
        // 假设时间戳是单调递增的
        expirationTimes[index] = computeExpirationTime(lane, currentTime);
      }
    }
    // 如果已有过期时间，并且已经到了当前时间
    else if (expirationTime <= currentTime) {
      // This lane expired
      // 把该 lane 标记为已过期（合并到 root.expiredLanes）
      root.expiredLanes |= lane;
    }

    // 把刚处理过的 lane 位从 lanes 中清掉
    lanes &= ~lane;
  }
}

export function includesNonIdleWork(lanes: Lanes): boolean {
  return (lanes & NonIdleLanes) !== NoLanes;
}

export function isTransitionLane(lane: Lane): boolean {
  // TransitionLanes 是过渡更新
  // 通过 startTransition / useTransition 产生的更新会落在这些 lanes 里
  // 它们是 低优先级、可中断 的更新，用于不阻塞用户交互的渲染
  // isTransitionLane 就是用 lane & TransitionLanes 来判断某个 lane 是否属于这组
  return (lane & TransitionLanes) !== NoLanes;
}

export function intersectLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a & b;
}

function computeExpirationTime(lane: Lane, currentTime: number) {
  switch (lane) {
    case SyncHydrationLane:
    case SyncLane:
    case InputContinuousHydrationLane:
    case InputContinuousLane:
    case GestureLane:
      // User interactions should expire slightly more quickly.
      //
      // NOTE: This is set to the corresponding constant as in Scheduler.js.
      // When we made it larger, a product metric in www regressed, suggesting
      // there's a user interaction that's being starved by a series of
      // synchronous updates. If that theory is correct, the proper solution is
      // to fix the starvation. However, this scenario supports the idea that
      // expiration times are an important safeguard when starvation
      // does happen.
      return currentTime + syncLaneExpirationMs;
    case DefaultHydrationLane:
    case DefaultLane:
    case TransitionHydrationLane:
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
      return currentTime + transitionLaneExpirationMs;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
      // TODO: Retries should be allowed to expire if they are CPU bound for
      // too long, but when I made this change it caused a spike in browser
      // crashes. There must be some other underlying bug; not super urgent but
      // ideally should figure out why and fix it. Unfortunately we don't have
      // a repro for the crashes, only detected via production metrics.
      return enableRetryLaneExpiration
        ? currentTime + retryLaneExpirationMs
        : NoTimestamp;
    case SelectiveHydrationLane:
    case IdleHydrationLane:
    case IdleLane:
    case OffscreenLane:
    case DeferredLane:
      // Anything idle priority or lower should never expire.
      return NoTimestamp;
    default:
      if (__DEV__) {
        console.error(
          'Should have found matching lanes. This is a bug in React.',
        );
      }
      return NoTimestamp;
  }
}

export function getNextLanes(
  root: FiberRoot,
  wipLanes: Lanes,
  rootHasPendingCommit: boolean,
): Lanes {
  // Early bailout if there's no pending work left.
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }

  let nextLanes: Lanes = NoLanes;

  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  const warmLanes = root.warmLanes;

  // finishedLanes represents a completed tree that is ready to commit.
  //
  // It's not worth doing discarding the completed tree in favor of performing
  // speculative work. So always check this before deciding to warm up
  // the siblings.
  //
  // Note that this is not set in a "suspend indefinitely" scenario, like when
  // suspending outside of a Suspense boundary, or in the shell during a
  // transition — only in cases where we are very likely to commit the tree in
  // a brief amount of time (i.e. below the "Just Noticeable Difference"
  // threshold).
  //

  // Do not work on any idle work until all the non-idle work has finished,
  // even if the work is suspended.
  const nonIdlePendingLanes = pendingLanes & NonIdleLanes;
  if (nonIdlePendingLanes !== NoLanes) {
    const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    if (nonIdleUnblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
    } else {
      throw new Error('Not implemented');
    }
  } else {
    throw new Error('Not implemented');
  }

  if (nextLanes === NoLanes) {
    // This should only be reachable if we're suspended
    // TODO: Consider warning in this path if a fallback timer is not scheduled.
    return NoLanes;
  }

  // If we're already in the middle of a render, switching lanes will interrupt
  // it and we'll lose our progress. We should only do this if the new lanes are
  // higher priority.
  if (
    wipLanes !== NoLanes &&
    wipLanes !== nextLanes &&
    // If we already suspended with a delay, then interrupting is fine. Don't
    // bother waiting until the root is complete.
    (wipLanes & suspendedLanes) === NoLanes
  ) {
    throw new Error('Not implemented');
  }
  return nextLanes;
}

export function includesSyncLane(lanes: Lanes): boolean {
  return (lanes & (SyncLane | SyncHydrationLane)) !== NoLanes;
}

export function checkIfRootIsPrerendering(
  root: FiberRoot,
  renderLanes: Lanes,
): boolean {
  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  // Remove lanes that are suspended (but not pinged)
  const unblockedLanes = pendingLanes & ~(suspendedLanes & ~pingedLanes);

  // If there are no unsuspended or pinged lanes, that implies that we're
  // performing a prerender.
  return (unblockedLanes & renderLanes) === 0;
}

export function isGestureRender(lanes: Lanes): boolean {
  if (!enableGestureTransition) {
    return false;
  }
  // This should render only the one lane.
  return lanes === GestureLane;
}
