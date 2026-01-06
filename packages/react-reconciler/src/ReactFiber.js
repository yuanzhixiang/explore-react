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
  ReactFragment,
  ReactPortal,
  ReactScope,
  ViewTransitionProps,
  ActivityProps,
  ReactKey,
} from 'shared/ReactTypes';
import type {Fiber} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {WorkTag} from './ReactWorkTags';
import type {TypeOfMode} from './ReactTypeOfMode';
import type {Lanes} from './ReactFiberLane';
import type {ActivityInstance, SuspenseInstance} from './ReactFiberConfig';
import type {
  LegacyHiddenProps,
  OffscreenProps,
} from './ReactFiberOffscreenComponent';
// import type {ViewTransitionState} from './ReactFiberViewTransitionComponent';
import type {TracingMarkerInstance} from './ReactFiberTracingMarkerComponent';

import {
  supportsResources,
  supportsSingletons,
  isHostHoistableType,
  isHostSingletonType,
} from './ReactFiberConfig';
import {
  enableProfilerTimer,
  enableScopeAPI,
  enableLegacyHidden,
  enableTransitionTracing,
  disableLegacyMode,
  enableObjectFiber,
  enableViewTransition,
  enableSuspenseyImages,
  enableOptimisticKey,
} from 'shared/ReactFeatureFlags';
import {NoFlags, Placement, StaticMask} from './ReactFiberFlags';
import {ConcurrentRoot} from './ReactRootTags';
import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  HostHoistable,
  HostSingleton,
  ForwardRef,
  Fragment,
  Mode,
  ContextProvider,
  ContextConsumer,
  Profiler,
  SuspenseComponent,
  SuspenseListComponent,
  DehydratedFragment,
  FunctionComponent,
  MemoComponent,
  SimpleMemoComponent,
  LazyComponent,
  ScopeComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
  TracingMarkerComponent,
  Throw,
  ViewTransitionComponent,
  ActivityComponent,
} from './ReactWorkTags';
// import {getComponentNameFromOwner} from 'react-reconciler/src/getComponentNameFromFiber';
import {isDevToolsPresent} from './ReactFiberDevToolsHook';
// import {
//   resolveClassForHotReloading,
//   resolveFunctionForHotReloading,
//   resolveForwardRefForHotReloading,
// } from './ReactFiberHotReloading';
import {NoLanes} from './ReactFiberLane';
import {
  NoMode,
  ConcurrentMode,
  ProfileMode,
  StrictLegacyMode,
  StrictEffectsMode,
  SuspenseyImagesMode,
} from './ReactTypeOfMode';
import {
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_CONSUMER_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
  REACT_SCOPE_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
  REACT_TRACING_MARKER_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_VIEW_TRANSITION_TYPE,
  REACT_ACTIVITY_TYPE,
} from 'shared/ReactSymbols';
import {TransitionTracingMarker} from './ReactFiberTracingMarkerComponent';
import {getHostContext} from './ReactFiberHostContext';
import type {ReactComponentInfo} from '../../shared/ReactTypes';
// import isArray from 'shared/isArray';
// import getComponentNameFromType from 'shared/getComponentNameFromType';

export type {Fiber};

let hasBadMapPolyfill;

// 在 开发模式 下检测环境里的 Map/Set 是否是有问题的 polyfill
if (__DEV__) {
  hasBadMapPolyfill = false;
  try {
    // 先创建一个 不可扩展对象：Object.preventExtensions({})
    const nonExtensibleObject = Object.preventExtensions({});
    // eslint-disable-next-line no-new
    // 尝试把这个对象作为 key 放进 Map、作为值放进 Set
    new Map([[nonExtensibleObject, null]]);
    // 尝试把这个对象作为作为值放进 Set
    // eslint-disable-next-line no-new
    new Set([nonExtensibleObject]);
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    // 如果抛错，说明这个 Map/Set polyfill 不支持非可扩展对象，一些旧 polyfill 有这个 bug
    hasBadMapPolyfill = true;
  }
}

