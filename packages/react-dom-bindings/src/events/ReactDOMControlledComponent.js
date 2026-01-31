/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// import {
//   getInstanceFromNode,
//   getFiberCurrentPropsFromNode,
// } from '../client/ReactDOMComponentTree';

// import {restoreControlledState} from 'react-dom-bindings/src/client/ReactDOMComponent';

// Use to restore controlled state after a change event has fired.

let restoreTarget = null;
let restoreQueue = null;

export function needsStateRestore(): boolean {
  return restoreTarget !== null || restoreQueue !== null;
}

export function restoreStateIfNeeded() {
  if (!restoreTarget) {
    return;
  }
  const target = restoreTarget;
  const queuedTargets = restoreQueue;
  restoreTarget = null;
  restoreQueue = null;

  restoreStateOfTarget(target);
  if (queuedTargets) {
    for (let i = 0; i < queuedTargets.length; i++) {
      restoreStateOfTarget(queuedTargets[i]);
    }
  }
}

function restoreStateOfTarget(target: Node) {
  throw new Error('Not implemented yet.');
}
