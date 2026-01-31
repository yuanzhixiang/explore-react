/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from '../events/PluginModuleType';
import type {
  Container,
  ActivityInstance,
  SuspenseInstance,
} from '../client/ReactFiberConfigDOM';
import type {DOMEventName} from '../events/DOMEventNames';
import type {EventSystemFlags} from './EventSystemFlags';
import type {FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';

import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority,
} from 'scheduler';
// import {
//   getNearestMountedFiber,
//   getContainerFromFiber,
//   getActivityInstanceFromFiber,
//   getSuspenseInstanceFromFiber,
// } from 'react-reconciler/src/ReactFiberTreeReflection';
// import {
//   findInstanceBlockingEvent,
//   findInstanceBlockingTarget,
// } from './ReactDOMEventListener';
// import {setReplayingEvent, resetReplayingEvent} from './CurrentReplayingEvent';
// import {
//   getInstanceFromNode,
//   getClosestInstanceFromNode,
//   getFiberCurrentPropsFromNode,
// } from '../client/ReactDOMComponentTree';
import {
  HostRoot,
  ActivityComponent,
  SuspenseComponent,
} from 'react-reconciler/src/ReactWorkTags';
import {isHigherEventPriority} from 'react-reconciler/src/ReactEventPriorities';
// import {isRootDehydrated} from 'react-reconciler/src/ReactFiberShellHydration';
// import {dispatchReplayedFormAction} from './plugins/FormActionEventPlugin';
import {
  resolveUpdatePriority,
  // runWithPriority as attemptHydrationAtPriority,
} from '../client/ReactDOMUpdatePriority';

// import {
//   attemptContinuousHydration,
//   attemptHydrationAtCurrentPriority,
// } from 'react-reconciler/src/ReactFiberReconciler';

import {enableHydrationChangeEvent} from 'shared/ReactFeatureFlags';

// TODO: Upgrade this definition once we're on a newer version of Flow that
// has this definition built-in.
type PointerEventType = Event & {
  pointerId: number,
  relatedTarget: EventTarget | null,
  ...
};

type QueuedReplayableEvent = {
  blockedOn: null | Container | ActivityInstance | SuspenseInstance,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetContainers: Array<EventTarget>,
};

let hasScheduledReplayAttempt = false;

// The last of each continuous event type. We only need to replay the last one
// if the last target was dehydrated.
let queuedFocus: null | QueuedReplayableEvent = null;
let queuedDrag: null | QueuedReplayableEvent = null;
let queuedMouse: null | QueuedReplayableEvent = null;
// For pointer events there can be one latest event per pointerId.
const queuedPointers: Map<number, QueuedReplayableEvent> = new Map();
const queuedPointerCaptures: Map<number, QueuedReplayableEvent> = new Map();
// We could consider replaying selectionchange and touchmoves too.

const queuedChangeEventTargets: Array<EventTarget> = [];

type QueuedHydrationTarget = {
  blockedOn: null | Container | ActivityInstance | SuspenseInstance,
  target: Node,
  priority: EventPriority,
};
const queuedExplicitHydrationTargets: Array<QueuedHydrationTarget> = [];

const discreteReplayableEvents: Array<DOMEventName> = [
  'mousedown',
  'mouseup',
  'touchcancel',
  'touchend',
  'touchstart',
  'auxclick',
  'dblclick',
  'pointercancel',
  'pointerdown',
  'pointerup',
  'dragend',
  'dragstart',
  'drop',
  'compositionend',
  'compositionstart',
  'keydown',
  'keypress',
  'keyup',
  'input',
  'textInput', // Intentionally camelCase
  'copy',
  'cut',
  'paste',
  'click',
  'change',
  'contextmenu',
  'reset',
  // 'submit', // stopPropagation blocks the replay mechanism
];

export function flushEventReplaying(): void {
  // Synchronously flush any event replaying so that it gets observed before
  // any new updates are applied.
  if (hasScheduledReplayAttempt) {
    replayUnblockedEvents();
  }
}

function replayUnblockedEvents() {
  hasScheduledReplayAttempt = false;
  throw new Error('Not implemented yet.');
}

// Resets the replaying for this type of continuous event to no event.
export function clearIfContinuousEvent(
  domEventName: DOMEventName,
  nativeEvent: AnyNativeEvent,
): void {
  switch (domEventName) {
    case 'focusin':
    case 'focusout':
      queuedFocus = null;
      break;
    case 'dragenter':
    case 'dragleave':
      queuedDrag = null;
      break;
    case 'mouseover':
    case 'mouseout':
      queuedMouse = null;
      break;
    case 'pointerover':
    case 'pointerout': {
      const pointerId = ((nativeEvent: any): PointerEventType).pointerId;
      queuedPointers.delete(pointerId);
      break;
    }
    case 'gotpointercapture':
    case 'lostpointercapture': {
      const pointerId = ((nativeEvent: any): PointerEventType).pointerId;
      queuedPointerCaptures.delete(pointerId);
      break;
    }
  }
}
