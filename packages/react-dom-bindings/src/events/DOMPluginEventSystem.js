/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from './DOMEventNames';
// import type {EventSystemFlags} from './EventSystemFlags';
// import type {AnyNativeEvent} from './PluginModuleType';
import type {
  KnownReactSyntheticEvent,
  ReactSyntheticEvent,
} from './ReactSyntheticEventType';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import {allNativeEvents} from './EventRegistry';
// import {
//   SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE,
//   IS_LEGACY_FB_SUPPORT_MODE,
//   SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS,
//   IS_CAPTURE_PHASE,
//   IS_EVENT_HANDLE_NON_MANAGED_NODE,
//   IS_NON_DELEGATED,
// } from './EventSystemFlags';
// import {isReplayingEvent} from './CurrentReplayingEvent';

import {
  HostRoot,
  HostPortal,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  ScopeComponent,
} from 'react-reconciler/src/ReactWorkTags';
// import {getLowestCommonAncestor} from 'react-reconciler/src/ReactFiberTreeReflection';

// import getEventTarget from './getEventTarget';
// import {
//   getClosestInstanceFromNode,
//   getEventListenerSet,
//   getEventHandlerListeners,
// } from '../client/ReactDOMComponentTree';
import {COMMENT_NODE, DOCUMENT_NODE} from '../client/HTMLNodeType';
// import {batchedUpdates} from './ReactDOMUpdateBatching';
// import getListener from './getListener';
// import {passiveBrowserEventsSupported} from './checkPassiveEvents';

import {
  enableLegacyFBSupport,
  enableCreateEventHandleAPI,
  enableScopeAPI,
  disableCommentsAsDOMContainers,
  enableScrollEndPolyfill,
} from 'shared/ReactFeatureFlags';
// import {createEventListenerWrapperWithPriority} from './ReactDOMEventListener';
// import {
//   removeEventListener,
//   addEventCaptureListener,
//   addEventBubbleListener,
//   addEventBubbleListenerWithPassiveFlag,
//   addEventCaptureListenerWithPassiveFlag,
// } from './EventListener';
// import * as BeforeInputEventPlugin from './plugins/BeforeInputEventPlugin';
// import * as ChangeEventPlugin from './plugins/ChangeEventPlugin';
import * as EnterLeaveEventPlugin from './plugins/EnterLeaveEventPlugin';
// import * as SelectEventPlugin from './plugins/SelectEventPlugin';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
// import * as FormActionEventPlugin from './plugins/FormActionEventPlugin';
// import * as ScrollEndEventPlugin from './plugins/ScrollEndEventPlugin';

// import reportGlobalError from 'shared/reportGlobalError';

// import {runWithFiberInDEV} from 'react-reconciler/src/ReactCurrentFiber';

type DispatchListener = {
  instance: null | Fiber,
  listener: Function,
  currentTarget: EventTarget,
};

type DispatchEntry = {
  event: ReactSyntheticEvent,
  listeners: Array<DispatchListener>,
};

export type DispatchQueue = Array<DispatchEntry>;

// TODO: remove top-level side effect.
SimpleEventPlugin.registerEvents();
EnterLeaveEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();
SelectEventPlugin.registerEvents();
BeforeInputEventPlugin.registerEvents();
if (enableScrollEndPolyfill) {
  ScrollEndEventPlugin.registerEvents();
}

// List of events that need to be individually attached to media elements.
export const mediaEventTypes: Array<DOMEventName> = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
];

// We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
  'beforetoggle',
  'cancel',
  'close',
  'invalid',
  'load',
  'scroll',
  'scrollend',
  'toggle',
  // In order to reduce bytes, we insert the above array of media events
  // into this Set. Note: the "error" event isn't an exclusive media event,
  // and can occur on other elements too. Rather than duplicate that event,
  // we just take it from the media events array.
  ...mediaEventTypes,
]);

const listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  if (!(rootContainerElement: any)[listeningMarker]) {
    (rootContainerElement: any)[listeningMarker] = true;
    allNativeEvents.forEach(domEventName => {
      // We handle selectionchange separately because it
      // doesn't bubble and needs to be on the document.
      if (domEventName !== 'selectionchange') {
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
    const ownerDocument =
      (rootContainerElement: any).nodeType === DOCUMENT_NODE
        ? rootContainerElement
        : (rootContainerElement: any).ownerDocument;
    if (ownerDocument !== null) {
      // The selectionchange event also needs deduplication
      // but it is attached to the document.
      if (!(ownerDocument: any)[listeningMarker]) {
        (ownerDocument: any)[listeningMarker] = true;
        listenToNativeEvent('selectionchange', false, ownerDocument);
      }
    }
  }
}
