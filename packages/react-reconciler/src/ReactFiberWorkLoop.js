/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_STRICT_MODE_TYPE} from 'shared/ReactSymbols';

import type {Wakeable, Thenable} from 'shared/ReactTypes';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {Lanes, Lane} from './ReactFiberLane';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {SuspenseState} from './ReactFiberSuspenseComponent';
// import type {FunctionComponentUpdateQueue} from './ReactFiberHooks';
import type {Transition} from 'react/src/ReactStartTransition';
import type {
  PendingTransitionCallbacks,
  PendingBoundaries,
  TransitionAbort,
} from './ReactFiberTracingMarkerComponent';
import type {OffscreenInstance} from './ReactFiberOffscreenComponent';
import type {
  // Resource,
  ViewTransitionInstance,
  RunningViewTransition,
  // SuspendedState,
} from './ReactFiberConfig';
import type {RootState} from './ReactFiberRoot';
// import {
//   getViewTransitionName,
//   type ViewTransitionState,
// } from './ReactFiberViewTransitionComponent';
import type {TransitionTypes} from 'react/src/ReactTransitionType';

import {
  enableCreateEventHandleAPI,
  enableProfilerTimer,
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableSchedulingProfiler,
  enableUpdaterTracking,
  enableTransitionTracing,
  disableLegacyContext,
  alwaysThrottleRetries,
  enableInfiniteRenderLoopDetection,
  disableLegacyMode,
  enableComponentPerformanceTrack,
  enableYieldingBeforePassive,
  enableThrottledScheduling,
  enableViewTransition,
  enableGestureTransition,
  enableDefaultTransitionIndicator,
} from 'shared/ReactFeatureFlags';
import {resetOwnerStackLimit} from 'shared/ReactOwnerStackReset';
import ReactSharedInternals from 'shared/ReactSharedInternals';
// import is from 'shared/objectIs';

// import reportGlobalError from 'shared/reportGlobalError';

