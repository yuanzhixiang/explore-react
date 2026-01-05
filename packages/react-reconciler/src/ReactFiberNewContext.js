/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';
import type {
  Fiber,
  ContextDependency,
  Dependencies,
} from './ReactInternalTypes';
import type {StackCursor} from './ReactFiberStack';
import type {Lanes} from './ReactFiberLane';
import type {TransitionStatus} from './ReactFiberConfig';
// import type {Hook} from './ReactFiberHooks';

// import {isPrimaryRenderer, HostTransitionContext} from './ReactFiberConfig';
import {createCursor, push, pop} from './ReactFiberStack';
import {ContextProvider, DehydratedFragment} from './ReactWorkTags';
// import {NoLanes, isSubsetOfLanes, mergeLanes} from './ReactFiberLane';
import {
  NoFlags,
  DidPropagateContext,
  NeedsPropagation,
} from './ReactFiberFlags';

// import is from 'shared/objectIs';
// import {getHostTransitionProvider} from './ReactFiberHostContext';

const valueCursor: StackCursor<mixed> = createCursor(null);

let rendererCursorDEV: StackCursor<Object | null>;
if (__DEV__) {
  rendererCursorDEV = createCursor(null);
}
let renderer2CursorDEV: StackCursor<Object | null>;
if (__DEV__) {
  renderer2CursorDEV = createCursor(null);
}

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

let currentlyRenderingFiber: Fiber | null = null;
let lastContextDependency: ContextDependency<mixed> | null = null;

let isDisallowedContextReadInDEV: boolean = false;

export function readContext<T>(context: ReactContext<T>): T {
  if (__DEV__) {
    // This warning would fire if you read context inside a Hook like useMemo.
    // Unlike the class check below, it's not enforced in production for perf.
    if (isDisallowedContextReadInDEV) {
      console.error(
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().',
      );
    }
  }
  // return readContextForConsumer(currentlyRenderingFiber, context);
  throw new Error('Not implemented');
}
