/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {Effect} from './ReactFiberHooks';
import type {CapturedValue} from './ReactCapturedValue';

import {isRendering, setIsRendering} from './ReactCurrentFiber';
import {captureCommitPhaseError} from './ReactFiberWorkLoop';

// These indirections exists so we can exclude its stack frame in DEV (and anything below it).
// TODO: Consider marking the whole bundle instead of these boundaries.

const callComponent = {
  react_stack_bottom_frame: function <Props, Arg, R>(
    // 函数组件
    Component: (p: Props, arg: Arg) => R,
    // 传给组件的 props
    props: Props,
    // 组件的第二个参数，我这里看到是 underfined
    secondArg: Arg,
  ): R {
    // 保存当前是否正在渲染
    const wasRendering = isRendering;
    // 标记当前正在渲染
    setIsRendering(true);
    try {
      // 调用函数组件，得到渲染结果
      const result = Component(props, secondArg);
      // 返回渲染结果
      return result;
    } finally {
      // 恢复之前的渲染状态
      setIsRendering(wasRendering);
    }
  },
};

// 这段代码的作用是在 DEV 环境里用一个带固定函数名的包装器来执行组件函数，
// 同时正确维护 isRendering 标记和异常恢复
export const callComponentInDEV: <Props, Arg, R>(
  Component: (p: Props, arg: Arg) => R,
  props: Props,
  secondArg: Arg,
) => R = __DEV__
  ? // We use this technique to trick minifiers to preserve the function name.
    // 如果是开发环境 __DEV__，才赋值真正实现
    (callComponent.react_stack_bottom_frame.bind(callComponent): any)
  : (null: any);
