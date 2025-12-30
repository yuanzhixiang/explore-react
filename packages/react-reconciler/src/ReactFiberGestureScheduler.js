/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { FiberRoot } from "./ReactInternalTypes";
import type { GestureOptions } from "shared/ReactTypes";
import type {
  GestureTimeline,
  RunningViewTransition,
} from "./ReactFiberConfig";
import type { TransitionTypes } from "react/src/ReactTransitionType";

// This type keeps track of any scheduled or active gestures.
export type ScheduledGesture = {
  provider: GestureTimeline,
  count: number, // The number of times this same provider has been started.
  rangeStart: number, // The percentage along the timeline where the "current" state starts.
  rangeEnd: number, // The percentage along the timeline where the "destination" state is reached.
  types: null | TransitionTypes, // Any addTransitionType call made during startGestureTransition.
  running: null | RunningViewTransition, // Used to cancel the running transition after we're done.
  prev: null | ScheduledGesture, // The previous scheduled gesture in the queue for this root.
  next: null | ScheduledGesture, // The next scheduled gesture in the queue for this root.
};
