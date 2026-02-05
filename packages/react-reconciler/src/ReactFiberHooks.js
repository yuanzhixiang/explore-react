/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactContext,
  StartTransitionOptions,
  Usable,
  Thenable,
  RejectedThenable,
  Awaited,
} from 'shared/ReactTypes';
import type {
  Fiber,
  FiberRoot,
  Dispatcher,
  HookType,
  MemoCache,
} from './ReactInternalTypes';
import type {Lanes, Lane} from './ReactFiberLane';
import type {HookFlags} from './ReactHookEffectTags';
import type {Flags} from './ReactFiberFlags';
import type {TransitionStatus} from './ReactFiberConfig';
import type {ScheduledGesture} from './ReactFiberGestureScheduler';

// import {
//   HostTransitionContext,
//   NotPendingTransition as NoPendingHostTransition,
//   setCurrentUpdatePriority,
//   getCurrentUpdatePriority,
// } from './ReactFiberConfig';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  enableSchedulingProfiler,
  enableTransitionTracing,
  enableUseEffectEventHook,
  enableLegacyCache,
  disableLegacyMode,
  enableNoCloningMemoCache,
  enableViewTransition,
  enableGestureTransition,
} from 'shared/ReactFeatureFlags';
import {
  REACT_CONTEXT_TYPE,
  REACT_MEMO_CACHE_SENTINEL,
} from 'shared/ReactSymbols';

import {
  NoMode,
  ConcurrentMode,
  StrictEffectsMode,
  StrictLegacyMode,
} from './ReactTypeOfMode';
import {
  NoLane,
  SyncLane,
  OffscreenLane,
  DeferredLane,
  NoLanes,
  isSubsetOfLanes,
  includesBlockingLane,
  // includesOnlyNonUrgentLanes,
  mergeLanes,
  removeLanes,
  intersectLanes,
  isTransitionLane,
  markRootEntangled,
  // includesSomeLane,
  isGestureRender,
  GestureLane,
  UpdateLanes,
} from './ReactFiberLane';
import {
  ContinuousEventPriority,
  // higherEventPriority,
} from './ReactEventPriorities';
import {
  readContext,
  //  checkIfContextChanged
} from './ReactFiberNewContext';
import {HostRoot, CacheComponent, HostComponent} from './ReactWorkTags';
import {
  LayoutStatic as LayoutStaticEffect,
  Passive as PassiveEffect,
  PassiveStatic as PassiveStaticEffect,
  StaticMask as StaticMaskEffect,
  Update as UpdateEffect,
  StoreConsistency,
  MountLayoutDev as MountLayoutDevEffect,
  MountPassiveDev as MountPassiveDevEffect,
  FormReset,
} from './ReactFiberFlags';
import {
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive,
  Insertion as HookInsertion,
} from './ReactHookEffectTags';
import {
  getWorkInProgressRoot,
  getWorkInProgressRootRenderLanes,
  scheduleUpdateOnFiber,
  requestUpdateLane,
  // requestDeferredLane,
  // markSkippedUpdateLanes,
  // isInvalidExecutionContextForEventFunction,
} from './ReactFiberWorkLoop';

import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import is from 'shared/objectIs';
// import isArray from 'shared/isArray';
import {
  markWorkInProgressReceivedUpdate,
  // checkIfWorkInProgressReceivedUpdate,
} from './ReactFiberBeginWork';
// import {
//   getIsHydrating,
//   tryToClaimNextHydratableFormMarkerInstance,
// } from './ReactFiberHydrationContext';
import {
  //   markStateUpdateScheduled,
  setIsStrictModeForDevtools,
} from './ReactFiberDevToolsHook';
import {
  startUpdateTimerByLane,
  // startHostActionTimer,
} from './ReactProfilerTimer';
import {createCache} from './ReactFiberCacheComponent';
import {
  createUpdate as createLegacyQueueUpdate,
  enqueueUpdate as enqueueLegacyQueueUpdate,
  entangleTransitions as entangleLegacyQueueTransitions,
} from './ReactFiberClassUpdateQueue';
import {
  enqueueConcurrentHookUpdate,
  // enqueueConcurrentHookUpdateAndEagerlyBailout,
  // enqueueConcurrentRenderForLane,
} from './ReactFiberConcurrentUpdates';
// import {getTreeId} from './ReactFiberTreeContext';
import {now} from './Scheduler';
// import {
//   trackUsedThenable,
//   checkIfUseWrappedInTryCatch,
//   createThenableState,
//   SuspenseException,
//   SuspenseActionException,
// } from './ReactFiberThenable';
import type {ThenableState} from './ReactFiberThenable';
import type {Transition} from 'react/src/ReactStartTransition';
import {
  peekEntangledActionLane,
  // peekEntangledActionThenable,
  // chainThenableValue,
} from './ReactFiberAsyncAction';
// import {requestTransitionLane} from './ReactFiberRootScheduler';
// import {isCurrentTreeHidden} from './ReactFiberHiddenContext';
// import {requestCurrentTransition} from './ReactFiberTransition';

