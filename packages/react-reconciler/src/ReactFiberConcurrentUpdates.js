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

// 完成并发更新的入队操作
export function finishQueueingConcurrentUpdates(): void {
  // 保存当前队列的结束索引，然后重置为 0（为下一批更新准备）
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;

  // 重置并发更新的 lanes 标记
  concurrentlyUpdatedLanes = NoLanes;

  // 遍历队列中所有暂存的更新
  let i = 0;
  while (i < endIndex) {
    const fiber: Fiber = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const queue: ConcurrentQueue = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const update: ConcurrentUpdate = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const lane: Lane = concurrentQueues[i];
    concurrentQueues[i++] = null;

    // 把 update 插入循环链表
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }

    if (lane !== NoLane) {
      markUpdateLaneFromFiberToRoot(fiber, update, lane);
    }
  }
}

// 这个函数的作用是从触发更新的 Fiber 向上遍历到 Root，沿途标记所有祖先节点的 childLanes
function markUpdateLaneFromFiberToRoot(
  sourceFiber: Fiber,
  update: ConcurrentUpdate | null,
  lane: Lane,
): null | FiberRoot {
  // Update the source fiber's lanes
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
  // Walk the parent path to the root and update the child lanes.
  let isHidden = false;
  let parent = sourceFiber.return;
  let node = sourceFiber;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    }

    if (parent.tag === OffscreenComponent) {
      // Check if this offscreen boundary is currently hidden.
      //
      // The instance may be null if the Offscreen parent was unmounted. Usually
      // the parent wouldn't be reachable in that case because we disconnect
      // fibers from the tree when they are deleted. However, there's a weird
      // edge case where setState is called on a fiber that was interrupted
      // before it ever mounted. Because it never mounts, it also never gets
      // deleted. Because it never gets deleted, its return pointer never gets
      // disconnected. Which means it may be attached to a deleted Offscreen
      // parent node. (This discovery suggests it may be better for memory usage
      // if we don't attach the `return` pointer until the commit phase, though
      // in order to do that we'd need some other way to track the return
      // pointer during the initial render, like on the stack.)
      //
      // This case is always accompanied by a warning, but we still need to
      // account for it. (There may be other cases that we haven't discovered,
      // too.)
      const offscreenInstance: OffscreenInstance | null = parent.stateNode;
      if (
        offscreenInstance !== null &&
        !(offscreenInstance._visibility & OffscreenVisible)
      ) {
        isHidden = true;
      }
    }

    node = parent;
    parent = parent.return;
  }

  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode;
    if (isHidden && update !== null) {
      // markHiddenUpdate(root, update, lane);
      throw new Error('Not implemented yet.');
    }
    return root;
  }
  return null;
}

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

export function getConcurrentlyUpdatedLanes(): Lanes {
  return concurrentlyUpdatedLanes;
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

export function enqueueConcurrentHookUpdate<S, A>(
  fiber: Fiber,
  queue: HookQueue<S, A>,
  update: HookUpdate<S, A>,
  lane: Lane,
): FiberRoot | null {
  const concurrentQueue: ConcurrentQueue = (queue: any);
  const concurrentUpdate: ConcurrentUpdate = (update: any);
  enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
  return getRootForUpdatedFiber(fiber);
}
