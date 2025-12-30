/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import type {
  UpdateQueue as HookQueue,
  Update as HookUpdate,
} from "./ReactFiberHooks";
import type {
  SharedQueue as ClassQueue,
  Update as ClassUpdate,
} from "./ReactFiberClassUpdateQueue";
import type { Lane, Lanes } from "./ReactFiberLane";
import type { OffscreenInstance } from "./ReactFiberOffscreenComponent";

export type ConcurrentUpdate = {
  next: ConcurrentUpdate,
  lane: Lane,
};

type ConcurrentQueue = {
  pending: ConcurrentUpdate | null,
};
