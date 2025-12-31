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
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';
import type {Lane} from './ReactFiberLane';
import type {Transition} from 'react/src/ReactStartTransition';

export function registerDefaultIndicator(
  onDefaultTransitionIndicator: () => void | (() => void),
): void {
  throw new Error('Not implemented');
}
