/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';
import type {
  ReactPortal,
  Thenable,
  ReactContext,
  ReactDebugInfo,
  ReactComponentInfo,
  SuspenseListRevealOrder,
  ReactKey,
  ReactOptimisticKey,
} from 'shared/ReactTypes';
import type {Fiber} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane';
import type {ThenableState} from './ReactFiberThenable';

import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import {
  Placement,
  ChildDeletion,
  Forked,
  PlacementDEV,
} from './ReactFiberFlags';
import {NoMode, ConcurrentMode} from './ReactTypeOfMode';
import {
  getIteratorFn,
  ASYNC_ITERATOR,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_LAZY_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_LEGACY_ELEMENT_TYPE,
  REACT_OPTIMISTIC_KEY,
} from 'shared/ReactSymbols';
import {
  HostRoot,
  HostText,
  HostPortal,
  Fragment,
  FunctionComponent,
} from './ReactWorkTags';
import isArray from 'shared/isArray';
import {
  enableAsyncIterableChildren,
  disableLegacyMode,
  enableFragmentRefs,
  enableOptimisticKey,
} from 'shared/ReactFeatureFlags';

import {
  createWorkInProgress,
  // resetWorkInProgress,
  createFiberFromElement,
  // createFiberFromFragment,
  // createFiberFromText,
  // createFiberFromPortal,
  createFiberFromThrow,
} from './ReactFiber';
import {isCompatibleFamilyForHotReloading} from './ReactFiberHotReloading';
// import {getIsHydrating} from './ReactFiberHydrationContext';
// import {pushTreeFork} from './ReactFiberTreeContext';
import {
  SuspenseException,
  SuspenseActionException,
  // createThenableState,
  // trackUsedThenable,
  resolveLazy,
} from './ReactFiberThenable';
// import {readContextDuringReconciliation} from './ReactFiberNewContext';

import {runWithFiberInDEV} from './ReactCurrentFiber';

// This tracks the thenables that are unwrapped during reconcilation.
let thenableState: ThenableState | null = null;
let thenableIndexCounter: number = 0;

// Server Components Meta Data
let currentDebugInfo: null | ReactDebugInfo = null;

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes,
) => Fiber | null;

let didWarnAboutMaps;
let didWarnAboutGenerators;
let ownerHasKeyUseWarning;
let ownerHasFunctionTypeWarning;
let ownerHasSymbolTypeWarning;
let warnForMissingKey = (
  returnFiber: Fiber,
  workInProgress: Fiber,
  child: mixed,
) => {};

if (__DEV__) {
  didWarnAboutMaps = false;
  didWarnAboutGenerators = false;

  /**
   * Warn if there's no key explicitly set on dynamic arrays of children or
   * object keys are not valid. This allows us to keep track of children between
   * updates.
   */
  ownerHasKeyUseWarning = ({}: {[string]: boolean});
  ownerHasFunctionTypeWarning = ({}: {[string]: boolean});
  ownerHasSymbolTypeWarning = ({}: {[string]: boolean});

  warnForMissingKey = (
    returnFiber: Fiber,
    workInProgress: Fiber,
    child: mixed,
  ) => {
    throw new Error('Not implemented yet.');
  };
}

function coerceRef(workInProgress: Fiber, element: ReactElement): void {
  // TODO: This is a temporary, intermediate step. Now that enableRefAsProp is on,
  // we should resolve the `ref` prop during the begin phase of the component
  // it's attached to (HostComponent, ClassComponent, etc).
  const refProp = element.props.ref;
  // TODO: With enableRefAsProp now rolled out, we shouldn't use the `ref` field. We
  // should always read the ref from the prop.
  workInProgress.ref = refProp !== undefined ? refProp : null;
}

function pushDebugInfo(
  debugInfo: null | ReactDebugInfo,
): null | ReactDebugInfo {
  if (!__DEV__) {
    return null;
  }
  const previousDebugInfo = currentDebugInfo;
  if (debugInfo == null) {
    // Leave inplace
  } else if (previousDebugInfo === null) {
    currentDebugInfo = debugInfo;
  } else {
    // If we have two debugInfo, we need to create a new one. This makes the array no longer
    // live so we'll miss any future updates if we received more so ideally we should always
    // do this after both have fully resolved/unsuspended.
    currentDebugInfo = previousDebugInfo.concat(debugInfo);
  }
  return previousDebugInfo;
}

