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
import type {ReactSyntheticEvent} from '../ReactSyntheticEventType';

import {registerTwoPhaseEvent} from '../EventRegistry';
// import {SyntheticUIEvent} from '../SyntheticEvent';

import {canUseDOM} from 'shared/ExecutionEnvironment';
// import isEventSupported from '../isEventSupported';

import {IS_CAPTURE_PHASE} from '../EventSystemFlags';

// import {batchedUpdates} from '../ReactDOMUpdateBatching';
// import {
//   processDispatchQueue,
//   accumulateSinglePhaseListeners,
//   accumulateTwoPhaseListeners,
// } from '../DOMPluginEventSystem';

// import {
//   getScrollEndTimer,
//   setScrollEndTimer,
//   clearScrollEndTimer,
// } from '../../client/ReactDOMComponentTree';

import {enableScrollEndPolyfill} from 'shared/ReactFeatureFlags';

// const isScrollEndEventSupported =
//   enableScrollEndPolyfill && canUseDOM && isEventSupported('scrollend');

let isTouchStarted = false;
let isMouseDown = false;

function registerEvents() {
  registerTwoPhaseEvent('onScrollEnd', [
    'scroll',
    'scrollend',
    'touchstart',
    'touchcancel',
    'touchend',
    'mousedown',
    'mouseup',
  ]);
}

export {registerEvents};
