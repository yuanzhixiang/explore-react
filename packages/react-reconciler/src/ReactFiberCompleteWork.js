/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {RootState} from './ReactFiberRoot';
import type {Lanes, Lane} from './ReactFiberLane';
import type {ReactScopeInstance, ReactContext} from 'shared/ReactTypes';
import type {
  Instance,
  Type,
  Props,
  Container,
  ChildSet,
  Resource,
} from './ReactFiberConfig';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {
  SuspenseState,
  SuspenseListRenderState,
  RetryQueue,
} from './ReactFiberSuspenseComponent';
import type {
  OffscreenState,
  OffscreenQueue,
} from './ReactFiberOffscreenComponent';
import type {TracingMarkerInstance} from './ReactFiberTracingMarkerComponent';
import type {Cache} from './ReactFiberCacheComponent';
import {
  enableLegacyHidden,
  enableSuspenseCallback,
  enableScopeAPI,
  enableProfilerTimer,
  enableTransitionTracing,
  passChildrenWhenCloningPersistedNodes,
  disableLegacyMode,
  enableViewTransition,
  enableSuspenseyImages,
} from 'shared/ReactFeatureFlags';

import {now} from './Scheduler';

import {
  FunctionComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostPortal,
  ContextProvider,
  ContextConsumer,
  ForwardRef,
  Fragment,
  Mode,
  Profiler,
  SuspenseComponent,
  SuspenseListComponent,
  MemoComponent,
  SimpleMemoComponent,
  LazyComponent,
  IncompleteClassComponent,
  IncompleteFunctionComponent,
  ScopeComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
  CacheComponent,
  TracingMarkerComponent,
  Throw,
  ViewTransitionComponent,
  ActivityComponent,
} from './ReactWorkTags';
import {
  NoMode,
  ConcurrentMode,
  ProfileMode,
  SuspenseyImagesMode,
} from './ReactTypeOfMode';
import {
  Placement,
  Update,
  Visibility,
  NoFlags,
  DidCapture,
  Snapshot,
  ChildDeletion,
  StaticMask,
  Passive,
  ForceClientRender,
  MaySuspendCommit,
  ScheduleRetry,
  ShouldSuspendCommit,
  Cloned,
  ViewTransitionStatic,
  Hydrate,
  PortalStatic,
} from './ReactFiberFlags';

import {
  createInstance,
  // createTextInstance,
  // resolveSingletonInstance,
  appendInitialChild,
  finalizeInitialChildren,
  // finalizeHydratedChildren,
  supportsMutation,
  supportsPersistence,
  supportsResources,
  supportsSingletons,
  // cloneInstance,
  // cloneHiddenInstance,
  // cloneHiddenTextInstance,
  // createContainerChildSet,
  // appendChildToContainerChildSet,
  // finalizeContainerChildren,
  // preparePortalMount,
  // prepareScopeUpdate,
  maySuspendCommit,
  maySuspendCommitOnUpdate,
  // maySuspendCommitInSyncRender,
  // mayResourceSuspendCommit,
  // preloadInstance,
  // preloadResource,
} from './ReactFiberConfig';
import {
  getRootHostContainer,
  popHostContext,
  getHostContext,
  popHostContainer,
} from './ReactFiberHostContext';
// import {
//   suspenseStackCursor,
//   popSuspenseListContext,
//   popSuspenseHandler,
//   pushSuspenseListContext,
//   pushSuspenseListCatch,
//   setShallowSuspenseListContext,
//   ForceSuspenseFallback,
//   setDefaultShallowSuspenseListContext,
// } from './ReactFiberSuspenseContext';
// import {popHiddenContext} from './ReactFiberHiddenContext';
// import {findFirstSuspended} from './ReactFiberSuspenseComponent';
import {
  // isContextProvider as isLegacyContextProvider,
  // popContext as popLegacyContext,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberLegacyContext';
import {popProvider} from './ReactFiberNewContext';
import {
  // prepareToHydrateHostInstance,
  // prepareToHydrateHostTextInstance,
  // prepareToHydrateHostActivityInstance,
  // prepareToHydrateHostSuspenseInstance,
  popHydrationState,
  resetHydrationState,
  getIsHydrating,
  upgradeHydrationErrorsToRecoverable,
  // emitPendingHydrationWarnings,
} from './ReactFiberHydrationContext';
import {
  //   renderHasNotSuspendedYet,
  //   getRenderTargetTime,
  getWorkInProgressTransitions,
  //   shouldRemainOnPreviousScreen,
  //   markSpawnedRetryLane,
} from './ReactFiberWorkLoop';
import {
  OffscreenLane,
  SomeRetryLane,
  NoLanes,
  includesSomeLane,
  mergeLanes,
  // claimNextRetryLane,
  // includesOnlySuspenseyCommitEligibleLanes,
} from './ReactFiberLane';
// import {resetChildFibers} from './ReactChildFiber';
// import {createScopeInstance} from './ReactFiberScope';
// import {transferActualDuration} from './ReactProfilerTimer';
import {popCacheProvider} from './ReactFiberCacheComponent';
import {popTreeContext, pushTreeFork} from './ReactFiberTreeContext';
import {popRootTransition, popTransition} from './ReactFiberTransition';
// import {
//   popMarkerInstance,
//   popRootMarkerInstance,
// } from './ReactFiberTracingMarkerComponent';
// import {suspendCommit} from './ReactFiberThenable';
import type {Flags} from './ReactFiberFlags';

/**
 * Tag the fiber with Cloned in persistent mode to signal that
 * it received an update that requires a clone of the tree above.
 */
function markCloned(workInProgress: Fiber) {
  if (supportsPersistence) {
    workInProgress.flags |= Cloned;
  }
}

/**
 * Tag the fiber with an update effect. This turns a Placement into
 * a PlacementAndUpdate.
 */
function markUpdate(workInProgress: Fiber) {
  workInProgress.flags |= Update;
}

function appendAllChildren(
  parent: Instance,
  workInProgress: Fiber,
  needsVisibilityToggle: boolean,
  isHidden: boolean,
) {
  if (supportsMutation) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    let node = workInProgress.child;
    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        appendInitialChild(parent, node.stateNode);
      } else if (
        node.tag === HostPortal ||
        (supportsSingletons ? node.tag === HostSingleton : false)
      ) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If we have a HostSingleton it will be placed independently
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        return;
      }
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      while (node.sibling === null) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      node.sibling.return = node.return;
      node = node.sibling;
    }
  } else if (supportsPersistence) {
    throw new Error('Not implemented yet.');
  }
}

