/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostContext, HostContextDev} from './ReactFiberConfigDOM';

import {HostContextNamespaceNone} from './ReactFiberConfigDOM';

import {
  registrationNameDependencies,
  possibleRegistrationNames,
} from '../events/EventRegistry';

// import {checkHtmlStringCoercion} from 'shared/CheckStringCoercion';
// import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';
// import {checkControlledValueProps} from '../shared/ReactControlledValuePropTypes';

// import {
//   getValueForAttribute,
//   getValueForAttributeOnCustomComponent,
//   setValueForPropertyOnCustomComponent,
//   setValueForKnownAttribute,
//   setValueForAttribute,
//   setValueForNamespacedAttribute,
// } from './DOMPropertyOperations';
// import {
//   validateInputProps,
//   initInput,
//   updateInput,
//   restoreControlledInputState,
// } from './ReactDOMInput';
// import {validateOptionProps} from './ReactDOMOption';
// import {
//   validateSelectProps,
//   initSelect,
//   restoreControlledSelectState,
//   updateSelect,
// } from './ReactDOMSelect';
// import {
//   validateTextareaProps,
//   initTextarea,
//   updateTextarea,
//   restoreControlledTextareaState,
// } from './ReactDOMTextarea';
// import {setSrcObject} from './ReactDOMSrcObject';
// import {validateTextNesting} from './validateDOMNesting';
import setTextContent from './setTextContent';
// import {
//   createDangerousStringForStyles,
//   setValueForStyles,
// } from './CSSPropertyOperations';
import {SVG_NAMESPACE, MATH_NAMESPACE} from './DOMNamespaces';
import isCustomElement from '../shared/isCustomElement';
// import getAttributeAlias from '../shared/getAttributeAlias';
// import possibleStandardNames from '../shared/possibleStandardNames';
// import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
// import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
// import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';
// import sanitizeURL from '../shared/sanitizeURL';

import noop from 'shared/noop';

import {trackHostMutation} from 'react-reconciler/src/ReactFiberMutationTracking';

import {
  enableHydrationChangeEvent,
  enableScrollEndPolyfill,
  enableSrcObject,
  enableTrustedTypesIntegration,
  enableViewTransition,
} from 'shared/ReactFeatureFlags';
import {
  mediaEventTypes,
  // listenToNonDelegatedEvent,
} from '../events/DOMPluginEventSystem';

let didWarnControlledToUncontrolled = false;
let didWarnUncontrolledToControlled = false;
let didWarnFormActionType = false;
let didWarnFormActionName = false;
let didWarnFormActionTarget = false;
let didWarnFormActionMethod = false;
let didWarnForNewBooleanPropsWithEmptyValue: {[string]: boolean};
let didWarnPopoverTargetObject = false;
if (__DEV__) {
  didWarnForNewBooleanPropsWithEmptyValue = {};
}

export function setInitialProperties(
  domElement: Element,
  tag: string,
  props: Object,
): void {
  if (__DEV__) {
    // validatePropertiesInDevelopment(tag, props);
    console.log('跳过检查 validatePropertiesInDevelopment(tag, props)');
  }

  // TODO: Make sure that we check isMounted before firing any of these events.

  switch (tag) {
    case 'div':
    case 'span':
    case 'svg':
    case 'path':
    case 'a':
    case 'g':
    case 'p':
    case 'li': {
      // Fast track the most common tag types
      break;
    }
    // img tags previously were implemented as void elements with non delegated events however Safari (and possibly Firefox)
    // begin fetching the image as soon as the `src` or `srcSet` property is set and if we set these before other properties
    // that can modify the request (such as crossorigin) or the resource fetch (such as sizes) then the browser will load
    // the wrong thing or load more than one thing. This implementation ensures src and srcSet are set on the instance last
    case 'img': {
      throw new Error('Not implemented yet.');
    }
    case 'input': {
      throw new Error('Not implemented yet.');
    }
    case 'select': {
      throw new Error('Not implemented yet.');
    }
    case 'textarea': {
      throw new Error('Not implemented yet.');
    }
    case 'option': {
      throw new Error('Not implemented yet.');
    }
    case 'dialog': {
      throw new Error('Not implemented yet.');
    }
    case 'iframe':
    case 'object': {
      throw new Error('Not implemented yet.');
    }
    case 'video':
    case 'audio': {
      throw new Error('Not implemented yet.');
    }
    case 'image': {
      throw new Error('Not implemented yet.');
    }
    case 'details': {
      throw new Error('Not implemented yet.');
    }
    case 'embed':
    case 'source':
    case 'link': {
      throw new Error('Not implemented yet.');
    }
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'track':
    case 'wbr':
    case 'menuitem': {
      throw new Error('Not implemented yet.');
    }
    default: {
      if (isCustomElement(tag, props)) {
        for (const propKey in props) {
          if (!props.hasOwnProperty(propKey)) {
            continue;
          }
          const propValue = props[propKey];
          if (propValue === undefined) {
            continue;
          }
          setPropOnCustomElement(
            domElement,
            tag,
            propKey,
            propValue,
            props,
            undefined,
          );
        }
        return;
      }
    }
  }

  for (const propKey in props) {
    // 跳过原型链上继承来的属性
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    // 跳过值为 null 或 undefined 的属性
    const propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    setProp(domElement, tag, propKey, propValue, props, null);
  }
}

function setPropOnCustomElement(
  domElement: Element,
  tag: string,
  key: string,
  value: mixed,
  props: any,
  prevValue: mixed,
): void {
  throw new Error('Not implemented yet.');
}

const xlinkNamespace = 'http://www.w3.org/1999/xlink';
const xmlNamespace = 'http://www.w3.org/XML/1998/namespace';

