/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { ReactComponentInfo, ReactAsyncInfo } from "shared/ReactTypes";
import type { LazyComponent } from "react/src/ReactLazy";

export type ComponentStackNode = {
  parent: null | ComponentStackNode,
  type:
    | symbol
    | string
    | Function
    | LazyComponent<any, any>
    | ReactComponentInfo
    | ReactAsyncInfo,
  owner?: null | ReactComponentInfo | ComponentStackNode, // DEV only
  stack?: null | string | Error, // DEV only
};
