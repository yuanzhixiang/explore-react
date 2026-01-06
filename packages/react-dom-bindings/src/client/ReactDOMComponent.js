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
// import setTextContent from './setTextContent';
// import {
//   createDangerousStringForStyles,
//   setValueForStyles,
// } from './CSSPropertyOperations';
import {SVG_NAMESPACE, MATH_NAMESPACE} from './DOMNamespaces';
// import isCustomElement from '../shared/isCustomElement';
// import getAttributeAlias from '../shared/getAttributeAlias';
// import possibleStandardNames from '../shared/possibleStandardNames';
// import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
// import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
// import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';
// import sanitizeURL from '../shared/sanitizeURL';

import noop from 'shared/noop';

// import {trackHostMutation} from 'react-reconciler/src/ReactFiberMutationTracking';

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
  throw new Error('Not implemented yet.');
}
