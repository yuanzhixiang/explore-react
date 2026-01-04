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
  UpdateQueue as HookQueue,
  Update as HookUpdate,
} from './ReactFiberHooks';
import type {
  SharedQueue as ClassQueue,
  Update as ClassUpdate,
} from './ReactFiberClassUpdateQueue';
import type {Lane, Lanes} from './ReactFiberLane';
import type {OffscreenInstance} from './ReactFiberOffscreenComponent';

// import {
//   warnAboutUpdateOnNotYetMountedFiberInDEV,
//   throwIfInfiniteUpdateLoopDetected,
//   getWorkInProgressRoot,
// } from './ReactFiberWorkLoop';
import {
  NoLane,
  NoLanes,
  mergeLanes,
  // markHiddenUpdate
} from './ReactFiberLane';
import {NoFlags, Placement, Hydrating} from './ReactFiberFlags';
import {HostRoot, OffscreenComponent} from './ReactWorkTags';
import {OffscreenVisible} from './ReactFiberOffscreenComponent';

export type ConcurrentUpdate = {
  next: ConcurrentUpdate,
  lane: Lane,
};

type ConcurrentQueue = {
  pending: ConcurrentUpdate | null,
};

// If a render is in progress, and we receive an update from a concurrent event,
// we wait until the current render is over (either finished or interrupted)
// before adding it to the fiber/hook queue. Push to this array so we can
// access the queue, fiber, update, et al later.
const concurrentQueues: Array<any> = [];
let concurrentQueuesIndex = 0;

let concurrentlyUpdatedLanes: Lanes = NoLanes;

export function enqueueConcurrentClassUpdate<State>(
  fiber: Fiber,
  queue: ClassQueue<State>,
  update: ClassUpdate<State>,
  lane: Lane,
): FiberRoot | null {
  const concurrentQueue: ConcurrentQueue = (queue: any);
  const concurrentUpdate: ConcurrentUpdate = (update: any);
  enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
  return getRootForUpdatedFiber(fiber);
}

function enqueueUpdate(
  fiber: Fiber,
  queue: ConcurrentQueue | null,
  update: ConcurrentUpdate | null,
  lane: Lane,
) {
  // 先不要在回溯阶段更新 childLanes，如果当前正处在渲染中，要等渲染结束后再更新，
  // 避免在渲染过程中修改 childLanes
  // Don't update the `childLanes` on the return path yet. If we already in
  // the middle of rendering, wait until after it has completed.
  // 把当前 fiber 放进并发更新队列
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  // 把对应的更新队列 queue 放进去
  concurrentQueues[concurrentQueuesIndex++] = queue;
  // 把具体的 update 放进去
  concurrentQueues[concurrentQueuesIndex++] = update;
  // 把本次更新的 lane（优先级通道）放进去
  concurrentQueues[concurrentQueuesIndex++] = lane;

  // 把这次更新的 lane 合并进全局的 concurrentlyUpdatedLanes，记录并发期间产生过这些 lane 的更新
  concurrentlyUpdatedLanes = mergeLanes(concurrentlyUpdatedLanes, lane);

  // fiber.lanes 用来判断这个 fiber 是否有待处理工作（用于快速跳过）
  // 所以必须立刻更新 fiber.lanes，否则会错误地提前跳过。
  // The fiber's `lane` field is used in some places to check if any work is
  // scheduled, to perform an eager bailout, so we need to update it immediately.

  // 这块逻辑以后可能应该放到共享队列里。
  // TODO: We should probably move this to the "shared" queue instead.
  // 立刻把新 lane 合并进当前 fiber 的 lanes
  fiber.lanes = mergeLanes(fiber.lanes, lane);
  // 取出这个 fiber 的 alternate（当前树的另一份，current/workInProgress）
  const alternate = fiber.alternate;
  // 如果 alternate 存在
  if (alternate !== null) {
    // 同样把 lane 合并到 alternate 的 lanes
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
}

function getRootForUpdatedFiber(sourceFiber: Fiber): FiberRoot | null {
  throw new Error('Not implemented');
}
