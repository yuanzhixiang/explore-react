/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {Instance} from './ReactFiberConfig';

import {
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
} from 'react-reconciler/src/ReactWorkTags';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import {
  // findFiberRoot,
  // getBoundingRect,
  // getInstanceFromNode,
  // getTextContent,
  // isHiddenSubtree,
  // matchAccessibilityRole,
  // setFocusIfFocusable,
  // setupIntersectionObserver,
  supportsTestSelectors,
} from './ReactFiberConfig';

let COMPONENT_TYPE: symbol | number = 0b000;
let HAS_PSEUDO_CLASS_TYPE: symbol | number = 0b001;
let ROLE_TYPE: symbol | number = 0b010;
let TEST_NAME_TYPE: symbol | number = 0b011;
let TEXT_TYPE: symbol | number = 0b100;

export type BoundingRect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export type IntersectionObserverOptions = Object;

export type ObserveVisibleRectsCallback = (
  intersections: Array<{ratio: number, rect: BoundingRect}>,
) => void;

const commitHooks: Array<Function> = [];

export function onCommitRoot(): void {
  if (supportsTestSelectors) {
    commitHooks.forEach(commitHook => commitHook());
  }
}
