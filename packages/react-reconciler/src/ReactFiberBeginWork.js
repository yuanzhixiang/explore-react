/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactConsumerType,
  ReactContext,
  ReactNodeList,
  ViewTransitionProps,
  ActivityProps,
  SuspenseProps,
  SuspenseListProps,
  SuspenseListRevealOrder,
  SuspenseListTailMode,
  TracingMarkerProps,
  CacheProps,
  ProfilerProps,
} from 'shared/ReactTypes';
import type {LazyComponent as LazyComponentType} from 'react/src/ReactLazy';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {TypeOfMode} from './ReactTypeOfMode';
import type {Lanes, Lane} from './ReactFiberLane';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {
  SuspenseState,
  SuspenseListRenderState,
} from './ReactFiberSuspenseComponent';
// import type {SuspenseContext} from './ReactFiberSuspenseContext';
import type {
  LegacyHiddenProps,
  OffscreenProps,
  OffscreenState,
  OffscreenQueue,
  OffscreenInstance,
} from './ReactFiberOffscreenComponent';
import type {
  Cache,
  CacheComponentState,
  SpawnedCachePool,
} from './ReactFiberCacheComponent';
import type {UpdateQueue} from './ReactFiberClassUpdateQueue';
import type {RootState} from './ReactFiberRoot';
import type {TracingMarkerInstance} from './ReactFiberTracingMarkerComponent';

// import {
//   markComponentRenderStarted,
//   markComponentRenderStopped,
//   setIsStrictModeForDevtools,
// } from './ReactFiberDevToolsHook';
import {
  FunctionComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostPortal,
  ForwardRef,
  Fragment,
  Mode,
  ContextProvider,
  ContextConsumer,
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
  NoFlags,
  PerformedWork,
  Placement,
  Hydrating,
  Callback,
  ContentReset,
  DidCapture,
  Update,
  Ref,
  RefStatic,
  ChildDeletion,
  ForceUpdateForLegacySuspense,
  StaticMask,
  ShouldCapture,
  ForceClientRender,
  Passive,
  DidDefer,
  ViewTransitionNamedStatic,
  ViewTransitionNamedMount,
  LayoutStatic,
} from './ReactFiberFlags';
import {
  disableLegacyContext,
  disableLegacyContextForFunctionComponents,
  enableProfilerCommitHooks,
  enableProfilerTimer,
  enableScopeAPI,
  enableSchedulingProfiler,
  enableTransitionTracing,
  enableLegacyHidden,
  enableCPUSuspense,
  disableLegacyMode,
  enableHydrationLaneScheduling,
  enableViewTransition,
  enableFragmentRefs,
} from 'shared/ReactFeatureFlags';
// import shallowEqual from 'shared/shallowEqual';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import {
  REACT_LAZY_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
} from 'shared/ReactSymbols';
// import {setCurrentFiber} from './ReactCurrentFiber';
// import {
//   resolveFunctionForHotReloading,
//   resolveForwardRefForHotReloading,
//   resolveClassForHotReloading,
// } from './ReactFiberHotReloading';

