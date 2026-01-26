/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Instance,
  TextInstance,
  ActivityInstance,
  SuspenseInstance,
  Container,
  HoistableRoot,
  // FormInstance,
  Props,
  SuspendedState,
} from './ReactFiberConfig';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane';
import {
  includesLoadingIndicatorLanes,
  // includesOnlySuspenseyCommitEligibleLanes,
  includesOnlyViewTransitionEligibleLanes,
} from './ReactFiberLane';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {SuspenseState, RetryQueue} from './ReactFiberSuspenseComponent';
import type {UpdateQueue} from './ReactFiberClassUpdateQueue';
// import type {FunctionComponentUpdateQueue} from './ReactFiberHooks';
import type {Wakeable, ViewTransitionProps} from 'shared/ReactTypes';
import type {
  OffscreenState,
  OffscreenInstance,
  OffscreenQueue,
} from './ReactFiberOffscreenComponent';
import type {Cache} from './ReactFiberCacheComponent';
import type {RootState} from './ReactFiberRoot';
import type {Transition} from 'react/src/ReactStartTransition';
import type {
  TracingMarkerInstance,
  TransitionAbort,
} from './ReactFiberTracingMarkerComponent';
import type {ViewTransitionState} from './ReactFiberViewTransitionComponent';

import {
  alwaysThrottleRetries,
  enableCreateEventHandleAPI,
  enableHiddenSubtreeInsertionEffectCleanup,
  enableProfilerTimer,
  enableProfilerCommitHooks,
  enableSuspenseCallback,
  enableScopeAPI,
  enableUpdaterTracking,
  enableTransitionTracing,
  enableUseEffectEventHook,
  enableLegacyHidden,
  disableLegacyMode,
  enableComponentPerformanceTrack,
  enableViewTransition,
  enableFragmentRefs,
  enableEagerAlternateStateNodeCleanup,
  enableDefaultTransitionIndicator,
} from 'shared/ReactFeatureFlags';
import {
  FunctionComponent,
  ForwardRef,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostPortal,
  Profiler,
  ActivityComponent,
  SuspenseComponent,
  DehydratedFragment,
  IncompleteClassComponent,
  MemoComponent,
  SimpleMemoComponent,
  SuspenseListComponent,
  ScopeComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
  CacheComponent,
  TracingMarkerComponent,
  ViewTransitionComponent,
  Fragment,
} from './ReactWorkTags';
import {
  NoFlags,
  ContentReset,
  Placement,
  ChildDeletion,
  Snapshot,
  Update,
  Hydrate,
  Callback,
  Ref,
  Hydrating,
  Passive,
  BeforeMutationMask,
  BeforeAndAfterMutationTransitionMask,
  MutationMask,
  LayoutMask,
  PassiveMask,
  PassiveTransitionMask,
  Visibility,
  ShouldSuspendCommit,
  MaySuspendCommit,
  FormReset,
  Cloned,
  PerformedWork,
  ForceClientRender,
  DidCapture,
  AffectedParentLayout,
  ViewTransitionNamedStatic,
  PortalStatic,
} from './ReactFiberFlags';
import {
  commitStartTime,
  pushNestedEffectDurations,
  // popNestedEffectDurations,
  // bubbleNestedEffectDurations,
  resetComponentEffectTimers,
  pushComponentEffectStart,
  popComponentEffectStart,
  pushComponentEffectDuration,
  popComponentEffectDuration,
  pushComponentEffectErrors,
  popComponentEffectErrors,
  pushComponentEffectDidSpawnUpdate,
  popComponentEffectDidSpawnUpdate,
  componentEffectStartTime,
  componentEffectEndTime,
  componentEffectDuration,
  componentEffectErrors,
  componentEffectSpawnedUpdate,
} from './ReactProfilerTimer';
// import {
//   logComponentRender,
//   logComponentErrored,
//   logComponentEffect,
//   logComponentMount,
//   logComponentUnmount,
//   logComponentReappeared,
//   logComponentDisappeared,
//   pushDeepEquality,
//   popDeepEquality,
// } from './ReactFiberPerformanceTrack';
import {ConcurrentMode, NoMode, ProfileMode} from './ReactTypeOfMode';
// import {deferHiddenCallbacks} from './ReactFiberClassUpdateQueue';
import {
  supportsMutation,
  supportsPersistence,
  supportsHydration,
  supportsResources,
  supportsSingletons,
  // clearSuspenseBoundary,
  // clearSuspenseBoundaryFromContainer,
  createContainerChildSet,
  clearContainer,
  // prepareScopeUpdate,
  prepareForCommit,
  // beforeActiveInstanceBlur,
  // detachDeletedInstance,
  getHoistableRoot,
  // acquireResource,
  // releaseResource,
  // hydrateHoistable,
  // mountHoistable,
  // unmountHoistable,
  prepareToCommitHoistables,
  // maySuspendCommitInSyncRender,
  // suspendInstance,
  // suspendResource,
  // resetFormInstance,
  // registerSuspenseInstanceRetry,
  // cancelViewTransitionName,
  // cancelRootViewTransitionName,
  // restoreRootViewTransitionName,
  // isSingletonScope,
  // updateFragmentInstanceFiber,
} from './ReactFiberConfig';
// import {
//   captureCommitPhaseError,
//   resolveRetryWakeable,
//   markCommitTimeOfFallback,
//   restorePendingUpdaters,
//   addTransitionStartCallbackToPendingTransition,
//   addTransitionProgressCallbackToPendingTransition,
//   addTransitionCompleteCallbackToPendingTransition,
//   addMarkerProgressCallbackToPendingTransition,
//   addMarkerIncompleteCallbackToPendingTransition,
//   addMarkerCompleteCallbackToPendingTransition,
//   retryDehydratedSuspenseBoundary,
//   scheduleViewTransitionEvent,
// } from './ReactFiberWorkLoop';
import {
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Insertion as HookInsertion,
  Passive as HookPassive,
} from './ReactHookEffectTags';
// import {doesFiberContain} from './ReactFiberTreeReflection';
// import {isDevToolsPresent, onCommitUnmount} from './ReactFiberDevToolsHook';
import {releaseCache, retainCache} from './ReactFiberCacheComponent';
// import {clearTransitionsForLanes} from './ReactFiberLane';
import {
  OffscreenVisible,
  OffscreenPassiveEffectsConnected,
} from './ReactFiberOffscreenComponent';
import {
  TransitionRoot,
  TransitionTracingMarker,
} from './ReactFiberTracingMarkerComponent';
// import {getViewTransitionClassName} from './ReactFiberViewTransitionComponent';
import {
  //   commitHookLayoutEffects,
  //   commitHookLayoutUnmountEffects,
  //   commitHookEffectListMount,
  //   commitHookEffectListUnmount,
  //   commitHookPassiveMountEffects,
  //   commitHookPassiveUnmountEffects,
  //   commitClassLayoutLifecycles,
  //   commitClassDidMount,
  //   commitClassCallbacks,
  //   commitClassHiddenCallbacks,
  //   commitClassSnapshot,
  //   safelyCallComponentWillUnmount,
  //   safelyAttachRef,
  safelyDetachRef,
  //   commitProfilerUpdate,
  //   commitProfilerPostCommit,
  //   commitRootCallbacks,
} from './ReactFiberCommitEffects';
import {
  //   commitHostMount,
  //   commitHostHydratedInstance,
  //   commitHostUpdate,
  //   commitHostTextUpdate,
  //   commitHostResetTextContent,
  //   commitShowHideSuspenseBoundary,
  //   commitShowHideHostInstance,
  //   commitShowHideHostTextInstance,
  commitHostPlacement,
  //   commitHostRootContainerChildren,
  //   commitHostPortalContainerChildren,
  //   commitHostHydratedContainer,
  //   commitHostHydratedActivity,
  //   commitHostHydratedSuspense,
  //   commitHostRemoveChildFromContainer,
  //   commitHostRemoveChild,
  //   commitHostSingletonAcquisition,
  //   commitHostSingletonRelease,
  commitFragmentInstanceDeletionEffects,
  //   commitFragmentInstanceInsertionEffects,
} from './ReactFiberCommitHostEffects';
import {
  //   trackEnterViewTransitions,
  //   commitEnterViewTransitions,
  //   commitExitViewTransitions,
  //   commitBeforeUpdateViewTransition,
  commitNestedViewTransitions,
  //   restoreEnterOrExitViewTransitions,
  //   restoreUpdateViewTransition,
  //   restoreNestedViewTransitions,
  //   measureUpdateViewTransition,
  //   measureNestedViewTransitions,
  resetAppearingViewTransitions,
  //   trackAppearingViewTransition,
  //   viewTransitionCancelableChildren,
  //   pushViewTransitionCancelableScope,
  //   popViewTransitionCancelableScope,
} from './ReactFiberCommitViewTransitions';
import {
  //   viewTransitionMutationContext,
  pushRootMutationContext,
  //   pushMutationContext,
  popMutationContext,
  rootMutationContext,
} from './ReactFiberMutationTracking';
// import {
//   trackNamedViewTransition,
//   untrackNamedViewTransition,
// } from './ReactFiberDuplicateViewTransitions';
import {markIndicatorHandled} from './ReactFiberRootScheduler';
import type {Flags} from './ReactFiberFlags';

