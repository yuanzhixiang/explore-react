/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from '../events/DOMEventNames';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {
  BoundingRect,
  IntersectionObserverOptions,
  ObserveVisibleRectsCallback,
} from 'react-reconciler/src/ReactTestSelectors';
import type {ReactContext, ReactScopeInstance} from 'shared/ReactTypes';
import type {AncestorInfoDev} from './validateDOMNesting';
import type {FormStatus} from 'react-dom-bindings/src/shared/ReactDOMFormActions';
import type {
  CrossOriginEnum,
  PreloadImplOptions,
  PreloadModuleImplOptions,
  PreinitStyleOptions,
  PreinitScriptOptions,
  PreinitModuleScriptOptions,
} from 'react-dom/src/shared/ReactDOMTypes';
import type {TransitionTypes} from 'react/src/ReactTransitionType';

// import {NotPending} from '../shared/ReactDOMFormActions';

// import {setSrcObject} from './ReactDOMSrcObject';

// import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';
// import {runWithFiberInDEV} from 'react-reconciler/src/ReactCurrentFiber';

// import hasOwnProperty from 'shared/hasOwnProperty';
// import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

export {
  // setCurrentUpdatePriority,
  // getCurrentUpdatePriority,
  resolveUpdatePriority,
} from './ReactDOMUpdatePriority';
import {
  // precacheFiberNode,
  // updateFiberProps,
  // getFiberCurrentPropsFromNode,
  // getInstanceFromNode,
  // getClosestInstanceFromNode,
  // getFiberFromScopeInstance,
  // getInstanceFromNode as getInstanceFromNodeDOMTree,
  isContainerMarkedAsRoot,
  // detachDeletedInstance,
  // getResourcesFromRoot,
  // isMarkedHoistable,
  // markNodeAsHoistable,
  // isOwnedInstance,
} from './ReactDOMComponentTree';
// import {
//   traverseFragmentInstance,
//   getFragmentParentHostFiber,
//   getInstanceFromHostFiber,
//   isFiberFollowing,
//   isFiberPreceding,
//   getFragmentInstanceSiblings,
//   traverseFragmentInstanceDeeply,
//   fiberIsPortaledIntoHost,
//   isFiberContainedByFragment,
//   isFragmentContainedByFiber,
// } from 'react-reconciler/src/ReactFiberTreeReflection';
// import {compareDocumentPositionForEmptyFragment} from 'shared/ReactDOMFragmentRefShared';

// export {detachDeletedInstance};
// import {hasRole} from './DOMAccessibilityRoles';
// import {
//   setInitialProperties,
//   updateProperties,
//   hydrateProperties,
//   hydrateText,
//   diffHydratedProperties,
//   getPropsFromElement,
//   diffHydratedText,
//   trapClickOnNonInteractiveElement,
// } from './ReactDOMComponent';
// import {hydrateInput} from './ReactDOMInput';
// import {hydrateTextarea} from './ReactDOMTextarea';
// import {hydrateSelect} from './ReactDOMSelect';
// import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
// import setTextContent from './setTextContent';
// import {
//   validateDOMNesting,
//   validateTextNesting,
//   updatedAncestorInfoDev,
// } from './validateDOMNesting';
// import {
//   isEnabled as ReactBrowserEventEmitterIsEnabled,
//   setEnabled as ReactBrowserEventEmitterSetEnabled,
// } from '../events/ReactDOMEventListener';
// import {SVG_NAMESPACE, MATH_NAMESPACE} from './DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './HTMLNodeType';

// import {
//   flushEventReplaying,
//   retryIfBlockedOn,
// } from '../events/ReactDOMEventReplaying';

