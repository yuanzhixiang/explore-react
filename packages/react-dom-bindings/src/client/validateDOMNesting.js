/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Fiber } from "react-reconciler/src/ReactInternalTypes";

type Info = { tag: string };
export type AncestorInfoDev = {
  current: ?Info,

  formTag: ?Info,
  aTagInScope: ?Info,
  buttonTagInScope: ?Info,
  nobrTagInScope: ?Info,
  pTagInButtonScope: ?Info,

  listItemTagAutoclosing: ?Info,
  dlItemTagAutoclosing: ?Info,

  // <head> or <body>
  containerTagInScope: ?Info,
  implicitRootScope: boolean,
};
