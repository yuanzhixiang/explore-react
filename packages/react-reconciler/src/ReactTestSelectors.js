/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Fiber } from "react-reconciler/src/ReactInternalTypes";
import type { Instance } from "./ReactFiberConfig";

export type BoundingRect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export type IntersectionObserverOptions = Object;

export type ObserveVisibleRectsCallback = (
  intersections: Array<{ ratio: number, rect: BoundingRect }>
) => void;