// Used during the commit phase to track the state of the Offscreen component stack.
// Allows us to avoid traversing the return path to find the nearest Offscreen ancestor.
let offscreenSubtreeIsHidden: boolean = false;
let offscreenSubtreeWasHidden: boolean = false;
// Track whether there's a hidden offscreen above with no HostComponent between. If so,
// it overrides the hiddenness of the HostComponent below.
let offscreenDirectParentIsHidden: boolean = false;

// Used to track if a form needs to be reset at the end of the mutation phase.
let needsFormReset = false;

const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;

let nextEffect: Fiber | null = null;

// Used for Profiling builds to track updaters.
let inProgressLanes: Lanes | null = null;
let inProgressRoot: FiberRoot | null = null;

let focusedInstanceHandle: null | Fiber = null;
export let shouldFireAfterActiveInstanceBlur: boolean = false;

// Used during the commit phase to track whether a parent ViewTransition component
// might have been affected by any mutations / relayouts below.
let viewTransitionContextChanged: boolean = false;
let inUpdateViewTransition: boolean = false;
let rootViewTransitionAffected: boolean = false;
let rootViewTransitionNameCanceled: boolean = false;

export function commitBeforeMutationEffects(
  root: FiberRoot,
  firstChild: Fiber,
  committedLanes: Lanes,
): void {
  focusedInstanceHandle = prepareForCommit(root.containerInfo);
  shouldFireAfterActiveInstanceBlur = false;

  const isViewTransitionEligible =
    enableViewTransition &&
    includesOnlyViewTransitionEligibleLanes(committedLanes);

  nextEffect = firstChild;
  commitBeforeMutationEffects_begin(isViewTransitionEligible);

  // We no longer need to track the active instance fiber
  focusedInstanceHandle = null;
  // We've found any matched pairs and can now reset.
  resetAppearingViewTransitions();
}

