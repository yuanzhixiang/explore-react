/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {StackCursor} from './ReactFiberStack';
import type {
  Container,
  HostContext,
  TransitionStatus,
} from './ReactFiberConfig';
// import type {Hook} from './ReactFiberHooks';

import {
  // getChildHostContext,
  getRootHostContext,
  // HostTransitionContext,
  // NotPendingTransition,
  // isPrimaryRenderer,
} from './ReactFiberConfig';
import {createCursor, push, pop} from './ReactFiberStack';

const contextStackCursor: StackCursor<HostContext | null> = createCursor(null);
const contextFiberStackCursor: StackCursor<Fiber | null> = createCursor(null);
const rootInstanceStackCursor: StackCursor<Container | null> =
  createCursor(null);

// Represents the nearest host transition provider (in React DOM, a <form />)
// NOTE: Since forms cannot be nested, and this feature is only implemented by
// React DOM, we don't technically need this to be a stack. It could be a single
// module variable instead.
const hostTransitionProviderCursor: StackCursor<Fiber | null> =
  createCursor(null);

function requiredContext<Value>(c: Value | null): Value {
  if (__DEV__) {
    if (c === null) {
      console.error(
        'Expected host context to exist. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
    }
  }
  return (c: any);
}

function pushHostContainer(fiber: Fiber, nextRootInstance: Container): void {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance, fiber);
  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  push(contextFiberStackCursor, fiber, fiber);

  // Finally, we need to push the host context to the stack.
  // However, we can't just call getRootHostContext() and push it because
  // we'd have a different number of entries on the stack depending on
  // whether getRootHostContext() throws somewhere in renderer code or not.
  // So we push an empty value first. This lets us safely unwind on errors.
  push(contextStackCursor, null, fiber);
  const nextRootContext = getRootHostContext(nextRootInstance);
  // Now that we know this function doesn't throw, replace it.
  pop(contextStackCursor, fiber);
  push(contextStackCursor, nextRootContext, fiber);
}

function getHostContext(): HostContext {
  const context = requiredContext(contextStackCursor.current);
  return context;
}

export {
  getHostContext,
  // getCurrentRootHostContainer,
  // getRootHostContainer,
  // popHostContainer,
  // popHostContext,
  pushHostContainer,
  // pushHostContext,
};
