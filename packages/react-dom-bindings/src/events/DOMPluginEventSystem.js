/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from './DOMEventNames';
import type {EventSystemFlags} from './EventSystemFlags';
// import type {AnyNativeEvent} from './PluginModuleType';
import type {
  KnownReactSyntheticEvent,
  ReactSyntheticEvent,
} from './ReactSyntheticEventType';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import {allNativeEvents} from './EventRegistry';
import {
  SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE,
  IS_LEGACY_FB_SUPPORT_MODE,
  SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS,
  IS_CAPTURE_PHASE,
  IS_EVENT_HANDLE_NON_MANAGED_NODE,
  IS_NON_DELEGATED,
} from './EventSystemFlags';
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
import {createEventListenerWrapperWithPriority} from './ReactDOMEventListener';
// import {
//   removeEventListener,
//   addEventCaptureListener,
//   addEventBubbleListener,
//   addEventBubbleListenerWithPassiveFlag,
//   addEventCaptureListenerWithPassiveFlag,
// } from './EventListener';
import * as BeforeInputEventPlugin from './plugins/BeforeInputEventPlugin';
import * as ChangeEventPlugin from './plugins/ChangeEventPlugin';
import * as EnterLeaveEventPlugin from './plugins/EnterLeaveEventPlugin';
import * as SelectEventPlugin from './plugins/SelectEventPlugin';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
// import * as FormActionEventPlugin from './plugins/FormActionEventPlugin';
import * as ScrollEndEventPlugin from './plugins/ScrollEndEventPlugin';

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

export function listenToNativeEvent(
  // 原生事件名
  domEventName: DOMEventName,
  // 是否是捕获阶段监听器
  isCapturePhaseListener: boolean,
  // 要绑定事件的目标对象
  target: EventTarget,
): void {
  // 开发环境下的额外警告
  if (__DEV__) {
    if (nonDelegatedEvents.has(domEventName) && !isCapturePhaseListener) {
      console.error(
        'Did not expect a listenToNativeEvent() call for "%s" in the bubble phase. ' +
          'This is a bug in React. Please file an issue.',
        domEventName,
      );
    }
  }

  // 初始化事件系统标志位为 0
  let eventSystemFlags = 0;
  // 如果是捕获阶段监听器
  if (isCapturePhaseListener) {
    // 把 IS_CAPTURE_PHASE 标志位加进去
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  // 调用底层函数真正注册事件监听器
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
  );
}

const listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);

// 在 rootContainerElement 上监听所有支持的原生事件
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  // 如果该根容器还没打过“已监听”的标记，就进入初始化
  if (!(rootContainerElement: any)[listeningMarker]) {
    // 给根容器打上已监听的标记，避免重复监听
    (rootContainerElement: any)[listeningMarker] = true;

    // 遍历所有支持的原生事件，逐个调用 listenToNativeEvent() 进行监听
    allNativeEvents.forEach(domEventName => {
      // We handle selectionchange separately because it
      // doesn't bubble and needs to be on the document.
      // 跳过 selectionchange，其他事件在这里处理
      if (domEventName !== 'selectionchange') {
        // 对于非委托事件，只监听冒泡阶段
        // 委托事件元素会将事件冒泡到父容器，这样父容器能统一处理所有事件
        // 非委托元素则不会将事件冒泡到父容器，要单独处理
        if (!nonDelegatedEvents.has(domEventName)) {
          // 既监听捕获阶段，也监听冒泡阶段
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        // 仅监听捕获阶段
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
    // 计算根容器所属的 document
    const ownerDocument =
      (rootContainerElement: any).nodeType === DOCUMENT_NODE
        ? rootContainerElement
        : (rootContainerElement: any).ownerDocument;
    // 如果 document 不为 null，则监听它的 selectionchange 事件
    if (ownerDocument !== null) {
      // The selectionchange event also needs deduplication
      // but it is attached to the document.
      // 所以要在 document 上打标记，避免重复监听
      if (!(ownerDocument: any)[listeningMarker]) {
        (ownerDocument: any)[listeningMarker] = true;
        // 监听 document 的 selectionchange 事件
        listenToNativeEvent('selectionchange', false, ownerDocument);
      }
    }
  }
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean,
  isDeferredListenerForLegacyFBSupport?: boolean,
) {
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
  );

  throw new Error('Not implemented: addTrappedEventListener');
}