import {
  mountChildFibers,
  reconcileChildFibers,
  // cloneChildFibers,
  // validateSuspenseListChildren,
} from './ReactChildFiber';
import {
  processUpdateQueue,
  cloneUpdateQueue,
  initializeUpdateQueue,
  // enqueueCapturedUpdate,
  suspendIfUpdateReadFromEntangledAsyncAction,
} from './ReactFiberClassUpdateQueue';
import {
  NoLane,
  NoLanes,
  OffscreenLane,
  DefaultLane,
  DefaultHydrationLane,
  SomeRetryLane,
  includesSomeLane,
  // includesOnlyRetries,
  // laneToLanes,
  // removeLanes,
  mergeLanes,
  // getBumpedLaneForHydration,
  pickArbitraryLane,
} from './ReactFiberLane';
import {
  ConcurrentMode,
  NoMode,
  ProfileMode,
  StrictLegacyMode,
} from './ReactTypeOfMode';
import {
  shouldSetTextContent,
  // isSuspenseInstancePending,
  // isSuspenseInstanceFallback,
  // getSuspenseInstanceFallbackErrorDetails,
  supportsHydration,
  // supportsResources,
  // supportsSingletons,
  // isPrimaryRenderer,
  // getResource,
  // createHoistableInstance,
  // HostTransitionContext,
} from './ReactFiberConfig';
import type {ActivityInstance, SuspenseInstance} from './ReactFiberConfig';
// import {shouldError, shouldSuspend} from './ReactFiberReconciler';
import {
  pushHostContext,
  pushHostContainer,
  // getRootHostContainer,
} from './ReactFiberHostContext';
// import {
//   suspenseStackCursor,
//   pushSuspenseListContext,
//   ForceSuspenseFallback,
//   hasSuspenseListContext,
//   setDefaultShallowSuspenseListContext,
//   setShallowSuspenseListContext,
//   pushPrimaryTreeSuspenseHandler,
//   pushFallbackTreeSuspenseHandler,
//   pushDehydratedActivitySuspenseHandler,
//   pushOffscreenSuspenseHandler,
//   reuseSuspenseHandlerOnStack,
//   popSuspenseHandler,
// } from './ReactFiberSuspenseContext';
// import {
//   pushHiddenContext,
//   reuseHiddenContextOnStack,
// } from './ReactFiberHiddenContext';
// import {findFirstSuspended} from './ReactFiberSuspenseComponent';
// import {
//   pushProvider,
//   propagateContextChange,
//   lazilyPropagateParentContextChanges,
//   propagateParentContextChangesToDeferredTree,
//   checkIfContextChanged,
//   readContext,
//   prepareToReadContext,
//   scheduleContextWorkOnParentPath,
// } from './ReactFiberNewContext';
// import {
//   renderWithHooks,
//   checkDidRenderIdHook,
//   bailoutHooks,
//   replaySuspendedComponentWithHooks,
//   renderTransitionAwareHostComponentWithHooks,
// } from './ReactFiberHooks';
// import {stopProfilerTimerIfRunning} from './ReactProfilerTimer';
import {
  // getMaskedContext,
  // getUnmaskedContext,
  hasContextChanged as hasLegacyContextChanged,
  // pushContextProvider as pushLegacyContextProvider,
  // isContextProvider as isLegacyContextProvider,
  pushTopLevelContextObject,
  // invalidateContextProvider,
} from './ReactFiberLegacyContext';
import {
  getIsHydrating,
  // enterHydrationState,
  // reenterHydrationStateFromDehydratedActivityInstance,
  // reenterHydrationStateFromDehydratedSuspenseInstance,
  resetHydrationState,
  // claimHydratableSingleton,
  tryToClaimNextHydratableInstance,
  // tryToClaimNextHydratableTextInstance,
  // claimNextHydratableActivityInstance,
  // claimNextHydratableSuspenseInstance,
  // warnIfHydrating,
  // queueHydrationError,
} from './ReactFiberHydrationContext';
// import {
//   constructClassInstance,
//   mountClassInstance,
//   resumeMountClassInstance,
//   updateClassInstance,
//   resolveClassComponentProps,
// } from './ReactFiberClassComponent';
import {
  createFiberFromTypeAndProps,
  // createFiberFromFragment,
  // createFiberFromOffscreen,
  createWorkInProgress,
  // isSimpleFunctionComponent,
  // isFunctionClassComponent,
} from './ReactFiber';
// import {
//   scheduleUpdateOnFiber,
//   renderDidSuspendDelayIfPossible,
//   markSkippedUpdateLanes,
//   markRenderDerivedCause,
//   getWorkInProgressRoot,
//   peekDeferredLane,
// } from './ReactFiberWorkLoop';
// import {enqueueConcurrentRenderForLane} from './ReactFiberConcurrentUpdates';
import {pushCacheProvider, CacheContext} from './ReactFiberCacheComponent';
// import {
//   createCapturedValueFromError,
//   createCapturedValueAtFiber,
// } from './ReactCapturedValue';
import {OffscreenVisible} from './ReactFiberOffscreenComponent';
// import {
//   createClassErrorUpdate,
//   initializeClassErrorUpdate,
// } from './ReactFiberThrow';
import {
  getForksAtLevel,
  isForkedChild,
  pushTreeId,
  pushMaterializedTreeId,
} from './ReactFiberTreeContext';
import {
  // requestCacheFromPool,
  pushRootTransition,
  // getSuspendedCache,
  // pushTransition,
  // getOffscreenDeferredCache,
  // getPendingTransitions,
} from './ReactFiberTransition';
import {
  // getMarkerInstances,
  // pushMarkerInstance,
  pushRootMarkerInstance,
  TransitionTracingMarker,
} from './ReactFiberTracingMarkerComponent';
// import {callComponentInDEV, callRenderInDEV} from './ReactFiberCallUserSpace';
// import {resolveLazy} from './ReactFiberThenable';

// A special exception that's used to unwind the stack when an update flows
// into a dehydrated boundary.
export const SelectiveHydrationException: mixed = new Error(
  "This is not a real error. It's an implementation detail of React's " +
    "selective hydration feature. If this leaks into userspace, it's a bug in " +
    'React. Please file an issue.',
);

