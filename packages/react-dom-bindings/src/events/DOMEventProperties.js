/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from './DOMEventNames';

// import {registerTwoPhaseEvent} from './EventRegistry';
// import {
//   ANIMATION_END,
//   ANIMATION_ITERATION,
//   ANIMATION_START,
//   TRANSITION_RUN,
//   TRANSITION_START,
//   TRANSITION_CANCEL,
//   TRANSITION_END,
// } from './DOMEventNames';

import {
  enableCreateEventHandleAPI,
  enableScrollEndPolyfill,
} from 'shared/ReactFeatureFlags';

export const topLevelEventsToReactNames: Map<DOMEventName, string | null> =
  new Map();

// NOTE: Capitalization is important in this list!
//
// E.g. it needs "pointerDown", not "pointerdown".
// This is because we derive both React name ("onPointerDown")
// and DOM name ("pointerdown") from the same list.
//
// Exceptions that don't match this convention are listed separately.
//
// prettier-ignore
const simpleEventPluginEvents = [
  'abort',
  'auxClick',
  'beforeToggle',
  'cancel',
  'canPlay',
  'canPlayThrough',
  'click',
  'close',
  'contextMenu',
  'copy',
  'cut',
  'drag',
  'dragEnd',
  'dragEnter',
  'dragExit',
  'dragLeave',
  'dragOver',
  'dragStart',
  'drop',
  'durationChange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'gotPointerCapture',
  'input',
  'invalid',
  'keyDown',
  'keyPress',
  'keyUp',
  'load',
  'loadedData',
  'loadedMetadata',
  'loadStart',
  'lostPointerCapture',
  'mouseDown',
  'mouseMove',
  'mouseOut',
  'mouseOver',
  'mouseUp',
  'paste',
  'pause',
  'play',
  'playing',
  'pointerCancel',
  'pointerDown',
  'pointerMove',
  'pointerOut',
  'pointerOver',
  'pointerUp',
  'progress',
  'rateChange',
  'reset',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'submit',
  'suspend',
  'timeUpdate',
  'touchCancel',
  'touchEnd',
  'touchStart',
  'volumeChange',
  'scroll',
  'toggle',
  'touchMove',
  'waiting',
  'wheel',
];

if (!enableScrollEndPolyfill) {
  simpleEventPluginEvents.push('scrollEnd');
}

if (enableCreateEventHandleAPI) {
  // Special case: these two events don't have on* React handler
  // and are only accessible via the createEventHandle API.
  topLevelEventsToReactNames.set('beforeblur', null);
  topLevelEventsToReactNames.set('afterblur', null);
}

export function registerSimpleEvents() {
  throw new Error('Not implemented: registerSimpleEvents');
}