import {callComponentInDEV} from './ReactFiberCallUserSpace';

// import {scheduleGesture} from './ReactFiberGestureScheduler';

export type Update<S, A> = {
  lane: Lane,
  revertLane: Lane,
  action: A,
  hasEagerState: boolean,
  eagerState: S | null,
  next: Update<S, A>,
  gesture: null | ScheduledGesture, // enableGestureTransition
};

export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null,
  lanes: Lanes,
  dispatch: (A => mixed) | null,
  lastRenderedReducer: ((S, A) => S) | null,
  lastRenderedState: S | null,
};

let didWarnAboutMismatchedHooksForComponent;
let didWarnUncachedGetSnapshot: void | true;
let didWarnAboutUseWrappedInTryCatch;
let didWarnAboutAsyncClientComponent;
let didWarnAboutUseFormState;
if (__DEV__) {
  didWarnAboutMismatchedHooksForComponent = new Set<string | null>();
  didWarnAboutUseWrappedInTryCatch = new Set<string | null>();
  didWarnAboutAsyncClientComponent = new Set<string | null>();
  didWarnAboutUseFormState = new Set<string | null>();
}

export type Hook = {
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: any,
  next: Hook | null,
};

// The effect "instance" is a shared object that remains the same for the entire
// lifetime of an effect. In Rust terms, a RefCell. We use it to store the
// "destroy" function that is returned from an effect, because that is stateful.
// The field is `undefined` if the effect is unmounted, or if the effect ran
// but is not stateful. We don't explicitly track whether the effect is mounted
// or unmounted because that can be inferred by the hiddenness of the fiber in
// the tree, i.e. whether there is a hidden Offscreen fiber above it.
//
// It's unfortunate that this is stored on a separate object, because it adds
// more memory per effect instance, but it's conceptually sound. I think there's
// likely a better data structure we could use for effects; perhaps just one
// array of effect instances per fiber. But I think this is OK for now despite
// the additional memory and we can follow up with performance
// optimizations later.
type EffectInstance = {
  destroy: void | (() => void),
};

export type Effect = {
  tag: HookFlags,
  inst: EffectInstance,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
  next: Effect,
};

type StoreInstance<T> = {
  value: T,
  getSnapshot: () => T,
};

type StoreConsistencyCheck<T> = {
  value: T,
  getSnapshot: () => T,
};

type EventFunctionPayload<Args, Return, F: (...Array<Args>) => Return> = {
  ref: {
    eventFn: F,
    impl: F,
  },
  nextImpl: F,
};

export type FunctionComponentUpdateQueue = {
  lastEffect: Effect | null,
  events: Array<EventFunctionPayload<any, any, any>> | null,
  stores: Array<StoreConsistencyCheck<any>> | null,
  memoCache: MemoCache | null,
};

type BasicStateAction<S> = (S => S) | S;

type Dispatch<A> = A => void;

// These are set right before calling the component.
let renderLanes: Lanes = NoLanes;
// The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.
let currentlyRenderingFiber: Fiber = (null: any);

// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

// Whether an update was scheduled at any point during the render phase. This
// does not get reset if we do another render pass; only when we're completely
// finished evaluating this component. This is an optimization so we know
// whether we need to clear render phase updates after a throw.
let didScheduleRenderPhaseUpdate: boolean = false;
// Where an update was scheduled only during the current render pass. This
// gets reset after each attempt.
// TODO: Maybe there's some way to consolidate this with
// `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.
let didScheduleRenderPhaseUpdateDuringThisPass: boolean = false;
let shouldDoubleInvokeUserFnsInHooksDEV: boolean = false;
// Counts the number of useId hooks in this component.
let localIdCounter: number = 0;
// Counts number of `use`-d thenables
let thenableIndexCounter: number = 0;
let thenableState: ThenableState | null = null;

// Used for ids that are generated completely client-side (i.e. not during
// hydration). This counter is global, so client ids are not stable across
// render attempts.
let globalClientIdCounter: number = 0;

const RE_RENDER_LIMIT = 25;

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: ?HookType = null;

// In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.
let hookTypesDev: Array<HookType> | null = null;
let hookTypesUpdateIndexDev: number = -1;

// In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.
let ignorePreviousDependencies: boolean = false;

