/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AsyncDispatcher, Fiber} from './ReactInternalTypes';
import type {Cache} from './ReactFiberCacheComponent';

import {readContext} from './ReactFiberNewContext';
// import {CacheContext} from './ReactFiberCacheComponent';

import {current as currentOwner} from './ReactCurrentFiber';

function getCacheForType<T>(resourceType: () => T): T {
  throw new Error('Not implemented');
}

function cacheSignal(): null | AbortSignal {
  throw new Error('Not implemented');
}

export const DefaultAsyncDispatcher: AsyncDispatcher = ({
  getCacheForType,
  cacheSignal,
}: any);

if (__DEV__) {
  DefaultAsyncDispatcher.getOwner = (): null | Fiber => {
    return currentOwner;
  };
}
