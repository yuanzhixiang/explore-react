/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint valid-typeof: 0 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import assign from 'shared/assign';
// import getEventCharCode from './getEventCharCode';

type EventInterfaceType = {
  [propName: string]: 0 | ((event: {[propName: string]: mixed, ...}) => mixed),
};

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}

// This is intentionally a factory so that we have different returned constructors.
// If we had a single constructor, it would be megamorphic and engines would deopt.
function createSyntheticEvent(Interface: EventInterfaceType) {
  /**
   * Synthetic events are dispatched by event plugins, typically in response to a
   * top-level event delegation handler.
   *
   * These systems should generally use pooling to reduce the frequency of garbage
   * collection. The system should check `isPersistent` to determine whether the
   * event should be released into the pool after being dispatched. Users that
   * need a persisted event should invoke `persist`.
   *
   * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
   * normalizing browser quirks. Subclasses do not necessarily have to implement a
   * DOM interface; custom application-specific events can also subclass this.
   */
  // $FlowFixMe[missing-this-annot]
  function SyntheticBaseEvent(
    reactName: string | null,
    reactEventType: string,
    targetInst: Fiber | null,
    nativeEvent: {[propName: string]: mixed, ...},
    nativeEventTarget: null | EventTarget,
  ) {
    throw new Error('Not implemented yet.');
  }

  // $FlowFixMe[prop-missing] found when upgrading Flow
  assign(SyntheticBaseEvent.prototype, {
    // $FlowFixMe[missing-this-annot]
    preventDefault: function () {
      throw new Error('Not implemented yet.');
    },
    // $FlowFixMe[missing-this-annot]
    stopPropagation: function () {
      throw new Error('Not implemented yet.');
    },
    /**
     * We release all dispatched `SyntheticEvent`s after each event loop, adding
     * them back into the pool. This allows a way to hold onto a reference that
     * won't be added back into the pool.
     */
    persist: function () {
      // Modern event system doesn't use pooling.
    },

    /**
     * Checks if this event should be released back into the pool.
     *
     * @return {boolean} True if this should not be released, false otherwise.
     */
    isPersistent: functionThatReturnsTrue,
  });
  return SyntheticBaseEvent;
}

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
const EventInterface: EventInterfaceType = {
  eventPhase: 0,
  bubbles: 0,
  cancelable: 0,
  timeStamp: function (event: {[propName: string]: mixed}) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: 0,
  isTrusted: 0,
};
export const SyntheticEvent: $FlowFixMe = createSyntheticEvent(EventInterface);

const UIEventInterface: EventInterfaceType = {
  ...EventInterface,
  view: 0,
  detail: 0,
};

function getEventModifierState(nativeEvent: {[propName: string]: mixed}) {
  // return modifierStateGetter;
  throw new Error('Not implemented yet.');
}

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
const MouseEventInterface: EventInterfaceType = {
  ...UIEventInterface,
  screenX: 0,
  screenY: 0,
  clientX: 0,
  clientY: 0,
  pageX: 0,
  pageY: 0,
  ctrlKey: 0,
  shiftKey: 0,
  altKey: 0,
  metaKey: 0,
  getModifierState: getEventModifierState,
  button: 0,
  buttons: 0,
  relatedTarget: function (event) {
    if (event.relatedTarget === undefined)
      return event.fromElement === event.srcElement
        ? event.toElement
        : event.fromElement;

    return event.relatedTarget;
  },
  movementX: function (event) {
    // if ('movementX' in event) {
    //   return event.movementX;
    // }
    // updateMouseMovementPolyfillState(event);
    // return lastMovementX;
    throw new Error('Not implemented yet.');
  },
  movementY: function (event) {
    // if ('movementY' in event) {
    //   return event.movementY;
    // }
    // // Don't need to call updateMouseMovementPolyfillState() here
    // // because it's guaranteed to have already run when movementX
    // // was copied.
    // return lastMovementY;
    throw new Error('Not implemented yet.');
  },
};

/**
 * @interface PointerEvent
 * @see http://www.w3.org/TR/pointerevents/
 */
const PointerEventInterface: EventInterfaceType = {
  ...MouseEventInterface,
  pointerId: 0,
  width: 0,
  height: 0,
  pressure: 0,
  tangentialPressure: 0,
  tiltX: 0,
  tiltY: 0,
  twist: 0,
  pointerType: 0,
  isPrimary: 0,
};
export const SyntheticPointerEvent: $FlowFixMe = createSyntheticEvent(
  PointerEventInterface,
);