import {
  // Aliased because `act` will override and push to an internal queue
  // scheduleCallback as Scheduler_scheduleCallback,
  // shouldYield,
  // requestPaint,
  now,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from './Scheduler';
// import {
//   logBlockingStart,
//   logGestureStart,
//   logTransitionStart,
//   logRenderPhase,
//   logInterruptedRenderPhase,
//   logSuspendedRenderPhase,
//   logRecoveredRenderPhase,
//   logErroredRenderPhase,
//   logInconsistentRender,
//   logSuspendedWithDelayPhase,
//   logSuspendedCommitPhase,
//   logSuspendedViewTransitionPhase,
//   logCommitPhase,
//   logPaintYieldPhase,
//   logStartViewTransitionYieldPhase,
//   logAnimatingPhase,
//   logPassiveCommitPhase,
//   logYieldTime,
//   logActionYieldTime,
//   logSuspendedYieldTime,
//   setCurrentTrackFromLanes,
//   markAllLanesInOrder,
// } from './ReactFiberPerformanceTrack';

import {
  // resetAfterCommit,
  // scheduleTimeout,
  cancelTimeout,
  noTimeout,
  // afterActiveInstanceBlur,
  // startSuspendingCommit,
  // suspendOnActiveViewTransition,
  // waitForCommitToBeReady,
  // getSuspendedCommitReason,
  // preloadInstance,
  // preloadResource,
  // supportsHydration,
  // setCurrentUpdatePriority,
  // getCurrentUpdatePriority,
  resolveUpdatePriority,
  // trackSchedulerEvent,
  // startViewTransition,
  // startGestureTransition,
  // stopViewTransition,
  // createViewTransitionInstance,
  // flushHydrationEvents,
} from './ReactFiberConfig';

import {
  createWorkInProgress,
  // resetWorkInProgress
} from './ReactFiber';
// import {isRootDehydrated} from './ReactFiberShellHydration';
// import {getIsHydrating} from './ReactFiberHydrationContext';
import {
  NoMode,
  ProfileMode,
  ConcurrentMode,
  StrictLegacyMode,
  StrictEffectsMode,
} from './ReactTypeOfMode';
import {
  HostRoot,
  ClassComponent,
  ActivityComponent,
  SuspenseComponent,
  SuspenseListComponent,
  OffscreenComponent,
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
  HostComponent,
  HostHoistable,
  HostSingleton,
} from './ReactWorkTags';
import {ConcurrentRoot, LegacyRoot} from './ReactRootTags';
import type {Flags} from './ReactFiberFlags';
import {
  NoFlags,
  Incomplete,
  StoreConsistency,
  HostEffectMask,
  ForceClientRender,
  BeforeMutationMask,
  MutationMask,
  LayoutMask,
  PassiveMask,
  PlacementDEV,
  Visibility,
  MountPassiveDev,
  MountLayoutDev,
  DidDefer,
  ShouldSuspendCommit,
  MaySuspendCommit,
  ScheduleRetry,
  PassiveTransitionMask,
} from './ReactFiberFlags';
import {
  NoLanes,
  NoLane,
  SyncLane,
  // claimNextRetryLane,
  // includesSyncLane,
  // isSubsetOfLanes,
  mergeLanes,
  // removeLanes,
  pickArbitraryLane,
  // includesNonIdleWork,
  // includesOnlyRetries,
  // includesOnlyTransitions,
  includesBlockingLane,
  // includesTransitionLane,
  // includesRetryLane,
  // includesIdleGroupLanes,
  includesExpiredLane,
  // getNextLanes,
  getEntangledLanes,
  // getLanesToRetrySynchronouslyOnError,
  // upgradePendingLanesToSync,
  // markRootSuspended as _markRootSuspended,
  markRootUpdated as _markRootUpdated,
  // markRootPinged as _markRootPinged,
  // markRootFinished,
  addFiberToLanesMap,
  // movePendingFibersToMemoized,
  // addTransitionToLanesMap,
  getTransitionsForLanes,
  // includesSomeLane,
  OffscreenLane,
  SyncUpdateLanes,
  UpdateLanes,
  // claimNextTransitionDeferredLane,
  checkIfRootIsPrerendering,
  // includesOnlyViewTransitionEligibleLanes,
  // isGestureRender,
  GestureLane,
  SomeTransitionLane,
  SomeRetryLane,
  IdleLane,
} from './ReactFiberLane';
import {
  DiscreteEventPriority,
  DefaultEventPriority,
  // lowerEventPriority,
  // lanesToEventPriority,
  eventPriorityToLane,
} from './ReactEventPriorities';
import {requestCurrentTransition} from './ReactFiberTransition';
// import {
//   SelectiveHydrationException,
//   beginWork,
//   replayFunctionComponent,
// } from './ReactFiberBeginWork';
// import {completeWork} from './ReactFiberCompleteWork';
// import {unwindWork, unwindInterruptedWork} from './ReactFiberUnwindWork';
// import {
//   throwException,
//   createRootErrorUpdate,
//   createClassErrorUpdate,
//   initializeClassErrorUpdate,
// } from './ReactFiberThrow';
// import {
//   commitBeforeMutationEffects,
//   shouldFireAfterActiveInstanceBlur,
//   commitAfterMutationEffects,
//   commitLayoutEffects,
//   commitMutationEffects,
//   commitPassiveMountEffects,
//   commitPassiveUnmountEffects,
//   disappearLayoutEffects,
//   reconnectPassiveEffects,
//   reappearLayoutEffects,
//   disconnectPassiveEffect,
//   invokeLayoutEffectMountInDEV,
//   invokePassiveEffectMountInDEV,
//   invokeLayoutEffectUnmountInDEV,
//   invokePassiveEffectUnmountInDEV,
//   accumulateSuspenseyCommit,
// } from './ReactFiberCommitWork';
// import {resetShouldStartViewTransition} from './ReactFiberCommitViewTransitions';
// import {shouldStartViewTransition} from './ReactFiberCommitViewTransitions';
// import {
//   insertDestinationClones,
//   applyDepartureTransitions,
//   startGestureAnimations,
// } from './ReactFiberApplyGesture';
// import {enqueueUpdate} from './ReactFiberClassUpdateQueue';
// import {resetContextDependencies} from './ReactFiberNewContext';
import {
  // resetHooksAfterThrow,
  // resetHooksOnUnwind,
  ContextOnlyDispatcher,
} from './ReactFiberHooks';
import {DefaultAsyncDispatcher} from './ReactFiberAsyncDispatcher';
import {
  // createCapturedValueAtFiber,
  type CapturedValue,
} from './ReactCapturedValue';
import {
  // enqueueConcurrentRenderForLane,
  finishQueueingConcurrentUpdates,
  // getConcurrentlyUpdatedLanes,
} from './ReactFiberConcurrentUpdates';

// import {
//   blockingClampTime,
//   blockingUpdateTime,
//   blockingUpdateTask,
//   blockingUpdateType,
//   blockingUpdateMethodName,
//   blockingUpdateComponentName,
//   blockingEventTime,
//   blockingEventType,
//   blockingEventRepeatTime,
//   blockingSuspendedTime,
//   gestureClampTime,
//   gestureUpdateTime,
//   gestureUpdateTask,
//   gestureUpdateType,
//   gestureUpdateMethodName,
//   gestureUpdateComponentName,
//   gestureEventTime,
//   gestureEventType,
//   gestureEventRepeatTime,
//   gestureSuspendedTime,
//   transitionClampTime,
//   transitionStartTime,
//   transitionUpdateTime,
//   transitionUpdateTask,
//   transitionUpdateType,
//   transitionUpdateMethodName,
//   transitionUpdateComponentName,
//   transitionEventTime,
//   transitionEventType,
//   transitionEventRepeatTime,
//   transitionSuspendedTime,
//   clearBlockingTimers,
//   clearGestureTimers,
//   clearGestureUpdates,
//   clearTransitionTimers,
//   clampBlockingTimers,
//   clampGestureTimers,
//   clampTransitionTimers,
//   clampRetryTimers,
//   clampIdleTimers,
//   markNestedUpdateScheduled,
//   renderStartTime,
//   commitStartTime,
//   commitEndTime,
//   commitErrors,
//   recordRenderTime,
//   recordCommitTime,
//   recordCommitEndTime,
//   startProfilerTimer,
//   stopProfilerTimerIfRunningAndRecordDuration,
//   stopProfilerTimerIfRunningAndRecordIncompleteDuration,
//   trackSuspendedTime,
//   startYieldTimer,
//   yieldStartTime,
//   yieldReason,
//   startPingTimerByLanes,
//   recordEffectError,
//   resetCommitErrors,
//   PINGED_UPDATE,
//   SPAWNED_UPDATE,
//   startAnimating,
//   stopAnimating,
//   animatingLanes,
//   retryClampTime,
//   idleClampTime,
//   animatingTask,
// } from './ReactProfilerTimer';

// // DEV stuff
// import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
// import {
//   isRendering as ReactCurrentDebugFiberIsRenderingInDEV,
//   resetCurrentFiber,
//   runWithFiberInDEV,
// } from './ReactCurrentFiber';
import {
  isDevToolsPresent,
  // markCommitStarted,
  // markCommitStopped,
  // markComponentRenderStopped,
  // markComponentSuspended,
  // markComponentErrored,
  // markLayoutEffectsStarted,
  // markLayoutEffectsStopped,
  // markPassiveEffectsStarted,
  // markPassiveEffectsStopped,
  markRenderStarted,
  // markRenderYielded,
  // markRenderStopped,
  // onCommitRoot as onCommitRootDevTools,
  // onPostCommitRoot as onPostCommitRootDevTools,
  // setIsStrictModeForDevtools,
} from './ReactFiberDevToolsHook';
// import {onCommitRoot as onCommitRootTestSelector} from './ReactTestSelectors';
// import {releaseCache} from './ReactFiberCacheComponent';
import {
  // isLegacyActEnvironment,
  isConcurrentActEnvironment,
} from './ReactFiberAct';
// import {processTransitionCallbacks} from './ReactFiberTracingMarkerComponent';
// import {
//   SuspenseException,
//   SuspenseActionException,
//   SuspenseyCommitException,
//   getSuspendedThenable,
//   isThenableResolved,
// } from './ReactFiberThenable';
// import {schedulePostPaintCallback} from './ReactPostPaintCallback';
// import {
//   getSuspenseHandler,
//   getShellBoundary,
// } from './ReactFiberSuspenseContext';
// import {resetChildReconcilerOnUnwind} from './ReactChildFiber';
import {
  ensureRootIsScheduled,
  // flushSyncWorkOnAllRoots,
  // flushSyncWorkOnLegacyRootsOnly,
  // requestTransitionLane,
} from './ReactFiberRootScheduler';
// import {getMaskedContext, getUnmaskedContext} from './ReactFiberLegacyContext';
// import {logUncaughtError} from './ReactFiberErrorLogger';
// import {
//   deleteScheduledGesture,
//   stopCompletedGestures,
// } from './ReactFiberGestureScheduler';
// import {claimQueuedTransitionTypes} from './ReactFiberTransitionTypes';

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const RootInProgress = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootSuspendedAtTheShell = 6;
const RootCompleted = 5;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;
// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

export opaque type SuspendedReason = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const NotSuspended: SuspendedReason = 0;
const SuspendedOnError: SuspendedReason = 1;
const SuspendedOnData: SuspendedReason = 2;
const SuspendedOnImmediate: SuspendedReason = 3;
const SuspendedOnInstance: SuspendedReason = 4;
const SuspendedOnInstanceAndReadyToContinue: SuspendedReason = 5;
const SuspendedOnDeprecatedThrowPromise: SuspendedReason = 6;
const SuspendedAndReadyToContinue: SuspendedReason = 7;
const SuspendedOnHydration: SuspendedReason = 8;
const SuspendedOnAction: SuspendedReason = 9;

// When this is true, the work-in-progress fiber just suspended (or errored) and
// we've yet to unwind the stack. In some cases, we may yield to the main thread
// after this happens. If the fiber is pinged before we resume, we can retry
// immediately instead of unwinding the stack.
let workInProgressSuspendedReason: SuspendedReason = NotSuspended;
let workInProgressThrownValue: mixed = null;

// Tracks whether any siblings were skipped during the unwind phase after
// something suspends. Used to determine whether to schedule another render
// to prewarm the skipped siblings.
let workInProgressRootDidSkipSuspendedSiblings: boolean = false;
// Whether the work-in-progress render is the result of a prewarm/prerender.
// This tells us whether or not we should render the siblings after
// something suspends.
let workInProgressRootIsPrerendering: boolean = false;

// Whether a ping listener was attached during this render. This is slightly
// different that whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).
let workInProgressRootDidAttachPingListener: boolean = false;

// A contextual version of workInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with entangledRenderLanes.
export let entangledRenderLanes: Lanes = NoLanes;

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootInProgress;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootInterleavedUpdatedLanes: Lanes = NoLanes;
// Lanes that were updated during the render phase (*not* an interleaved event).
let workInProgressRootRenderPhaseUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;
// If this render scheduled deferred work, this is the lane of the deferred task.
let workInProgressDeferredLane: Lane = NoLane;
// Represents the retry lanes that were spawned by this render and have not
// been pinged since, implying that they are still suspended.
let workInProgressSuspendedRetryLanes: Lanes = NoLanes;
// Errors that are thrown during the render phase.
let workInProgressRootConcurrentErrors: Array<CapturedValue<mixed>> | null =
  null;
// These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.
let workInProgressRootRecoverableErrors: Array<CapturedValue<mixed>> | null =
  null;

// Tracks when an update occurs during the render phase.
let workInProgressRootDidIncludeRecursiveRenderUpdate: boolean = false;
// Thacks when an update occurs during the commit phase. It's a separate
// variable from the one for renders because the commit phase may run
// concurrently to a render phase.
let didIncludeCommitPhaseUpdate: boolean = false;
// The most recent time we either committed a fallback, or when a fallback was
// filled in with the resolved UI. This lets us throttle the appearance of new
// content as it streams in, to minimize jank.
// TODO: Think of a better name for this variable?
let globalMostRecentFallbackTime: number = 0;
// Track the most recent time we started a new Transition. This lets us apply
// heuristics like the suspensey image timeout based on how long we've waited
// already.
let globalMostRecentTransitionTime: number = 0;

const FALLBACK_THROTTLE_MS: number = 300;

// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime: number = Infinity;
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
const RENDER_TIMEOUT_MS = 500;

let workInProgressTransitions: Array<Transition> | null = null;
export function getWorkInProgressTransitions(): null | Array<Transition> {
  return workInProgressTransitions;
}

let legacyErrorBoundariesThatAlreadyFailed: Set<mixed> | null = null;

type SuspendedCommitReason = null | string;

type DelayedCommitReason = 0 | 1 | 2 | 3;
const IMMEDIATE_COMMIT = 0;
const ABORTED_VIEW_TRANSITION_COMMIT = 1;
const DELAYED_PASSIVE_COMMIT = 2;
const ANIMATION_STARTED_COMMIT = 3;

const NO_PENDING_EFFECTS = 0;
const PENDING_MUTATION_PHASE = 1;
const PENDING_LAYOUT_PHASE = 2;
const PENDING_AFTER_MUTATION_PHASE = 3;
const PENDING_SPAWNED_WORK = 4;
const PENDING_PASSIVE_PHASE = 5;
const PENDING_GESTURE_MUTATION_PHASE = 6;
const PENDING_GESTURE_ANIMATION_PHASE = 7;
let pendingEffectsStatus: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 = 0;
let pendingEffectsRoot: FiberRoot = (null: any);
let pendingFinishedWork: Fiber = (null: any);
let pendingEffectsLanes: Lanes = NoLanes;
let pendingEffectsRemainingLanes: Lanes = NoLanes;
let pendingEffectsRenderEndTime: number = -0; // Profiling-only
let pendingPassiveTransitions: Array<Transition> | null = null;
let pendingRecoverableErrors: null | Array<CapturedValue<mixed>> = null;
let pendingViewTransition: null | RunningViewTransition = null;
let pendingViewTransitionEvents: Array<(types: Array<string>) => void> | null =
  null;
let pendingTransitionTypes: null | TransitionTypes = null;
let pendingDidIncludeRenderPhaseUpdate: boolean = false;
let pendingSuspendedCommitReason: SuspendedCommitReason = null; // Profiling-only
let pendingDelayedCommitReason: DelayedCommitReason = IMMEDIATE_COMMIT; // Profiling-only
let pendingSuspendedViewTransitionReason: null | string = null; // Profiling-only

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;
let isFlushingPassiveEffects = false;
let didScheduleUpdateDuringPassiveEffects = false;

const NESTED_PASSIVE_UPDATE_LIMIT = 50;
let nestedPassiveUpdateCount: number = 0;
let rootWithPassiveNestedUpdates: FiberRoot | null = null;

let isRunningInsertionEffect = false;

export function getWorkInProgressRoot(): FiberRoot | null {
  return workInProgressRoot;
}

export function getCommittingRoot(): FiberRoot | null {
  return pendingEffectsRoot;
}

export function getWorkInProgressRootRenderLanes(): Lanes {
  return workInProgressRootRenderLanes;
}

// The first setState call that eventually caused the current render.
let workInProgressUpdateTask: null | ConsoleTask = null;

let currentPendingTransitionCallbacks: PendingTransitionCallbacks | null = null;
let currentEndTime: number | null = null;

export function requestUpdateLane(fiber: Fiber): Lane {
  // Special cases
  const mode = fiber.mode;
  if (!disableLegacyMode && (mode & ConcurrentMode) === NoMode) {
    // return (SyncLane: Lane);
    throw new Error('Not implemented');
  } else if (
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    // This is a render phase update. These are not officially supported. The
    // old behavior is to give this the same "thread" (lanes) as
    // whatever is currently rendering. So if you call `setState` on a component
    // that happens later in the same render, it will flush. Ideally, we want to
    // remove the special case and treat them as if they came from an
    // interleaved event. Regardless, this pattern is not officially supported.
    // This behavior is only a fallback. The flag only exists until we can roll
    // out the setState warning, since existing code might accidentally rely on
    // the current behavior.
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  const transition = requestCurrentTransition();
  if (transition !== null) {
    throw new Error('Not implemented');
  }
  return eventPriorityToLane(resolveUpdatePriority());
}

// 检查当前是不是渲染阶段的更新
export function isUnsafeClassRenderPhaseUpdate(fiber: Fiber): boolean {
  // Check if this is a render phase update. Only called by class components,
  // which special (deprecated) behavior for UNSAFE_componentWillReceive props.
  // 判断当前执行上下文里是否包含 RenderContext 标志
  // 这个函数只会被类组件调用，因为类组件在 UNSAFE_componentWillReceiveProps
  // 这种已废弃的生命周期里有特殊处理逻辑。
  return (executionContext & RenderContext) !== NoContext;
}

export function throwIfInfiniteUpdateLoopDetected() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    nestedPassiveUpdateCount = 0;
    rootWithNestedUpdates = null;
    rootWithPassiveNestedUpdates = null;

    if (enableInfiniteRenderLoopDetection) {
      if (executionContext & RenderContext && workInProgressRoot !== null) {
        // We're in the render phase. Disable the concurrent error recovery
        // mechanism to ensure that the error we're about to throw gets handled.
        // We need it to trigger the nearest error boundary so that the infinite
        // update loop is broken.
        workInProgressRoot.errorRecoveryDisabledLanes = mergeLanes(
          workInProgressRoot.errorRecoveryDisabledLanes,
          workInProgressRootRenderLanes,
        );
      }
    }

    throw new Error(
      'Maximum update depth exceeded. This can happen when a component ' +
        'repeatedly calls setState inside componentWillUpdate or ' +
        'componentDidUpdate. React limits the number of nested updates to ' +
        'prevent infinite loops.',
    );
  }

  if (__DEV__) {
    if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
      nestedPassiveUpdateCount = 0;
      rootWithPassiveNestedUpdates = null;

      console.error(
        'Maximum update depth exceeded. This can happen when a component ' +
          "calls setState inside useEffect, but useEffect either doesn't " +
          'have a dependency array, or one of the dependencies changes on ' +
          'every render.',
      );
    }
  }
}

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
) {
  if (__DEV__) {
    if (isRunningInsertionEffect) {
      console.error('useInsertionEffect must not schedule updates.');
    }
  }

  if (__DEV__) {
    if (isFlushingPassiveEffects) {
      didScheduleUpdateDuringPassiveEffects = true;
    }
  }

  // Check if the work loop is currently suspended and waiting for data to
  // finish loading.
  if (
    // Suspended render phase
    (root === workInProgressRoot &&
      (workInProgressSuspendedReason === SuspendedOnData ||
        workInProgressSuspendedReason === SuspendedOnAction)) ||
    // Suspended commit phase
    root.cancelPendingCommit !== null
  ) {
    // The incoming update might unblock the current render. Interrupt the
    // current attempt and restart from the top.
    prepareFreshStack(root, NoLanes);
    const didAttemptEntireTree = false;
    markRootSuspended(
      root,
      workInProgressRootRenderLanes,
      workInProgressDeferredLane,
      didAttemptEntireTree,
    );
  }

  // Mark that the root has a pending update.
  markRootUpdated(root, lane);
  if (
    (executionContext & RenderContext) !== NoContext &&
    root === workInProgressRoot
  ) {
    throw new Error('Not implemented yet.');
  } else {
    // This is a normal update, scheduled from outside the render phase. For
    // example, during an input event.
    if (enableUpdaterTracking) {
      if (isDevToolsPresent) {
        addFiberToLanesMap(root, fiber, lane);
      }
    }

    warnIfUpdatesNotWrappedWithActDEV(fiber);

    if (enableTransitionTracing) {
      const transition = ReactSharedInternals.T;
      if (transition !== null && transition.name != null) {
        if (transition.startTime === -1) {
          transition.startTime = now();
        }

        // addTransitionToLanesMap(root, transition, lane);
        throw new Error('Not implemented yet.');
      }
    }

    if (root === workInProgressRoot) {
      throw new Error('Not implemented yet.');
    }

    ensureRootIsScheduled(root);

    if (
      lane === SyncLane &&
      executionContext === NoContext &&
      !disableLegacyMode &&
      (fiber.mode & ConcurrentMode) === NoMode
    ) {
      if (__DEV__ && ReactSharedInternals.isBatchingLegacy) {
        // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
      } else {
        throw new Error('Not implemented yet.');
      }
    }
  }
}

