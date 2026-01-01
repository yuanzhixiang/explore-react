/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// import type {ReactElement} from 'shared/ReactElementType';
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

// import {
//   supportsResources,
//   supportsSingletons,
//   isHostHoistableType,
//   isHostSingletonType,
// } from './ReactFiberConfig';
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
// import {getHostContext} from './ReactFiberHostContext';
import type {ReactComponentInfo} from '../../shared/ReactTypes';
// import isArray from 'shared/isArray';
// import getComponentNameFromType from 'shared/getComponentNameFromType';

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
