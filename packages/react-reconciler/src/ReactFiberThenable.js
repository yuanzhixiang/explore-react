/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
  ReactIOInfo,
} from "shared/ReactTypes";

opaque type ThenableStateDev = {
  didWarnAboutUncachedPromise: boolean,
  thenables: Array<Thenable<any>>,
};

opaque type ThenableStateProd = Array<Thenable<any>>;

export opaque type ThenableState = ThenableStateDev | ThenableStateProd;