function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  if (enableProfilerTimer && enableComponentPerformanceTrack) {
    throw new Error('Not implemented yet.');
  }

  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    // The root previous suspended and scheduled a timeout to commit a fallback
    // state. Now that we have additional work, cancel the timeout.
    root.timeoutHandle = noTimeout;
    // $FlowFixMe[incompatible-call] Complains noTimeout is not a TimeoutID, despite the check above
    cancelTimeout(timeoutHandle);
  }
  const cancelPendingCommit = root.cancelPendingCommit;
  if (cancelPendingCommit !== null) {
    root.cancelPendingCommit = null;
    cancelPendingCommit();
  }

  pendingEffectsLanes = NoLanes;

  resetWorkInProgressStack();
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  workInProgressRootRenderLanes = lanes;
  workInProgressSuspendedReason = NotSuspended;
  workInProgressThrownValue = null;
  workInProgressRootDidSkipSuspendedSiblings = false;
  workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
  workInProgressRootDidAttachPingListener = false;
  workInProgressRootExitStatus = RootInProgress;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootInterleavedUpdatedLanes = NoLanes;
  workInProgressRootRenderPhaseUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
  workInProgressDeferredLane = NoLane;
  workInProgressSuspendedRetryLanes = NoLanes;
  workInProgressRootConcurrentErrors = null;
  workInProgressRootRecoverableErrors = null;
  workInProgressRootDidIncludeRecursiveRenderUpdate = false;

  // Get the lanes that are entangled with whatever we're about to render. We
  // track these separately so we can distinguish the priority of the render
  // task from the priority of the lanes it is entangled with. For example, a
  // transition may not be allowed to finish unless it includes the Sync lane,
  // which is currently suspended. We should be able to render the Transition
  // and Sync lane in the same batch, but at Transition priority, because the
  // Sync lane already suspended.
  entangledRenderLanes = getEntangledLanes(root, lanes);

  finishQueueingConcurrentUpdates();

  if (__DEV__) {
    resetOwnerStackLimit();

    ReactStrictModeWarnings.discardPendingWarnings();
  }

  return rootWorkInProgress;
}

