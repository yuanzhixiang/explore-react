/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {TEXT_NODE} from './HTMLNodeType';

/**
 * Set the textContent property of a node. For text updates, it's faster
 * to set the `nodeValue` of the Text node directly instead of using
 * `.textContent` which will remove the existing node and create a new one.
 *
 * @param {DOMElement} node
 * @param {string} text
 * @internal
 */
function setTextContent(node: Element, text: string): void {
  // 如果 text 是空字符串/null/undefined，跳过优化逻辑，直接用 textContent
  if (text) {
    // 获取第一个子节点
    const firstChild = node.firstChild;

    if (
      // firstChild 存在（有子节点）
      firstChild &&
      // 第一个和最后一个是同一个 → 只有一个子节点
      firstChild === node.lastChild &&
      // 这个唯一子节点必须是文本节点
      firstChild.nodeType === TEXT_NODE
    ) {
      // 直接修改文本节点的值
      firstChild.nodeValue = text;
      return;
    }
  }
  // 降级使用 textContent 暴力替换
  // - 会销毁所有子节点
  // - 创建新的文本节点
  // - 触发更多的 DOM 重排/重绘
  node.textContent = text;
}

export default setTextContent;
