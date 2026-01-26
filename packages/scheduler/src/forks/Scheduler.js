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

import {
  enableProfiling,
  frameYieldMs,
  userBlockingPriorityTimeout,
  lowPriorityTimeout,
  normalPriorityTimeout,
  enableRequestPaint,
  enableAlwaysYieldScheduler,
} from '../SchedulerFeatureFlags';

import {push, pop, peek} from '../SchedulerMinHeap';

// // TODO: Use symbols?
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from '../SchedulerPriorities';
import {
  markTaskRun,
  markTaskYield,
  markTaskCompleted,
  markTaskCanceled,
  markTaskErrored,
  markSchedulerSuspended,
  markSchedulerUnsuspended,
  markTaskStart,
  stopLoggingProfilingEvents,
  startLoggingProfilingEvents,
} from '../SchedulerProfiling';

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
// 存放可立即执行的任务
var taskQueue: Array<Task> = [];
// 存放延迟任务（通过 delay 参数调度的任务）
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

// 将 timerQueue 中到期的任务转移到 taskQueue 中
function advanceTimers(currentTime: number) {
  // Check for tasks that are no longer delayed and add them to the queue.
  // peek 获取 timerQueue 队首元素（不移除）。这是最早应该执行的延迟任务
  let timer = peek(timerQueue);
  // 循环处理队列中的任务，直到队列为空
  while (timer !== null) {
    // 如果 callback 为 null，说明任务被取消了
    if (timer.callback === null) {
      // Timer was cancelled.
      // 直接移除
      pop(timerQueue);
    }
    // 任务的开始时间 ≤ 当前时间，说明延迟时间已过，任务该执行了
    else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      // 从 timerQueue 移除
      pop(timerQueue);
      // 设置 sortIndex 为过期时间（taskQueue 按这个排序，过期时间越早优先级越高）
      timer.sortIndex = timer.expirationTime;
      // 放入 taskQueue 等待执行
      push(taskQueue, timer);

      // 性能分析相关，标记任务开始时间
      if (enableProfiling) {
        markTaskStart(timer, currentTime);
        timer.isQueued = true;
      }
    } else {
      // Remaining timers are pending.
      // 任务还没到期，直接返回。因为 timerQueue 是按 startTime 排序的小顶堆，
      // 当前任务没到期，后面的肯定也没到期，不用继续遍历了。
      return;
    }
    // 处理完一个任务后，获取下一个继续循环。
    timer = peek(timerQueue);
  }
}

const performWorkUntilDeadline = () => {
  if (enableRequestPaint) {
    needsPaint = false;
  }
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    // Keep track of the start time so we can measure how long the main thread
    // has been blocked.
    startTime = currentTime;

    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    //
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `flushWork` errors, then `hasMoreWork` will
    // remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      hasMoreWork = flushWork(currentTime);
    } catch (error) {
      console.log('Error occurred during performWorkUntilDeadline: ', error);
      throw error;
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        // 如果还有任务要执行，就继续调度下一次执行
        // @why 我们暂时先注释这里，不然现在内部出现异常会导致死循环
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
};

function flushWork(initialTime: number) {
  if (enableProfiling) {
    markSchedulerUnsuspended(initialTime);
  }

  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    if (enableProfiling) {
      throw new Error('Not implemented');
    } else {
      // No catch in prod code path.
      return workLoop(initialTime);
    }
  } catch (error) {
    console.log('Error occurred during flushWork: ', error);
    throw error;
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
    if (enableProfiling) {
      const currentTime = getCurrentTime();
      markSchedulerSuspended(currentTime);
    }
  }
}

function workLoop(initialTime: number) {
  let currentTime = initialTime;
  // 将 timerQueue 中到期的任务转移到 taskQueue 中
  advanceTimers(currentTime);
  // 取出 taskQueue 中优先级最高的任务（过期时间最早的任务）
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    // 如果没有启用"总是让出"模式，才执行下面的判断
    if (!enableAlwaysYieldScheduler) {
      if (
        // 当前任务还没过期（还有时间可以等）
        currentTask.expirationTime > currentTime &&
        // 已经工作超过 5ms，该让出主线程了
        shouldYieldToHost()
      ) {
        // This currentTask hasn't expired, and we've reached the deadline.
        break;
      }
    }

    // $FlowFixMe[incompatible-use] found when upgrading Flow
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      // 先把任务的 callback 置为 null
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentTask.callback = null;

      // 把当前任务的优先级保存到全局变量 currentPriorityLevel。
      // 这样在任务执行过程中，其他代码可以知道当前正在执行什么优先级的任务。
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      currentPriorityLevel = currentTask.priorityLevel;

      // 判断任务是否已经超时/过期
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;

      // 性能分析相关，记录任务开始执行的时间点
      if (enableProfiling) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        markTaskRun(currentTask, currentTime);
      }

      // 执行任务的回调函数
      const continuationCallback = callback(didUserCallbackTimeout);
      // 重新获取当前时间
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        throw new Error('Not implemented');
      } else {
        if (enableProfiling) {
          throw new Error('Not implemented');
        }
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      throw new Error('Not implemented');
    }
    currentTask = peek(taskQueue);
    if (enableAlwaysYieldScheduler) {
      if (currentTask === null || currentTask.expirationTime > currentTime) {
        // This currentTask hasn't expired we yield to the browser task.
        break;
      }
    }
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      // requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      throw new Error('Not implemented yet');
    }
    return false;
  }
}

let schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === 'function') {
  throw new Error('Not implemented');
} else if (typeof MessageChannel !== 'undefined') {
  // DOM and Worker environments.
  // We prefer MessageChannel because of the 4ms setTimeout clamping.
  // 创建一个 MessageChannel，用于在同一线程里发送消息（触发微任务/宏任务式回调）
  const channel = new MessageChannel();
  // 取出 port2，后面用它来发送消息
  const port = channel.port2;
  // 给 port1 绑定消息回调，一旦收到消息就执行 performWorkUntilDeadline
  channel.port1.onmessage = performWorkUntilDeadline;
  // 定义调度函数
  schedulePerformWorkUntilDeadline = () => {
    // 通过 port2 发送一条消息到 port1，触发上面的回调
    port.postMessage(null);
  };
} else {
  throw new Error('Not implemented');
}

function unstable_getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number},
): Task {
  var currentTime = getCurrentTime();

  var startTime;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      // Times out immediately
      timeout = -1;
      break;
    case UserBlockingPriority:
      // Eventually times out
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      // Never times out
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      // Eventually times out
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      // Eventually times out
      timeout = normalPriorityTimeout;
      break;
  }

  var expirationTime = startTime + timeout;

  var newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }

  if (startTime > currentTime) {
    throw new Error('Not implemented');
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }

    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback();
    }
  }

  return newTask;
}

let isMessageLoopRunning = false;
let taskTimeoutID: TimeoutID = (-1: any);

// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
// 每帧的时间间隔，默认是 5ms（frameYieldMs 的值）。这是 Scheduler 允许连续执行任务的最大时长。
let frameInterval: number = frameYieldMs;
// 记录当前工作循环的开始时间，会在 workLoop 开始时被设置。
let startTime = -1;

// 判断是否应该让出控制权给浏览器（host）
function shouldYieldToHost(): boolean {
  // 如果有绘制需求（needsPaint 为 true），立即让出，让浏览器可以尽快渲染
  if (!enableAlwaysYieldScheduler && enableRequestPaint && needsPaint) {
    // Yield now.
    return true;
  }
  // 计算从工作开始到现在过了多久
  const timeElapsed = getCurrentTime() - startTime;
  // 如果时间还没超过 5ms，继续执行，不让出
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }
  // Yield now.
  // 超过 5ms 了，让出主线程
  return true;
}

function requestHostCallback() {
  // 这是一个标志，表示消息循环是否正在运行
  if (!isMessageLoopRunning) {
    // 只有当消息循环没有运行时，才会启动它（避免重复调度）
    isMessageLoopRunning = true;
    // 这个函数会安排一个宏任务（通过 MessageChannel 或 setTimeout），
    // 在下一个事件循环中执行 performWorkUntilDeadline
    schedulePerformWorkUntilDeadline();
  }
}

function requestPaint() {
  if (enableRequestPaint) {
    needsPaint = true;
  }
}

export {
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  IdlePriority as unstable_IdlePriority,
  LowPriority as unstable_LowPriority,
  // unstable_runWithPriority,
  // unstable_next,
  unstable_scheduleCallback,
  // unstable_cancelCallback,
  // unstable_wrapCallback,
  unstable_getCurrentPriorityLevel,
  // shouldYieldToHost as unstable_shouldYield,
  requestPaint as unstable_requestPaint,
  getCurrentTime as unstable_now,
  // forceFrameRate as unstable_forceFrameRate,
};

function cancelHostTimeout() {
  // $FlowFixMe[not-a-function] nullable value
  localClearTimeout(taskTimeoutID);
  taskTimeoutID = ((-1: any): TimeoutID);
}