function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  // Note: This intentionally doesn't check if we're hydrating because comparing
  // to the current tree provider fiber is just as fast and less error-prone.
  // Ideally we would have a special version of the work loop only
  // for hydration.
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case IncompleteFunctionComponent: {
      throw new Error('Not implemented yet.');
    }
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      throw new Error('Not implemented yet.');
    case ClassComponent: {
      throw new Error('Not implemented yet.');
    }
    case HostRoot: {
      const fiberRoot = (workInProgress.stateNode: FiberRoot);

      if (enableTransitionTracing) {
        const transitions = getWorkInProgressTransitions();
        // We set the Passive flag here because if there are new transitions,
        // we will need to schedule callbacks and process the transitions,
        // which we do in the passive phase
        if (transitions !== null) {
          workInProgress.flags |= Passive;
        }
      }
      let previousCache: Cache | null = null;
      if (current !== null) {
        previousCache = current.memoizedState.cache;
      }
      const cache: Cache = workInProgress.memoizedState.cache;
      if (cache !== previousCache) {
        // Run passive effects to retain/release the cache.
        workInProgress.flags |= Passive;
      }

      popCacheProvider(workInProgress, cache);

      if (enableTransitionTracing) {
        // popRootMarkerInstance(workInProgress);
        throw new Error('Not implemented yet.');
      }

      popRootTransition(workInProgress, fiberRoot, renderLanes);
      popHostContainer(workInProgress);
      popTopLevelLegacyContextObject(workInProgress);
      if (fiberRoot.pendingContext) {
        fiberRoot.context = fiberRoot.pendingContext;
        fiberRoot.pendingContext = null;
      }
      if (current === null || current.child === null) {
        // If we hydrated, pop so that we can delete any remaining children
        // that weren't hydrated.
        const wasHydrated = popHydrationState(workInProgress);
        if (wasHydrated) {
          throw new Error('Not implemented yet.');
        } else {
          if (current !== null) {
            const prevState: RootState = current.memoizedState;
            if (
              // Check if this is a client root
              !prevState.isDehydrated ||
              // Check if we reverted to client rendering (e.g. due to an error)
              (workInProgress.flags & ForceClientRender) !== NoFlags
            ) {
              // Schedule an effect to clear this container at the start of the
              // next commit. This handles the case of React rendering into a
              // container with previous children. It's also safe to do for
              // updates too, because current.child would only be null if the
              // previous render was null (so the container would already
              // be empty).
              workInProgress.flags |= Snapshot;

              // If this was a forced client render, there may have been
              // recoverable errors during first hydration attempt. If so, add
              // them to a queue so we can log them in the commit phase.
              upgradeHydrationErrorsToRecoverable();
            }
          }
        }
      }
      updateHostContainer(current, workInProgress);
      bubbleProperties(workInProgress);
      if (enableTransitionTracing) {
        if ((workInProgress.subtreeFlags & Visibility) !== NoFlags) {
          // If any of our suspense children toggle visibility, this means that
          // the pending boundaries array needs to be updated, which we only
          // do in the passive phase.
          workInProgress.flags |= Passive;
        }
      }
      return null;
    }
    case HostHoistable: {
      throw new Error('Not implemented yet.');
    }
    case HostSingleton: {
      throw new Error('Not implemented yet.');
    }
    case HostComponent: {
      // 弹出宿主上下文。
      // 在 beginWork 时会 pushHostContext（压入命名空间信息，比如是否在 SVG/MathML 内），
      // 现在完成工作了，需要弹出恢复之前的上下文。
      popHostContext(workInProgress);
      // 获取元素类型，比如 'div'、'span'、'svg' 等标签名
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        // 如果 current 存在（说明是更新而非首次挂载）且已有 DOM 节点（stateNode），
        // 应该走更新逻辑（updateHostComponent）
        throw new Error('Not implemented yet.');
      } else {
        // 首次创建 DOM 元素
        if (!newProps) {
          throw new Error('Not implemented yet.');
        }

        // 获取当前的宿主上下文（命名空间信息）
        // 用于决定是用 createElement 还是 createElementNS
        const currentHostContext = getHostContext();
        // TODO: Move createInstance to beginWork and keep it on a context
        // "stack" as the parent. Then append children as we go in beginWork
        // or completeWork depending on whether we want to add them top->down or
        // bottom->up. Top->down is faster in IE11.

        // 检查是否是 hydration（服务端渲染复用 DOM）
        const wasHydrated = popHydrationState(workInProgress);
        if (wasHydrated) {
          throw new Error('Not implemented yet.');
        } else {
          // 获取根容器
          const rootContainerInstance = getRootHostContainer();
          // 这里就是真正创建 DOM 元素的地方，并且他会将 fiber 和 props 挂到元素上
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );

          // TODO: For persistent renderers, we should pass children as part
          // of the initial instance creation

          // 标记这个 Fiber 已经被克隆过了
          // 用于持久化模式（你用的 DOM 是可变模式，这个其实是空操作）
          markCloned(workInProgress);
          // 把所有子节点的 DOM 追加到刚创建的 instance 上
          appendAllChildren(instance, workInProgress, false, false);
          // 把创建的 DOM 元素存到 Fiber 的 stateNode 上
          workInProgress.stateNode = instance;

          // Certain renderers require commit-time effects for initial mount.
          // (eg DOM renderer supports auto-focus for certain elements).
          // Make sure such renderers get scheduled for later work.
          if (
            // 在这个函数内将属性真正设置到 DOM 元素上
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              currentHostContext,
            )
          ) {
            markUpdate(workInProgress);
          }
        }
      }
      bubbleProperties(workInProgress);
      if (enableViewTransition) {
        // Host Components act as their own View Transitions which doesn't run enter/exit animations.
        // We clear any ViewTransitionStatic flag bubbled from inner View Transitions.
        workInProgress.subtreeFlags &= ~ViewTransitionStatic;
      }

      // This must come at the very end of the complete phase, because it might
      // throw to suspend, and if the resource immediately loads, the work loop
      // will resume rendering as if the work-in-progress completed. So it must
      // fully complete.
      preloadInstanceAndSuspendIfNeeded(
        workInProgress,
        workInProgress.type,
        current === null ? null : current.memoizedProps,
        workInProgress.pendingProps,
        renderLanes,
      );
      return null;
    }
    case HostText: {
      throw new Error('Not implemented yet.');
    }
    case ActivityComponent: {
      throw new Error('Not implemented yet.');
    }
    case SuspenseComponent: {
      throw new Error('Not implemented yet.');
    }
    case HostPortal:
      throw new Error('Not implemented yet.');
    case ContextProvider:
      throw new Error('Not implemented yet.');
    case IncompleteClassComponent: {
      throw new Error('Not implemented yet.');
    }
    case SuspenseListComponent: {
      throw new Error('Not implemented yet.');
    }
    case ScopeComponent: {
      throw new Error('Not implemented yet.');
    }
    case OffscreenComponent:
    case LegacyHiddenComponent: {
      throw new Error('Not implemented yet.');
    }
    case CacheComponent: {
      throw new Error('Not implemented yet.');
    }
    case TracingMarkerComponent: {
      throw new Error('Not implemented yet.');
    }
    case ViewTransitionComponent: {
      throw new Error('Not implemented yet.');
    }
    case Throw: {
      throw new Error('Not implemented yet.');
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      'React. Please file an issue.',
  );
}

