/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { DOMEventName } from "../events/DOMEventNames";
import type { Fiber, FiberRoot } from "react-reconciler/src/ReactInternalTypes";
import type {
  BoundingRect,
  IntersectionObserverOptions,
  ObserveVisibleRectsCallback,
} from "react-reconciler/src/ReactTestSelectors";
import type { ReactContext, ReactScopeInstance } from "shared/ReactTypes";
import type { AncestorInfoDev } from "./validateDOMNesting";
import type { FormStatus } from "react-dom-bindings/src/shared/ReactDOMFormActions";
import type {
  CrossOriginEnum,
  PreloadImplOptions,
  PreloadModuleImplOptions,
  PreinitStyleOptions,
  PreinitScriptOptions,
  PreinitModuleScriptOptions,
} from "react-dom/src/shared/ReactDOMTypes";
import type { TransitionTypes } from "react/src/ReactTransitionType";

export const rendererPackageName = "react-dom";
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
    "view-transition-name"?: string,
    viewTransitionClass?: string,
    "view-transition-class"?: string,
    margin?: string,
    marginTop?: string,
    "margin-top"?: string,
    marginBottom?: string,
    "margin-bottom"?: string,
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
  loading?: "eager" | "lazy",
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
  | interface extends Element { _reactRootContainer?: FiberRoot }
  | interface extends Document { _reactRootContainer?: FiberRoot }
  | interface extends DocumentFragment { _reactRootContainer?: FiberRoot };
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

const SUPPRESS_HYDRATION_WARNING = "suppressHydrationWarning";

const ACTIVITY_START_DATA = "&";
const ACTIVITY_END_DATA = "/&";
const SUSPENSE_START_DATA = "$";
const SUSPENSE_END_DATA = "/$";
const SUSPENSE_PENDING_START_DATA = "$?";
const SUSPENSE_QUEUED_START_DATA = "$~";
const SUSPENSE_FALLBACK_START_DATA = "$!";
const PREAMBLE_CONTRIBUTION_HTML = "html";
const PREAMBLE_CONTRIBUTION_BODY = "body";
const PREAMBLE_CONTRIBUTION_HEAD = "head";
const FORM_STATE_IS_MATCHING = "F!";
const FORM_STATE_IS_NOT_MATCHING = "F";

const DOCUMENT_READY_STATE_LOADING = "loading";

const STYLE = "style";

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
    optionsOrUseCapture?: EventListenerOptionsOrUseCapture
  ): void,
  removeEventListener(
    type: string,
    listener: EventListener,
    optionsOrUseCapture?: EventListenerOptionsOrUseCapture
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
