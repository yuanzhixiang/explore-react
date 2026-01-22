/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ViewTransitionProps} from 'shared/ReactTypes';
import type {
  Instance,
  // InstanceMeasurement,
  Props,
} from './ReactFiberConfig';
import type {Fiber} from './ReactInternalTypes';
import type {ViewTransitionState} from './ReactFiberViewTransitionComponent';

import {
  HostComponent,
  OffscreenComponent,
  ViewTransitionComponent,
} from './ReactWorkTags';
import {
  NoFlags,
  Update,
  ViewTransitionStatic,
  AffectedParentLayout,
  ViewTransitionNamedStatic,
} from './ReactFiberFlags';
import {
  supportsMutation,
  // applyViewTransitionName,
  // restoreViewTransitionName,
  // measureInstance,
  // measureClonedInstance,
  // hasInstanceChanged,
  // hasInstanceAffectedParent,
  // wasInstanceInViewport,
} from './ReactFiberConfig';
// import {scheduleViewTransitionEvent} from './ReactFiberWorkLoop';
// import {
//   getViewTransitionName,
//   getViewTransitionClassName,
// } from './ReactFiberViewTransitionComponent';
// import {trackAnimatingTask} from './ReactProfilerTimer';
import {
  enableComponentPerformanceTrack,
  enableProfilerTimer,
} from 'shared/ReactFeatureFlags';

export let shouldStartViewTransition: boolean = false;

export function resetShouldStartViewTransition(): void {
  shouldStartViewTransition = false;
}

// This tracks named ViewTransition components found in the accumulateSuspenseyCommit
// phase that might need to find deleted pairs in the beforeMutation phase.
export let appearingViewTransitions: Map<string, ViewTransitionState> | null =
  null;

export function resetAppearingViewTransitions(): void {
  appearingViewTransitions = null;
}

export function commitNestedViewTransitions(changedParent: Fiber): void {
  let child = changedParent.child;
  while (child !== null) {
    if (child.tag === ViewTransitionComponent) {
      throw new Error('Not implemented yet.');
    } else if ((child.subtreeFlags & ViewTransitionStatic) !== NoFlags) {
      commitNestedViewTransitions(child);
    }
    child = child.sibling;
  }
}
