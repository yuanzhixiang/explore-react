/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable no-var */
import type {PriorityLevel} from '../SchedulerPriorities';

// import {
//   enableProfiling,
//   frameYieldMs,
//   userBlockingPriorityTimeout,
//   lowPriorityTimeout,
//   normalPriorityTimeout,
//   enableRequestPaint,
//   enableAlwaysYieldScheduler,
// } from '../SchedulerFeatureFlags';

// import {push, pop, peek} from '../SchedulerMinHeap';

// // TODO: Use symbols?
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from '../SchedulerPriorities';
// import {
//   markTaskRun,
//   markTaskYield,
//   markTaskCompleted,
//   markTaskCanceled,
//   markTaskErrored,
//   markSchedulerSuspended,
//   markSchedulerUnsuspended,
//   markTaskStart,
//   stopLoggingProfilingEvents,
//   startLoggingProfilingEvents,
// } from '../SchedulerProfiling';

export type Callback = boolean => ?Callback;

export opaque type Task = {
  id: number,
  callback: Callback | null,
  priorityLevel: PriorityLevel,
  startTime: number,
  expirationTime: number,
  sortIndex: number,
  isQueued?: boolean,
};

let getCurrentTime: () => number | DOMHighResTimeStamp;
const hasPerformanceNow =
  // $FlowFixMe[method-unbinding]
  typeof performance === 'object' && typeof performance.now === 'function';

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Tasks are stored on a min heap
var taskQueue: Array<Task> = [];
var timerQueue: Array<Task> = [];

// Incrementing id counter. Used to maintain insertion order.
var taskIdCounter = 1;

var currentTask = null;
var currentPriorityLevel: PriorityLevel = NormalPriority;

// This is set while performing work, to prevent re-entrance.
var isPerformingWork = false;

var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;

var needsPaint = false;

// Capture local references to native APIs, in case a polyfill overrides them.
const localSetTimeout = typeof setTimeout === 'function' ? setTimeout : null;
const localClearTimeout =
  typeof clearTimeout === 'function' ? clearTimeout : null;
const localSetImmediate =
  typeof setImmediate !== 'undefined' ? setImmediate : null; // IE and Node.js + jsdom

function unstable_getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

export {
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  IdlePriority as unstable_IdlePriority,
  LowPriority as unstable_LowPriority,
  // unstable_runWithPriority,
  // unstable_next,
  // unstable_scheduleCallback,
  // unstable_cancelCallback,
  // unstable_wrapCallback,
  unstable_getCurrentPriorityLevel,
  // shouldYieldToHost as unstable_shouldYield,
  // requestPaint as unstable_requestPaint,
  getCurrentTime as unstable_now,
  // forceFrameRate as unstable_forceFrameRate,
};