function bubbleProperties(completedWork: Fiber) {
  // Bailout 在 react 中是一个性能优化术语，当 React 发现某个组件不需要更新时，会跳过它及其子树的渲染过程，直接复用之前的结果。
  const didBailout =
    // 有旧的 fiber（不是首次渲染）
    completedWork.alternate !== null &&
    // 子节点指针没变（子节点被复用了）
    completedWork.alternate.child === completedWork.child;

  let newChildLanes: Lanes = NoLanes;
  let subtreeFlags: Flags = NoFlags;

  if (!didBailout) {
    // Bubble up the earliest expiration time.
    // 这是一个双重检查，用来判断是否需要收集性能分析（profiling）数据
    if (enableProfilerTimer && (completedWork.mode & ProfileMode) !== NoMode) {
      throw new Error('Not implemented yet.');
    } else {
      // 让父节点知道整个子树中有哪些优先级的更新需要处理
      // 获取当前 fiber 的第一个子节点
      let child = completedWork.child;
      // 遍历所有子节点
      while (child !== null) {
        // 再合并到 newChildLanes（累加所有子节点的优先级）
        newChildLanes = mergeLanes(
          newChildLanes,
          // 先合并子节点的两个 lanes
          mergeLanes(
            // 这个 fiber 自己的更新优先级
            child.lanes,
            // 这个 fiber 子树的更新优先级
            child.childLanes,
          ),
        );

        // 收集子树的 flaggs
        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        // 这是一个代码坏味道（code smell），因为它假设 commit 阶段永远不会和 render 阶段并发
        // Update the return pointer so the tree is consistent. This is a code
        // smell because it assumes the commit phase is never concurrent with
        // the render phase. Will address during refactor to alternate model.
        // 设置子节点的 return 指针指向父节点
        child.return = completedWork;

        // 遍历下一个兄弟节点，继续循环
        child = child.sibling;
      }
    }

    completedWork.subtreeFlags |= subtreeFlags;
  } else {
    throw new Error('Not implemented yet.');
  }

  completedWork.childLanes = newChildLanes;

  return didBailout;
}

