/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';

import {getEventPriority} from '../events/ReactDOMEventListener';
import {
  NoEventPriority,
  DefaultEventPriority,
} from 'react-reconciler/src/ReactEventPriorities';

// import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';

export function resolveUpdatePriority(): EventPriority {
  // const updatePriority = ReactDOMSharedInternals.p; /* currentUpdatePriority */
  // if (updatePriority !== NoEventPriority) {
  //   return updatePriority;
  // }
  // const currentEvent = window.event;
  // if (currentEvent === undefined) {
  //   return DefaultEventPriority;
  // }
  // return getEventPriority(currentEvent.type);
  throw new Error('Not implemented');
}
