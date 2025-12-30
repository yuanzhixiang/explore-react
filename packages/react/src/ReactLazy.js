/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Wakeable,
  Thenable,
  FulfilledThenable,
  RejectedThenable,
  ReactDebugInfo,
  ReactIOInfo,
} from "shared/ReactTypes";

import { enableAsyncDebugInfo } from "shared/ReactFeatureFlags";

import { REACT_LAZY_TYPE } from "shared/ReactSymbols";

import noop from "shared/noop";

const Uninitialized = -1;
const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type UninitializedPayload<T> = {
  _status: -1,
  _result: () => Thenable<{ default: T, ... }>,
  _ioInfo?: ReactIOInfo, // DEV-only
};

type PendingPayload = {
  _status: 0,
  _result: Wakeable,
  _ioInfo?: ReactIOInfo, // DEV-only
};

type ResolvedPayload<T> = {
  _status: 1,
  _result: { default: T, ... },
  _ioInfo?: ReactIOInfo, // DEV-only
};

type RejectedPayload = {
  _status: 2,
  _result: mixed,
  _ioInfo?: ReactIOInfo, // DEV-only
};

type Payload<T> =
  | UninitializedPayload<T>
  | PendingPayload
  | ResolvedPayload<T>
  | RejectedPayload;

export type LazyComponent<T, P> = {
  $$typeof: symbol | number,
  _payload: P,
  _init: (payload: P) => T,

  // __DEV__
  _debugInfo?: null | ReactDebugInfo,
  _store?: { validated: 0 | 1 | 2, ... }, // 0: not validated, 1: validated, 2: force fail
};
