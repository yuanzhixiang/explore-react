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
  // HoistableRoot,
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

export function markContainerAsRoot(hostRoot: Fiber, node: Container): void {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: Container): void {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: Container): boolean {
  // $FlowFixMe[prop-missing]
  return !!node[internalContainerInstanceKey];
}

export function precacheFiberNode(
  // Fiber 节点
  hostInst: Fiber,
  // DOM 节点（多种类型）
  node:
    | Instance // 普通 DOM 元素
    | TextInstance // 文本节点
    | SuspenseInstance // Suspense 占位节点
    | ActivityInstance // Activity 相关
    | ReactScopeInstance, // Scope 相关
): void {
  // 如果启用了 Map 模式，用 WeakMap 存储映射关系
  if (enableInternalInstanceMap) {
    internalInstanceMap.set(node, hostInst);
    return;
  }
  // 直接在 DOM 节点上挂一个属性
  (node: any)[internalInstanceKey] = hostInst;
}

export function updateFiberProps(
  // DOM 元素
  node: Instance,
  // React props，如 { className: 'foo', onClick: fn }
  props: Props,
): void {
  // 用 WeakMap 存储映射关系
  if (enableInternalInstanceMap) {
    internalPropsMap.set(node, props);
    return;
  }
  // 直接在 DOM 节点上挂属性
  (node: any)[internalPropsKey] = props;
}
