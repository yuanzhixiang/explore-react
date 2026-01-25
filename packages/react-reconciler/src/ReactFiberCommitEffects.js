/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ViewTransitionProps,
  ProfilerProps,
  ProfilerPhase,
} from 'shared/ReactTypes';
import type {Fiber} from './ReactInternalTypes';
import type {UpdateQueue} from './ReactFiberClassUpdateQueue';
// import type {FunctionComponentUpdateQueue} from './ReactFiberHooks';
import type {HookFlags} from './ReactHookEffectTags';
import type {FragmentInstanceType} from './ReactFiberConfig';
import type {ViewTransitionState} from './ReactFiberViewTransitionComponent';

// import {getViewTransitionName} from './ReactFiberViewTransitionComponent';

import {
  enableProfilerTimer,
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableSchedulingProfiler,
  enableViewTransition,
  enableFragmentRefs,
} from 'shared/ReactFeatureFlags';
import {
  ClassComponent,
  Fragment,
  HostComponent,
  HostHoistable,
  HostSingleton,
  ViewTransitionComponent,
} from './ReactWorkTags';
import {NoFlags} from './ReactFiberFlags';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
// import {resolveClassComponentProps} from './ReactFiberClassComponent';
// import {
//   recordEffectDuration,
//   startEffectTimer,
//   isCurrentUpdateNested,
// } from './ReactProfilerTimer';
import {NoMode, ProfileMode} from './ReactTypeOfMode';
// import {
//   commitCallbacks,
//   commitHiddenCallbacks,
// } from './ReactFiberClassUpdateQueue';
// import {
//   getPublicInstance,
//   createViewTransitionInstance,
//   createFragmentInstance,
// } from './ReactFiberConfig';
// import {
//   captureCommitPhaseError,
//   setIsRunningInsertionEffect,
// } from './ReactFiberWorkLoop';
import {
  NoFlags as NoHookEffect,
  Layout as HookLayout,
  Insertion as HookInsertion,
  Passive as HookPassive,
} from './ReactHookEffectTags';
import {didWarnAboutReassigningProps} from './ReactFiberBeginWork';
// import {
//   markComponentPassiveEffectMountStarted,
//   markComponentPassiveEffectMountStopped,
//   markComponentPassiveEffectUnmountStarted,
//   markComponentPassiveEffectUnmountStopped,
//   markComponentLayoutEffectMountStarted,
//   markComponentLayoutEffectMountStopped,
//   markComponentLayoutEffectUnmountStarted,
//   markComponentLayoutEffectUnmountStopped,
// } from './ReactFiberDevToolsHook';
// import {
//   callComponentDidMountInDEV,
//   callComponentDidUpdateInDEV,
//   callComponentWillUnmountInDEV,
//   callCreateInDEV,
//   callDestroyInDEV,
// } from './ReactFiberCallUserSpace';

import {runWithFiberInDEV} from './ReactCurrentFiber';

export function safelyDetachRef(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  const ref = current.ref;
  const refCleanup = current.refCleanup;

  if (ref !== null) {
    throw new Error('Not implemented yet.');
  }
}