function getCurrentDebugTask(): null | ConsoleTask {
  // Get the debug task of the parent Server Component if there is one.
  if (__DEV__) {
    const debugInfo = currentDebugInfo;
    if (debugInfo != null) {
      for (let i = debugInfo.length - 1; i >= 0; i--) {
        if (debugInfo[i].name != null) {
          const componentInfo: ReactComponentInfo = debugInfo[i];
          const debugTask: ?ConsoleTask = componentInfo.debugTask;
          if (debugTask != null) {
            return debugTask;
          }
        }
      }
    }
  }
  return null;
}

function warnOnFunctionType(returnFiber: Fiber, invalidChild: Function) {
  const debugTask = getCurrentDebugTask();
  if (__DEV__ && debugTask !== null) {
    debugTask.run(warnOnFunctionTypeImpl.bind(null, returnFiber, invalidChild));
  } else {
    warnOnFunctionTypeImpl(returnFiber, invalidChild);
  }
}

function warnOnFunctionTypeImpl(returnFiber: Fiber, invalidChild: Function) {
  if (__DEV__) {
    const parentName = getComponentNameFromFiber(returnFiber) || 'Component';

    if (ownerHasFunctionTypeWarning[parentName]) {
      return;
    }
    ownerHasFunctionTypeWarning[parentName] = true;

    const name = invalidChild.displayName || invalidChild.name || 'Component';

    if (returnFiber.tag === HostRoot) {
      console.error(
        'Functions are not valid as a React child. This may happen if ' +
          'you return %s instead of <%s /> from render. ' +
          'Or maybe you meant to call this function rather than return it.\n' +
          '  root.render(%s)',
        name,
        name,
        name,
      );
    } else {
      console.error(
        'Functions are not valid as a React child. This may happen if ' +
          'you return %s instead of <%s /> from render. ' +
          'Or maybe you meant to call this function rather than return it.\n' +
          '  <%s>{%s}</%s>',
        name,
        name,
        parentName,
        name,
        parentName,
      );
    }
  }
}

function warnOnSymbolType(returnFiber: Fiber, invalidChild: symbol) {
  const debugTask = getCurrentDebugTask();
  if (__DEV__ && debugTask !== null) {
    debugTask.run(warnOnSymbolTypeImpl.bind(null, returnFiber, invalidChild));
  } else {
    warnOnSymbolTypeImpl(returnFiber, invalidChild);
  }
}

function warnOnSymbolTypeImpl(returnFiber: Fiber, invalidChild: symbol) {
  if (__DEV__) {
    const parentName = getComponentNameFromFiber(returnFiber) || 'Component';

    if (ownerHasSymbolTypeWarning[parentName]) {
      return;
    }
    ownerHasSymbolTypeWarning[parentName] = true;

    // eslint-disable-next-line react-internal/safe-string-coercion
    const name = String(invalidChild);

    if (returnFiber.tag === HostRoot) {
      console.error(
        'Symbols are not valid as a React child.\n' + '  root.render(%s)',
        name,
      );
    } else {
      console.error(
        'Symbols are not valid as a React child.\n' + '  <%s>%s</%s>',
        parentName,
        name,
        parentName,
      );
    }
  }
}

