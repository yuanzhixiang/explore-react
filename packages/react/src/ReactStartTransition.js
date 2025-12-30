/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Fiber } from "react-reconciler/src/ReactInternalTypes";
import type {
  StartTransitionOptions,
  GestureProvider,
  GestureOptions,
} from "shared/ReactTypes";
import type { TransitionTypes } from "./ReactTransitionType";

export type Transition = {
  types: null | TransitionTypes, // enableViewTransition
  gesture: null | GestureProvider, // enableGestureTransition
  name: null | string, // enableTransitionTracing only
  startTime: number, // enableTransitionTracing only
  _updatedFibers: Set<Fiber>, // DEV-only
  ...
};
