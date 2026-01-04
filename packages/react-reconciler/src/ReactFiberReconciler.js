/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Fiber,
  FiberRoot,
  SuspenseHydrationCallbacks,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {
  Container,
  PublicInstance,
  RendererInspectionConfig,
} from './ReactFiberConfig';
import type {ReactNodeList, ReactFormState} from 'shared/ReactTypes';
import type {Lane} from './ReactFiberLane';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {SuspenseState} from './ReactFiberSuspenseComponent';

import {LegacyRoot} from './ReactRootTags';
// import {
//   findCurrentHostFiber,
//   findCurrentHostFiberWithNoPortals,
// } from './ReactFiberTreeReflection';
// import {get as getInstance} from 'shared/ReactInstanceMap';
import {
  HostComponent,
  HostSingleton,
  ClassComponent,
  HostRoot,
  SuspenseComponent,
  ActivityComponent,
} from './ReactWorkTags';
// import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
// import isArray from 'shared/isArray';
import {
  enableSchedulingProfiler,
  enableHydrationLaneScheduling,
  disableLegacyMode,
} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  // getPublicInstance,
  // rendererVersion,
  rendererPackageName,
  extraDevToolsConfig,
} from './ReactFiberConfig';
// import {
//   findCurrentUnmaskedContext,
//   processChildContext,
//   emptyContextObject,
//   isContextProvider as isLegacyContextProvider,
// } from './ReactFiberLegacyContext';
import {createFiberRoot} from './ReactFiberRoot';
// import {isRootDehydrated} from './ReactFiberShellHydration';
// import {
//   injectInternals,
//   markRenderScheduled,
//   onScheduleRoot,
//   injectProfilingHooks,
// } from './ReactFiberDevToolsHook';
// import {startUpdateTimerByLane} from './ReactProfilerTimer';
import {
  requestUpdateLane,
  // scheduleUpdateOnFiber,
  // scheduleInitialHydrationOnRoot,
  // flushRoot,
  // batchedUpdates,
  // flushSyncFromReconciler,
  // flushSyncWork,
  // isAlreadyRendering,
  // deferredUpdates,
  // discreteUpdates,
  // flushPendingEffects,
} from './ReactFiberWorkLoop';
// import {enqueueConcurrentRenderForLane} from './ReactFiberConcurrentUpdates';
// import {
//   createUpdate,
//   enqueueUpdate,
//   entangleTransitions,
// } from './ReactFiberClassUpdateQueue';
// import {
//   isRendering as ReactCurrentFiberIsRendering,
//   current as ReactCurrentFiberCurrent,
//   runWithFiberInDEV,
// } from './ReactCurrentFiber';
import {StrictLegacyMode} from './ReactTypeOfMode';
import {
  SyncLane,
  SelectiveHydrationLane,
  // getHighestPriorityPendingLanes,
  // higherPriorityLane,
  // getBumpedLaneForHydrationByLane,
  // claimNextRetryLane,
} from './ReactFiberLane';
// import {
//   scheduleRefresh,
//   scheduleRoot,
//   setRefreshHandler,
// } from './ReactFiberHotReloading';
import ReactVersion from 'shared/ReactVersion';
// export {createPortal} from './ReactPortal';
// export {
//   createComponentSelector,
//   createHasPseudoClassSelector,
//   createRoleSelector,
//   createTestNameSelector,
//   createTextSelector,
//   getFindAllNodesFailureDescription,
//   findAllNodes,
//   findBoundingRects,
//   focusWithin,
//   observeVisibleRects,
// } from './ReactTestSelectors';
// export {startHostTransition} from './ReactFiberHooks';
export {
  defaultOnUncaughtError,
  defaultOnCaughtError,
  defaultOnRecoverableError,
} from './ReactFiberErrorLogger';
// import {getLabelForLane, TotalLanes} from 'react-reconciler/src/ReactFiberLane';
import {registerDefaultIndicator} from './ReactFiberAsyncAction';

type OpaqueRoot = FiberRoot;

export function createContainer(
  containerInfo: Container,
  tag: RootTag,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  // TODO: Remove `concurrentUpdatesByDefaultOverride`. It is now ignored.
  concurrentUpdatesByDefaultOverride: null | boolean,
  identifierPrefix: string,
  onUncaughtError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      +errorBoundary?: ?component(...props: any),
    },
  ) => void,
  onRecoverableError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onDefaultTransitionIndicator: () => void | (() => void),
  transitionCallbacks: null | TransitionTracingCallbacks,
): OpaqueRoot {
  const hydrate = false;
  const initialChildren = null;
  const root = createFiberRoot(
    containerInfo,
    tag,
    hydrate,
    initialChildren,
    hydrationCallbacks,
    isStrictMode,
    identifierPrefix,
    null,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    transitionCallbacks,
  );
  registerDefaultIndicator(onDefaultTransitionIndicator);
  return root;
}

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?component(...props: any),
  callback: ?Function,
): Lane {
  const current = container.current;
  const lane = requestUpdateLane(current);
  updateContainerImpl(
    current,
    lane,
    element,
    container,
    parentComponent,
    callback,
  );
  return lane;
}

function updateContainerImpl(
  rootFiber: Fiber,
  lane: Lane,
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?component(...props: any),
  callback: ?Function,
): void {
  throw new Error('Not implemented yet.');
}
