/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Keep in sync with ReactServerConsoleConfig
const badgeFormat = "%c%s%c";
// Same badge styling as DevTools.
const badgeStyle =
  // We use a fixed background if light-dark is not supported, otherwise
  // we use a transparent background.
  "background: #e6e6e6;" +
  "background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.25));" +
  "color: #000000;" +
  "color: light-dark(#000000, #ffffff);" +
  "border-radius: 2px";
const resetStyle = "";
const pad = " ";

const bind = Function.prototype.bind;
