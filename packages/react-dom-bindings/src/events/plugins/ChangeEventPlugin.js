/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TextInstance, Instance} from '../../client/ReactFiberConfigDOM';
import type {AnyNativeEvent} from '../PluginModuleType';
import type {DOMEventName} from '../DOMEventNames';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {ReactSyntheticEvent} from '../ReactSyntheticEventType';

import {registerTwoPhaseEvent} from '../EventRegistry';
// import {SyntheticEvent} from '../SyntheticEvent';
// import isTextInputElement from '../isTextInputElement';
// import {canUseDOM} from 'shared/ExecutionEnvironment';

// import getEventTarget from '../getEventTarget';
// import isEventSupported from '../isEventSupported';
// import {getNodeFromInstance} from '../../client/ReactDOMComponentTree';
// import {updateValueIfChanged} from '../../client/inputValueTracking';
// import {setDefaultValue} from '../../client/ReactDOMInput';
// import {enqueueStateRestore} from '../ReactDOMControlledComponent';

import {disableInputAttributeSyncing} from 'shared/ReactFeatureFlags';
// import {batchedUpdates} from '../ReactDOMUpdateBatching';
// import {
//   processDispatchQueue,
//   accumulateTwoPhaseListeners,
// } from '../DOMPluginEventSystem';
// import isCustomElement from '../../shared/isCustomElement';

function registerEvents() {
  registerTwoPhaseEvent('onChange', [
    'change',
    'click',
    'focusin',
    'focusout',
    'input',
    'keydown',
    'keyup',
    'selectionchange',
  ]);
}

export {registerEvents};
