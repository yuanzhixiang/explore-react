/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// import type {ReactElement} from 'shared/ReactElementType';
import type {
  ReactPortal,
  Thenable,
  ReactContext,
  ReactDebugInfo,
  ReactComponentInfo,
  SuspenseListRevealOrder,
  ReactKey,
  ReactOptimisticKey,
} from 'shared/ReactTypes';
import type {Fiber} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane';
import type {ThenableState} from './ReactFiberThenable';

import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import {
  Placement,
  ChildDeletion,
  Forked,
  PlacementDEV,
} from './ReactFiberFlags';
import {NoMode, ConcurrentMode} from './ReactTypeOfMode';
import {
  // getIteratorFn,
  // ASYNC_ITERATOR,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_LAZY_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_LEGACY_ELEMENT_TYPE,
  // REACT_OPTIMISTIC_KEY,
} from 'shared/ReactSymbols';
import {
  HostRoot,
  HostText,
  HostPortal,
  Fragment,
  FunctionComponent,
} from './ReactWorkTags';
// import isArray from 'shared/isArray';
import {
  enableAsyncIterableChildren,
  disableLegacyMode,
  enableFragmentRefs,
  enableOptimisticKey,
} from 'shared/ReactFeatureFlags';

// import {
//   createWorkInProgress,
//   resetWorkInProgress,
//   createFiberFromElement,
//   createFiberFromFragment,
//   createFiberFromText,
//   createFiberFromPortal,
//   createFiberFromThrow,
// } from './ReactFiber';
// import {isCompatibleFamilyForHotReloading} from './ReactFiberHotReloading';
// import {getIsHydrating} from './ReactFiberHydrationContext';
// import {pushTreeFork} from './ReactFiberTreeContext';
// import {
//   SuspenseException,
//   SuspenseActionException,
//   createThenableState,
//   trackUsedThenable,
//   resolveLazy,
// } from './ReactFiberThenable';
// import {readContextDuringReconciliation} from './ReactFiberNewContext';

import {runWithFiberInDEV} from './ReactCurrentFiber';

// This tracks the thenables that are unwrapped during reconcilation.
let thenableState: ThenableState | null = null;
let thenableIndexCounter: number = 0;

// Server Components Meta Data
let currentDebugInfo: null | ReactDebugInfo = null;

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes,
) => Fiber | null;

// This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.
function createChildReconciler(
  shouldTrackSideEffects: boolean,
): ChildReconciler {
  throw new Error('Not implemented');
}

export const reconcileChildFibers: ChildReconciler =
  createChildReconciler(true);