let didReceiveUpdate: boolean = false;

let didWarnAboutBadClass;
let didWarnAboutContextTypeOnFunctionComponent;
let didWarnAboutContextTypes;
let didWarnAboutGetDerivedStateOnFunctionComponent;
export let didWarnAboutReassigningProps: boolean;
let didWarnAboutRevealOrder;
let didWarnAboutTailOptions;
let didWarnAboutClassNameOnViewTransition;

if (__DEV__) {
  didWarnAboutBadClass = ({}: {[string]: boolean});
  didWarnAboutContextTypeOnFunctionComponent = ({}: {[string]: boolean});
  didWarnAboutContextTypes = ({}: {[string]: boolean});
  didWarnAboutGetDerivedStateOnFunctionComponent = ({}: {[string]: boolean});
  didWarnAboutReassigningProps = false;
  didWarnAboutRevealOrder = ({}: {[string]: boolean});
  didWarnAboutTailOptions = ({}: {[string]: boolean});
  didWarnAboutClassNameOnViewTransition = ({}: {[string]: boolean});
}

function updateHostRoot(
  current: null | Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostRootContext(workInProgress);

  if (current === null) {
    throw new Error('Should have a current fiber. This is a bug in React.');
  }

  const nextProps = workInProgress.pendingProps;
  const prevState: RootState = workInProgress.memoizedState;
  const prevChildren = prevState.element;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);

  const nextState: RootState = workInProgress.memoizedState;
  const root: FiberRoot = workInProgress.stateNode;
  pushRootTransition(workInProgress, root, renderLanes);

  if (enableTransitionTracing) {
    pushRootMarkerInstance(workInProgress);
  }

  const nextCache: Cache = nextState.cache;
  pushCacheProvider(workInProgress, nextCache);
  if (nextCache !== prevState.cache) {
    // The root cache refreshed.
    // propagateContextChange(workInProgress, CacheContext, renderLanes);
    throw new Error('Not implemented yet.');
  }

  // This would ideally go inside processUpdateQueue, but because it suspends,
  // it needs to happen after the `pushCacheProvider` call above to avoid a
  // context stack mismatch. A bit unfortunate.
  suspendIfUpdateReadFromEntangledAsyncAction();

  // Caution: React DevTools currently depends on this property
  // being called "element".
  const nextChildren = nextState.element;
  if (supportsHydration && prevState.isDehydrated) {
    throw new Error('Not implemented yet.');
  } else {
    // Root is not dehydrated. Either this is a client-only root, or it
    // already hydrated.
    resetHydrationState();
    if (nextChildren === prevChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }
  return workInProgress.child;
}

function bailoutOnAlreadyFinishedWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  throw new Error('Not implemented yet.');
}

export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}

