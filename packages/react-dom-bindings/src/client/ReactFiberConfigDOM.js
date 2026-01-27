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

import {NotPending} from '../shared/ReactDOMFormActions';

// import {setSrcObject} from './ReactDOMSrcObject';

// import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';
// import {runWithFiberInDEV} from 'react-reconciler/src/ReactCurrentFiber';

import hasOwnProperty from 'shared/hasOwnProperty';
// import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

export {
  setCurrentUpdatePriority,
  getCurrentUpdatePriority,
  resolveUpdatePriority,
} from './ReactDOMUpdatePriority';
import {
  precacheFiberNode,
  updateFiberProps,
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
import {
  setInitialProperties,
  // updateProperties,
  // hydrateProperties,
  // hydrateText,
  // diffHydratedProperties,
  // getPropsFromElement,
  // diffHydratedText,
  trapClickOnNonInteractiveElement,
} from './ReactDOMComponent';
// import {hydrateInput} from './ReactDOMInput';
// import {hydrateTextarea} from './ReactDOMTextarea';
// import {hydrateSelect} from './ReactDOMSelect';
import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
// import setTextContent from './setTextContent';
import {
  validateDOMNesting,
  // validateTextNesting,
  updatedAncestorInfoDev,
} from './validateDOMNesting';
import {
  isEnabled as ReactBrowserEventEmitterIsEnabled,
  setEnabled as ReactBrowserEventEmitterSetEnabled,
} from '../events/ReactDOMEventListener';
import {SVG_NAMESPACE, MATH_NAMESPACE} from './DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './HTMLNodeType';

import {
  flushEventReplaying,
  // retryIfBlockedOn,
} from '../events/ReactDOMEventReplaying';

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

export * from './ReactFiberConfigWithNoPersistence';

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

export type HoistableRoot = Document | ShadowRoot;

export opaque type SuspendedState = {
  stylesheets: null | Map<StylesheetResource, HoistableRoot>,
  count: number, // suspensey css and active view transitions
  imgCount: number, // suspensey images pending to load
  imgBytes: number, // number of bytes we estimate needing to download
  suspenseyImages: Array<HTMLImageElement>, // instances of suspensey images (whether loaded or not)
  waitingForImages: boolean, // false when we're no longer blocking on images
  waitingForViewTransition: boolean,
  unsuspend: null | (() => void),
};

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

let didWarnScriptTags = false;
const warnedUnknownTags: {
  [key: string]: boolean,
} = {
  // There are working polyfills for <dialog>. Let people use it.
  dialog: true,
  // Electron ships a custom <webview> tag to display external web content in
  // an isolated frame and process.
  // This tag is not present in non Electron environments such as JSDom which
  // is often used for testing purposes.
  // @see https://electronjs.org/docs/api/webview-tag
  webview: true,
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

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout: any =
  typeof setTimeout === 'function' ? setTimeout : (undefined: any);
export const cancelTimeout: any =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined: any);
export const noTimeout: -1 = -1;
const localPromise = typeof Promise === 'function' ? Promise : undefined;

type KeyedTagCache = Map<string, Array<Element>>;
type DocumentTagCaches = Map<Document, KeyedTagCache>;
let tagCaches: null | DocumentTagCaches = null;

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

let schedulerEvent: void | Event = undefined;
export function trackSchedulerEvent(): void {
  schedulerEvent = window.event;
}

const supportsMoveBefore =
  // $FlowFixMe[prop-missing]: We're doing the feature detection here.
  enableMoveBefore &&
  typeof window !== 'undefined' &&
  typeof window.Element.prototype.moveBefore === 'function';

export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  let type;
  let context: HostContextProd;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      throw new Error('Not implemented yet.');
    }
    default: {
      const container: any =
        !disableCommentsAsDOMContainers && nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      type = container.tagName;
      const namespaceURI = container.namespaceURI;
      if (!namespaceURI) {
        throw new Error('Not implemented yet.');
      } else {
        const ownContext = getOwnHostContext(namespaceURI);
        context = getChildHostContextProd(ownContext, type);
      }
      break;
    }
  }
  if (__DEV__) {
    const validatedTag = type.toLowerCase();
    const ancestorInfo = updatedAncestorInfoDev(null, validatedTag);
    return {context, ancestorInfo};
  }
  return context;
}

function getOwnHostContext(namespaceURI: string): HostContextNamespace {
  switch (namespaceURI) {
    case SVG_NAMESPACE:
      return HostContextNamespaceSvg;
    case MATH_NAMESPACE:
      return HostContextNamespaceMath;
    default:
      return HostContextNamespaceNone;
  }
}

