/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot} from './ReactInternalTypes';
import type {TransitionTypes} from 'react/src/ReactTransitionType';

import {enableViewTransition} from 'shared/ReactFeatureFlags';
// import {includesTransitionLane} from './ReactFiberLane';

export function claimQueuedTransitionTypes(
  root: FiberRoot,
): null | TransitionTypes {
  const claimed = root.transitionTypes;
  root.transitionTypes = null;
  return claimed;
}
