/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ViewTransitionClass, ViewTransitionProps} from 'shared/ReactTypes';
import type {FiberRoot} from './ReactInternalTypes';
import type {ViewTransitionInstance, Instance} from './ReactFiberConfig';

import {
  getCommittingRoot,
  getPendingTransitionTypes,
} from './ReactFiberWorkLoop';

export type ViewTransitionState = {
  autoName: null | string, // the view-transition-name to use when an explicit one is not specified
  paired: null | ViewTransitionState, // a temporary state during the commit phase if we have paired this with another instance
  clones: null | Array<Instance>, // a temporary state during the apply gesture phase if we cloned this boundary
  ref: null | ViewTransitionInstance, // the current ref instance. This can change through the lifetime of the instance.
};

let globalClientIdCounter: number = 0;
