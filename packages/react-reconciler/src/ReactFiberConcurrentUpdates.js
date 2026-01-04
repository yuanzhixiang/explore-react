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

import {
  // warnAboutUpdateOnNotYetMountedFiberInDEV,
  throwIfInfiniteUpdateLoopDetected,
  // getWorkInProgressRoot,
} from './ReactFiberWorkLoop';
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
  // TODO：即使这个 fiber 已经被卸载了（unmounted），
  // 我们仍然会检测到一次无限更新循环并抛出错误。
  // 这在严格意义上并不是必须的，
  // 但它恰好是我们在过去多个发布版本中一直沿用的当前行为。
  // 可以考虑这样一种改进：
  // 如果被更新的 fiber 已经卸载了，就不再执行这项检查，
  // 因为在这种情况下，它不可能再导致无限更新循环。

  // TODO: We will detect and infinite update loop and throw even if this fiber
  // has already unmounted. This isn't really necessary but it happens to be the
  // current behavior we've used for several release cycles. Consider not
  // performing this check if the updated fiber already unmounted, since it's
  // not possible for that to cause an infinite update loop.
  throwIfInfiniteUpdateLoopDetected();

  // 当一次 setState 发生时，我们必须确保对应的 root 被调度（scheduled）。
  // 由于更新队列（update queue）并没有指向 root 的反向指针（backpointer），
  // 目前唯一能做到这一点的方法，就是沿着 return 路径一路向上遍历。
  // 过去这并不是什么大问题，
  // 因为我们本来就需要沿着 return 路径向上遍历，
  // 以设置 `childLanes`。
  // 但现在，这两次遍历发生在不同的时间点。
  // TODO：考虑在 update queue 上增加一个指向 `root` 的反向指针。

  // When a setState happens, we must ensure the root is scheduled. Because
  // update queues do not have a backpointer to the root, the only way to do
  // this currently is to walk up the return path. This used to not be a big
  // deal because we would have to walk up the return path to set
  // the `childLanes`, anyway, but now those two traversals happen at
  // different times.
  // TODO: Consider adding a `root` backpointer on the update queue.
  detectUpdateOnUnmountedFiber(sourceFiber, sourceFiber);
  // 把当前节点设为发起更新的 fiber
  let node = sourceFiber;
  // 取当前节点的父指针（return 指向父 fiber）
  let parent = node.return;
  // 只要还有父节点，就一直向上遍历
  while (parent !== null) {
    // 用当前节点做一次是否在未挂载节点上触发更新的检测（sourceFiber 是更新来源）
    detectUpdateOnUnmountedFiber(sourceFiber, node);
    // 把当前节点上移一层
    node = parent;
    // 更新父指针，准备下一轮
    parent = node.return;
  }
  // 如果最终到达的是 HostRoot，返回它的 stateNode（即 FiberRoot）；否则返回 null
  return node.tag === HostRoot ? (node.stateNode: FiberRoot) : null;
}

// 定义函数，接收发起更新的 sourceFiber 和它的 parent
function detectUpdateOnUnmountedFiber(sourceFiber: Fiber, parent: Fiber) {
  // 仅在开发模式下执行下面的检查
  if (__DEV__) {
    // 获取 parent 的 alternate（current/workInProgress 的另一份）
    const alternate = parent.alternate;
    // 开始条件判断
    if (
      // 如果没有 alternate，说明这是首次挂载过程中
      alternate === null &&
      // 并且 parent 带有“插入/挂载”或“hydration”标记（表示还没真正挂载完成）
      (parent.flags & (Placement | Hydrating)) !== NoFlags
    ) {
      // warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
      throw new Error('Not implemented');
    }
  }
}