function mountHookTypesDev(): void {
  if (__DEV__) {
    const hookName = ((currentHookNameInDev: any): HookType);

    if (hookTypesDev === null) {
      hookTypesDev = [hookName];
    } else {
      hookTypesDev.push(hookName);
    }
  }
}

function throwInvalidHookError() {
  throw new Error(
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.',
  );
}

function use<T>(usable: Usable<T>): T {
  throw new Error('Not implemented yet.');
}

export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  if (__DEV__) {
    hookTypesDev =
      current !== null
        ? ((current._debugHookTypes: any): Array<HookType>)
        : null;
    hookTypesUpdateIndexDev = -1;
    // Used for hot reloading:
    ignorePreviousDependencies =
      current !== null && current.type !== workInProgress.type;

    warnIfAsyncClientComponent(Component);
  }

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;

  // didScheduleRenderPhaseUpdate = false;
  // localIdCounter = 0;
  // thenableIndexCounter = 0;
  // thenableState = null;

  // TODO Warn if no hooks are used at all during mount, then some are used during update.
  // Currently we will identify the update render as a mount because memoizedState === null.
  // This is tricky because it's valid for certain types of components (e.g. React.lazy)

  // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
  // Non-stateful hooks (e.g. context) don't get added to memoizedState,
  // so memoizedState would be null during updates and mounts.
  if (__DEV__) {
    if (current !== null && current.memoizedState !== null) {
      ReactSharedInternals.H = HooksDispatcherOnUpdateInDEV;
    } else if (hookTypesDev !== null) {
      // This dispatcher handles an edge case where a component is updating,
      // but no stateful hooks have been used.
      // We want to match the production code behavior (which will use HooksDispatcherOnMount),
      // but with the extra DEV validation to ensure hooks ordering hasn't changed.
      // This dispatcher does that.
      ReactSharedInternals.H = HooksDispatcherOnMountWithHookTypesInDEV;
    } else {
      ReactSharedInternals.H = HooksDispatcherOnMountInDEV;
    }
  } else {
    ReactSharedInternals.H =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
  }

  // In Strict Mode, during development, user functions are double invoked to
  // help detect side effects. The logic for how this is implemented for in
  // hook components is a bit complex so let's break it down.
  //
  // We will invoke the entire component function twice. However, during the
  // second invocation of the component, the hook state from the first
  // invocation will be reused. That means things like `useMemo` functions won't
  // run again, because the deps will match and the memoized result will
  // be reused.
  //
  // We want memoized functions to run twice, too, so account for this, user
  // functions are double invoked during the *first* invocation of the component
  // function, and are *not* double invoked during the second incovation:
  //
  // - First execution of component function: user functions are double invoked
  // - Second execution of component function (in Strict Mode, during
  //   development): user functions are not double invoked.
  //
  // This is intentional for a few reasons; most importantly, it's because of
  // how `use` works when something suspends: it reuses the promise that was
  // passed during the first attempt. This is itself a form of memoization.
  // We need to be able to memoize the reactive inputs to the `use` call using
  // a hook (i.e. `useMemo`), which means, the reactive inputs to `use` must
  // come from the same component invocation as the output.
  //
  // There are plenty of tests to ensure this behavior is correct.
  const shouldDoubleRenderDEV =
    __DEV__ && (workInProgress.mode & StrictLegacyMode) !== NoMode;

  shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleRenderDEV;
  let children = __DEV__
    ? callComponentInDEV(Component, props, secondArg)
    : Component(props, secondArg);
  shouldDoubleInvokeUserFnsInHooksDEV = false;

  // Check if there was a render phase update
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    throw new Error('Not implemented yet.');
  }

  if (shouldDoubleRenderDEV) {
    throw new Error('Not implemented yet.');
  }

  finishRenderingHooks(current, workInProgress, Component);

  return children;
}

function finishRenderingHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
): void {
  if (__DEV__) {
    workInProgress._debugHookTypes = hookTypesDev;
    // Stash the thenable state for use by DevTools.
    if (workInProgress.dependencies === null) {
      if (thenableState !== null) {
        workInProgress.dependencies = {
          lanes: NoLanes,
          firstContext: null,
          _debugThenableState: thenableState,
        };
      }
    } else {
      workInProgress.dependencies._debugThenableState = thenableState;
    }
  }

  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrance.
  ReactSharedInternals.H = ContextOnlyDispatcher;

  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  if (__DEV__) {
    currentHookNameInDev = null;
    hookTypesDev = null;
    hookTypesUpdateIndexDev = -1;

    // Confirm that a static flag was not added or removed since the last
    // render. If this fires, it suggests that we incorrectly reset the static
    // flags in some other part of the codebase. This has happened before, for
    // example, in the SuspenseList implementation.
    if (
      current !== null &&
      (current.flags & StaticMaskEffect) !==
        (workInProgress.flags & StaticMaskEffect) &&
      // Disable this warning in legacy mode, because legacy Suspense is weird
      // and creates false positives. To make this work in legacy mode, we'd
      // need to mark fibers that commit in an incomplete state, somehow. For
      // now I'll disable the warning that most of the bugs that would trigger
      // it are either exclusive to concurrent mode or exist in both.
      (disableLegacyMode || (current.mode & ConcurrentMode) !== NoMode)
    ) {
      console.error(
        'Internal React error: Expected static flag was missing. Please ' +
          'notify the React team.',
      );
    }
  }
}

