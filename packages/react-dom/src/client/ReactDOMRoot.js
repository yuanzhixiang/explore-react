/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList, ReactFormState} from 'shared/ReactTypes';
import type {
  FiberRoot,
  TransitionTracingCallbacks,
} from 'react-reconciler/src/ReactInternalTypes';

import {isValidContainer} from 'react-dom-bindings/src/client/ReactDOMContainer';
// import {queueExplicitHydrationTarget} from 'react-dom-bindings/src/events/ReactDOMEventReplaying';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';
import {
  disableCommentsAsDOMContainers,
  enableDefaultTransitionIndicator,
} from 'shared/ReactFeatureFlags';

export type RootType = {
  render(children: ReactNodeList): void,
  unmount(): void,
  _internalRoot: FiberRoot | null,
};

export type CreateRootOptions = {
  unstable_strictMode?: boolean,
  unstable_transitionCallbacks?: TransitionTracingCallbacks,
  identifierPrefix?: string,
  onUncaughtError?: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError?: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      +errorBoundary?: ?component(...props: any),
    },
  ) => void,
  onRecoverableError?: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onDefaultTransitionIndicator?: () => void | (() => void),
};

export type HydrateRootOptions = {
  // Hydration options
  onHydrated?: (hydrationBoundary: Comment) => void,
  onDeleted?: (hydrationBoundary: Comment) => void,
  // Options for all roots
  unstable_strictMode?: boolean,
  unstable_transitionCallbacks?: TransitionTracingCallbacks,
  identifierPrefix?: string,
  onUncaughtError?: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError?: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      +errorBoundary?: ?component(...props: any),
    },
  ) => void,
  onRecoverableError?: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onDefaultTransitionIndicator?: () => void | (() => void),
  formState?: ReactFormState<any, any> | null,
};

import {
  isContainerMarkedAsRoot,
  markContainerAsRoot,
  unmarkContainerAsRoot,
} from 'react-dom-bindings/src/client/ReactDOMComponentTree';

// import {
//   isContainerMarkedAsRoot,
//   markContainerAsRoot,
//   unmarkContainerAsRoot,
// } from 'react-dom-bindings/src/client/ReactDOMComponentTree';
import {listenToAllSupportedEvents} from 'react-dom-bindings/src/events/DOMPluginEventSystem';
import {COMMENT_NODE} from 'react-dom-bindings/src/client/HTMLNodeType';

import {
  createContainer,
  // createHydrationContainer,
  updateContainer,
  // updateContainerSync,
  // flushSyncWork,
  // isAlreadyRendering,
  defaultOnUncaughtError,
  defaultOnCaughtError,
  defaultOnRecoverableError,
} from 'react-reconciler/src/ReactFiberReconciler';
import {defaultOnDefaultTransitionIndicator} from './ReactDOMDefaultTransitionIndicator';
import {ConcurrentRoot} from 'react-reconciler/src/ReactRootTags';

// $FlowFixMe[missing-this-annot]
function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

// $FlowFixMe[prop-missing] found when upgrading Flow
ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render =
  // $FlowFixMe[missing-this-annot]
  function (children: ReactNodeList): void {
    const root = this._internalRoot;
    if (root === null) {
      throw new Error('Cannot update an unmounted root.');
    }

    if (__DEV__) {
      // using a reference to `arguments` bails out of GCC optimizations which affect function arity
      const args = arguments;
      if (typeof args[1] === 'function') {
        console.error(
          'does not support the second callback argument. ' +
            'To execute a side effect after rendering, declare it in a component body with useEffect().',
        );
      } else if (isValidContainer(args[1])) {
        console.error(
          'You passed a container to the second argument of root.render(...). ' +
            "You don't need to pass it again since you already passed it to create the root.",
        );
      } else if (typeof args[1] !== 'undefined') {
        console.error(
          'You passed a second argument to root.render(...) but it only accepts ' +
            'one argument.',
        );
      }
    }
    updateContainer(children, root, null, null);
  };

// $FlowFixMe[prop-missing] found when upgrading Flow
ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount =
  // $FlowFixMe[missing-this-annot]
  function (): void {
    throw new Error('Not implemented');
  };

export function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  // 在真正挂载前做校验，如果不是合法容器就直接抛错，防止 React 渲染到非法节点
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  warnIfReactDOMContainerInDEV(container);

  const concurrentUpdatesByDefaultOverride = false;
  let isStrictMode = false;
  let identifierPrefix = '';
  let onUncaughtError = defaultOnUncaughtError;
  let onCaughtError = defaultOnCaughtError;
  let onRecoverableError = defaultOnRecoverableError;
  let onDefaultTransitionIndicator = defaultOnDefaultTransitionIndicator;
  let transitionCallbacks = null;

  if (options !== null && options !== undefined) {
    if (options.unstable_transitionCallbacks !== undefined) {
      transitionCallbacks = options.unstable_transitionCallbacks;
    }
    throw new Error('Not implemented');
  }

  const root = createContainer(
    container,
    ConcurrentRoot,
    null,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
    identifierPrefix,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    transitionCallbacks,
  );
  markContainerAsRoot(root.current, container);

  const rootContainerElement: Document | Element | DocumentFragment =
    // 如果没有禁用用注释节点当容器，那么则用他的 parentNode 做容器
    !disableCommentsAsDOMContainers && container.nodeType === COMMENT_NODE
      ? (container.parentNode: any)
      : // 如果直接用注释节点当容器返回，后续流程可能会出现报错
        container;
  listenToAllSupportedEvents(rootContainerElement);

  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  return new ReactDOMRoot(root);
}

export function hydrateRoot(
  container: Document | Element,
  initialChildren: ReactNodeList,
  options?: HydrateRootOptions,
): RootType {
  throw new Error('Not implemented');
}

// 这个函数是开发环境下的误用提示器
// 如果传入的 container 之前已经被 React 当成根容器用过，就在控制台报错，提醒你使用方式不对
function warnIfReactDOMContainerInDEV(container: any) {
  if (__DEV__) {
    // 先用 isContainerMarkedAsRoot(container) 判断容器是否已经被标记为 root
    if (isContainerMarkedAsRoot(container)) {
      // container._reactRootContainer 存在，说明之前用的是旧的 ReactDOM.render()，
      // 现在改用 createRoot()，这是不支持的
      if (container._reactRootContainer) {
        console.error(
          'You are calling ReactDOMClient.createRoot() on a container that was previously ' +
            'passed to ReactDOM.render(). This is not supported.',
        );
      } else {
        console.error(
          'You are calling ReactDOMClient.createRoot() on a container that ' +
            'has already been passed to createRoot() before. Instead, call ' +
            'root.render() on the existing root instead if you want to update it.',
        );
      }
    }
  }
}

// $FlowFixMe[missing-this-annot]
function ReactDOMHydrationRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}
