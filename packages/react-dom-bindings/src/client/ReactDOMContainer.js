/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {disableCommentsAsDOMContainers} from 'shared/ReactFeatureFlags';

import {
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './HTMLNodeType';

export function isValidContainer(node: any): boolean {
  // 这里的 !! 表示两次取反，将任意值转成 布尔值
  return !!(
    node &&
    // 支持挂载到普通元素、document 以及 document fragment 上
    // const elementNode = document.createElement('div');
    // 这里的 elementNode.nodeType 就是 ELEMENT_NODE，值为 1
    (node.nodeType === ELEMENT_NODE ||
      // document 是浏览器里当前页面的顶层文档对象（DOM 的根），代表整棵 DOM 树本身
      // document.nodeType 的值为 9
      node.nodeType === DOCUMENT_NODE ||
      // DocumentFragment 是一个轻量级的“离线容器”，可以先把一批节点插进去、做完批量操作后，
      // 再一次性插入到真实 DOM 中；这样更高效、也不会触发多次重排/重绘
      // const fragmentNode = document.createDocumentFragment()
      // 这里的 fragmentNode.nodeType 就是 DOCUMENT_FRAGMENT_NODE，值为 11
      // fragmentNode 其实就是 <></> 这种 React 片段的底层实现
      // 在添加到 appendChild 到 DOM 的时候，<></> 本身不会被渲染成真实节点，
      // 而是把它里面的子节点都添加到 DOM 里
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      // 在 disableCommentsAsDOMContainers 为 false 时，
      // 允许 COMMENT_NODE 且注释内容必须是 ' react-mount-point-unstable '
      // const commentNode = document.createComment(' react-mount-point-unstable ')
      // 这里的 commentNode.nodeType 就是 COMMENT_NODE，值为 8
      (!disableCommentsAsDOMContainers &&
        node.nodeType === COMMENT_NODE &&
        (node: any).nodeValue === ' react-mount-point-unstable '))
  );
}