function updateHostContainer(current: null | Fiber, workInProgress: Fiber) {
  if (supportsPersistence) {
    throw new Error('Not implement yet.');
  }
}

// This function must be called at the very end of the complete phase, because
// it might throw to suspend, and if the resource immediately loads, the work
// loop will resume rendering as if the work-in-progress completed. So it must
// fully complete.
// TODO: This should ideally move to begin phase, but currently the instance is
// not created until the complete phase. For our existing use cases, host nodes
// that suspend don't have children, so it doesn't matter. But that might not
// always be true in the future.
// 这个函数用于在 complete 阶段预加载资源
function preloadInstanceAndSuspendIfNeeded(
  workInProgress: Fiber,
  type: Type,
  oldProps: null | Props,
  newProps: Props,
  renderLanes: Lanes,
) {
  const maySuspend =
    // 全局开启了功能 或者 当前 fiber 的 mode 包含 SuspenseyImagesMode
    // 这是一个全局 feature flag（编译时常量）
    (enableSuspenseyImages ||
      // 这是位运算，检查当前 fiber 是否开启了 Suspensey Images 模式
      (workInProgress.mode & SuspenseyImagesMode) !== NoMode) &&
    // 检查是否是 Suspensey 资源
    (oldProps === null // oldProps === null 表示首次渲染
      ? maySuspendCommit(type, newProps)
      : maySuspendCommitOnUpdate(type, oldProps, newProps));

  if (!maySuspend) {
    // If this flag was set previously, we can remove it. The flag
    // represents whether this particular set of props might ever need to
    // suspend. The safest thing to do is for maySuspendCommit to always
    // return true, but if the renderer is reasonably confident that the
    // underlying resource won't be evicted, it can return false as a
    // performance optimization.
    workInProgress.flags &= ~MaySuspendCommit;
    return;
  }

  // Mark this fiber with a flag. This gets set on all host instances
  // that might possibly suspend, even if they don't need to suspend
  // currently. We use this when revealing a prerendered tree, because
  // even though the tree has "mounted", its resources might not have
  // loaded yet.
  workInProgress.flags |= MaySuspendCommit;

  throw new Error('Not implemented yet.');
}

export {completeWork};
