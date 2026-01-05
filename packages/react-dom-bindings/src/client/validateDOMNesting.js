/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

type Info = {tag: string};
export type AncestorInfoDev = {
  current: ?Info,

  formTag: ?Info,
  aTagInScope: ?Info,
  buttonTagInScope: ?Info,
  nobrTagInScope: ?Info,
  pTagInButtonScope: ?Info,

  listItemTagAutoclosing: ?Info,
  dlItemTagAutoclosing: ?Info,

  // <head> or <body>
  containerTagInScope: ?Info,
  implicitRootScope: boolean,
};

// This validation code was written based on the HTML5 parsing spec:
// https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
//
// Note: this does not catch all invalid nesting, nor does it try to (as it's
// not clear what practical benefit doing so provides); instead, we warn only
// for cases where the parser will give a parse tree differing from what React
// intended. For example, <b><div></div></b> is invalid but we don't warn
// because it still parses correctly; we do warn for other cases like nested
// <p> tags where the beginning of the second element implicitly closes the
// first, causing a confusing mess.

// https://html.spec.whatwg.org/multipage/syntax.html#special
const specialTags = [
  'address',
  'applet',
  'area',
  'article',
  'aside',
  'base',
  'basefont',
  'bgsound',
  'blockquote',
  'body',
  'br',
  'button',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dir',
  'div',
  'dl',
  'dt',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'iframe',
  'img',
  'input',
  'isindex',
  'li',
  'link',
  'listing',
  'main',
  'marquee',
  'menu',
  'menuitem',
  'meta',
  'nav',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'ol',
  'p',
  'param',
  'plaintext',
  'pre',
  'script',
  'section',
  'select',
  'source',
  'style',
  'summary',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul',
  'wbr',
  'xmp',
];

// https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
const inScopeTags = [
  'applet',
  'caption',
  'html',
  'table',
  'td',
  'th',
  'marquee',
  'object',
  'template',

  // https://html.spec.whatwg.org/multipage/syntax.html#html-integration-point
  // TODO: Distinguish by namespace here -- for <title>, including it here
  // errs on the side of fewer warnings
  'foreignObject',
  'desc',
  'title',
];

// https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-button-scope
const buttonScopeTags = __DEV__ ? inScopeTags.concat(['button']) : [];

// https://html.spec.whatwg.org/multipage/syntax.html#generate-implied-end-tags
const impliedEndTags = [
  'dd',
  'dt',
  'li',
  'option',
  'optgroup',
  'p',
  'rp',
  'rt',
];

const emptyAncestorInfoDev: AncestorInfoDev = {
  current: null,

  formTag: null,
  aTagInScope: null,
  buttonTagInScope: null,
  nobrTagInScope: null,
  pTagInButtonScope: null,

  listItemTagAutoclosing: null,
  dlItemTagAutoclosing: null,

  containerTagInScope: null,
  implicitRootScope: false,
};

// 接收旧的祖先信息和当前标签，返回新的祖先信息
function updatedAncestorInfoDev(
  oldInfo: null | AncestorInfoDev,
  tag: string,
): AncestorInfoDev {
  if (__DEV__) {
    // 复制旧的祖先信息（或用空对象），创建当前标签的 info
    const ancestorInfo = {...(oldInfo || emptyAncestorInfoDev)};
    const info = {tag};

    // 遇到某些标签（如 table、td 等）会重置作用域。 比如 <table> 会打断 <a> 的作用域
    if (inScopeTags.indexOf(tag) !== -1) {
      ancestorInfo.aTagInScope = null;
      ancestorInfo.buttonTagInScope = null;
      ancestorInfo.nobrTagInScope = null;
    }

    // 遇到按钮作用域标签，重置 <p> 的作用域
    if (buttonScopeTags.indexOf(tag) !== -1) {
      ancestorInfo.pTagInButtonScope = null;
    }

    // 特殊标签会重置 <li>、<dd>、<dt> 的自动闭合追踪。 HTML 规范规定这些标签会自动闭合前一个同类标签
    if (
      specialTags.indexOf(tag) !== -1 &&
      tag !== 'address' &&
      tag !== 'div' &&
      tag !== 'p'
    ) {
      // See rules for 'li', 'dd', 'dt' start tags in
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
      ancestorInfo.listItemTagAutoclosing = null;
      ancestorInfo.dlItemTagAutoclosing = null;
    }

    // 记录当前处理的标签
    ancestorInfo.current = info;

    // 追踪特定标签
    if (tag === 'form') {
      ancestorInfo.formTag = info;
    }
    if (tag === 'a') {
      ancestorInfo.aTagInScope = info;
    }
    if (tag === 'button') {
      ancestorInfo.buttonTagInScope = info;
    }
    if (tag === 'nobr') {
      ancestorInfo.nobrTagInScope = info;
    }
    if (tag === 'p') {
      ancestorInfo.pTagInButtonScope = info;
    }
    if (tag === 'li') {
      ancestorInfo.listItemTagAutoclosing = info;
    }
    if (tag === 'dd' || tag === 'dt') {
      ancestorInfo.dlItemTagAutoclosing = info;
    }
    // 追踪列表项，用于检测自动闭合行为
    if (tag === '#document' || tag === 'html') {
      ancestorInfo.containerTagInScope = null;
    } else if (!ancestorInfo.containerTagInScope) {
      ancestorInfo.containerTagInScope = info;
    }

    // 追踪容器标签，用于检测如 <body> 只能在 <html> 里等规则
    if (
      oldInfo === null &&
      (tag === '#document' || tag === 'html' || tag === 'body')
    ) {
      // While <head> is also a singleton we don't want to support semantics where
      // you can escape the head by rendering a body singleton so we treat it like a normal scope
      ancestorInfo.implicitRootScope = true;
    } else if (ancestorInfo.implicitRootScope === true) {
      ancestorInfo.implicitRootScope = false;
    }

    return ancestorInfo;
  } else {
    return (null: any);
  }
}

export {
  updatedAncestorInfoDev,
  // validateDOMNesting,
  // validateTextNesting
};
