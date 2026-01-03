/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
import {ownerStackLimit, enableOptimisticKey} from 'shared/ReactFeatureFlags';

const createTask =
  // eslint-disable-next-line react-internal/no-production-logging
  // console.createTask 是 Chrome DevTools 的一个非标准调试 API，
  // 用于“标记异步任务”，让 DevTools 能更好地显示异步调用链和任务来源。
  __DEV__ && console.createTask
    ? // eslint-disable-next-line react-internal/no-production-logging
      console.createTask
    : () => null;

let unknownOwnerDebugTask;
if (__DEV__) {
  unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
}

function getTaskName(type) {
  throw new Error('Not implemented: getTaskName');
}

function getOwner() {
  if (__DEV__) {
    const dispatcher = ReactSharedInternals.A;
    if (dispatcher === null) {
      return null;
    }
    return dispatcher.getOwner();
  }
  return null;
}

// v8 (Chromium, Node.js) defaults to 10
// SpiderMonkey (Firefox) does not support Error.stackTraceLimit
// JSC (Safari) defaults to 100
// The lower the limit, the more likely we'll not reach react_stack_bottom_frame
// The higher the limit, the slower Error() is when not inspecting with a debugger.
// When inspecting with a debugger, Error.stackTraceLimit has no impact on Error() performance (in v8).
const ownerStackTraceLimit = 10;

/** @noinline */
function UnknownOwner() {
  /** @noinline */
  return (() => Error('react-stack-top-frame'))();
}

/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */

export function createElement(type, config, children) {
  if (__DEV__) {
    // We don't warn for invalid element type here because with owner stacks,
    // we error in the renderer. The renderer is the only one that knows what
    // types are valid for this particular renderer so we let it error there.

    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing
    // errors. We don't want exception behavior to differ between dev and
    // prod. (Rendering will throw with a helpful message and as soon as the
    // type is fixed, the key warnings will appear.)
    for (let i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i]);
    }

    // Unlike the jsx() runtime, createElement() doesn't warn about key spread.
  }

  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;

  if (config != null) {
    throw new Error('Not implemented');
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (__DEV__) {
    if (key) {
      throw new Error('Not implemented');
    }
  }

  const trackActualOwner =
    __DEV__ &&
    // recentlyCreatedOwnerStacks 是个计数器，每创建一次元素就自增 1
    // < ownerStackLimit 用来限制数量，避免无限增长和性能开销
    ReactSharedInternals.recentlyCreatedOwnerStacks++ < ownerStackLimit;
  let debugStackDEV = false;
  if (__DEV__) {
    if (trackActualOwner) {
      const previousStackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = ownerStackTraceLimit;
      debugStackDEV = Error('react-stack-top-frame');
      Error.stackTraceLimit = previousStackTraceLimit;
    } else {
      debugStackDEV = unknownOwnerDebugStack;
    }
  }

  return ReactElement(
    type,
    key,
    props,
    getOwner(),
    debugStackDEV,
    __DEV__ &&
      (trackActualOwner
        ? createTask(getTaskName(type))
        : unknownOwnerDebugTask),
  );
}

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node) {
  if (__DEV__) {
    // Mark elements as being in a valid static child position so they
    // don't need keys.
    if (isValidElement(node)) {
      if (node._store) {
        node._store.validated = 1;
      }
    } else if (isLazyType(node)) {
      if (node._payload.status === 'fulfilled') {
        if (isValidElement(node._payload.value) && node._payload.value._store) {
          node._payload.value._store.validated = 1;
        }
      } else if (node._store) {
        node._store.validated = 1;
      }
    }
  }
}

/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

export function isLazyType(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_LAZY_TYPE
  );
}
