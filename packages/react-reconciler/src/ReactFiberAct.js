/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import ReactSharedInternals from 'shared/ReactSharedInternals';

// import {warnsIfNotActing} from './ReactFiberConfig';

// act 是一个测试工具
export function isConcurrentActEnvironment(): void | boolean {
  if (__DEV__) {
    const isReactActEnvironmentGlobal =
      // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
      typeof IS_REACT_ACT_ENVIRONMENT !== 'undefined'
        ? // $FlowFixMe[cannot-resolve-name]
          IS_REACT_ACT_ENVIRONMENT
        : undefined;

    // 如果没有声明是 act 环境，但 actQueue 却不为空（说明可能在用 act）
    if (
      !isReactActEnvironmentGlobal &&
      ReactSharedInternals.actQueue !== null
    ) {
      // TODO: Include link to relevant documentation page.
      console.error(
        'The current testing environment is not configured to support ' +
          'act(...)',
      );
    }
    return isReactActEnvironmentGlobal;
  }
  return false;
}
