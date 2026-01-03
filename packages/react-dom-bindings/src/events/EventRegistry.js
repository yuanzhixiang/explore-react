/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from './DOMEventNames';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

// 所有注册过的原生事件名集合
export const allNativeEvents: Set<DOMEventName> = new Set();

// 根据特性开关，添加 beforeblur 和 afterblur 事件
if (enableCreateEventHandleAPI) {
  allNativeEvents.add('beforeblur');
  allNativeEvents.add('afterblur');
}

/**
 * Mapping from registration name to event name
 */
// 注册名（onXxx）到依赖的原生事件名数组的映射表
export const registrationNameDependencies: {
  [registrationName: string]: Array<DOMEventName>,
} = {};

/**
 * Mapping from lowercase registration names to the properly cased version,
 * used to warn in the case of missing event handlers. Available
 * only in __DEV__.
 * @type {Object}
 */
// 仅在开发模式下使用的大小写纠正表，把用户可能写错的 onclick、onMouseEnter
// 等小写版本映射回正确的注册名，用来给出更友好的警告提示
export const possibleRegistrationNames: {
  [lowerCasedName: string]: string,
} = __DEV__ ? {} : (null: any);
// Trust the developer to only use possibleRegistrationNames in __DEV__

export function registerTwoPhaseEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>,
): void {
  // 冒泡 + 捕获两个阶段的事件名，会登记 onXxx 和 onXxxCapture 两个注册名，依赖相同的原生事件
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + 'Capture', dependencies);
}

export function registerDirectEvent(
  // 注册名，比如 onClick
  registrationName: string,
  // 依赖的原生事件数组（比如 ['click']），元素类型是 DOMEventName
  dependencies: Array<DOMEventName>,
) {
  // DEV 下检查是否重复注册同名事件（防止多个插件冲突）
  if (__DEV__) {
    if (registrationNameDependencies[registrationName]) {
      console.error(
        'EventRegistry: More than one plugin attempted to publish the same ' +
          'registration name, `%s`.',
        registrationName,
      );
    }
  }

  // 正式写入映射：注册名 -> 依赖的原生事件数组
  registrationNameDependencies[registrationName] = dependencies;

  // 开发模式下支持大小写纠正
  if (__DEV__) {
    // 生成小写版本的注册名映射
    const lowerCasedName = registrationName.toLowerCase();
    // 写入映射表，把小写版本映射回正确的注册名
    possibleRegistrationNames[lowerCasedName] = registrationName;

    // 特例处理：onDoubleClick 对应的 DOM 事件是 dblclick
    if (registrationName === 'onDoubleClick') {
      possibleRegistrationNames.ondblclick = registrationName;
    }
  }

  // 把依赖的原生事件都加入到 allNativeEvents 集合中
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
