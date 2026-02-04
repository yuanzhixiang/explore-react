/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from '../../events/DOMEventNames';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {AnyNativeEvent} from '../../events/PluginModuleType';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';
import type {ReactSyntheticEvent} from '../ReactSyntheticEventType';

import {canUseDOM} from 'shared/ExecutionEnvironment';

import {registerTwoPhaseEvent} from '../EventRegistry';
// import {
//   getData as FallbackCompositionStateGetData,
//   initialize as FallbackCompositionStateInitialize,
//   reset as FallbackCompositionStateReset,
// } from '../FallbackCompositionState';
// import {
//   SyntheticCompositionEvent,
//   SyntheticInputEvent,
// } from '../SyntheticEvent';
// import {accumulateTwoPhaseListeners} from '../DOMPluginEventSystem';

const END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
const START_KEYCODE = 229;

const canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;

let documentMode = null;
if (canUseDOM && 'documentMode' in document) {
  documentMode = document.documentMode;
}

// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
const canUseTextInputEvent =
  canUseDOM && 'TextEvent' in window && !documentMode;

// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
const useFallbackCompositionData =
  canUseDOM &&
  (!canUseCompositionEvent ||
    (documentMode && documentMode > 8 && documentMode <= 11));

const SPACEBAR_CODE = 32;
const SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);

function registerEvents() {
  registerTwoPhaseEvent('onBeforeInput', [
    'compositionend',
    'keypress',
    'textInput',
    'paste',
  ]);
  registerTwoPhaseEvent('onCompositionEnd', [
    'compositionend',
    'focusout',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
  ]);
  registerTwoPhaseEvent('onCompositionStart', [
    'compositionstart',
    'focusout',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
  ]);
  registerTwoPhaseEvent('onCompositionUpdate', [
    'compositionupdate',
    'focusout',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
  ]);
}

// Track whether we've ever handled a keypress on the space key.
let hasSpaceKeypress = false;

/**
 * Create an `onBeforeInput` event to match
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * This event plugin is based on the native `textInput` event
 * available in Chrome, Safari, Opera, and IE. This event fires after
 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
 *
 * `beforeInput` is spec'd but not implemented in any browsers, and
 * the `input` event does not provide any useful information about what has
 * actually been added, contrary to the spec. Thus, `textInput` is the best
 * available event to identify the characters that have actually been inserted
 * into the target node.
 *
 * This plugin is also responsible for emitting `composition` events, thus
 * allowing us to share composition fallback code for both `beforeInput` and
 * `composition` event types.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  extractCompositionEvent(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  );
  extractBeforeInputEvent(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  );
}

/**
 * Check if a composition event was triggered by Korean IME.
 * Our fallback mode does not work well with IE's Korean IME,
 * so just use native composition events when Korean IME is used.
 * Although CompositionEvent.locale property is deprecated,
 * it is available in IE, where our fallback mode is enabled.
 *
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isUsingKoreanIME(nativeEvent: any) {
  return nativeEvent.locale === 'ko';
}

// Track the current IME composition status, if any.
let isComposing = false;

/**
 * @return {?object} A SyntheticCompositionEvent.
 */
function extractCompositionEvent(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
) {
  let eventType;
  let fallbackData;

  if (canUseCompositionEvent) {
    eventType = getCompositionEventType(domEventName);
  } else if (!isComposing) {
    if (isFallbackCompositionStart(domEventName, nativeEvent)) {
      eventType = 'onCompositionStart';
    }
  } else if (isFallbackCompositionEnd(domEventName, nativeEvent)) {
    eventType = 'onCompositionEnd';
  }

  if (!eventType) {
    return null;
  }

  throw new Error('Not implemented yet.');
}

/**
 * Translate native top level events into event types.
 */
function getCompositionEventType(domEventName: DOMEventName) {
  switch (domEventName) {
    case 'compositionstart':
      return 'onCompositionStart';
    case 'compositionend':
      return 'onCompositionEnd';
    case 'compositionupdate':
      return 'onCompositionUpdate';
  }
}

/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 */
function isFallbackCompositionStart(
  domEventName: DOMEventName,
  nativeEvent: any,
): boolean {
  return domEventName === 'keydown' && nativeEvent.keyCode === START_KEYCODE;
}

/**
 * Does our fallback mode think that this event is the end of composition?
 */
function isFallbackCompositionEnd(
  domEventName: DOMEventName,
  nativeEvent: any,
): boolean {
  switch (domEventName) {
    case 'keyup':
      // Command keys insert or clear IME input.
      return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
    case 'keydown':
      // Expect IME keyCode on each keydown. If we get any other
      // code we must have exited earlier.
      return nativeEvent.keyCode !== START_KEYCODE;
    case 'keypress':
    case 'mousedown':
    case 'focusout':
      // Events are not possible without cancelling IME.
      return true;
    default:
      return false;
  }
}

/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 *
 * @return {?object} A SyntheticInputEvent.
 */
function extractBeforeInputEvent(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
) {
  let chars;

  if (canUseTextInputEvent) {
    chars = getNativeBeforeInputChars(domEventName, nativeEvent);
  } else {
    // chars = getFallbackBeforeInputChars(domEventName, nativeEvent);
    throw new Error('Not implemented yet.');
  }

  // If no characters are being inserted, no BeforeInput event should
  // be fired.
  if (!chars) {
    return null;
  }

  throw new Error('Not implemented yet.');
}

function getNativeBeforeInputChars(
  domEventName: DOMEventName,
  nativeEvent: any,
): ?string {
  switch (domEventName) {
    case 'compositionend':
      // return getDataFromCustomEvent(nativeEvent);
      throw new Error('Not implemented yet.');
    case 'keypress':
      /**
       * If native `textInput` events are available, our goal is to make
       * use of them. However, there is a special case: the spacebar key.
       * In Webkit, preventing default on a spacebar `textInput` event
       * cancels character insertion, but it *also* causes the browser
       * to fall back to its default spacebar behavior of scrolling the
       * page.
       *
       * Tracking at:
       * https://code.google.com/p/chromium/issues/detail?id=355103
       *
       * To avoid this issue, use the keypress event as if no `textInput`
       * event is available.
       */
      const which = nativeEvent.which;
      if (which !== SPACEBAR_CODE) {
        return null;
      }

      hasSpaceKeypress = true;
      return SPACEBAR_CHAR;

    case 'textInput':
      // Record the characters to be added to the DOM.
      const chars = nativeEvent.data;

      // If it's a spacebar character, assume that we have already handled
      // it at the keypress level and bail immediately. Android Chrome
      // doesn't give us keycodes, so we need to ignore it.
      if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
        return null;
      }

      return chars;

    default:
      // For other native event types, do nothing.
      return null;
  }
}

export {registerEvents, extractEvents};
