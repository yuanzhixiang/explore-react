// var React = require('react');
// // React 18+ 的挂载入口在 react-dom/client
// var ReactDOMClient = require('react-dom/client');

import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';

function App() {
  return <h1>Hello World!</h1>;
}

var container = document.getElementById('container');
var root = ReactDOMClient.createRoot(container);
// TODO 这里的例子最好要能换成 jsx 的原生写法
root.render(<h1>Hello World!</h1>);
