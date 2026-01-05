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

import {disableLegacyContext} from 'shared/ReactFeatureFlags';
import {ClassComponent, HostRoot} from './ReactWorkTags';
// import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';

import {createCursor, push, pop} from './ReactFiberStack';

let warnedAboutMissingGetChildContext;

if (__DEV__) {
  warnedAboutMissingGetChildContext = ({}: {[string]: boolean});
}

export const emptyContextObject: {} = {};
if (__DEV__) {
  Object.freeze(emptyContextObject);
}

// A cursor to the current merged context object on the stack.
const contextStackCursor: StackCursor<Object> =
  createCursor(emptyContextObject);
// A cursor to a boolean indicating whether the context has changed.
const didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false);
// Keep track of the previous context object that was on the stack.
// We use this to get access to the parent context after we have already
// pushed the next context provider, and now need to merge their contexts.
let previousContext: Object = emptyContextObject;

function hasContextChanged(): boolean {
  if (disableLegacyContext) {
    return false;
  } else {
    return didPerformWorkStackCursor.current;
  }
}

function pushTopLevelContextObject(
  fiber: Fiber,
  context: Object,
  didChange: boolean,
): void {
  if (disableLegacyContext) {
    return;
  } else {
    // if (contextStackCursor.current !== emptyContextObject) {
    //   throw new Error(
    //     'Unexpected context found on stack. ' +
    //       'This error is likely caused by a bug in React. Please file an issue.',
    //   );
    // }

    // push(contextStackCursor, context, fiber);
    // push(didPerformWorkStackCursor, didChange, fiber);
    throw new Error('Not implemented yet.');
  }
}

export {
  // getUnmaskedContext,
  // cacheContext,
  // getMaskedContext,
  hasContextChanged,
  // popContext,
  // popTopLevelContextObject,
  pushTopLevelContextObject,
  // processChildContext,
  // isContextProvider,
  // pushContextProvider,
  // invalidateContextProvider,
  // findCurrentUnmaskedContext,
};
