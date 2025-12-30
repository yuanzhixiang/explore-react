/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Cache = {
  controller: AbortController,
  data: Map<() => mixed, mixed>,
  refCount: number,
};

export type CacheComponentState = {
  +parent: Cache,
  +cache: Cache,
};

export type SpawnedCachePool = {
  +parent: Cache,
  +pool: Cache,
};
