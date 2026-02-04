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
import isTextInputElement from '../isTextInputElement';
// import {canUseDOM} from 'shared/ExecutionEnvironment';

// import getEventTarget from '../getEventTarget';
// import isEventSupported from '../isEventSupported';
import {getNodeFromInstance} from '../../client/ReactDOMComponentTree';
// import {updateValueIfChanged} from '../../client/inputValueTracking';
// import {setDefaultValue} from '../../client/ReactDOMInput';
// import {enqueueStateRestore} from '../ReactDOMControlledComponent';

import {disableInputAttributeSyncing} from 'shared/ReactFeatureFlags';
// import {batchedUpdates} from '../ReactDOMUpdateBatching';
// import {
//   processDispatchQueue,
//   accumulateTwoPhaseListeners,
// } from '../DOMPluginEventSystem';
import isCustomElement from '../../shared/isCustomElement';

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

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: null | EventTarget,
) {
  const targetNode = targetInst ? getNodeFromInstance(targetInst) : window;

  let getTargetInstFunc, handleEventFunc;
  if (shouldUseChangeEvent(targetNode)) {
    getTargetInstFunc = getTargetInstForChangeEvent;
  } else if (isTextInputElement(((targetNode: any): HTMLElement))) {
    // if (isInputEventSupported) {
    //   getTargetInstFunc = getTargetInstForInputOrChangeEvent;
    // } else {
    //   getTargetInstFunc = getTargetInstForInputEventPolyfill;
    //   handleEventFunc = handleEventsForInputEventPolyfill;
    // }
    throw new Error('Not implemented yet.');
  } else if (shouldUseClickEvent(targetNode)) {
    getTargetInstFunc = getTargetInstForClickEvent;
  } else if (
    targetInst &&
    isCustomElement(targetInst.elementType, targetInst.memoizedProps)
  ) {
    getTargetInstFunc = getTargetInstForChangeEvent;
  }
}

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem: Instance | TextInstance) {
  const nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName === 'select' ||
    (nodeName === 'input' && (elem: any).type === 'file')
  );
}

function getTargetInstForChangeEvent(
  domEventName: DOMEventName,
  targetInst: null | Fiber,
) {
  if (domEventName === 'change') {
    return targetInst;
  }
}

/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem: any) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  const nodeName = elem.nodeName;
  return (
    nodeName &&
    nodeName.toLowerCase() === 'input' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
}

function getTargetInstForClickEvent(
  domEventName: DOMEventName,
  targetInst: null | Fiber,
) {
  if (domEventName === 'click') {
    // return getInstIfValueChanged(targetInst);
    throw new Error('Not implemented yet.');
  }
}

export {registerEvents, extractEvents};