function resetWorkInProgressStack() {
  if (workInProgress === null) {
    return;
  }
  throw new Error('Not implemented yet.');
}

// The extra indirections around markRootUpdated and markRootSuspended is
// needed to avoid a circular dependency between this module and
// ReactFiberLane. There's probably a better way to split up these modules and
// avoid this problem. Perhaps all the root-marking functions should move into
// the work loop.

function markRootUpdated(root: FiberRoot, updatedLanes: Lanes) {
  _markRootUpdated(root, updatedLanes);

  if (enableInfiniteRenderLoopDetection) {
    // Check for recursive updates
    if (executionContext & RenderContext) {
      workInProgressRootDidIncludeRecursiveRenderUpdate = true;
    } else if (executionContext & CommitContext) {
      didIncludeCommitPhaseUpdate = true;
    }

    throwIfInfiniteUpdateLoopDetected();
  }
}

function markRootSuspended(
  root: FiberRoot,
  suspendedLanes: Lanes,
  spawnedLane: Lane,
  didAttemptEntireTree: boolean,
) {
  throw new Error('Not implemented yet.');
}

function warnIfUpdatesNotWrappedWithActDEV(fiber: Fiber): void {
  if (__DEV__) {
    if (disableLegacyMode || fiber.mode & ConcurrentMode) {
      if (!isConcurrentActEnvironment()) {
        // Not in an act environment. No need to warn.
        return;
      }
    } else {
      //   // Legacy mode has additional cases where we suppress a warning.
      //   if (!isLegacyActEnvironment(fiber)) {
      //     // Not in an act environment. No need to warn.
      //     return;
      //   }
      //   if (executionContext !== NoContext) {
      //     // Legacy mode doesn't warn if the update is batched, i.e.
      //     // batchedUpdates or flushSync.
      //     return;
      //   }
      //   if (
      //     fiber.tag !== FunctionComponent &&
      //     fiber.tag !== ForwardRef &&
      //     fiber.tag !== SimpleMemoComponent
      //   ) {
      //     // For backwards compatibility with pre-hooks code, legacy mode only
      //     // warns for updates that originate from a hook.
      //     return;
      throw new Error('Not implemented yet.');
    }
    // if (ReactSharedInternals.actQueue === null) {
    //   runWithFiberInDEV(fiber, () => {
    //     console.error(
    //       'An update to %s inside a test was not wrapped in act(...).\n\n' +
    //         'When testing, code that causes React state updates should be ' +
    //         'wrapped into act(...):\n\n' +
    //         'act(() => {\n' +
    //         '  /* fire events that update state */\n' +
    //         '});\n' +
    //         '/* assert on the output */\n\n' +
    //         "This ensures that you're testing the behavior the user would see " +
    //         'in the browser.' +
    //         ' Learn more at https://react.dev/link/wrap-tests-with-act',
    //       getComponentNameFromFiber(fiber),
    //     );
    //   });
    // }
    throw new Error('Not implemented yet.');
  }
}