function getChildHostContextProd(
  parentNamespace: HostContextNamespace,
  type: string,
): HostContextNamespace {
  if (parentNamespace === HostContextNamespaceNone) {
    // No (or default) parent namespace: potential entry point.
    switch (type) {
      case 'svg':
        return HostContextNamespaceSvg;
      case 'math':
        return HostContextNamespaceMath;
      default:
        return HostContextNamespaceNone;
    }
  }
  if (parentNamespace === HostContextNamespaceSvg && type === 'foreignObject') {
    // We're leaving SVG.
    return HostContextNamespaceNone;
  }
  // By default, pass namespace below.
  return parentNamespace;
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

// -------------------
//     Resources
// -------------------

export const supportsResources = true;

type HoistableTagType = 'link' | 'meta' | 'title';
type TResource<
  T: 'stylesheet' | 'style' | 'script' | 'void',
  S: null | {...},
> = {
  type: T,
  instance: null | Instance,
  count: number,
  state: S,
};
type StylesheetResource = TResource<'stylesheet', StylesheetState>;
type StyleTagResource = TResource<'style', null>;
type StyleResource = StyleTagResource | StylesheetResource;
type ScriptResource = TResource<'script', null>;
type VoidResource = TResource<'void', null>;
export type Resource = StyleResource | ScriptResource | VoidResource;

type LoadingState = number;
const NotLoaded = /*       */ 0b000;
const Loaded = /*          */ 0b001;
const Errored = /*         */ 0b010;
const Settled = /*         */ 0b011;
const Inserted = /*        */ 0b100;

type StylesheetState = {
  loading: LoadingState,
  preload: null | HTMLLinkElement,
};

type StyleTagProps = {
  'data-href': string,
  'data-precedence': string,
  [string]: mixed,
};
type StylesheetProps = {
  rel: 'stylesheet',
  href: string,
  'data-precedence': string,
  [string]: mixed,
};

type ScriptProps = {
  src: string,
  async: true,
  [string]: mixed,
};

type PreloadProps = {
  rel: 'preload',
  href: ?string,
  [string]: mixed,
};
type PreloadModuleProps = {
  rel: 'modulepreload',
  href: string,
  [string]: mixed,
};

export type RootResources = {
  hoistableStyles: Map<string, StyleResource>,
  hoistableScripts: Map<string, ScriptResource>,
};

// -------------------
//     Singletons
// -------------------

export const supportsSingletons = true;

// 用于判断一个元素是否是可提升（hoistable）的宿主类型，
// 即可以被提升到 <head> 或文档顶层的元素
// 提升（Hoist）= 把元素从组件渲染的位置移动到 <head> 里
export function isHostHoistableType(
  type: string,
  props: RawProps,
  hostContext: HostContext,
): boolean {
  let outsideHostContainerContext: boolean;
  let hostContextProd: HostContextProd;
  if (__DEV__) {
    const hostContextDev: HostContextDev = (hostContext: any);
    // We can only render resources when we are not within the host container context
    outsideHostContainerContext =
      !hostContextDev.ancestorInfo.containerTagInScope;
    hostContextProd = hostContextDev.context;
  } else {
    hostContextProd = (hostContext: any);
  }

  // Global opt out of hoisting for anything in SVG Namespace or anything with an itemProp inside an itemScope
  if (hostContextProd === HostContextNamespaceSvg || props.itemProp != null) {
    if (__DEV__) {
      if (
        outsideHostContainerContext &&
        props.itemProp != null &&
        (type === 'meta' ||
          type === 'title' ||
          type === 'style' ||
          type === 'link' ||
          type === 'script')
      ) {
        console.error(
          'Cannot render a <%s> outside the main document if it has an `itemProp` prop. `itemProp` suggests the tag belongs to an' +
            ' `itemScope` which can appear anywhere in the DOM. If you were intending for React to hoist this <%s> remove the `itemProp` prop.' +
            ' Otherwise, try moving this tag into the <head> or <body> of the Document.',
          type,
          type,
        );
      }
    }
    return false;
  }
  // 哪些类型可提升
  switch (type) {
    // ✓ 可提升
    case 'meta':
    // ✓ 可提升
    case 'title': {
      return true;
    }
    // 需要 precedence + href
    case 'style': {
      throw new Error('Not implemented yet.');
    }
    // 需要 rel="stylesheet" 等条件
    case 'link': {
      if (
        typeof props.rel !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === '' ||
        props.onLoad ||
        props.onError
      ) {
        throw new Error('Not implemented yet.');
      }
      switch (props.rel) {
        case 'stylesheet': {
          throw new Error('Not implemented yet.');
        }
        default: {
          throw new Error('Not implemented yet.');
        }
      }
    }
    // 需要 async + src
    case 'script': {
      throw new Error('Not implemented yet.');
    }
    case 'noscript':
    case 'template': {
      throw new Error('Not implemented yet.');
    }
  }
  return false;
}

export function isHostSingletonType(type: string): boolean {
  return type === 'html' || type === 'head' || type === 'body';
}

export const NotPendingTransition: TransitionStatus = NotPending;
export const HostTransitionContext: ReactContext<TransitionStatus> = {
  $$typeof: REACT_CONTEXT_TYPE,
  Provider: (null: any),
  Consumer: (null: any),
  _currentValue: NotPendingTransition,
  _currentValue2: NotPendingTransition,
  _threadCount: 0,
};

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
): HostContext {
  if (__DEV__) {
    const parentHostContextDev = ((parentHostContext: any): HostContextDev);
    const context = getChildHostContextProd(parentHostContextDev.context, type);
    const ancestorInfo = updatedAncestorInfoDev(
      parentHostContextDev.ancestorInfo,
      type,
    );
    return {context, ancestorInfo};
  }
  const parentNamespace = ((parentHostContext: any): HostContextProd);
  return getChildHostContextProd(parentNamespace, type);
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    typeof props.children === 'bigint' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document | DocumentFragment,
): Document {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? // 如果元素是 document 本身，那么直接返回他自己
      (rootContainerElement: any)
    : // 如果不是，就返回他的 ownerDocument
      rootContainerElement.ownerDocument;
}

