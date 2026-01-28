/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flowx
 */

import getComponentNameFromType from 'shared/getComponentNameFromType';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import hasOwnProperty from 'shared/hasOwnProperty';
// import assign from 'shared/assign';
import {
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  // REACT_OPTIMISTIC_KEY,
} from 'shared/ReactSymbols';
// import {checkKeyStringCoercion} from 'shared/CheckStringCoercion';
// import isArray from 'shared/isArray';
import {ownerStackLimit, enableOptimisticKey} from 'shared/ReactFeatureFlags';

const createTask =
  // eslint-disable-next-line react-internal/no-production-logging
  // console.createTask 是 Chrome DevTools 的一个非标准调试 API，
  // 用于“标记异步任务”，让 DevTools 能更好地显示异步调用链和任务来源。
  __DEV__ && console.createTask
    ? // eslint-disable-next-line react-internal/no-production-logging
      console.createTask
    : () => null;

const createFakeCallStack = {
  react_stack_bottom_frame: function (callStackForError) {
    return callStackForError();
  },
};

let specialPropKeyWarningShown;
let didWarnAboutElementRef;
let didWarnAboutOldJSXRuntime;
let unknownOwnerDebugStack;
let unknownOwnerDebugTask;

if (__DEV__) {
  didWarnAboutElementRef = {};

  // We use this technique to trick minifiers to preserve the function name.
  unknownOwnerDebugStack = createFakeCallStack.react_stack_bottom_frame.bind(
    createFakeCallStack,
    UnknownOwner,
  )();
  unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
}

function hasValidKey(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'key')) {
      const getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

function getTaskName(type) {
  if (type === REACT_FRAGMENT_TYPE) {
    return '<>';
  }
  if (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_LAZY_TYPE
  ) {
    // We don't want to eagerly initialize the initializer in DEV mode so we can't
    // call it to extract the type so we don't know the type of this component.
    return '<...>';
  }
  try {
    const name = getComponentNameFromType(type);
    return name ? '<' + name + '>' : '<...>';
  } catch (x) {
    return '<...>';
  }
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
    if (__DEV__) {
      if (
        !didWarnAboutOldJSXRuntime &&
        '__self' in config &&
        // Do not assume this is the result of an oudated JSX transform if key
        // is present, because the modern JSX transform sometimes outputs
        // createElement to preserve precedence between a static key and a
        // spread key. To avoid false positive warnings, we never warn if
        // there's a key.
        !('key' in config)
      ) {
        didWarnAboutOldJSXRuntime = true;
        console.warn(
          'Your app (or one of its dependencies) is using an outdated JSX ' +
            'transform. Update to the modern JSX transform for ' +
            'faster performance: https://react.dev/link/new-jsx-transform',
        );
      }
    }

    if (hasValidKey(config)) {
      throw new Error('Not implemented');
    }

    // Remaining properties are added to a new props object
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        // Skip over reserved prop names
        propName !== 'key' &&
        // Even though we don't use these anymore in the runtime, we don't want
        // them to appear as props, so in createElement we filter them out.
        // We don't have to do this in the jsx() runtime because the jsx()
        // transform never passed these as props; it used separate arguments.
        propName !== '__self' &&
        propName !== '__source'
      ) {
        props[propName] = config[propName];
      }
    }
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

function ReactElement(type, key, props, owner, debugStack, debugTask) {
  // Ignore whatever was passed as the ref argument and treat `props.ref` as
  // the source of truth. The only thing we use this for is `element.ref`,
  // which will log a deprecation warning on access. In the next release, we
  // can remove `element.ref` as well as the `ref` argument.
  const refProp = props.ref;

  // An undefined `element.ref` is coerced to `null` for
  // backwards compatibility.
  const ref = refProp !== undefined ? refProp : null;

  let element;
  if (__DEV__) {
    // In dev, make `ref` a non-enumerable property with a warning. It's non-
    // enumerable so that test matchers and serializers don't access it and
    // trigger the warning.
    //
    // `ref` will be removed from the element completely in a future release.
    element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      // Built-in properties that belong on the element
      type,
      key,

      props,

      // Record the component responsible for creating this element.
      _owner: owner,
    };
    if (ref !== null) {
      Object.defineProperty(element, 'ref', {
        enumerable: false,
        get: elementRefGetterWithDeprecationWarning,
      });
    } else {
      // Don't warn on access if a ref is not given. This reduces false
      // positives in cases where a test serializer uses
      // getOwnPropertyDescriptors to compare objects, like Jest does, which is
      // a problem because it bypasses non-enumerability.
      //
      // So unfortunately this will trigger a false positive warning in Jest
      // when the diff is printed:
      //
      //   expect(<div ref={ref} />).toEqual(<span ref={ref} />);
      //
      // A bit sketchy, but this is what we've done for the `props.key` and
      // `props.ref` accessors for years, which implies it will be good enough
      // for `element.ref`, too. Let's see if anyone complains.
      Object.defineProperty(element, 'ref', {
        enumerable: false,
        value: null,
      });
    }
  } else {
    // In prod, `ref` is a regular property and _owner doesn't exist.
    element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: REACT_ELEMENT_TYPE,

      // Built-in properties that belong on the element
      type,
      key,
      ref,

      props,
    };
  }

  if (__DEV__) {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: 0,
    });
    // debugInfo contains Server Component debug information.
    Object.defineProperty(element, '_debugInfo', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null,
    });
    Object.defineProperty(element, '_debugStack', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: debugStack,
    });
    Object.defineProperty(element, '_debugTask', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: debugTask,
    });
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
}

function elementRefGetterWithDeprecationWarning() {
  if (__DEV__) {
    const componentName = getComponentNameFromType(this.type);
    if (!didWarnAboutElementRef[componentName]) {
      didWarnAboutElementRef[componentName] = true;
      console.error(
        'Accessing element.ref was removed in React 19. ref is now a ' +
          'regular prop. It will be removed from the JSX Element ' +
          'type in a future release.',
      );
    }

    // An undefined `element.ref` is coerced to `null` for
    // backwards compatibility.
    const refProp = this.props.ref;
    return refProp !== undefined ? refProp : null;
  }
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
