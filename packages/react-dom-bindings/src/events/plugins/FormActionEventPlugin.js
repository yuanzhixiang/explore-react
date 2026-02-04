/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from '../PluginModuleType';
import type {DOMEventName} from '../DOMEventNames';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {FormStatus} from 'react-dom-bindings/src/shared/ReactDOMFormActions';

import {enableTrustedTypesIntegration} from 'shared/ReactFeatureFlags';
import {getFiberCurrentPropsFromNode} from '../../client/ReactDOMComponentTree';
// import {startHostTransition} from 'react-reconciler/src/ReactFiberReconciler';
// import {didCurrentEventScheduleTransition} from 'react-reconciler/src/ReactFiberRootScheduler';
// import sanitizeURL from 'react-dom-bindings/src/shared/sanitizeURL';
// import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';

import {SyntheticEvent} from '../SyntheticEvent';

/**
 * This plugin invokes action functions on forms, inputs and buttons if
 * the form doesn't prevent default.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  maybeTargetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
) {
  if (domEventName !== 'submit') {
    return;
  }
  if (!maybeTargetInst || maybeTargetInst.stateNode !== nativeEventTarget) {
    // If we're inside a parent root that itself is a parent of this root, then
    // its deepest target won't be the actual form that's being submitted.
    return;
  }
  throw new Error('Not implemented yet.');
}

export {extractEvents};