export function getExecutionContext(): ExecutionContext {
  return executionContext;
}

export function getRootWithPendingPassiveEffects(): FiberRoot | null {
  // 如果当前待处理副作用的状态是 PENDING_PASSIVE_PHASE（表示有被动 effect 还没处理）
  return pendingEffectsStatus === PENDING_PASSIVE_PHASE
    ? // 就返回对应的 root
      pendingEffectsRoot
    : // 否则返回 null
      null;
}

export function getPendingPassiveEffectsLanes(): Lanes {
  return pendingEffectsLanes;
}

export function getPendingTransitionTypes(): null | TransitionTypes {
  return pendingTransitionTypes;
}

export function isWorkLoopSuspendedOnData(): boolean {
  return (
    workInProgressSuspendedReason === SuspendedOnData ||
    workInProgressSuspendedReason === SuspendedOnAction
  );
}

export function hasPendingCommitEffects(): boolean {
  return (
    pendingEffectsStatus !== NO_PENDING_EFFECTS &&
    pendingEffectsStatus !== PENDING_PASSIVE_PHASE
  );
}

let didWarnAboutInterruptedViewTransitions = false;

export function flushPendingEffectsDelayed(): boolean {
  if (pendingDelayedCommitReason === IMMEDIATE_COMMIT) {
    pendingDelayedCommitReason = DELAYED_PASSIVE_COMMIT;
  }
  return flushPendingEffects();
}

