/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {
  Instance,
  TextInstance,
  HydratableInstance,
  ActivityInstance,
  SuspenseInstance,
  Container,
  HostContext,
} from './ReactFiberConfig';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {SuspenseState} from './ReactFiberSuspenseComponent';
import type {TreeContext} from './ReactFiberTreeContext';
import type {CapturedValue} from './ReactCapturedValue';
import type {HydrationDiffNode} from './ReactFiberHydrationDiffs';

import {
  HostComponent,
  HostSingleton,
  HostRoot,
  SuspenseComponent,
  ActivityComponent,
} from './ReactWorkTags';

// import {createCapturedValueAtFiber} from './ReactCapturedValue';

// import {createFiberFromDehydratedFragment} from './ReactFiber';
import {
  // shouldSetTextContent,
  supportsHydration,
  // supportsSingletons,
  // getNextHydratableSibling,
  // getNextHydratableSiblingAfterSingleton,
  // getFirstHydratableChild,
  // getFirstHydratableChildWithinContainer,
  // getFirstHydratableChildWithinActivityInstance,
  // getFirstHydratableChildWithinSuspenseInstance,
  // getFirstHydratableChildWithinSingleton,
  // hydrateInstance,
  // diffHydratedPropsForDevWarnings,
  // describeHydratableInstanceForDevWarnings,
  // hydrateTextInstance,
  // diffHydratedTextForDevWarnings,
  // hydrateActivityInstance,
  // hydrateSuspenseInstance,
  // getNextHydratableInstanceAfterActivityInstance,
  // getNextHydratableInstanceAfterSuspenseInstance,
  // shouldDeleteUnhydratedTailInstances,
  // resolveSingletonInstance,
  // canHydrateInstance,
  // canHydrateTextInstance,
  // canHydrateActivityInstance,
  // canHydrateSuspenseInstance,
  // canHydrateFormStateMarker,
  // isFormStateMarkerMatching,
  // validateHydratableInstance,
  // validateHydratableTextInstance,
} from './ReactFiberConfig';
import {OffscreenLane} from './ReactFiberLane';
// import {
//   getSuspendedTreeContext,
//   restoreSuspendedTreeContext,
// } from './ReactFiberTreeContext';
// import {queueRecoverableErrors} from './ReactFiberWorkLoop';
// import {getRootHostContainer, getHostContext} from './ReactFiberHostContext';
// import {describeDiff} from './ReactFiberHydrationDiffs';
import {runWithFiberInDEV} from './ReactCurrentFiber';

// The deepest Fiber on the stack involved in a hydration context.
// This may have been an insertion or a hydration.
let hydrationParentFiber: null | Fiber = null;
let nextHydratableInstance: null | HydratableInstance = null;
let isHydrating: boolean = false;

// This flag allows for warning supression when we expect there to be mismatches
// due to earlier mismatches or a suspended fiber.
let didSuspendOrErrorDEV: boolean = false;

// Hydration differences found that haven't yet been logged.
let hydrationDiffRootDEV: null | HydrationDiffNode = null;

// Hydration errors that were thrown inside this boundary
let hydrationErrors: Array<CapturedValue<mixed>> | null = null;

let rootOrSingletonContext = false;

function resetHydrationState(): void {
  if (!supportsHydration) {
    return;
  }

  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
  didSuspendOrErrorDEV = false;
}

function getIsHydrating(): boolean {
  return isHydrating;
}

export {
  // warnIfHydrating,
  // enterHydrationState,
  getIsHydrating,
  // reenterHydrationStateFromDehydratedActivityInstance,
  // reenterHydrationStateFromDehydratedSuspenseInstance,
  resetHydrationState,
  // claimHydratableSingleton,
  // tryToClaimNextHydratableInstance,
  // tryToClaimNextHydratableTextInstance,
  // claimNextHydratableActivityInstance,
  // claimNextHydratableSuspenseInstance,
  // prepareToHydrateHostInstance,
  // prepareToHydrateHostTextInstance,
  // prepareToHydrateHostActivityInstance,
  // prepareToHydrateHostSuspenseInstance,
  // popHydrationState,
};
