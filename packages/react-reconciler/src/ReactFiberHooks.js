/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {
  ReactContext,
  StartTransitionOptions,
  Usable,
  Thenable,
  RejectedThenable,
  Awaited,
} from "shared/ReactTypes";
import type {
  Fiber,
  FiberRoot,
  Dispatcher,
  HookType,
  MemoCache,
} from "./ReactInternalTypes";
import type { Lanes, Lane } from "./ReactFiberLane";
import type { HookFlags } from "./ReactHookEffectTags";
import type { Flags } from "./ReactFiberFlags";
import type { TransitionStatus } from "./ReactFiberConfig";
import type { ScheduledGesture } from "./ReactFiberGestureScheduler";

export type Update<S, A> = {
  lane: Lane,
  revertLane: Lane,
  action: A,
  hasEagerState: boolean,
  eagerState: S | null,
  next: Update<S, A>,
  gesture: null | ScheduledGesture, // enableGestureTransition
};

export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null,
  lanes: Lanes,
  dispatch: ((A) => mixed) | null,
  lastRenderedReducer: ((S, A) => S) | null,
  lastRenderedState: S | null,
};
