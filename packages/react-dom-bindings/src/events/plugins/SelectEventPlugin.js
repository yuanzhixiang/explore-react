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

import {canUseDOM} from 'shared/ExecutionEnvironment';
// import {SyntheticEvent} from '../../events/SyntheticEvent';
// import isTextInputElement from '../isTextInputElement';
// import shallowEqual from 'shared/shallowEqual';

import {registerTwoPhaseEvent} from '../EventRegistry';
// import getActiveElement from '../../client/getActiveElement';
import {getNodeFromInstance} from '../../client/ReactDOMComponentTree';
// import {hasSelectionCapabilities} from '../../client/ReactInputSelection';
// import {DOCUMENT_NODE} from '../../client/HTMLNodeType';
// import {accumulateTwoPhaseListeners} from '../DOMPluginEventSystem';

const skipSelectionChangeEvent =
  canUseDOM && 'documentMode' in document && document.documentMode <= 11;

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

let activeElement = null;
let activeElementInst = null;
let lastSelection = null;
let mouseDown = false;

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
) {
  const targetNode = targetInst ? getNodeFromInstance(targetInst) : window;

  switch (domEventName) {
    // Track the input node that has focus.
    case 'focusin':
      // if (
      //   isTextInputElement((targetNode: any)) ||
      //   targetNode.contentEditable === 'true'
      // ) {
      //   activeElement = targetNode;
      //   activeElementInst = targetInst;
      //   lastSelection = null;
      // }
      // break;
      throw new Error('Not implemented yet.');
    case 'focusout':
      // activeElement = null;
      // activeElementInst = null;
      // lastSelection = null;
      // break;
      throw new Error('Not implemented yet.');
    // Don't fire the event while the user is dragging. This matches the
    // semantics of the native select event.
    case 'mousedown':
      mouseDown = true;
      break;
    case 'contextmenu':
    case 'mouseup':
    case 'dragend':
      // mouseDown = false;
      // constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
      // break;
      throw new Error('Not implemented yet.');
    // Chrome and IE fire non-standard event when selection is changed (and
    // sometimes when it hasn't). IE's event fires out of order with respect
    // to key and input events on deletion, so we discard it.
    //
    // Firefox doesn't support selectionchange, so check selection status
    // after each key entry. The selection changes after keydown and before
    // keyup, but we check on keydown as well in the case of holding down a
    // key, when multiple keydown events are fired but only one keyup is.
    // This is also our approach for IE handling, for the reason above.
    case 'selectionchange':
      if (skipSelectionChangeEvent) {
        break;
      }
    // falls through
    case 'keydown':
    case 'keyup':
      // constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
      throw new Error('Not implemented yet.');
  }
}

export {registerEvents, extractEvents};