function pushHostRootContext(workInProgress: Fiber) {
  const root = (workInProgress.stateNode: FiberRoot);
  if (root.pendingContext) {
    throw new Error('Not implemented yet.');
  } else {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  if (__DEV__) {
    if (workInProgress._debugNeedsRemount && current !== null) {
      // This will restart the begin phase with a new fiber.
      const copiedFiber = createFiberFromTypeAndProps(
        workInProgress.type,
        workInProgress.key,
        workInProgress.pendingProps,
        workInProgress._debugOwner || null,
        workInProgress.mode,
        workInProgress.lanes,
      );
      copiedFiber._debugStack = workInProgress._debugStack;
      copiedFiber._debugTask = workInProgress._debugTask;
      return remountFiber(current, workInProgress, copiedFiber);
    }
  }

  // current 是否为 null 决定了是 mount 还是 update 阶段
  /*

  这里面 HostRoot 比较特殊，他是提前创建好的，在第一次渲染前就创建好了，所以执行顺序是下面这样

第一次 beginWork: HostRoot → current !== null → Update
第二次 beginWork: App      → current === null → Mount
第三次 beginWork: Child    → current === null → Mount
...

  */
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      // Force a re-render if the implementation changed due to hot reload:
      (__DEV__ ? workInProgress.type !== current.type : false)
    ) {
      throw new Error('Not implemented yet.');
    } else {
      // Neither props nor legacy context changes. Check if there's a pending
      // update or context change.
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes,
      );
      if (
        !hasScheduledUpdateOrContext &&
        // If this is the second pass of an error or suspense boundary, there
        // may not be work scheduled on `current`, so we check for this flag.
        (workInProgress.flags & DidCapture) === NoFlags
      ) {
        throw new Error('Not implemented yet.');
      }

      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      } else {
        // An update was scheduled on this fiber, but there are no new props
        // nor legacy context. Set this to false. If an update queue or context
        // consumer produces a changed value, it will set this to true. Otherwise,
        // the component will assume the children have not changed and bail out.
        didReceiveUpdate = false;
      }
    }
  } else {
    didReceiveUpdate = false;

    if (getIsHydrating() && isForkedChild(workInProgress)) {
      // Check if this child belongs to a list of muliple children in
      // its parent.
      //
      // In a true multi-threaded implementation, we would render children on
      // parallel threads. This would represent the beginning of a new render
      // thread for this subtree.
      //
      // We only use this for id generation during hydration, which is why the
      // logic is located in this special branch.
      const slotIndex = workInProgress.index;
      const numberOfForks = getForksAtLevel(workInProgress);
      pushTreeId(workInProgress, numberOfForks, slotIndex);
    }
  }

  // Before entering the begin phase, clear pending update priority.
  // TODO: This assumes that we're about to evaluate the component and process
  // the update queue. However, there's an exception: SimpleMemoComponent
  // sometimes bails out later in the begin phase. This indicates that we should
  // move this assignment out of the common path and into each branch.
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case LazyComponent: {
      throw new Error('Not implemented yet.');
    }
    case FunctionComponent: {
      throw new Error('Not implemented yet.');
    }
    case ClassComponent: {
      throw new Error('Not implemented yet.');
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostHoistable:
      throw new Error('Not implemented yet.');
    // Fall through
    case HostSingleton:
      throw new Error('Not implemented yet.');
    // Fall through
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      throw new Error('Not implemented yet.');
    case SuspenseComponent:
      throw new Error('Not implemented yet.');
    case HostPortal:
      throw new Error('Not implemented yet.');
    case ForwardRef: {
      throw new Error('Not implemented yet.');
    }
    case Fragment:
      throw new Error('Not implemented yet.');
    case Mode:
      throw new Error('Not implemented yet.');
    case Profiler:
      throw new Error('Not implemented yet.');
    case ContextProvider:
      throw new Error('Not implemented yet.');
    case ContextConsumer:
      throw new Error('Not implemented yet.');
    case MemoComponent: {
      throw new Error('Not implemented yet.');
    }
    case SimpleMemoComponent: {
      throw new Error('Not implemented yet.');
    }
    case IncompleteClassComponent: {
      throw new Error('Not implemented yet.');
    }
    case IncompleteFunctionComponent: {
      throw new Error('Not implemented yet.');
    }
    case SuspenseListComponent: {
      throw new Error('Not implemented yet.');
    }
    case ScopeComponent: {
      throw new Error('Not implemented yet.');
    }
    case ActivityComponent: {
      throw new Error('Not implemented yet.');
    }
    case OffscreenComponent: {
      throw new Error('Not implemented yet.');
    }
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
      // This represents a Component that threw in the reconciliation phase.
      // So we'll rethrow here. This might be a Thenable.
      throw workInProgress.pendingProps;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      'React. Please file an issue.',
  );
}

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  pushHostContext(workInProgress);

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also has access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }

  const memoizedState = workInProgress.memoizedState;
  if (memoizedState !== null) {
    throw new Error('Not implemented yet.');
  }

  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function markRef(current: Fiber | null, workInProgress: Fiber) {
  // TODO: Check props.ref instead of fiber.ref when enableRefAsProp is on.
  const ref = workInProgress.ref;
  if (ref === null) {
    if (current !== null && current.ref !== null) {
      // Schedule a Ref effect
      workInProgress.flags |= Ref | RefStatic;
    }
  } else {
    if (typeof ref !== 'function' && typeof ref !== 'object') {
      throw new Error(
        'Expected ref to be a function, an object returned by React.createRef(), or undefined/null.',
      );
    }
    if (current === null || current.ref !== ref) {
      // Schedule a Ref effect
      workInProgress.flags |= Ref | RefStatic;
    }
  }
}

function remountFiber(
  current: Fiber,
  oldWorkInProgress: Fiber,
  newWorkInProgress: Fiber,
): Fiber | null {
  throw new Error('Not implemented yet.');
}

function checkScheduledUpdateOrContext(
  current: Fiber,
  renderLanes: Lanes,
): boolean {
  // Before performing an early bailout, we must check if there are pending
  // updates or context.
  const updateLanes = current.lanes;
  if (includesSomeLane(updateLanes, renderLanes)) {
    return true;
  }
  throw new Error('Not implemented yet.');
}

export {beginWork};
