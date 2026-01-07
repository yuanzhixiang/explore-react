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
  // maySuspendCommit,
  // maySuspendCommitOnUpdate,
  // maySuspendCommitInSyncRender,
  // mayResourceSuspendCommit,
  // preloadInstance,
  // preloadResource,
} from './ReactFiberConfig';
import {
  getRootHostContainer,
  popHostContext,
  getHostContext,
  // popHostContainer,
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
// import {
//   isContextProvider as isLegacyContextProvider,
//   popContext as popLegacyContext,
//   popTopLevelContextObject as popTopLevelLegacyContextObject,
// } from './ReactFiberLegacyContext';
import {popProvider} from './ReactFiberNewContext';
import {
  // prepareToHydrateHostInstance,
  // prepareToHydrateHostTextInstance,
  // prepareToHydrateHostActivityInstance,
  // prepareToHydrateHostSuspenseInstance,
  popHydrationState,
  resetHydrationState,
  getIsHydrating,
  // upgradeHydrationErrorsToRecoverable,
  // emitPendingHydrationWarnings,
} from './ReactFiberHydrationContext';
// import {
//   renderHasNotSuspendedYet,
//   getRenderTargetTime,
//   getWorkInProgressTransitions,
//   shouldRemainOnPreviousScreen,
//   markSpawnedRetryLane,
// } from './ReactFiberWorkLoop';
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
// import {popRootTransition, popTransition} from './ReactFiberTransition';
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
      throw new Error('Not implemented yet.');
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
        throw new Error('Not implemented yet.');
      }
      throw new Error('Not implemented yet.');
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

export {completeWork};
