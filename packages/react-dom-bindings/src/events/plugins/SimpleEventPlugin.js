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

// import {
//   SyntheticEvent,
//   SyntheticKeyboardEvent,
//   SyntheticFocusEvent,
//   SyntheticMouseEvent,
//   SyntheticDragEvent,
//   SyntheticTouchEvent,
//   SyntheticAnimationEvent,
//   SyntheticTransitionEvent,
//   SyntheticUIEvent,
//   SyntheticWheelEvent,
//   SyntheticClipboardEvent,
//   SyntheticPointerEvent,
//   SyntheticToggleEvent,
// } from '../../events/SyntheticEvent';

// import {
//   ANIMATION_END,
//   ANIMATION_ITERATION,
//   ANIMATION_START,
//   TRANSITION_END,
// } from '../DOMEventNames';
import {
  topLevelEventsToReactNames,
  registerSimpleEvents,
} from '../DOMEventProperties';
// import {
//   accumulateSinglePhaseListeners,
//   accumulateEventHandleNonManagedNodeListeners,
// } from '../DOMPluginEventSystem';
// import {
//   IS_EVENT_HANDLE_NON_MANAGED_NODE,
//   IS_CAPTURE_PHASE,
// } from '../EventSystemFlags';

// import getEventCharCode from '../getEventCharCode';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  throw new Error('Not implemented: SimpleEventPlugin.extractEvents');
}

export {registerSimpleEvents as registerEvents, extractEvents};
