/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type FormStatusNotPending = {|
  pending: false,
  data: null,
  method: null,
  action: null,
|};

type FormStatusPending = {|
  pending: true,
  data: FormData,
  method: string,
  action: string | (FormData => void | Promise<void>) | null,
|};

export type FormStatus = FormStatusPending | FormStatusNotPending;

// Since the "not pending" value is always the same, we can reuse the
// same object across all transitions.
const sharedNotPendingObject: FormStatusNotPending = {
  pending: false,
  data: null,
  method: null,
  action: null,
};

export const NotPending: FormStatus = __DEV__
  ? Object.freeze(sharedNotPendingObject)
  : sharedNotPendingObject;