function warnIfAsyncClientComponent(Component: Function) {
  if (__DEV__) {
    // This dev-only check only works for detecting native async functions,
    // not transpiled ones. There's also a prod check that we use to prevent
    // async client components from crashing the app; the prod one works even
    // for transpiled async functions. Neither mechanism is completely
    // bulletproof but together they cover the most common cases.
    const isAsyncFunction =
      // $FlowIgnore[method-unbinding]
      Object.prototype.toString.call(Component) === '[object AsyncFunction]' ||
      // $FlowIgnore[method-unbinding]
      Object.prototype.toString.call(Component) ===
        '[object AsyncGeneratorFunction]';
    if (isAsyncFunction) {
      // Encountered an async Client Component. This is not yet supported.
      const componentName = getComponentNameFromFiber(currentlyRenderingFiber);
      if (!didWarnAboutAsyncClientComponent.has(componentName)) {
        didWarnAboutAsyncClientComponent.add(componentName);
        console.error(
          '%s is an async Client Component. ' +
            'Only Server Components can be async at the moment. This error is often caused by accidentally ' +
            "adding `'use client'` to a module that was originally written " +
            'for the server.',
          componentName === null
            ? 'An unknown Component'
            : `<${componentName}>`,
        );
      }
    }
  }
}

export function checkDidRenderIdHook(): boolean {
  // This should be called immediately after every renderWithHooks call.
  // Conceptually, it's part of the return value of renderWithHooks; it's only a
  // separate function to avoid using an array tuple.
  const didRenderIdHook = localIdCounter !== 0;
  localIdCounter = 0;
  return didRenderIdHook;
}

function mountDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
  // This hook is normally a no-op.
  // The react-debug-hooks package injects its own implementation
  // so that e.g. DevTools can display custom hook values.
}

const updateDebugValue = mountDebugValue;

function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  throw new Error('Not implemented yet.');
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  throw new Error('Not implemented yet.');
}

function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  throw new Error('Not implemented yet.');
}

function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  throw new Error('Not implemented yet.');
}

function mountDeferredValue<T>(value: T, initialValue?: T): T {
  throw new Error('Not implemented yet.');
}

function updateDeferredValue<T>(value: T, initialValue?: T): T {
  throw new Error('Not implemented yet.');
}

function rerenderDeferredValue<T>(value: T, initialValue?: T): T {
  throw new Error('Not implemented yet.');
}

function isRenderingDeferredWork(): boolean {
  throw new Error('Not implemented yet.');
}

function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function mountImperativeHandle<T>(
  ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function mountLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function mountInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  throw new Error('Not implemented yet.');
}

function mountRef<T>(initialValue: T): {current: T} {
  throw new Error('Not implemented yet.');
}

function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
): void {
  if (__DEV__) {
    // using a reference to `arguments` bails out of GCC optimizations which affect function arity
    const args = arguments;
    if (typeof args[3] === 'function') {
      console.error(
        "State updates from the useState() and useReducer() Hooks don't support the " +
          'second callback argument. To execute a side effect after ' +
          'rendering, declare it in the component body with useEffect().',
      );
    }
  }

  const lane = requestUpdateLane(fiber);
  const didScheduleUpdate = dispatchSetStateInternal(
    fiber,
    queue,
    action,
    lane,
  );
  if (didScheduleUpdate) {
    startUpdateTimerByLane(lane, 'setState()', fiber);
  }
  markUpdateInDevTools(fiber, lane, action);
}

function markUpdateInDevTools<A>(fiber: Fiber, lane: Lane, action: A): void {
  if (enableSchedulingProfiler) {
    // markStateUpdateScheduled(fiber, lane);
    throw new Error('Not implemented yet.');
  }
}

