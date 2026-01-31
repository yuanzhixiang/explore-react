/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {ReactScopeInstance} from 'shared/ReactTypes';
// import type {
//   ReactDOMEventHandle,
//   ReactDOMEventHandleListener,
// } from './ReactDOMEventHandleTypes';
import type {
  Container,
  TextInstance,
  Instance,
  ActivityInstance,
  SuspenseInstance,
  Props,
  HoistableRoot,
  RootResources,
} from './ReactFiberConfigDOM';

import {
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostRoot,
  SuspenseComponent,
  ActivityComponent,
} from 'react-reconciler/src/ReactWorkTags';

// import {getParentHydrationBoundary} from './ReactFiberConfigDOM';

import {enableScopeAPI} from 'shared/ReactFeatureFlags';

import {enableInternalInstanceMap} from 'shared/ReactFeatureFlags';

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;
const internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
const internalEventHandlesSetKey = '__reactHandles$' + randomKey;
const internalRootNodeResourcesKey = '__reactResources$' + randomKey;
const internalHoistableMarker = '__reactMarker$' + randomKey;
const internalScrollTimer = '__reactScroll$' + randomKey;

type InstanceUnion =
  | Instance
  | TextInstance
  | SuspenseInstance
  | ActivityInstance
  | ReactScopeInstance
  | Container;

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const internalInstanceMap:
  | WeakMap<InstanceUnion, Fiber>
  | Map<InstanceUnion, Fiber> = new PossiblyWeakMap();
const internalPropsMap:
  | WeakMap<InstanceUnion, Props>
  | Map<InstanceUnion, Props> = new PossiblyWeakMap();
