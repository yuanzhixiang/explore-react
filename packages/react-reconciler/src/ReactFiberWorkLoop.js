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
// import {resetOwnerStackLimit} from 'shared/ReactOwnerStackReset';
import ReactSharedInternals from 'shared/ReactSharedInternals';
// import is from 'shared/objectIs';

// import reportGlobalError from 'shared/reportGlobalError';

import {
  // Aliased because `act` will override and push to an internal queue
  // scheduleCallback as Scheduler_scheduleCallback,
  // shouldYield,
  // requestPaint,
  // now,
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
  // cancelTimeout,
  // noTimeout,
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

// import {createWorkInProgress, resetWorkInProgress} from './ReactFiber';
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
  // mergeLanes,
  // removeLanes,
  pickArbitraryLane,
  // includesNonIdleWork,
  // includesOnlyRetries,
  // includesOnlyTransitions,
  // includesBlockingLane,
  // includesTransitionLane,
  // includesRetryLane,
  // includesIdleGroupLanes,
  // includesExpiredLane,
  // getNextLanes,
  // getEntangledLanes,
  // getLanesToRetrySynchronouslyOnError,
  // upgradePendingLanesToSync,
  // markRootSuspended as _markRootSuspended,
  // markRootUpdated as _markRootUpdated,
  // markRootPinged as _markRootPinged,
  // markRootFinished,
  // addFiberToLanesMap,
  // movePendingFibersToMemoized,
  // addTransitionToLanesMap,
  // getTransitionsForLanes,
  // includesSomeLane,
  OffscreenLane,
  SyncUpdateLanes,
  UpdateLanes,
  // claimNextTransitionDeferredLane,
  // checkIfRootIsPrerendering,
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
// import {
//   resetHooksAfterThrow,
//   resetHooksOnUnwind,
//   ContextOnlyDispatcher,
// } from './ReactFiberHooks';
// import {DefaultAsyncDispatcher} from './ReactFiberAsyncDispatcher';
import {
  // createCapturedValueAtFiber,
  type CapturedValue,
} from './ReactCapturedValue';
// import {
//   enqueueConcurrentRenderForLane,
//   finishQueueingConcurrentUpdates,
//   getConcurrentlyUpdatedLanes,
// } from './ReactFiberConcurrentUpdates';

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
// import ReactStrictModeWarnings from './ReactStrictModeWarnings';
// import {
//   isRendering as ReactCurrentDebugFiberIsRenderingInDEV,
//   resetCurrentFiber,
//   runWithFiberInDEV,
// } from './ReactCurrentFiber';
// import {
//   isDevToolsPresent,
//   markCommitStarted,
//   markCommitStopped,
//   markComponentRenderStopped,
//   markComponentSuspended,
//   markComponentErrored,
//   markLayoutEffectsStarted,
//   markLayoutEffectsStopped,
//   markPassiveEffectsStarted,
//   markPassiveEffectsStopped,
//   markRenderStarted,
//   markRenderYielded,
//   markRenderStopped,
//   onCommitRoot as onCommitRootDevTools,
//   onPostCommitRoot as onPostCommitRootDevTools,
//   setIsStrictModeForDevtools,
// } from './ReactFiberDevToolsHook';
// import {onCommitRoot as onCommitRootTestSelector} from './ReactTestSelectors';
// import {releaseCache} from './ReactFiberCacheComponent';
// import {
//   isLegacyActEnvironment,
//   isConcurrentActEnvironment,
// } from './ReactFiberAct';
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
// import {
//   ensureRootIsScheduled,
//   flushSyncWorkOnAllRoots,
//   flushSyncWorkOnLegacyRootsOnly,
//   requestTransitionLane,
// } from './ReactFiberRootScheduler';
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