function dispatchSetStateInternal<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
  lane: Lane,
): boolean {
  const update: Update<S, A> = {
    lane,
    revertLane: NoLane,
    gesture: null,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  if (isRenderPhaseUpdate(fiber)) {
    // enqueueRenderPhaseUpdate(queue, update);
    throw new Error('Not implemented yet.');
  } else {
    const alternate = fiber.alternate;
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher = null;
        if (__DEV__) {
          prevDispatcher = ReactSharedInternals.H;
          ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
        }
        try {
          const currentState: S = (queue.lastRenderedState: any);
          const eagerState = lastRenderedReducer(currentState, action);
          // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.
          update.hasEagerState = true;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            // TODO: Do we still need to entangle transitions in this case?
            // enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update);
            // return false;
            throw new Error('Not implemented yet.');
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
          if (__DEV__) {
            ReactSharedInternals.H = prevDispatcher;
          }
        }
      }
    }

    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (root !== null) {
      scheduleUpdateOnFiber(root, fiber, lane);
      entangleTransitionUpdate(root, queue, lane);
      return true;
    }
  }
  return false;
}

// TODO: Move to ReactFiberConcurrentUpdates?
function entangleTransitionUpdate<S, A>(
  root: FiberRoot,
  queue: UpdateQueue<S, A>,
  lane: Lane,
): void {
  if (isTransitionLane(lane)) {
    let queueLanes = queue.lanes;

    // If any entangled lanes are no longer pending on the root, then they
    // must have finished. We can remove them from the shared queue, which
    // represents a superset of the actually pending lanes. In some cases we
    // may entangle more than we need to, but that's OK. In fact it's worse if
    // we *don't* entangle when we should.
    queueLanes = intersectLanes(queueLanes, root.pendingLanes);

    // Entangle the new transition lane with the other transition lanes.
    const newQueueLanes = mergeLanes(queueLanes, lane);
    queue.lanes = newQueueLanes;
    // Even if queue.lanes already include lane, we don't know for certain if
    // the lane finished since the last time we entangled it. So we need to
    // entangle it again, just to be sure.
    markRootEntangled(root, newQueueLanes);
  }
}

function isRenderPhaseUpdate(fiber: Fiber): boolean {
  const alternate = fiber.alternate;
  return (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  );
}

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountStateImpl(initialState);
  const queue = hook.queue;
  const dispatch: Dispatch<BasicStateAction<S>> = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any);
  queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}

function mountStateImpl<S>(initialState: (() => S) | S): Hook {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    const initialStateInitializer = initialState;
    // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
    initialState = initialStateInitializer();
    if (shouldDoubleInvokeUserFnsInHooksDEV) {
      setIsStrictModeForDevtools(true);
      try {
        // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
        initialStateInitializer();
      } finally {
        setIsStrictModeForDevtools(false);
      }
    }
  }

  hook.memoizedState = hook.baseState = initialState;
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  };
  hook.queue = queue;
  return hook;
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    // 真正使用时的状态，会被更新
    memoizedState: null,

    // 初始化时外部传入的状态，不会被更新
    baseState: null,

    // @why 下面这两个不知道干嘛的
    baseQueue: null,
    queue: null,

    // 连接到下一个 hook
    next: null,
  };

  // 如果是第一个 hook
  if (workInProgressHook === null) {
    // This is the first hook in the list
    // 对于第一个 hook 需要把它挂载到 fiber 上
    // 对 hook 来说，state 是他内部的状态，对 fiber 来说，hook 就是他的状态
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    // 将新创建的 hook 挂载到链表的末尾
    workInProgressHook = workInProgressHook.next = hook;
  }
  // 返回当前创建的 hook
  return workInProgressHook;
}

function mountTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  throw new Error('Not implemented yet.');
}

function mountSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
): T {
  throw new Error('Not implemented yet.');
}

function mountId(): string {
  throw new Error('Not implemented yet.');
}

function useHostTransitionStatus(): TransitionStatus {
  throw new Error('Not implemented yet.');
}

function mountActionState<S, P>(
  action: (Awaited<S>, P) => S,
  initialStateProp: Awaited<S>,
  permalink?: string,
): [Awaited<S>, (P) => void, boolean] {
  throw new Error('Not implemented yet.');
}

function mountOptimistic<S, A>(
  passthrough: S,
  reducer: ?(S, A) => S,
): [S, (A) => void] {
  throw new Error('Not implemented yet.');
}

function useMemoCache(size: number): Array<mixed> {
  throw new Error('Not implemented yet.');
}

function mountRefresh(): any {
  throw new Error('Not implemented yet.');
}

function mountEvent<Args, Return, F: (...Array<Args>) => Return>(
  callback: F,
): F {
  throw new Error('Not implemented yet.');
}

function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function updateImperativeHandle<T>(
  ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function updateInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function updateLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  throw new Error('Not implemented yet.');
}

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  return updateReducerImpl(hook, ((currentHook: any): Hook), reducer);
}

