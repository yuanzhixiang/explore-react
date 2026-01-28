'use strict';

const {esNextPaths} = require('./scripts/shared/pathsByLanguageVersion');

module.exports = {
  bracketSpacing: false,
  singleQuote: true,
  bracketSameLine: true,
  trailingComma: 'es5',
  printWidth: 80,
  // 默认 flow 会出现奇怪的 bug，也许不是他的问题，但我们这里注释掉
  // parser: 'flow',
  arrowParens: 'avoid',
  overrides: [
    {
      files: ['**/*.{js,jsx}'],
      options: {parser: 'flow'},
    },
    {
      files: ['**/*.{json,jsonc}', '.vscode/*.json'],
      options: {parser: 'jsonc'},
    },
    {
      files: ['*.code-workspace'],
      options: {
        parser: 'json-stringify',
      },
    },
    {
      files: esNextPaths,
      options: {
        trailingComma: 'all',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        trailingComma: 'all',
        parser: 'typescript',
      },
    },
  ],
};
