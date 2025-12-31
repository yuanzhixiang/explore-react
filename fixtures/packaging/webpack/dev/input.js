// var React = require('react');
// // React 18+ 的挂载入口在 react-dom/client
// var ReactDOMClient = require('react-dom/client');

import * as React from "react";
import * as ReactDOMClient from "react-dom/client";

var container = document.getElementById("container");
var root = ReactDOMClient.createRoot(container);
root.render(React.createElement("h1", null, "Hello World!"));