function updateReducerImpl<S, A>(
  hook: Hook,
  current: Hook,
  reducer: (S, A) => S,
): [S, Dispatch<A>] {
  const queue = hook.queue;

  if (queue === null) {
    throw new Error(
      'Should have a queue. You are likely calling Hooks conditionally, ' +
        'which is not allowed. (https://react.dev/link/invalid-hook-call)',
    );
  }

  queue.lastRenderedReducer = reducer;

  // The last rebase update that is NOT part of the base state.
  let baseQueue = hook.baseQueue;

  // The last pending update that hasn't been processed yet.
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    if (__DEV__) {
      if (current.baseQueue !== baseQueue) {
        // Internal invariant that should never happen, but feasibly could in
        // the future if we implement resuming, or some form of that.
        console.error(
          'Internal error: Expected work-in-progress queue to be a clone. ' +
            'This is a bug in React.',
        );
      }
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  const baseState = hook.baseState;
  if (baseQueue === null) {
    // If there are no pending updates, then the memoized state should be the
    // same as the base state. Currently these only diverge in the case of
    // useOptimistic, because useOptimistic accepts a new baseState on
    // every render.
    hook.memoizedState = baseState;
    // We don't need to call markWorkInProgressReceivedUpdate because
    // baseState is derived from other reactive values.
  } else {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast: Update<S, A> | null = null;
    let update = first;
    let didReadFromEntangledAsyncAction = false;
    do {
      // An extra OffscreenLane bit is added to updates that were made to
      // a hidden tree, so that we can distinguish them from updates that were
      // already there when the tree was hidden.
      const updateLane = removeLanes(update.lane, OffscreenLane);
      const isHiddenUpdate = updateLane !== update.lane;

      // Check if this update was made while the tree was hidden. If so, then
      // it's not a "base" update and we should disregard the extra base lanes
      // that were added to renderLanes when we entered the Offscreen tree.
      let shouldSkipUpdate = isHiddenUpdate
        ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
        : !isSubsetOfLanes(renderLanes, updateLane);

      if (enableGestureTransition && updateLane === GestureLane) {
        throw new Error('Not implemented yet.');
      }

      if (shouldSkipUpdate) {
        throw new Error('Not implemented yet.');
      } else {
        // This update does have sufficient priority.

        // Check if this is an optimistic update.
        const revertLane = update.revertLane;
        if (revertLane === NoLane) {
          // This is not an optimistic update, and we're going to apply it now.
          // But, if there were earlier updates that were skipped, we need to
          // leave this update in the queue so it can be rebased later.
          if (newBaseQueueLast !== null) {
            const clone: Update<S, A> = {
              // This update is going to be committed so we never want uncommit
              // it. Using NoLane works because 0 is a subset of all bitmasks, so
              // this will never be skipped by the check above.
              lane: NoLane,
              revertLane: NoLane,
              gesture: null,
              action: update.action,
              hasEagerState: update.hasEagerState,
              eagerState: update.eagerState,
              next: (null: any),
            };
            newBaseQueueLast = newBaseQueueLast.next = clone;
          }

          // Check if this update is part of a pending async action. If so,
          // we'll need to suspend until the action has finished, so that it's
          // batched together with future updates in the same action.
          if (updateLane === peekEntangledActionLane()) {
            didReadFromEntangledAsyncAction = true;
          }
        } else {
          throw new Error('Not implemented yet.');
        }
        // Process this update.
        const action = update.action;
        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          reducer(newState, action);
        }
        if (update.hasEagerState) {
          // If this update is a state update (not a reducer) and was processed eagerly,
          // we can use the eagerly computed state
          newState = ((update.eagerState: any): S);
        } else {
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }

    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();

      // Check if this update is part of a pending async action. If so, we'll
      // need to suspend until the action has finished, so that it's batched
      // together with future updates in the same action.
      // TODO: Once we support hooks inside useMemo (or an equivalent
      // memoization boundary like Forget), hoist this logic so that it only
      // suspends if the memo boundary produces a new value.
      if (didReadFromEntangledAsyncAction) {
        // const entangledActionThenable = peekEntangledActionThenable();
        // if (entangledActionThenable !== null) {
        //   // TODO: Instead of the throwing the thenable directly, throw a
        //   // special object like `use` does so we can detect if it's captured
        //   // by userspace.
        //   throw entangledActionThenable;
        // }
        throw new Error('Not implemented yet.');
      }
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }
  if (baseQueue === null) {
    // `queue.lanes` is used for entangling transitions. We can set it back to
    // zero once the queue is empty.
    queue.lanes = NoLanes;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook(): Hook {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base.
  let nextCurrentHook: null | Hook;
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else {
    // Clone from the current hook.

    if (nextCurrentHook === null) {
      const currentFiber = currentlyRenderingFiber.alternate;
      if (currentFiber === null) {
        // This is the initial render. This branch is reached when the component
        // suspends, resumes, then renders an additional hook.
        // Should never be reached because we should switch to the mount dispatcher first.
        throw new Error(
          'Update hook called on initial render. This is likely a bug in React. Please file an issue.',
        );
      } else {
        // This is an update. We should always have a current hook.
        throw new Error('Rendered more hooks than during the previous render.');
      }
    }

    currentHook = nextCurrentHook;

    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}

function updateRef<T>(initialValue: T): {current: T} {
  throw new Error('Not implemented yet.');
}

function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, initialState);
}

function updateTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  throw new Error('Not implemented yet.');
}

function updateSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
): T {
  throw new Error('Not implemented yet.');
}

function updateId(): string {
  throw new Error('Not implemented yet.');
}

function updateActionState<S, P>(
  action: (Awaited<S>, P) => S,
  initialState: Awaited<S>,
  permalink?: string,
): [Awaited<S>, (P) => void, boolean] {
  throw new Error('Not implemented yet.');
}

function updateOptimistic<S, A>(
  passthrough: S,
  reducer: ?(S, A) => S,
): [S, (A) => void] {
  throw new Error('Not implemented yet.');
}

function updateRefresh(): any {
  throw new Error('Not implemented yet.');
}

function updateEvent<Args, Return, F: (...Array<Args>) => Return>(
  callback: F,
): F {
  throw new Error('Not implemented yet.');
}

function rerenderReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  throw new Error('Not implemented yet.');
}

