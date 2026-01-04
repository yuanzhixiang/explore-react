/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';

import {getEventPriority} from '../events/ReactDOMEventListener';
import {
  NoEventPriority,
  DefaultEventPriority,
} from 'react-reconciler/src/ReactEventPriorities';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';

// 返回一个 EventPriority
export function resolveUpdatePriority(): EventPriority {
  // 读当前更新优先级
  const updatePriority = ReactDOMSharedInternals.p; /* currentUpdatePriority */
  // 如果已经有明确的优先级，就直接返回
  if (updatePriority !== NoEventPriority) {
    return updatePriority;
  }
  // 读取当前浏览器的全局事件对象（同步事件期间可能有值）
  const currentEvent = window.event;

  // 如果没有事件上下文，返回默认优先级
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  // 否则根据事件类型（比如 click、input）计算并返回对应优先级。
  return getEventPriority(currentEvent.type);
}
