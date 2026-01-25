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
  ChildSet,
  FragmentInstanceType,
} from './ReactFiberConfig';
import type {Fiber, FiberRoot} from './ReactInternalTypes';

import {
  HostRoot,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostPortal,
  DehydratedFragment,
  Fragment,
} from './ReactWorkTags';
import {ContentReset, Placement} from './ReactFiberFlags';
import {
  supportsMutation,
  supportsResources,
  supportsSingletons,
  // commitMount,
  // commitUpdate,
  // resetTextContent,
  // commitTextUpdate,
  // appendChild,
  // appendChildToContainer,
  // insertBefore,
  // insertInContainerBefore,
  replaceContainerChildren,
  // hideDehydratedBoundary,
  // hideInstance,
  // hideTextInstance,
  // unhideDehydratedBoundary,
  // unhideInstance,
  // unhideTextInstance,
  // commitHydratedInstance,
  // commitHydratedContainer,
  // commitHydratedActivityInstance,
  // commitHydratedSuspenseInstance,
  // removeChildFromContainer,
  // removeChild,
  // acquireSingletonInstance,
  // releaseSingletonInstance,
  isSingletonScope,
  // commitNewChildToFragmentInstance,
  // deleteChildFromFragmentInstance,
} from './ReactFiberConfig';
// import {captureCommitPhaseError} from './ReactFiberWorkLoop';
import {trackHostMutation} from './ReactFiberMutationTracking';

import {runWithFiberInDEV} from './ReactCurrentFiber';
import {enableFragmentRefs} from 'shared/ReactFeatureFlags';

export function commitFragmentInstanceDeletionEffects(fiber: Fiber): void {
  let parent = fiber.return;
  while (parent !== null) {
    if (isFragmentInstanceParent(parent)) {
      // const fragmentInstance: FragmentInstanceType = parent.stateNode;
      // deleteChildFromFragmentInstance(fiber.stateNode, fragmentInstance);
      throw new Error('Not implemented yet.');
    }

    if (isHostParent(parent)) {
      return;
    }

    parent = parent.return;
  }
}

function isHostParent(fiber: Fiber): boolean {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    (supportsResources ? fiber.tag === HostHoistable : false) ||
    (supportsSingletons
      ? fiber.tag === HostSingleton && isSingletonScope(fiber.type)
      : false) ||
    fiber.tag === HostPortal
  );
}

function isFragmentInstanceParent(fiber: Fiber): boolean {
  return fiber && fiber.tag === Fragment && fiber.stateNode !== null;
}