function rerenderState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  throw new Error('Not implemented yet.');
}

function rerenderTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  throw new Error('Not implemented yet.');
}

function rerenderActionState<S, P>(
  action: (Awaited<S>, P) => S,
  initialState: Awaited<S>,
  permalink?: string,
): [Awaited<S>, (P) => void, boolean] {
  throw new Error('Not implemented yet.');
}

function rerenderOptimistic<S, A>(
  passthrough: S,
  reducer: ?(S, A) => S,
): [S, (A) => void] {
  throw new Error('Not implemented yet.');
}

function updateHookTypesDev(): void {
  if (__DEV__) {
    const hookName = ((currentHookNameInDev: any): HookType);

    if (hookTypesDev !== null) {
      hookTypesUpdateIndexDev++;
      if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
        // warnOnHookMismatchInDev(hookName);
        throw new Error('Not implemented yet.');
      }
    }
  }
}

export const ContextOnlyDispatcher: Dispatcher = {
  readContext,

  use,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError,
  useHostTransitionStatus: throwInvalidHookError,
  useFormState: throwInvalidHookError,
  useActionState: throwInvalidHookError,
  useOptimistic: throwInvalidHookError,
  useMemoCache: throwInvalidHookError,
  useCacheRefresh: throwInvalidHookError,
};
if (enableUseEffectEventHook) {
  (ContextOnlyDispatcher: Dispatcher).useEffectEvent = throwInvalidHookError;
}

const HooksDispatcherOnMount: Dispatcher = {
  readContext,

  use,
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useInsertionEffect: mountInsertionEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useSyncExternalStore: mountSyncExternalStore,
  useId: mountId,
  useHostTransitionStatus: useHostTransitionStatus,
  useFormState: mountActionState,
  useActionState: mountActionState,
  useOptimistic: mountOptimistic,
  useMemoCache,
  useCacheRefresh: mountRefresh,
};
if (enableUseEffectEventHook) {
  (HooksDispatcherOnMount: Dispatcher).useEffectEvent = mountEvent;
}

const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,

  use,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,
  useHostTransitionStatus: useHostTransitionStatus,
  useFormState: updateActionState,
  useActionState: updateActionState,
  useOptimistic: updateOptimistic,
  useMemoCache,
  useCacheRefresh: updateRefresh,
};
if (enableUseEffectEventHook) {
  (HooksDispatcherOnUpdate: Dispatcher).useEffectEvent = updateEvent;
}

const HooksDispatcherOnRerender: Dispatcher = {
  readContext,

  use,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: rerenderReducer,
  useRef: updateRef,
  useState: rerenderState,
  useDebugValue: updateDebugValue,
  useDeferredValue: rerenderDeferredValue,
  useTransition: rerenderTransition,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,
  useHostTransitionStatus: useHostTransitionStatus,
  useFormState: rerenderActionState,
  useActionState: rerenderActionState,
  useOptimistic: rerenderOptimistic,
  useMemoCache,
  useCacheRefresh: updateRefresh,
};

if (enableUseEffectEventHook) {
  (HooksDispatcherOnRerender: Dispatcher).useEffectEvent = updateEvent;
}

