/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  TransitionTracingCallbacks,
  Fiber,
  FiberRoot,
} from "./ReactInternalTypes";
import type { Transition } from "react/src/ReactStartTransition";
import type { OffscreenInstance } from "./ReactFiberOffscreenComponent";
import type { StackCursor } from "./ReactFiberStack";

export type SuspenseInfo = { name: string | null };

// TODO: Is there a way to not include the tag or name here?
export type TracingMarkerInstance = {
  tag?: TracingMarkerTag,
  transitions: Set<Transition> | null,
  pendingBoundaries: PendingBoundaries | null,
  aborts: Array<TransitionAbort> | null,
  name: string | null,
};

export type TransitionAbort = {
  reason: "error" | "unknown" | "marker" | "suspense",
  name?: string | null,
};

export const TransitionRoot = 0;
export const TransitionTracingMarker = 1;
export type TracingMarkerTag = 0 | 1;

export type PendingBoundaries = Map<OffscreenInstance, SuspenseInfo>;
