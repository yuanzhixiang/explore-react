/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import ReactSharedInternals from 'shared/ReactSharedInternals';
// import {getOwnerStackByFiberInDev} from './ReactFiberComponentStack';
// import {getComponentNameFromOwner} from 'react-reconciler/src/getComponentNameFromFiber';

export let current: Fiber | null = null;
export let isRendering: boolean = false;

export function runWithFiberInDEV<A0, A1, A2, A3, A4, T>(
  fiber: null | Fiber,
  callback: (A0, A1, A2, A3, A4) => T,
  arg0: A0,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
): T {
  throw new Error('Not implemented');
}