let HooksDispatcherOnMountInDEV: Dispatcher | null = null;
let HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher | null = null;
let HooksDispatcherOnUpdateInDEV: Dispatcher | null = null;
let HooksDispatcherOnRerenderInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher | null = null;

if (__DEV__) {
  const warnInvalidContextAccess = () => {
    console.error(
      'Context can only be read while React is rendering. ' +
        'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
        'In function components, you can read it directly in the function body, but not ' +
        'inside Hooks like useReducer() or useMemo().',
    );
  };

  const warnInvalidHookAccess = () => {
    console.error(
      'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' +
        'You can only call Hooks at the top level of your React function. ' +
        'For more information, see ' +
        'https://react.dev/link/rules-of-hooks',
    );
  };
  HooksDispatcherOnMountInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use,
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      mountHookTypesDev();
      const prevDispatcher = ReactSharedInternals.H;
      ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountState(initialState);
      } finally {
        ReactSharedInternals.H = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useMemoCache,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (HooksDispatcherOnMountInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }

  HooksDispatcherOnMountWithHookTypesInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use,
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      throw new Error('Not implemented yet.');
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useMemoCache,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }

  HooksDispatcherOnUpdateInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use,
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      updateHookTypesDev();
      const prevDispatcher = ReactSharedInternals.H;
      ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
      try {
        return updateState(initialState);
      } finally {
        ReactSharedInternals.H = prevDispatcher;
      }
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useMemoCache,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (HooksDispatcherOnUpdateInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }

  HooksDispatcherOnRerenderInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use,
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      throw new Error('Not implemented yet.');
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useMemoCache,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (HooksDispatcherOnRerenderInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }

  InvalidNestedHooksDispatcherOnMountInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use<T>(usable: Usable<T>): T {
      throw new Error('Not implemented yet.');
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      throw new Error('Not implemented yet.');
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useMemoCache(size: number): Array<any> {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }

  InvalidNestedHooksDispatcherOnUpdateInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use<T>(usable: Usable<T>): T {
      throw new Error('Not implemented yet.');
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      throw new Error('Not implemented yet.');
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useMemoCache(size: number): Array<any> {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }

  InvalidNestedHooksDispatcherOnRerenderInDEV = {
    readContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    use<T>(usable: Usable<T>): T {
      throw new Error('Not implemented yet.');
    },
    useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useContext<T>(context: ReactContext<T>): T {
      throw new Error('Not implemented yet.');
    },
    useEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useImperativeHandle<T>(
      ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
      create: () => T,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useInsertionEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useLayoutEffect(
      create: () => (() => void) | void,
      deps: Array<mixed> | void | null,
    ): void {
      throw new Error('Not implemented yet.');
    },
    useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T {
      throw new Error('Not implemented yet.');
    },
    useReducer<S, I, A>(
      reducer: (S, A) => S,
      initialArg: I,
      init?: I => S,
    ): [S, Dispatch<A>] {
      throw new Error('Not implemented yet.');
    },
    useRef<T>(initialValue: T): {current: T} {
      throw new Error('Not implemented yet.');
    },
    useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      throw new Error('Not implemented yet.');
    },
    useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void {
      throw new Error('Not implemented yet.');
    },
    useDeferredValue<T>(value: T, initialValue?: T): T {
      throw new Error('Not implemented yet.');
    },
    useTransition(): [boolean, (() => void) => void] {
      throw new Error('Not implemented yet.');
    },
    useSyncExternalStore<T>(
      subscribe: (() => void) => () => void,
      getSnapshot: () => T,
      getServerSnapshot?: () => T,
    ): T {
      throw new Error('Not implemented yet.');
    },
    useId(): string {
      throw new Error('Not implemented yet.');
    },
    useFormState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useActionState<S, P>(
      action: (Awaited<S>, P) => S,
      initialState: Awaited<S>,
      permalink?: string,
    ): [Awaited<S>, (P) => void, boolean] {
      throw new Error('Not implemented yet.');
    },
    useOptimistic<S, A>(
      passthrough: S,
      reducer: ?(S, A) => S,
    ): [S, (A) => void] {
      throw new Error('Not implemented yet.');
    },
    useMemoCache(size: number): Array<any> {
      throw new Error('Not implemented yet.');
    },
    useHostTransitionStatus,
    useCacheRefresh() {
      throw new Error('Not implemented yet.');
    },
  };
  if (enableUseEffectEventHook) {
    (InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher).useEffectEvent =
      function useEffectEvent<Args, Return, F: (...Array<Args>) => Return>(
        callback: F,
      ): F {
        throw new Error('Not implemented yet.');
      };
  }
}
