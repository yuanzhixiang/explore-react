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
  appendChildToContainer,
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
import {captureCommitPhaseError} from './ReactFiberWorkLoop';
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

export function commitHostPlacement(finishedWork: Fiber) {
  try {
    if (__DEV__) {
      runWithFiberInDEV(finishedWork, commitPlacement, finishedWork);
    } else {
      commitPlacement(finishedWork);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

function commitPlacement(finishedWork: Fiber): void {
  // Recursively insert all host nodes into the parent.
  let hostParentFiber;
  let parentFragmentInstances = null;
  let parentFiber = finishedWork.return;
  while (parentFiber !== null) {
    if (enableFragmentRefs && isFragmentInstanceParent(parentFiber)) {
      throw new Error('Not implemented yet.');
    }
    if (isHostParent(parentFiber)) {
      hostParentFiber = parentFiber;
      break;
    }
    parentFiber = parentFiber.return;
    throw new Error('Not implemented yet.');
  }

  if (!supportsMutation) {
    throw new Error('Not implemented yet.');
  }

  if (hostParentFiber == null) {
    throw new Error(
      'Expected to find a host parent. This error is likely caused by a bug ' +
        'in React. Please file an issue.',
    );
  }

  switch (hostParentFiber.tag) {
    case HostSingleton: {
      throw new Error('Not implemented yet.');
      // Fall through
    }
    case HostComponent: {
      throw new Error('Not implemented yet.');
    }
    case HostRoot:
    case HostPortal: {
      const parent: Container = hostParentFiber.stateNode.containerInfo;
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNodeIntoContainer(
        finishedWork,
        before,
        parent,
        parentFragmentInstances,
      );
      break;
    }
    default:
      throw new Error(
        'Invalid host parent fiber. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
  }
}

function getHostSibling(fiber: Fiber): ?Instance {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node: Fiber = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      // $FlowFixMe[incompatible-type] found when upgrading Flow
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      node.tag !== DehydratedFragment
    ) {
      // If this is a host singleton we go deeper if it's not a special
      // singleton scope. If it is a singleton scope we skip over it because
      // you only insert against this scope when you are already inside of it
      if (
        supportsSingletons &&
        node.tag === HostSingleton &&
        isSingletonScope(node.type)
      ) {
        continue siblings;
      }

      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.flags & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.flags & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNodeIntoContainer(
  node: Fiber,
  before: ?Instance,
  parent: Container,
  parentFragmentInstances: null | Array<FragmentInstanceType>,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      throw new Error('Not implemented yet.');
    } else {
      appendChildToContainer(parent, stateNode);
    }
    if (enableFragmentRefs) {
      commitNewChildToFragmentInstances(node, parentFragmentInstances);
    }
    trackHostMutation();
    return;
  } else if (tag === HostPortal) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
    return;
  }

  if (
    (supportsSingletons ? tag === HostSingleton : false) &&
    isSingletonScope(node.type)
  ) {
    // This singleton is the parent of deeper nodes and needs to become
    // the parent for child insertions and appends
    parent = node.stateNode;
    before = null;
  }

  const child = node.child;
  if (child !== null) {
    insertOrAppendPlacementNodeIntoContainer(
      child,
      before,
      parent,
      parentFragmentInstances,
    );
    let sibling = child.sibling;
    while (sibling !== null) {
      insertOrAppendPlacementNodeIntoContainer(
        sibling,
        before,
        parent,
        parentFragmentInstances,
      );
      sibling = sibling.sibling;
    }
  }
}

export function commitNewChildToFragmentInstances(
  fiber: Fiber,
  parentFragmentInstances: null | Array<FragmentInstanceType>,
): void {
  if (
    fiber.tag !== HostComponent ||
    // Only run fragment insertion effects for initial insertions
    fiber.alternate !== null ||
    parentFragmentInstances === null
  ) {
    return;
  }
  for (let i = 0; i < parentFragmentInstances.length; i++) {
    const fragmentInstance = parentFragmentInstances[i];
    // commitNewChildToFragmentInstance(fiber.stateNode, fragmentInstance);
    throw new Error('Not implemented yet.');
  }
}
