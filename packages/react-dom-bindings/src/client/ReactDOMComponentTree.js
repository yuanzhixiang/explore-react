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

// Given a DOM node, return the closest HostComponent or HostText fiber ancestor.
// If the target node is part of a hydrated or not yet rendered subtree, then
// this may also return a SuspenseComponent, ActivityComponent or HostRoot to
// indicate that.
// Conceptually the HostRoot fiber is a child of the Container node. So if you
// pass the Container node as the targetNode, you will not actually get the
// HostRoot back. To get to the HostRoot, you need to pass a child of it.
// The same thing applies to Suspense and Activity boundaries.
export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  let targetInst: void | Fiber;
  if (enableInternalInstanceMap) {
    targetInst = internalInstanceMap.get(((targetNode: any): InstanceUnion));
  } else {
    targetInst = (targetNode: any)[internalInstanceKey];
  }

  if (targetInst) {
    // Don't return HostRoot, SuspenseComponent or ActivityComponent here.
    return targetInst;
  }

  // If the direct event target isn't a React owned DOM node, we need to look
  // to see if one of its parents is a React owned DOM node.
  let parentNode = targetNode.parentNode;
  while (parentNode) {
    // We'll check if this is a container root that could include
    // React nodes in the future. We need to check this first because
    // if we're a child of a dehydrated container, we need to first
    // find that inner container before moving on to finding the parent
    // instance. Note that we don't check this field on  the targetNode
    // itself because the fibers are conceptually between the container
    // node and the first child. It isn't surrounding the container node.
    // If it's not a container, we check if it's an instance.
    if (enableInternalInstanceMap) {
      throw new Error('Not implemented');
    } else {
      throw new Error('Not implemented');
    }

    // if (targetInst) {
    //   // Since this wasn't the direct target of the event, we might have
    //   // stepped past dehydrated DOM nodes to get here. However they could
    //   // also have been non-React nodes. We need to answer which one.

    //   // If we the instance doesn't have any children, then there can't be
    //   // a nested suspense boundary within it. So we can use this as a fast
    //   // bailout. Most of the time, when people add non-React children to
    //   // the tree, it is using a ref to a child-less DOM node.
    //   // Normally we'd only need to check one of the fibers because if it
    //   // has ever gone from having children to deleting them or vice versa
    //   // it would have deleted the dehydrated boundary nested inside already.
    //   // However, since the HostRoot starts out with an alternate it might
    //   // have one on the alternate so we need to check in case this was a
    //   // root.
    //   const alternate = targetInst.alternate;
    //   throw new Error('Not implemented');
    // }
    // targetNode = parentNode;
    // parentNode = targetNode.parentNode;
    throw new Error('Not implemented');
  }
  return null;
}

export function getFiberCurrentPropsFromNode(
  node:
    | Container
    | Instance
    | TextInstance
    | SuspenseInstance
    | ActivityInstance,
): Props | null {
  if (enableInternalInstanceMap) {
    return internalPropsMap.get(node) || null;
  }
  return (node: any)[internalPropsKey] || null;
}