function commitBeforeMutationEffects_begin(isViewTransitionEligible: boolean) {
  // If this commit is eligible for a View Transition we look into all mutated subtrees.
  // TODO: We could optimize this by marking these with the Snapshot subtree flag in the render phase.
  const subtreeMask = isViewTransitionEligible
    ? BeforeAndAfterMutationTransitionMask
    : BeforeMutationMask;

  while (nextEffect !== null) {
    const fiber = nextEffect;
    // This phase is only used for beforeActiveInstanceBlur.
    // Let's skip the whole loop if it's off.
    if (enableCreateEventHandleAPI || isViewTransitionEligible) {
      throw new Error('Not implemented yet.');
    }

    if (
      enableViewTransition &&
      fiber.alternate === null &&
      (fiber.flags & Placement) !== NoFlags
    ) {
      throw new Error('Not implemented yet.');
    }

    // TODO: This should really unify with the switch in commitBeforeMutationEffectsOnFiber recursively.
    if (enableViewTransition && fiber.tag === OffscreenComponent) {
      throw new Error('Not implemented yet.');
    }

    const child = fiber.child;
    if ((fiber.subtreeFlags & subtreeMask) !== NoFlags && child !== null) {
      child.return = fiber;
      nextEffect = child;
    } else {
      if (isViewTransitionEligible) {
        // We are inside an updated subtree. Any mutations that affected the
        // parent HostInstance's layout or set of children (such as reorders)
        // might have also affected the positioning or size of the inner
        // ViewTransitions. Therefore we need to find them inside.
        commitNestedViewTransitions(fiber);
      }
      commitBeforeMutationEffects_complete(isViewTransitionEligible);
    }
  }
}