function FiberNode(
  this: $FlowFixMe,
  tag: WorkTag,
  pendingProps: mixed,
  key: ReactKey,
  mode: TypeOfMode,
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;
  this.refCleanup = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;

  if (enableProfilerTimer) {
    // Note: The following is done to avoid a v8 performance cliff.
    //
    // Initializing the fields below to smis and later updating them with
    // double values will cause Fibers to end up having separate shapes.
    // This behavior/bug has something to do with Object.preventExtension().
    // Fortunately this only impacts DEV builds.
    // Unfortunately it makes React unusably slow for some applications.
    // To work around this, initialize the fields below with doubles.
    //
    // Learn more about this here:
    // https://github.com/facebook/react/issues/14365
    // https://bugs.chromium.org/p/v8/issues/detail?id=8538

    this.actualDuration = -0;
    this.actualStartTime = -1.1;
    this.selfBaseDuration = -0;
    this.treeBaseDuration = -0;
  }

  if (__DEV__) {
    // This isn't directly used but is handy for debugging internals:
    this._debugInfo = null;
    this._debugOwner = null;
    this._debugStack = null;
    this._debugTask = null;
    this._debugNeedsRemount = false;
    this._debugHookTypes = null;
    if (!hasBadMapPolyfill && typeof Object.preventExtensions === 'function') {
      Object.preventExtensions(this);
    }
  }
}

// This is a constructor function, rather than a POJO constructor, still
// please ensure we do the following:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 4) We can easily go from a constructor to a createFiber object literal if that
//    is faster.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
function createFiberImplClass(
  tag: WorkTag,
  pendingProps: mixed,
  key: ReactKey,
  mode: TypeOfMode,
): Fiber {
  // $FlowFixMe[invalid-constructor]: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
}

function createFiberImplObject(
  tag: WorkTag,
  pendingProps: mixed,
  key: ReactKey,
  mode: TypeOfMode,
): Fiber {
  const fiber: Fiber = {
    // Instance
    // tag, key - defined at the bottom as dynamic properties
    elementType: null,
    type: null,
    stateNode: null,

    // Fiber
    return: null,
    child: null,
    sibling: null,
    index: 0,

    ref: null,
    refCleanup: null,

    // pendingProps - defined at the bottom as dynamic properties
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    dependencies: null,

    // Effects
    flags: NoFlags,
    subtreeFlags: NoFlags,
    deletions: null,

    lanes: NoLanes,
    childLanes: NoLanes,

    alternate: null,

    // dynamic properties at the end for more efficient hermes bytecode
    tag,
    key,
    pendingProps,
    mode,
  };

  if (enableProfilerTimer) {
    fiber.actualDuration = -0;
    fiber.actualStartTime = -1.1;
    fiber.selfBaseDuration = -0;
    fiber.treeBaseDuration = -0;
  }

  if (__DEV__) {
    // This isn't directly used but is handy for debugging internals:
    fiber._debugInfo = null;
    fiber._debugOwner = null;
    fiber._debugStack = null;
    fiber._debugTask = null;
    fiber._debugNeedsRemount = false;
    fiber._debugHookTypes = null;
    if (!hasBadMapPolyfill && typeof Object.preventExtensions === 'function') {
      Object.preventExtensions(fiber);
    }
  }
  return fiber;
}

const createFiber = enableObjectFiber
  ? createFiberImplObject
  : createFiberImplClass;

