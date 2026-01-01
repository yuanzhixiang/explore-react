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

// In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
// 没有原生 AbortController 的环境里，使用一个简易的替代实现。
const AbortControllerLocal: typeof AbortController =
  typeof AbortController !== 'undefined'
    ? AbortController
    : // $FlowFixMe[incompatible-type]
      // $FlowFixMe[missing-this-annot]
      function AbortControllerShim() {
        const listeners = [];
        const signal = (this.signal = {
          aborted: false as boolean,
          addEventListener: (type, listener) => {
            listeners.push(listener);
          },
        });

        this.abort = () => {
          signal.aborted = true;
          listeners.forEach(listener => listener());
        };
      };

// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).
export function createCache(): Cache {
  return {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0,
  };
}

export function retainCache(cache: Cache) {
  if (__DEV__) {
    if (cache.controller.signal.aborted) {
      console.warn(
        'A cache instance was retained after it was already freed. ' +
          'This likely indicates a bug in React.',
      );
    }
  }
  cache.refCount++;
}
