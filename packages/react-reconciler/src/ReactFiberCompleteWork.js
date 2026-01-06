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
  // appendInitialChild,
  // finalizeInitialChildren,
  // finalizeHydratedChildren,
  // supportsMutation,
  // supportsPersistence,
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
      popHostContext(workInProgress);
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        throw new Error('Not implemented yet.');
      } else {
        if (!newProps) {
          throw new Error('Not implemented yet.');
        }

        const currentHostContext = getHostContext();
        // TODO: Move createInstance to beginWork and keep it on a context
        // "stack" as the parent. Then append children as we go in beginWork
        // or completeWork depending on whether we want to add them top->down or
        // bottom->up. Top->down is faster in IE11.
        const wasHydrated = popHydrationState(workInProgress);
        if (wasHydrated) {
          throw new Error('Not implemented yet.');
        } else {
          const rootContainerInstance = getRootHostContainer();
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );

          throw new Error('Not implemented yet.');
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