import {
  enableCreateEventHandleAPI,
  enableScopeAPI,
  enableTrustedTypesIntegration,
  disableLegacyMode,
  enableMoveBefore,
  disableCommentsAsDOMContainers,
  enableSuspenseyImages,
  enableSrcObject,
  enableViewTransition,
  enableHydrationChangeEvent,
  enableFragmentRefsScrollIntoView,
  enableProfilerTimer,
  enableFragmentRefsInstanceHandles,
} from 'shared/ReactFeatureFlags';
import {
  HostComponent,
  HostHoistable,
  HostText,
  HostSingleton,
} from 'react-reconciler/src/ReactWorkTags';
import {listenToAllSupportedEvents} from '../events/DOMPluginEventSystem';
// import {validateLinkPropsForStyleResource} from '../shared/ReactDOMResourceValidation';
// import escapeSelectorAttributeValueInsideDoubleQuotes from './escapeSelectorAttributeValueInsideDoubleQuotes';
// import {flushSyncWork as flushSyncWorkOnAllRoots} from 'react-reconciler/src/ReactFiberWorkLoop';
// import {requestFormReset as requestFormResetOnFiber} from 'react-reconciler/src/ReactFiberHooks';

// import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';

export {default as rendererVersion} from 'shared/ReactVersion';

import noop from 'shared/noop';
// import estimateBandwidth from './estimateBandwidth';

export const rendererPackageName = 'react-dom';
export const extraDevToolsConfig = null;

export type Type = string;
export type Props = {
  autoFocus?: boolean,
  children?: mixed,
  disabled?: boolean,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
  dangerouslySetInnerHTML?: mixed,
  style?: {
    display?: string,
    viewTransitionName?: string,
    'view-transition-name'?: string,
    viewTransitionClass?: string,
    'view-transition-class'?: string,
    margin?: string,
    marginTop?: string,
    'margin-top'?: string,
    marginBottom?: string,
    'margin-bottom'?: string,
    ...
  },
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
  is?: string,
  size?: number,
  value?: string,
  defaultValue?: string,
  checked?: boolean,
  defaultChecked?: boolean,
  multiple?: boolean,
  src?: string | Blob | MediaSource | MediaStream, // TODO: Response
  srcSet?: string,
  loading?: 'eager' | 'lazy',
  onLoad?: (event: any) => void,
  ...
};
type RawProps = {
  [string]: mixed,
};
export type EventTargetChildElement = {
  type: string,
  props: null | {
    style?: {
      position?: string,
      zIndex?: number,
      bottom?: string,
      left?: string,
      right?: string,
      top?: string,
      ...
    },
    ...
  },
  ...
};

export type Container =
  | interface extends Element {_reactRootContainer?: FiberRoot}
  | interface extends Document {_reactRootContainer?: FiberRoot}
  | interface extends DocumentFragment {_reactRootContainer?: FiberRoot};
export type Instance = Element;
export type TextInstance = Text;

type InstanceWithFragmentHandles = Instance & {
  unstable_reactFragments?: Set<FragmentInstanceType>,
};

declare class ActivityInterface extends Comment {}
declare class SuspenseInterface extends Comment {
  _reactRetry: void | (() => void);
}

export type ActivityInstance = ActivityInterface;
export type SuspenseInstance = SuspenseInterface;

type FormStateMarkerInstance = Comment;
export type HydratableInstance =
  | Instance
  | TextInstance
  | ActivityInstance
  | SuspenseInstance
  | FormStateMarkerInstance;
export type PublicInstance = Element | Text;
export type HostContextDev = {
  context: HostContextProd,
  ancestorInfo: AncestorInfoDev,
};
type HostContextProd = HostContextNamespace;
export type HostContext = HostContextDev | HostContextProd;
export type UpdatePayload = Array<mixed>;
export type ChildSet = void; // Unused
export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;
export type RendererInspectionConfig = $ReadOnly<{}>;

export type TransitionStatus = FormStatus;

export type ViewTransitionInstance = {
  name: string,
  group: mixin$Animatable,
  imagePair: mixin$Animatable,
  old: mixin$Animatable,
  new: mixin$Animatable,
};