function commitBeforeMutationEffects_complete(
  isViewTransitionEligible: boolean,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    commitBeforeMutationEffectsOnFiber(fiber, isViewTransitionEligible);

    const sibling = fiber.sibling;
    if (sibling !== null) {
      sibling.return = fiber.return;
      nextEffect = sibling;
      return;
    }

    nextEffect = fiber.return;
  }
}

function commitBeforeMutationEffectsOnFiber(
  finishedWork: Fiber,
  isViewTransitionEligible: boolean,
) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  if (enableCreateEventHandleAPI) {
    throw new Error('Not implemented yet.');
  }

  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      if (enableUseEffectEventHook) {
        // if ((flags & Update) !== NoFlags) {
        //   const updateQueue: FunctionComponentUpdateQueue | null =
        //     (finishedWork.updateQueue: any);
        //   const eventPayloads =
        //     updateQueue !== null ? updateQueue.events : null;
        //   if (eventPayloads !== null) {
        //     for (let ii = 0; ii < eventPayloads.length; ii++) {
        //       const {ref, nextImpl} = eventPayloads[ii];
        //       ref.impl = nextImpl;
        //     }
        //   }
        // }
        throw new Error('Not implemented yet.');
      }
      break;
    }
    case ClassComponent: {
      if ((flags & Snapshot) !== NoFlags) {
        if (current !== null) {
          // commitClassSnapshot(finishedWork, current);
          throw new Error('Not implemented yet.');
        }
      }
      break;
    }
    case HostRoot: {
      if ((flags & Snapshot) !== NoFlags) {
        if (supportsMutation) {
          const root = finishedWork.stateNode;
          clearContainer(root.containerInfo);
        }
      }
      break;
    }
    case HostComponent:
    case HostHoistable:
    case HostSingleton:
    case HostText:
    case HostPortal:
    case IncompleteClassComponent:
      // Nothing to do for these component types
      break;
    case ViewTransitionComponent:
      if (enableViewTransition) {
        if (isViewTransitionEligible) {
          if (current === null) {
            // This is a new mount. We should have handled this as part of the
            // Placement effect or it is deeper inside a entering transition.
          } else {
            // Something may have mutated within this subtree. This might need to cause
            // a cross-fade of this parent. We first assign old names to the
            // previous tree in the before mutation phase in case we need to.
            // TODO: This walks the tree that we might continue walking anyway.
            // We should just stash the parent ViewTransitionComponent and continue
            // walking the tree until we find HostComponent but to do that we need
            // to use a stack which requires refactoring this phase.

            // commitBeforeUpdateViewTransition(current, finishedWork);
            throw new Error('Not implemented yet.');
          }
        }
        break;
      }
    // Fallthrough
    default: {
      if ((flags & Snapshot) !== NoFlags) {
        throw new Error(
          'This unit of work tag should not have side-effects. This error is ' +
            'likely caused by a bug in React. Please file an issue.',
        );
      }
    }
  }
}

// These are tracked on the stack as we recursively traverse a
// deleted subtree.
// TODO: Update these during the whole mutation phase, not just during
// a deletion.
let hostParent: Instance | Container | null = null;
let hostParentIsContainer: boolean = false;

function commitDeletionEffects(
  root: FiberRoot,
  returnFiber: Fiber,
  deletedFiber: Fiber,
) {
  const prevEffectStart = pushComponentEffectStart();
  throw new Error('Not implemented yet.');
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber,
  lanes: Lanes,
) {
  // Deletions effects can be scheduled on any fiber type. They need to happen
  // before the children effects have fired.
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }

  if (parentFiber.subtreeFlags & (MutationMask | Cloned)) {
    let child = parentFiber.child;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root, lanes);
      child = child.sibling;
    }
  }
}

let currentHoistableRoot: HoistableRoot | null = null;

export function commitMutationEffects(
  root: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
) {
  inProgressLanes = committedLanes;
  inProgressRoot = root;

  rootViewTransitionAffected = false;
  inUpdateViewTransition = false;

  resetComponentEffectTimers();

  commitMutationEffectsOnFiber(finishedWork, root, committedLanes);

  inProgressLanes = null;
  inProgressRoot = null;
}

