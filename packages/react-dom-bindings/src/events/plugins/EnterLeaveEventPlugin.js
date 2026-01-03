/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from '../PluginModuleType';
import type {DOMEventName} from '../DOMEventNames';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {KnownReactSyntheticEvent} from '../ReactSyntheticEventType';

import {registerDirectEvent} from '../EventRegistry';
// import {isReplayingEvent} from '../CurrentReplayingEvent';
// import {SyntheticMouseEvent, SyntheticPointerEvent} from '../SyntheticEvent';
// import {
//   getClosestInstanceFromNode,
//   getNodeFromInstance,
//   isContainerMarkedAsRoot,
// } from '../../client/ReactDOMComponentTree';
// import {accumulateEnterLeaveTwoPhaseListeners} from '../DOMPluginEventSystem';

import {
  HostComponent,
  HostSingleton,
  HostText,
} from 'react-reconciler/src/ReactWorkTags';
// import {getNearestMountedFiber} from 'react-reconciler/src/ReactFiberTreeReflection';

function registerEvents() {
  registerDirectEvent('onMouseEnter', ['mouseout', 'mouseover']);
  registerDirectEvent('onMouseLeave', ['mouseout', 'mouseover']);
  registerDirectEvent('onPointerEnter', ['pointerout', 'pointerover']);
  registerDirectEvent('onPointerLeave', ['pointerout', 'pointerover']);
}

export {registerEvents};