type SelectionInformation = {
  focusedElem: null | HTMLElement,
  selectionRange: mixed,
};

const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';

const ACTIVITY_START_DATA = '&';
const ACTIVITY_END_DATA = '/&';
const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_QUEUED_START_DATA = '$~';
const SUSPENSE_FALLBACK_START_DATA = '$!';
const PREAMBLE_CONTRIBUTION_HTML = 'html';
const PREAMBLE_CONTRIBUTION_BODY = 'body';
const PREAMBLE_CONTRIBUTION_HEAD = 'head';
const FORM_STATE_IS_MATCHING = 'F!';
const FORM_STATE_IS_NOT_MATCHING = 'F';

const DOCUMENT_READY_STATE_LOADING = 'loading';

const STYLE = 'style';

opaque type HostContextNamespace = 0 | 1 | 2;
export const HostContextNamespaceNone: HostContextNamespace = 0;
const HostContextNamespaceSvg: HostContextNamespace = 1;
const HostContextNamespaceMath: HostContextNamespace = 2;

let eventsEnabled: ?boolean = null;
let selectionInformation: null | SelectionInformation = null;

type StoredEventListener = {
  type: string,
  listener: EventListener,
  optionsOrUseCapture: void | EventListenerOptionsOrUseCapture,
};

export type FragmentInstanceType = {
  _fragmentFiber: Fiber,
  _eventListeners: null | Array<StoredEventListener>,
  _observers: null | Set<IntersectionObserver | ResizeObserver>,
  addEventListener(
    type: string,
    listener: EventListener,
    optionsOrUseCapture?: EventListenerOptionsOrUseCapture,
  ): void,
  removeEventListener(
    type: string,
    listener: EventListener,
    optionsOrUseCapture?: EventListenerOptionsOrUseCapture,
  ): void,
  dispatchEvent(event: Event): boolean,
  focus(focusOptions?: FocusOptions): void,
  focusLast(focusOptions?: FocusOptions): void,
  blur(): void,
  observeUsing(observer: IntersectionObserver | ResizeObserver): void,
  unobserveUsing(observer: IntersectionObserver | ResizeObserver): void,
  getClientRects(): Array<DOMRect>,
  getRootNode(getRootNodeOptions?: {
    composed: boolean,
  }): Document | ShadowRoot | FragmentInstanceType,
  compareDocumentPosition(otherNode: Instance): number,
  scrollIntoView(alignToTop?: boolean): void,
};

export type RunningViewTransition = {
  skipTransition(): void,
  ...
};

interface CustomTimeline {
  currentTime: number;
  animate(animation: Animation): void | (() => void);
}

export type GestureTimeline = AnimationTimeline | CustomTimeline;

// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout: any =
  typeof setTimeout === 'function' ? setTimeout : (undefined: any);
export const cancelTimeout: any =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined: any);
export const noTimeout: -1 = -1;
const localPromise = typeof Promise === 'function' ? Promise : undefined;

// -------------------
//     Microtasks
// -------------------
export const supportsMicrotasks = true;
// 导出一个常量 scheduleMicrotask（类型标注为 any）
// 这个函数的用处是在 ui 例如 click 任务结束后、浏览器下一次渲染之前执行
export const scheduleMicrotask: any =
  // 如果全局有原生的 queueMicrotask 函数就直接用它
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : // 否则如果有 Promise（这里叫 localPromise），用 Promise 的 microtask 来实现
      typeof localPromise !== 'undefined'
      ? // 先 resolve 再 then 执行回调；catch 用来处理异步错误
        callback =>
          localPromise.resolve(null).then(callback).catch(handleErrorInNextTick)
      : // 如果连 Promise 都没有，就退回到 setTimeout 级别的宏任务；
        // 旁边的注释说这是个待改进的 fallback
        scheduleTimeout; // TODO: Determine the best fallback here.

function handleErrorInNextTick(error: any) {
  setTimeout(() => {
    throw error;
  });
}
