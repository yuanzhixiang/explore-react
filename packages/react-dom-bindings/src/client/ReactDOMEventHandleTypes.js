/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {DOMEventName} from '../events/DOMEventNames';
// TODO 这里的 typeof 沾到业务逻辑了，先不抄这个
// import typeof {SyntheticEvent} from '../events/SyntheticEvent';

// export type ReactDOMEventHandle = (
//   target: EventTarget | ReactScopeInstance,
//   callback: (SyntheticEvent) => void,
// ) => () => void;

// export type ReactDOMEventHandleListener = {
//   callback: SyntheticEvent => void,
//   capture: boolean,
//   type: DOMEventName,
// };