export function flushPendingEffects(): boolean {
  // Returns whether passive effects were flushed.
  if (enableViewTransition && pendingViewTransition !== null) {
    throw new Error('Not implemented yet.');
  }
  flushGestureMutations();
  flushGestureAnimations();
  flushMutationEffects();
  flushLayoutEffects();
  // Skip flushAfterMutation if we're forcing this early.
  flushSpawnedWork();
  return flushPassiveEffects();
}

function flushGestureMutations(): void {
  if (!enableGestureTransition) {
    return;
  }
  throw new Error('Not implemented yet.');
}

function flushGestureAnimations(): void {
  if (!enableGestureTransition) {
    return;
  }
  throw new Error('Not implemented yet.');
}

function flushMutationEffects(): void {
  if (pendingEffectsStatus !== PENDING_MUTATION_PHASE) {
    return;
  }
  throw new Error('Not implemented yet.');
}

function flushLayoutEffects(): void {
  if (pendingEffectsStatus !== PENDING_LAYOUT_PHASE) {
    return;
  }
  throw new Error('Not implemented yet.');
}

function flushSpawnedWork(): void {
  if (
    pendingEffectsStatus !== PENDING_SPAWNED_WORK &&
    // If a startViewTransition times out, we might flush this earlier than
    // after mutation phase. In that case, we just skip the after mutation phase.
    pendingEffectsStatus !== PENDING_AFTER_MUTATION_PHASE
  ) {
    return;
  }
  throw new Error('Not implemented yet.');
}