// This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.
function createChildReconciler(
  shouldTrackSideEffects: boolean,
): ChildReconciler {
  function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
    throw new Error('Not implemented');
  }

  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
  ): null {
    if (!shouldTrackSideEffects) {
      // Noop.
      return null;
    }

    // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  function mapRemainingChildren(
    currentFirstChild: Fiber,
  ): Map<string | number | ReactOptimisticKey, Fiber> {
    throw new Error('Not implemented');
  }

  function useFiber(fiber: Fiber, pendingProps: mixed): Fiber {
    throw new Error('Not implemented');
  }

  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number,
    newIndex: number,
  ): number {
    throw new Error('Not implemented');
  }

  function placeSingleChild(newFiber: Fiber): Fiber {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement | PlacementDEV;
    }
    return newFiber;
  }

  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string,
    lanes: Lanes,
  ) {
    throw new Error('Not implemented');
  }

  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement,
    lanes: Lanes,
  ): Fiber {
    throw new Error('Not implemented yet.');
  }

  function updatePortal(
    returnFiber: Fiber,
    current: Fiber | null,
    portal: ReactPortal,
    lanes: Lanes,
  ): Fiber {
    throw new Error('Not implemented yet.');
  }

  function updateFragment(
    returnFiber: Fiber,
    current: Fiber | null,
    fragment: Iterable<React$Node>,
    lanes: Lanes,
    key: ReactKey,
  ): Fiber {
    throw new Error('Not implemented yet.');
  }

  function createChild(
    returnFiber: Fiber,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  function updateFromMap(
    existingChildren: Map<string | number | ReactOptimisticKey, Fiber>,
    returnFiber: Fiber,
    newIdx: number,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  /**
   * Warns if there is a duplicate or missing key
   */
  function warnOnInvalidKey(
    returnFiber: Fiber,
    workInProgress: Fiber,
    child: mixed,
    knownKeys: Set<string> | null,
  ): Set<string> | null {
    throw new Error('Not implemented yet.');
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  function reconcileChildrenIteratable(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildrenIterable: Iterable<mixed>,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  function reconcileChildrenAsyncIteratable(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildrenIterable: AsyncIterable<mixed>,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  function reconcileChildrenIterator(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: ?Iterator<mixed>,
    lanes: Lanes,
  ): Fiber | null {
    throw new Error('Not implemented yet.');
  }

  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string,
    lanes: Lanes,
  ): Fiber {
    throw new Error('Not implemented');
  }

  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement,
    lanes: Lanes,
  ): Fiber {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (
        child.key === key ||
        (enableOptimisticKey && child.key === REACT_OPTIMISTIC_KEY)
      ) {
        const elementType = element.type;
        if (elementType === REACT_FRAGMENT_TYPE) {
          throw new Error('Not implemented');
        } else {
          if (
            child.elementType === elementType ||
            // Keep this check inline so it only runs on the false path:
            (__DEV__
              ? isCompatibleFamilyForHotReloading(child, element)
              : false) ||
            // Lazy types should reconcile their resolved type.
            // We need to do this after the Hot Reloading check above,
            // because hot reloading has different semantics than prod because
            // it doesn't resuspend. So we can't let the call below suspend.
            (typeof elementType === 'object' &&
              elementType !== null &&
              elementType.$$typeof === REACT_LAZY_TYPE &&
              resolveLazy(elementType) === child.type)
          ) {
            deleteRemainingChildren(returnFiber, child.sibling);
            const existing = useFiber(child, element.props);
            if (enableOptimisticKey) {
              // If the old key was optimistic we need to now save the real one.
              existing.key = key;
            }
            coerceRef(existing, element);
            existing.return = returnFiber;
            if (__DEV__) {
              existing._debugOwner = element._owner;
              existing._debugInfo = currentDebugInfo;
            }
            return existing;
          }
        }
        // Didn't match.
        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    if (element.type === REACT_FRAGMENT_TYPE) {
      throw new Error('Not implemented');
    } else {
      const created = createFiberFromElement(element, returnFiber.mode, lanes);
      coerceRef(created, element);
      created.return = returnFiber;
      if (__DEV__) {
        created._debugInfo = currentDebugInfo;
      }
      return created;
    }
  }

  function reconcileSinglePortal(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    portal: ReactPortal,
    lanes: Lanes,
  ): Fiber {
    throw new Error('Not implemented');
  }

  // This API will tag the children with the side-effect of the reconciliation
  // itself. They will be added to the side-effect list as we pass through the
  // children and the parent.
  // 这是 diff 算法的核心入口，负责对比新旧子节点，决定如何更新
  function reconcileChildFibersImpl(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    // This function is only recursive for Usables/Lazy and not nested arrays.
    // That's so that using a Lazy wrapper is unobservable to the Fragment
    // convention.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.

    // Handle top level unkeyed fragments without refs (enableFragmentRefs)
    // as if they were arrays. This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
    // We don't use recursion here because a fragment inside a fragment
    // is no longer considered "top level" for these purposes.
    const isUnkeyedUnrefedTopLevelFragment =
      typeof newChild === 'object' &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null &&
      (enableFragmentRefs ? newChild.props.ref === undefined : true);

    if (isUnkeyedUnrefedTopLevelFragment) {
      throw new Error('Not implemented yet.');
    }

    // Handle object types
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);
          const firstChild = placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
            ),
          );
          currentDebugInfo = prevDebugInfo;
          return firstChild;
        }
        case REACT_PORTAL_TYPE: {
          throw new Error('Not implemented yet.');
        }
        case REACT_LAZY_TYPE: {
          throw new Error('Not implemented yet.');
        }
      }

      if (isArray(newChild)) {
        const prevDebugInfo = pushDebugInfo(newChild._debugInfo);
        const firstChild = reconcileChildrenArray(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes,
        );
        currentDebugInfo = prevDebugInfo;
        return firstChild;
      }

      if (getIteratorFn(newChild)) {
        throw new Error('Not implemented yet.');
      }

      if (
        enableAsyncIterableChildren &&
        typeof newChild[ASYNC_ITERATOR] === 'function'
      ) {
        throw new Error('Not implemented yet.');
      }

      // Usables are a valid React node type. When React encounters a Usable in
      // a child position, it unwraps it using the same algorithm as `use`. For
      // example, for promises, React will throw an exception to unwind the
      // stack, then replay the component once the promise resolves.
      //
      // A difference from `use` is that React will keep unwrapping the value
      // until it reaches a non-Usable type.
      //
      // e.g. Usable<Usable<Usable<T>>> should resolve to T
      //
      // The structure is a bit unfortunate. Ideally, we shouldn't need to
      // replay the entire begin phase of the parent fiber in order to reconcile
      // the children again. This would require a somewhat significant refactor,
      // because reconcilation happens deep within the begin phase, and
      // depending on the type of work, not always at the end. We should
      // consider as an future improvement.
      if (typeof newChild.then === 'function') {
        throw new Error('Not implemented yet.');
      }

      if (newChild.$$typeof === REACT_CONTEXT_TYPE) {
        throw new Error('Not implemented yet.');
      }

      // throwOnInvalidObjectType(returnFiber, newChild);
      throw new Error('Not implemented yet.');
    }

    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number' ||
      typeof newChild === 'bigint'
    ) {
      throw new Error('Not implemented yet.');
    }

    if (__DEV__) {
      if (typeof newChild === 'function') {
        warnOnFunctionType(returnFiber, newChild);
      }
      if (typeof newChild === 'symbol') {
        warnOnSymbolType(returnFiber, newChild);
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    const prevDebugInfo = currentDebugInfo;
    currentDebugInfo = null;
    try {
      // This indirection only exists so we can reset `thenableState` at the end.
      // It should get inlined by Closure.
      thenableIndexCounter = 0;
      const firstChildFiber = reconcileChildFibersImpl(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes,
      );
      thenableState = null;
      // Don't bother to reset `thenableIndexCounter` to 0 because it always gets
      // set at the beginning.
      return firstChildFiber;
    } catch (x) {
      if (
        x === SuspenseException ||
        x === SuspenseActionException ||
        (!disableLegacyMode &&
          (returnFiber.mode & ConcurrentMode) === NoMode &&
          typeof x === 'object' &&
          x !== null &&
          typeof x.then === 'function')
      ) {
        // Suspense exceptions need to read the current suspended state before
        // yielding and replay it using the same sequence so this trick doesn't
        // work here.
        // Suspending in legacy mode actually mounts so if we let the child
        // mount then we delete its state in an update.
        throw x;
      }
      // Something errored during reconciliation but it's conceptually a child that
      // errored and not the current component itself so we create a virtual child
      // that throws in its begin phase. That way the current component can handle
      // the error or suspending if needed.
      const throwFiber = createFiberFromThrow(x, returnFiber.mode, lanes);
      throwFiber.return = returnFiber;
      if (__DEV__) {
        const debugInfo = (throwFiber._debugInfo = currentDebugInfo);
        // Conceptually the error's owner should ideally be captured when the
        // Error constructor is called but we don't override them to capture our
        // `owner`. So instead, we use the nearest parent as the owner/task of the
        // error. This is usually the same thing when it's thrown from the same
        // async component but not if you await a promise started from a different
        // component/task.
        // In newer Chrome, Error constructor does capture the Task which is what
        // is logged by reportError. In that case this debugTask isn't used.
        throwFiber._debugOwner = returnFiber._debugOwner;
        throwFiber._debugTask = returnFiber._debugTask;
        if (debugInfo != null) {
          for (let i = debugInfo.length - 1; i >= 0; i--) {
            if (typeof debugInfo[i].stack === 'string') {
              throwFiber._debugOwner = (debugInfo[i]: any);
              throwFiber._debugTask = debugInfo[i].debugTask;
              break;
            }
          }
        }
      }
      return throwFiber;
    } finally {
      currentDebugInfo = prevDebugInfo;
    }
  }

  return reconcileChildFibers;
}

export const reconcileChildFibers: ChildReconciler =
  createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

export function cloneChildFibers(
  current: Fiber | null,
  workInProgress: Fiber,
): void {
  if (current !== null && workInProgress.child !== current.child) {
    throw new Error('Resuming work not yet implemented.');
  }

  if (workInProgress.child === null) {
    return;
  }

  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;

  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
    );
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
}
