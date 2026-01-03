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

// import {canUseDOM} from 'shared/ExecutionEnvironment';
// import {SyntheticEvent} from '../../events/SyntheticEvent';
// import isTextInputElement from '../isTextInputElement';
// import shallowEqual from 'shared/shallowEqual';

import {registerTwoPhaseEvent} from '../EventRegistry';
// import getActiveElement from '../../client/getActiveElement';
// import {getNodeFromInstance} from '../../client/ReactDOMComponentTree';
// import {hasSelectionCapabilities} from '../../client/ReactInputSelection';
// import {DOCUMENT_NODE} from '../../client/HTMLNodeType';
// import {accumulateTwoPhaseListeners} from '../DOMPluginEventSystem';

// const skipSelectionChangeEvent =
//   canUseDOM && 'documentMode' in document && document.documentMode <= 11;

function registerEvents() {
  registerTwoPhaseEvent('onSelect', [
    'focusout',
    'contextmenu',
    'dragend',
    'focusin',
    'keydown',
    'keyup',
    'mousedown',
    'mouseup',
    'selectionchange',
  ]);
}

export {registerEvents};