export function createHostRootFiber(
  tag: RootTag,
  isStrictMode: boolean,
): Fiber {
  let mode: number;
  if (disableLegacyMode || tag === ConcurrentRoot) {
    mode = ConcurrentMode;
    if (isStrictMode === true) {
      mode |= StrictLegacyMode | StrictEffectsMode;
    }
  } else {
    mode = NoMode;
  }

  if (__DEV__ || (enableProfilerTimer && isDevToolsPresent)) {
    // dev: Enable profiling instrumentation by default.
    // profile: enabled if DevTools is present or subtree is wrapped in <Profiler>.
    // production: disabled.
    mode |= ProfileMode;
  }

  return createFiber(HostRoot, null, null, mode);
}

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    if (__DEV__) {
      // DEV-only fields

      workInProgress._debugOwner = current._debugOwner;
      workInProgress._debugStack = current._debugStack;
      workInProgress._debugTask = current._debugTask;
      workInProgress._debugHookTypes = current._debugHookTypes;
    }

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    throw new Error('Not implemented yet.');
  }

  // Reset all effects except static ones.
  // Static effects are not specific to a render.
  workInProgress.flags = current.flags & StaticMask;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // Clone the dependencies object. This is mutated during the render phase, so
  // it cannot be shared with the current fiber.
  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : __DEV__
        ? {
            lanes: currentDependencies.lanes,
            firstContext: currentDependencies.firstContext,
            _debugThenableState: currentDependencies._debugThenableState,
          }
        : {
            lanes: currentDependencies.lanes,
            firstContext: currentDependencies.firstContext,
          };

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.refCleanup = current.refCleanup;

  if (enableProfilerTimer) {
    workInProgress.selfBaseDuration = current.selfBaseDuration;
    workInProgress.treeBaseDuration = current.treeBaseDuration;
  }

  if (__DEV__) {
    workInProgress._debugInfo = current._debugInfo;
    workInProgress._debugNeedsRemount = current._debugNeedsRemount;
    switch (workInProgress.tag) {
      case FunctionComponent:
      case SimpleMemoComponent:
        // workInProgress.type = resolveFunctionForHotReloading(current.type);
        // break;
        throw new Error('Not implemented yet.');
      case ClassComponent:
        // workInProgress.type = resolveClassForHotReloading(current.type);
        // break;
        throw new Error('Not implemented yet.');
      case ForwardRef:
        // workInProgress.type = resolveForwardRefForHotReloading(current.type);
        // break;
        throw new Error('Not implemented yet.');
      default:
        break;
    }
  }

  return workInProgress;
}

// TODO: Get rid of this helper. Only createFiberFromElement should exist.
export function createFiberFromTypeAndProps(
  type: any, // React$ElementType
  key: ReactKey,
  pendingProps: any,
  owner: null | ReactComponentInfo | Fiber,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {
  let fiberTag: WorkTag = FunctionComponent;
  // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
  let resolvedType = type;

  if (typeof type === 'function') {
    throw new Error('Not implemented yet.');
  } else if (typeof type === 'string') {
    if (supportsResources && supportsSingletons) {
      const hostContext = getHostContext();
      fiberTag = isHostHoistableType(type, pendingProps, hostContext)
        ? HostHoistable
        : isHostSingletonType(type)
          ? HostSingleton
          : HostComponent;
    } else if (supportsResources) {
      throw new Error('Not implemented yet.');
    } else if (supportsSingletons) {
      throw new Error('Not implemented yet.');
    } else {
      throw new Error('Not implemented yet.');
    }
  } else {
    throw new Error('Not implemented yet.');
  }

  const fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = resolvedType;
  fiber.lanes = lanes;

  if (__DEV__) {
    fiber._debugOwner = owner;
  }

  return fiber;
}

export function createFiberFromThrow(
  error: mixed,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {
  const fiber = createFiber(Throw, error, null, mode);
  fiber.lanes = lanes;
  return fiber;
}

export function createFiberFromElement(
  element: ReactElement,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {
  let owner = null;
  if (__DEV__) {
    owner = element._owner;
  }
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    lanes,
  );
  if (__DEV__) {
    fiber._debugOwner = element._owner;
    fiber._debugStack = element._debugStack;
    fiber._debugTask = element._debugTask;
  }
  return fiber;
}
