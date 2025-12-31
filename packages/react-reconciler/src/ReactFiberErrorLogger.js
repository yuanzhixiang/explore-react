/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Side-channel since I'm not sure we want to make this part of the public API
let componentName: null | string = null;
let errorBoundaryName: null | string = null;

export function defaultOnUncaughtError(
  error: mixed,
  errorInfo: {+componentStack?: ?string},
): void {
  throw new Error('Not implemented');
}

export function defaultOnCaughtError(
  error: mixed,
  errorInfo: {
    +componentStack?: ?string,
    +errorBoundary?: ?component(...props: any),
  },
): void {
  throw new Error('Not implemented');
}

export function defaultOnRecoverableError(
  error: mixed,
  errorInfo: {+componentStack?: ?string},
) {
  throw new Error('Not implemented');
}