function commitMutationEffectsOnFiber(
  finishedWork: Fiber,
  root: FiberRoot,
  lanes: Lanes,
) {
  const prevEffectStart = pushComponentEffectStart();
  const prevEffectDuration = pushComponentEffectDuration();
  const prevEffectErrors = pushComponentEffectErrors();
  const prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  // The effect flag should be checked *after* we refine the type of fiber,
  // because the fiber tag is more specific. An exception is any flag related
  // to reconciliation, because those can be set on all fiber types.
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // break;
      throw new Error('Not implemented yet.');
    }
    case ClassComponent: {
      // break;
      throw new Error('Not implemented yet.');
    }
    case HostHoistable: {
      throw new Error('Not implemented yet.');
      // Fall through
    }
    case HostSingleton: {
      throw new Error('Not implemented yet.');
      // Fall through
    }
    case HostComponent: {
      throw new Error('Not implemented yet.');
    }
    case HostText: {
      throw new Error('Not implemented yet.');
    }
    case HostRoot: {
      const prevProfilerEffectDuration = pushNestedEffectDurations();

      pushRootMutationContext();
      if (supportsResources) {
        prepareToCommitHoistables();

        const previousHoistableRoot = currentHoistableRoot;
        currentHoistableRoot = getHoistableRoot(root.containerInfo);

        recursivelyTraverseMutationEffects(root, finishedWork, lanes);
        currentHoistableRoot = previousHoistableRoot;

        commitReconciliationEffects(finishedWork, lanes);
      } else {
        throw new Error('Not implemented yet.');
      }

      if (flags & Update) {
        throw new Error('Not implemented yet.');
      }

      if (needsFormReset) {
        throw new Error('Not implemented yet.');
      }

      if (enableProfilerTimer && enableProfilerCommitHooks) {
        throw new Error('Not implemented yet.');
      }

      popMutationContext(false);

      if (
        enableDefaultTransitionIndicator &&
        rootMutationContext &&
        includesLoadingIndicatorLanes(lanes)
      ) {
        // This root had a mutation. Mark this root as having rendered a manual
        // loading state.
        markIndicatorHandled(root);
      }

      break;
    }
    case HostPortal: {
      throw new Error('Not implemented yet.');
    }
    case Profiler: {
      throw new Error('Not implemented yet.');
    }
    case ActivityComponent: {
      throw new Error('Not implemented yet.');
    }
    case SuspenseComponent: {
      throw new Error('Not implemented yet.');
    }
    case OffscreenComponent: {
      throw new Error('Not implemented yet.');
    }
    case SuspenseListComponent: {
      throw new Error('Not implemented yet.');
    }
    case ViewTransitionComponent: {
      throw new Error('Not implemented yet.');
    }
    case ScopeComponent: {
      throw new Error('Not implemented yet.');
    }
    case Fragment:
      throw new Error('Not implemented yet.');
    // Fallthrough
    default: {
      throw new Error('Not implemented yet.');
    }
  }

  if (
    enableProfilerTimer &&
    enableProfilerCommitHooks &&
    enableComponentPerformanceTrack &&
    (finishedWork.mode & ProfileMode) !== NoMode &&
    componentEffectStartTime >= 0 &&
    componentEffectEndTime >= 0 &&
    (componentEffectSpawnedUpdate || componentEffectDuration > 0.05)
  ) {
    // logComponentEffect(
    //   finishedWork,
    //   componentEffectStartTime,
    //   componentEffectEndTime,
    //   componentEffectDuration,
    //   componentEffectErrors,
    // );
    throw new Error('Not implemented yet.');
  }

  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  popComponentEffectErrors(prevEffectErrors);
  popComponentEffectDidSpawnUpdate(prevEffectDidSpawnUpdate);
}

function recursivelyTraverseDisappearLayoutEffects(parentFiber: Fiber) {
  // TODO (Offscreen) Check: subtreeflags & (RefStatic | LayoutStatic)
  let child = parentFiber.child;
  while (child !== null) {
    disappearLayoutEffects(child);
    child = child.sibling;
  }
}

