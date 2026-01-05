/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

// 游标类型，包含一个 current 属性存储当前值
export type StackCursor<T> = {current: T};

// 值栈，存储被 push 进来的历史值。
const valueStack: Array<any> = [];

// Fiber 栈，仅开发模式使用，用于调试时验证 push/pop 是否配对
let fiberStack: Array<Fiber | null>;

if (__DEV__) {
  fiberStack = [];
}

// 栈顶指针，-1 表示栈为空
let index = -1;

// 创建一个游标，初始值为 defaultValue。游标的 current 始终指向当前有效值
function createCursor<T>(defaultValue: T): StackCursor<T> {
  return {
    current: defaultValue,
  };
}

function pop<T>(cursor: StackCursor<T>, fiber: Fiber): void {
  // 栈空时报错（push/pop 不配对）
  if (index < 0) {
    if (__DEV__) {
      console.error('Unexpected pop.');
    }
    return;
  }

  // 开发模式下，验证 pop 的 Fiber 和 push 的是同一个（确保配对）
  if (__DEV__) {
    if (fiber !== fiberStack[index]) {
      console.error('Unexpected Fiber popped.');
    }
  }

  // 从栈中恢复旧值到游标
  cursor.current = valueStack[index];

  // 清空栈位置，指针减 1
  valueStack[index] = null;

  if (__DEV__) {
    fiberStack[index] = null;
  }

  index--;
}

function push<T>(cursor: StackCursor<T>, value: T, fiber: Fiber): void {
  // 栈顶指针加 1
  index++;

  // 把游标的旧值保存到栈中（之后恢复用）
  valueStack[index] = cursor.current;

  // 开发模式下，记录是哪个 Fiber 做的 push（调试用）
  if (__DEV__) {
    fiberStack[index] = fiber;
  }

  // 设置游标的新值
  cursor.current = value;
}

export {createCursor, pop, push};