export function createInstance(
  // 标签名，如 'div', 'span', 'svg'
  type: string,
  // 属性，如 { className: 'foo', onClick: fn }
  props: Props,
  // 根容器，如 document.getElementById('root')
  rootContainerInstance: Container,
  // 宿主上下文（命名空间信息）
  hostContext: HostContext,
  // Fiber 节点
  internalInstanceHandle: Object,
): Instance {
  let hostContextProd: HostContextProd;
  if (__DEV__) {
    // 开发模式下校验 DOM 嵌套是否合法（如 <p> 里不能放 <div>）
    // TODO: take namespace into account when validating.
    const hostContextDev: HostContextDev = (hostContext: any);
    validateDOMNesting(type, hostContextDev.ancestorInfo);
    hostContextProd = hostContextDev.context;
  } else {
    hostContextProd = (hostContext: any);
  }

  // 获取 document 对象，用于后面创建元素
  // @why 他的 document 对象是从哪儿获取的？
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );

  // 根据命名空间创建元素
  let domElement: Instance;
  switch (hostContextProd) {
    // 如果当前在 SVG 命名空间内，用 createElementNS 创建
    /*
<!-- SVG 命名空间内的元素必须用 createElementNS -->
<svg>
  <rect />   <!-- 需要 createElementNS('http://www.w3.org/2000/svg', 'rect') -->
</svg>
    */
    case HostContextNamespaceSvg:
      domElement = ownerDocument.createElementNS(SVG_NAMESPACE, type);
      break;
    // 如果当前在 MathML 命名空间内，用 createElementNS 创建
    case HostContextNamespaceMath:
      domElement = ownerDocument.createElementNS(MATH_NAMESPACE, type);
      break;
    // 处理普通 HTML 元素
    default:
      switch (type) {
        // 遇到 <svg> 标签，切换到对应命名空间
        case 'svg': {
          domElement = ownerDocument.createElementNS(SVG_NAMESPACE, type);
          break;
        }
        // 遇到 <math> 标签，切换到对应命名空间
        case 'math': {
          domElement = ownerDocument.createElementNS(MATH_NAMESPACE, type);
          break;
        }
        case 'script': {
          throw new Error('Not implemented yet.');
        }
        case 'select': {
          throw new Error('Not implemented yet.');
        }
        // 处理普通元素
        default: {
          // 普通元素直接用 createElement
          if (typeof props.is === 'string') {
            // props.is 是 Web Components 的自定义内置元素语法
            // <button is="fancy-button">Click</button>
            domElement = ownerDocument.createElement(type, {is: props.is});
          } else {
            // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
            // See discussion in https://github.com/facebook/react/pull/6896
            // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
            domElement = ownerDocument.createElement(type);
          }

          // 开发模式警告
          if (__DEV__) {
            if (type.indexOf('-') === -1) {
              // We're not SVG/MathML and we don't have a dash, so we're not a custom element
              // Even if you use `is`, these should be of known type and lower case.
              // <DIV />  // ❌ 警告：应该用 <div />
              if (type !== type.toLowerCase()) {
                console.error(
                  '<%s /> is using incorrect casing. ' +
                    'Use PascalCase for React components, ' +
                    'or lowercase for HTML elements.',
                  type,
                );
              }

              // <foobar />  // ❌ 警告：浏览器不认识这个标签
              if (
                // $FlowFixMe[method-unbinding]
                Object.prototype.toString.call(domElement) ===
                  '[object HTMLUnknownElement]' &&
                !hasOwnProperty.call(warnedUnknownTags, type)
              ) {
                warnedUnknownTags[type] = true;
                console.error(
                  'The tag <%s> is unrecognized in this browser. ' +
                    'If you meant to render a React component, start its name with ' +
                    'an uppercase letter.',
                  type,
                );
              }
            }
          }
        }
      }
  }
  // 把 Fiber 存到 DOM 元素上（domElement.__reactFiber = fiber），方便后续通过 DOM 找到 Fiber
  // @why 这里需要再深度理解一下
  precacheFiberNode(internalInstanceHandle, domElement);
  // 把 props 存到 DOM 元素上（domElement.__reactProps = props），事件系统会用到
  // @why 这里需要再深度理解一下
  updateFiberProps(domElement, props);
  return domElement;
}