function flushPassiveEffects(): boolean {
  if (pendingEffectsStatus !== PENDING_PASSIVE_PHASE) {
    return false;
  }
  throw new Error('Not implemented yet.');
}

export function performWorkOnRoot(
  root: FiberRoot,
  lanes: Lanes,
  forceSync: boolean,
): void {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.');
  }

  if (enableProfilerTimer && enableComponentPerformanceTrack) {
    throw new Error('Not implemented yet.');
  }

  // We disable time-slicing in some cases: if the work has been CPU-bound
  // for too long ("expired" work, to prevent starvation), or we're in
  // sync-updates-by-default mode.
  const shouldTimeSlice =
    (!forceSync &&
      !includesBlockingLane(lanes) &&
      !includesExpiredLane(root, lanes)) ||
    // If we're prerendering, then we should use the concurrent work loop
    // even if the lanes are synchronous, so that prerendering never blocks
    // the main thread.
    // TODO: We should consider doing this whenever a sync lane is suspended,
    // even for regular pings.
    checkIfRootIsPrerendering(root, lanes);

  let exitStatus: RootExitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes, true);

  let renderWasConcurrent = shouldTimeSlice;

  throw new Error('Not implemented yet.');
}

function renderRootConcurrent(root: FiberRoot, lanes: Lanes): RootExitStatus {
  throw new Error('Not implemented yet.');
}