function commitReconciliationEffects(
  finishedWork: Fiber,
  committedLanes: Lanes,
) {
  // Placement effects (insertions, reorders) can be scheduled on any fiber
  // type. They needs to happen after the children effects have fired, but
  // before the effects on this fiber have fired.
  const flags = finishedWork.flags;
  if (flags & Placement) {
    commitHostPlacement(finishedWork);
    // Clear the "placement" from effect tag so that we know that this is
    // inserted, before any life-cycles like componentDidMount gets called.
    // TODO: findDOMNode doesn't rely on this any more but isMounted does
    // and isMounted is deprecated anyway so we should be able to kill this.
    finishedWork.flags &= ~Placement;
  }
  if (flags & Hydrating) {
    finishedWork.flags &= ~Hydrating;
  }
}

export function disappearLayoutEffects(finishedWork: Fiber) {
  const prevEffectStart = pushComponentEffectStart();
  const prevEffectDuration = pushComponentEffectDuration();
  const prevEffectErrors = pushComponentEffectErrors();
  const prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // // TODO (Offscreen) Check: flags & LayoutStatic
      // commitHookLayoutUnmountEffects(
      //   finishedWork,
      //   finishedWork.return,
      //   HookLayout,
      // );
      // recursivelyTraverseDisappearLayoutEffects(finishedWork);
      // break;
      throw new Error('Not implemented yet.');
    }
    case ClassComponent: {
      // // TODO (Offscreen) Check: flags & RefStatic
      // safelyDetachRef(finishedWork, finishedWork.return);

      // const instance = finishedWork.stateNode;
      // if (typeof instance.componentWillUnmount === 'function') {
      //   safelyCallComponentWillUnmount(
      //     finishedWork,
      //     finishedWork.return,
      //     instance,
      //   );
      // }

      // recursivelyTraverseDisappearLayoutEffects(finishedWork);
      // break;
      throw new Error('Not implemented yet.');
    }
    case HostSingleton: {
      // if (supportsSingletons) {
      //   // TODO (Offscreen) Check: flags & RefStatic
      //   commitHostSingletonRelease(finishedWork);
      // }
      throw new Error('Not implemented yet.');
      // Expected fallthrough to HostComponent
    }
    case HostHoistable:
    case HostComponent: {
      // TODO (Offscreen) Check: flags & RefStatic
      safelyDetachRef(finishedWork, finishedWork.return);

      if (enableFragmentRefs && finishedWork.tag === HostComponent) {
        commitFragmentInstanceDeletionEffects(finishedWork);
      }

      recursivelyTraverseDisappearLayoutEffects(finishedWork);
      break;
    }
    case OffscreenComponent: {
      // const isHidden = finishedWork.memoizedState !== null;
      // if (isHidden) {
      //   // Nested Offscreen tree is already hidden. Don't disappear
      //   // its effects.
      // } else {
      //   recursivelyTraverseDisappearLayoutEffects(finishedWork);
      // }
      // break;
      throw new Error('Not implemented yet.');
    }
    case ViewTransitionComponent: {
      // if (enableViewTransition) {
      //   if (__DEV__) {
      //     if (finishedWork.flags & ViewTransitionNamedStatic) {
      //       untrackNamedViewTransition(finishedWork);
      //     }
      //   }
      //   safelyDetachRef(finishedWork, finishedWork.return);
      // }
      // recursivelyTraverseDisappearLayoutEffects(finishedWork);
      // break;
      throw new Error('Not implemented yet.');
    }
    case Fragment: {
      // if (enableFragmentRefs) {
      //   safelyDetachRef(finishedWork, finishedWork.return);
      // }
      throw new Error('Not implemented yet.');
      // Fallthrough
    }
    default: {
      recursivelyTraverseDisappearLayoutEffects(finishedWork);
      break;
    }
  }

  if (
    enableProfilerTimer &&
    enableProfilerCommitHooks &&
    enableComponentPerformanceTrack &&
    (finishedWork.mode & ProfileMode) !== NoMode &&
    componentEffectStartTime >= 0 &&
    componentEffectEndTime >= 0 &&
    (componentEffectSpawnedUpdate || componentEffectDuration > 0.05)
  ) {
    // logComponentEffect(
    //   finishedWork,
    //   componentEffectStartTime,
    //   componentEffectEndTime,
    //   componentEffectDuration,
    //   componentEffectErrors,
    // );
    throw new Error('Not implemented yet.');
  }

  popComponentEffectStart(prevEffectStart);
  popComponentEffectDuration(prevEffectDuration);
  popComponentEffectErrors(prevEffectErrors);
  popComponentEffectDidSpawnUpdate(prevEffectDidSpawnUpdate);
}
