#!/usr/bin/env node
// arborist: a TUI for git worktrees + tmux
// Usage: node ~/tools/arborist/index.js   (or the `arb` bash function)

import React from 'react';
import { render } from 'ink';
import App from './src/App.js';
import { isGitRepo } from './src/git.js';

const cwd = process.cwd();

if (!isGitRepo(cwd)) {
  console.error(`arborist: not inside a git repository (cwd: ${cwd})`);
  process.exit(1);
}

let pending = null;
const setPending = fn => {
  pending = fn;
};

const { waitUntilExit } = render(React.createElement(App, { cwd, setPending }), {
  exitOnCtrlC: true,
});

try {
  await waitUntilExit();
} catch (e) {
  console.error(`arborist: ${e.message}`);
  process.exit(1);
}

if (pending) {
  await pending();
}