// TODO: Over time, this function and renderRootConcurrent have become more
// and more similar. Not sure it makes sense to maintain forked paths. Consider
// unifying them again.
function renderRootSync(
  root: FiberRoot,
  lanes: Lanes,
  shouldYieldForPrerendering: boolean,
): RootExitStatus {
  // 保存当前的执行上下文
  // executionContext 标记 React 当前处于什么阶段（渲染中、提交中、批处理中等）
  const prevExecutionContext = executionContext;
  // 用位运算 |= 把 RenderContext 标记加入当前上下文
  // 这样其他代码可以通过检查 executionContext & RenderContext 知道当前正在渲染中
  executionContext |= RenderContext;
  // 设置 Hooks dispatcher（上一个问题讲过），返回之前的 dispatcher 用于之后恢复
  const prevDispatcher = pushDispatcher(root.containerInfo);
  const prevAsyncDispatcher = pushAsyncDispatcher();

  // If the root or lanes have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    if (enableUpdaterTracking) {
      if (isDevToolsPresent) {
        throw new Error('Not implemented yet.');
      }
    }

    workInProgressTransitions = getTransitionsForLanes(root, lanes);
    prepareFreshStack(root, lanes);
  }

  if (enableSchedulingProfiler) {
    markRenderStarted(lanes);
  }
  throw new Error('Not implemented yet.');
}

// 这个函数用于设置 Hooks 的 dispatcher，在渲染开始前调用
// 函数名 push 暗示是入栈操作，会保存之前的状态以便之后恢复
function pushDispatcher(container: any) {
  // 保存当前的 dispatcher 引用
  // ReactSharedInternals.H 就是 Hooks 的实现（H 代表 Hooks）
  const prevDispatcher = ReactSharedInternals.H;
  // 设置为 ContextOnlyDispatcher。
  // 这是一个特殊的 dispatcher，只允许读取 Context，其他 Hooks 调用会报错
  ReactSharedInternals.H = ContextOnlyDispatcher;

  // 如果之前没有 dispatcher（null），返回 ContextOnlyDispatcher
  if (prevDispatcher === null) {
    // The React isomorphic package does not include a default dispatcher.
    // Instead the first renderer will lazily attach one, in order to give
    // nicer error messages.
    return ContextOnlyDispatcher;
  }
  // 如果之前有 dispatcher，返回它（用于之后恢复）
  else {
    return prevDispatcher;
  }
}

function pushAsyncDispatcher() {
  const prevAsyncDispatcher = ReactSharedInternals.A;
  ReactSharedInternals.A = DefaultAsyncDispatcher;
  return prevAsyncDispatcher;
}