export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props);
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
    case 'img':
      return true;
    default:
      return false;
  }
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  // Note: This should not use moveBefore() because initial are appended while disconnected.
  parentInstance.appendChild(child);
}

export function maySuspendCommit(type: Type, props: Props): boolean {
  if (!enableSuspenseyImages && !enableViewTransition) {
    return false;
  }
  // Suspensey images are the default, unless you opt-out of with either
  // loading="lazy" or onLoad={...} which implies you're ok waiting.
  return (
    type === 'img' && // 是 <img> 标签
    props.src != null && // 有 src
    props.src !== '' && // src 不为空
    props.onLoad == null && // 没有 onLoad 回调
    props.loading !== 'lazy' // 不是懒加载
  );
}

export function maySuspendCommitOnUpdate(
  type: Type,
  oldProps: Props,
  newProps: Props,
): boolean {
  return (
    maySuspendCommit(type, newProps) && // 新 props 是 Suspensey 图片
    (newProps.src !== oldProps.src || // src 改变了
      newProps.srcSet !== oldProps.srcSet) // 或 srcSet 改变了
  );
}

export function prepareForCommit(containerInfo: Container): Object | null {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation(containerInfo);
  let activeInstance = null;
  if (enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      // activeInstance = getClosestInstanceFromNode(focusedElem);
      throw new Error('Not implemented yet.');
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}

export function clearContainer(container: Container): void {
  const nodeType = container.nodeType;
  if (nodeType === DOCUMENT_NODE) {
    clearContainerSparingly(container);
  } else if (nodeType === ELEMENT_NODE) {
    switch (container.nodeName) {
      case 'HEAD':
      case 'HTML':
      case 'BODY':
        clearContainerSparingly(container);
        return;
      default: {
        container.textContent = '';
      }
    }
  }
}

export function isSingletonScope(type: string): boolean {
  return type === 'head';
}

function clearContainerSparingly(container: Node) {
  throw new Error('Not implemented yet.');
}

export function resetAfterCommit(containerInfo: Container): void {
  restoreSelection(selectionInformation, containerInfo);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}

// -------------------
//     Test Selectors
// -------------------

export const supportsTestSelectors = true;

export function flushHydrationEvents(): void {
  if (enableHydrationChangeEvent) {
    flushEventReplaying();
  }
}

export function prepareToCommitHoistables() {
  tagCaches = null;
}

// getRootNode is missing from IE and old jsdom versions
export function getHoistableRoot(container: Container): HoistableRoot {
  // $FlowFixMe[method-unbinding]
  return typeof container.getRootNode === 'function'
    ? /* $FlowFixMe[incompatible-cast] Flow types this as returning a `Node`,
       * but it's either a `Document` or `ShadowRoot`. */
      (container.getRootNode(): Document | ShadowRoot)
    : container.nodeType === DOCUMENT_NODE
      ? // $FlowFixMe[incompatible-cast] We've constrained this to be a Document which satisfies the return type
        (container: Document)
      : container.ownerDocument;
}

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  if (__DEV__) {
    // warnForReactChildrenConflict(container);
    console.log('跳过 warnForReactChildrenConflict 检查');
  }

  let parentNode: DocumentFragment | Element;
  if (container.nodeType === DOCUMENT_NODE) {
    parentNode = (container: any).body;
  } else if (
    !disableCommentsAsDOMContainers &&
    container.nodeType === COMMENT_NODE
  ) {
    parentNode = (container.parentNode: any);
    if (supportsMoveBefore && child.parentNode !== null) {
      // $FlowFixMe[prop-missing]: We've checked this with supportsMoveBefore.
      parentNode.moveBefore(child, container);
    } else {
      parentNode.insertBefore(child, container);
    }
    return;
  } else if (container.nodeName === 'HTML') {
    parentNode = (container.ownerDocument.body: any);
  } else {
    parentNode = (container: any);
  }
  if (supportsMoveBefore && child.parentNode !== null) {
    // $FlowFixMe[prop-missing]: We've checked this with supportsMoveBefore.
    parentNode.moveBefore(child, null);
  } else {
    parentNode.appendChild(child);
  }

  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((parentNode: any): HTMLElement));
  }
}