// 在这里面真正将属性设置到 DOM 元素上
function setProp(
  domElement: Element,
  tag: string,
  key: string,
  value: mixed,
  props: any,
  prevValue: mixed,
): void {
  switch (key) {
    case 'children': {
      if (typeof value === 'string') {
        // 如果数值为字符串，则设置文本内容
        if (__DEV__) {
          // validateTextNesting(value, tag, false);
          console.log('跳过检查 validateTextNesting(value, tag, false);');
        }
        // Avoid setting initial textContent when the text is empty. In IE11 setting
        // textContent on a <textarea> will cause the placeholder to not
        // show within the <textarea> until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        const canSetTextContent =
          tag !== 'body' && (tag !== 'textarea' || value !== '');
        if (canSetTextContent) {
          setTextContent(domElement, value);
        }
      } else if (typeof value === 'number' || typeof value === 'bigint') {
        throw new Error('Not implemented yet.');
      } else {
        return;
      }
      break;
    }
    // These are very common props and therefore are in the beginning of the switch.
    // TODO: aria-label is a very common prop but allows booleans so is not like the others
    // but should ideally go in this list too.
    case 'className':
      throw new Error('Not implemented yet.');
    case 'tabIndex':
      throw new Error('Not implemented yet.');
    case 'dir':
    case 'role':
    case 'viewBox':
    case 'width':
    case 'height': {
      throw new Error('Not implemented yet.');
    }
    case 'style': {
      throw new Error('Not implemented yet.');
    }
    // These attributes accept URLs. These must not allow javascript: URLS.
    case 'data':
      throw new Error('Not implemented yet.');
    // fallthrough
    case 'src': {
      throw new Error('Not implemented yet.');
      // Fallthrough
    }
    case 'href': {
      throw new Error('Not implemented yet.');
    }
    case 'action':
    case 'formAction': {
      throw new Error('Not implemented yet.');
    }
    case 'onClick': {
      throw new Error('Not implemented yet.');
    }
    case 'onScroll': {
      throw new Error('Not implemented yet.');
    }
    case 'onScrollEnd': {
      throw new Error('Not implemented yet.');
    }
    case 'dangerouslySetInnerHTML': {
      throw new Error('Not implemented yet.');
    }
    // Note: `option.selected` is not updated if `select.multiple` is
    // disabled with `removeAttribute`. We have special logic for handling this.
    case 'multiple': {
      throw new Error('Not implemented yet.');
    }
    case 'muted': {
      throw new Error('Not implemented yet.');
    }
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'defaultValue': // Reserved
    case 'defaultChecked':
    case 'innerHTML':
    case 'ref': {
      // TODO: `ref` is pretty common, should we move it up?
      // Noop
      break;
    }
    case 'autoFocus': {
      // We polyfill it separately on the client during commit.
      // We could have excluded it in the property list instead of
      // adding a special case here, but then it wouldn't be emitted
      // on server rendering (but we *do* want to emit it in SSR).
      break;
    }
    case 'xlinkHref': {
      throw new Error('Not implemented yet.');
    }
    case 'contentEditable':
    case 'spellCheck':
    case 'draggable':
    case 'value':
    case 'autoReverse':
    case 'externalResourcesRequired':
    case 'focusable':
    case 'preserveAlpha': {
      throw new Error('Not implemented yet.');
    }
    // Boolean
    case 'inert': {
      throw new Error('Not implemented yet.');
    }
    // Fallthrough for boolean props that don't have a warning for empty strings.
    case 'allowFullScreen':
    case 'async':
    case 'autoPlay':
    case 'controls':
    case 'default':
    case 'defer':
    case 'disabled':
    case 'disablePictureInPicture':
    case 'disableRemotePlayback':
    case 'formNoValidate':
    case 'hidden':
    case 'loop':
    case 'noModule':
    case 'noValidate':
    case 'open':
    case 'playsInline':
    case 'readOnly':
    case 'required':
    case 'reversed':
    case 'scoped':
    case 'seamless':
    case 'itemScope': {
      throw new Error('Not implemented yet.');
    }
    // Overloaded Boolean
    case 'capture':
    case 'download': {
      throw new Error('Not implemented yet.');
    }
    case 'cols':
    case 'rows':
    case 'size':
    case 'span': {
      throw new Error('Not implemented yet.');
    }
    case 'rowSpan':
    case 'start': {
      throw new Error('Not implemented yet.');
    }
    case 'popover':
      throw new Error('Not implemented yet.');
    case 'xlinkActuate':
      throw new Error('Not implemented yet.');
    case 'xlinkArcrole':
      throw new Error('Not implemented yet.');
    case 'xlinkRole':
      throw new Error('Not implemented yet.');
    case 'xlinkShow':
      throw new Error('Not implemented yet.');
    case 'xlinkTitle':
      throw new Error('Not implemented yet.');
    case 'xlinkType':
      throw new Error('Not implemented yet.');
    case 'xmlBase':
      throw new Error('Not implemented yet.');
    case 'xmlLang':
      throw new Error('Not implemented yet.');
    case 'xmlSpace':
      throw new Error('Not implemented yet.');
    // Properties that should not be allowed on custom elements.
    case 'is': {
      throw new Error('Not implemented yet.');
    }
    case 'innerText':
    case 'textContent':
      return;
    case 'popoverTarget':
      throw new Error('Not implemented yet.');
    // Fall through
    default: {
      throw new Error('Not implemented yet.');
    }
  }
  // To avoid marking things as host mutations we do early returns above.
  trackHostMutation();
}

export function trapClickOnNonInteractiveElement(node: HTMLElement) {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  node.onclick = noop;
}
