/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import {runWithFiberInDEV} from './ReactCurrentFiber';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import {StrictLegacyMode} from './ReactTypeOfMode';

type FiberArray = Array<Fiber>;
type FiberToFiberComponentsMap = Map<Fiber, FiberArray>;

const ReactStrictModeWarnings = {
  recordUnsafeLifecycleWarnings: (fiber: Fiber, instance: any): void => {},
  flushPendingUnsafeLifecycleWarnings: (): void => {},
  recordLegacyContextWarning: (fiber: Fiber, instance: any): void => {},
  flushLegacyContextWarning: (): void => {},
  discardPendingWarnings: (): void => {},
};

if (__DEV__) {
  let pendingComponentWillMountWarnings: Array<Fiber> = [];
  let pendingUNSAFE_ComponentWillMountWarnings: Array<Fiber> = [];
  let pendingComponentWillReceivePropsWarnings: Array<Fiber> = [];
  let pendingUNSAFE_ComponentWillReceivePropsWarnings: Array<Fiber> = [];
  let pendingComponentWillUpdateWarnings: Array<Fiber> = [];
  let pendingUNSAFE_ComponentWillUpdateWarnings: Array<Fiber> = [];

  let pendingLegacyContextWarning: FiberToFiberComponentsMap = new Map();

  ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = (
    fiber: Fiber,
    instance: any,
  ) => {
    throw new Error('Not implemented yet.');
  };

  ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = () => {
    throw new Error('Not implemented yet.');
  };

  ReactStrictModeWarnings.recordLegacyContextWarning = (
    fiber: Fiber,
    instance: any,
  ) => {
    throw new Error('Not implemented yet.');
  };

  ReactStrictModeWarnings.flushLegacyContextWarning = () => {
    throw new Error('Not implemented yet.');
  };

  ReactStrictModeWarnings.discardPendingWarnings = () => {
    pendingComponentWillMountWarnings = [];
    pendingUNSAFE_ComponentWillMountWarnings = [];
    pendingComponentWillReceivePropsWarnings = [];
    pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
    pendingComponentWillUpdateWarnings = [];
    pendingUNSAFE_ComponentWillUpdateWarnings = [];
    pendingLegacyContextWarning = new Map();
  };
}

export default ReactStrictModeWarnings;
