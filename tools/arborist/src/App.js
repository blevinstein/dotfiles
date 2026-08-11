import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import htm from 'htm';
import { basename } from 'node:path';

const html = htm.bind(React.createElement);

import WorktreeList from './screens/WorktreeList.js';
import ActionMenu from './screens/ActionMenu.js';
import ConfirmAdopt from './screens/ConfirmAdopt.js';
import ConfirmClose from './screens/ConfirmClose.js';
import NewWorktree from './screens/NewWorktree.js';

import {
  addWorktree,
  branchExists,
  checkoutBranch,
  currentBranch,
  deleteBranch,
  hasUncommitted,
  isSameRepo,
  parseWorktrees,
  removeWorktree,
  repoToplevel,
} from './git.js';
import { attachOrCreate, sessionName, tmuxInstalled } from './tmux.js';

// Compute the reasons "Adopt here" is not allowed for the selected worktree.
function evaluateAdopt(worktree, cwd) {
  if (!isSameRepo(worktree.path, cwd)) return 'cwd is in a different repository';
  if (worktree.isMain) return 'cannot remove the main worktree';
  if (worktree.isCurrent) return 'cannot adopt the current worktree';
  return null;
}

// "Close out" is like adopt without the checkout — same removal constraints,
// but works from any cwd (we're not touching cwd).
function evaluateClose(worktree) {
  if (worktree.isMain) return 'cannot remove the main worktree';
  if (worktree.isCurrent) return 'cannot close out the current worktree';
  return null;
}

function gatherAdoptWarnings(worktree, cwd) {
  const warnings = [];
  if (hasUncommitted(worktree.path)) warnings.push(`worktree ${worktree.path} has uncommitted changes`);
  if (hasUncommitted(cwd)) warnings.push(`cwd ${cwd} has uncommitted changes`);
  return warnings;
}

function gatherCloseWarnings(worktree) {
  const warnings = [];
  if (hasUncommitted(worktree.path)) warnings.push(`worktree ${worktree.path} has uncommitted changes`);
  return warnings;
}

export default function App({ cwd, setPending }) {
  const { exit } = useApp();

  const [screen, setScreen] = useState('list');
  const [selected, setSelected] = useState(null);
  const [worktrees, setWorktrees] = useState(() => parseWorktrees(cwd));
  const [result, setResult] = useState(null); // { ok, title, lines }

  const refresh = () => setWorktrees(parseWorktrees(cwd));

  useInput((input, key) => {
    if (screen === 'result' && (key.return || input === 'q' || key.escape)) {
      setResult(null);
      setScreen('list');
      refresh();
    }
  });

  const openTmux = worktree => {
    if (!tmuxInstalled()) {
      setResult({ ok: false, title: 'tmux is not installed', lines: ['Install tmux to use this action.'] });
      setScreen('result');
      return;
    }
    const name = sessionName(worktree.path);
    setPending(async () => {
      try {
        await attachOrCreate(name, worktree.path);
      } catch (e) {
        console.error(`arborist: ${e.message}`);
        process.exitCode = 1;
      }
    });
    exit();
  };

  const runAdopt = worktree => {
    const rm = removeWorktree(worktree.path, cwd);
    if (!rm.ok) {
      setResult({
        ok: false,
        title: `git worktree remove failed`,
        lines: [rm.stderr.trim() || rm.stdout.trim() || `exit ${rm.status}`],
      });
      setScreen('result');
      return;
    }
    const target = worktree.detached ? worktree.head : worktree.branch;
    if (!target) {
      setResult({ ok: false, title: 'No branch to checkout', lines: ['worktree had no branch and no HEAD.'] });
      setScreen('result');
      return;
    }
    const co = checkoutBranch(target, cwd);
    if (!co.ok) {
      setResult({
        ok: false,
        title: `git checkout ${target} failed`,
        lines: [co.stderr.trim() || co.stdout.trim() || `exit ${co.status}`],
      });
      setScreen('result');
      return;
    }
    setResult({
      ok: true,
      title: `Adopted ${target} into ${cwd}`,
      lines: [
        `removed worktree at ${worktree.path}`,
        `checked out ${target}`,
        co.stdout.trim(),
      ].filter(Boolean),
    });
    setScreen('result');
  };

  const runClose = (worktree, { deleteBranch: alsoDeleteBranch }) => {
    const rm = removeWorktree(worktree.path, cwd);
    if (!rm.ok) {
      setResult({
        ok: false,
        title: `git worktree remove failed`,
        lines: [rm.stderr.trim() || rm.stdout.trim() || `exit ${rm.status}`],
      });
      setScreen('result');
      return;
    }
    const lines = [`removed worktree at ${worktree.path}`];
    if (alsoDeleteBranch && worktree.branch) {
      const del = deleteBranch(worktree.branch, cwd);
      if (!del.ok) {
        setResult({
          ok: false,
          title: `worktree removed, but git branch -D ${worktree.branch} failed`,
          lines: [del.stderr.trim() || del.stdout.trim() || `exit ${del.status}`],
        });
        setScreen('result');
        return;
      }
      lines.push(`deleted branch ${worktree.branch}`);
    }
    setResult({
      ok: true,
      title: `Closed out ${worktree.branch ?? worktree.path}`,
      lines,
    });
    setScreen('result');
  };

  const runCreate = ({ branch, path, createBranch }) => {
    const res = addWorktree({ path, branch, createBranch }, cwd);
    if (!res.ok) {
      setResult({
        ok: false,
        title: `git worktree add failed`,
        lines: [res.stderr.trim() || res.stdout.trim() || `exit ${res.status}`],
      });
      setScreen('result');
      return;
    }
    setResult({
      ok: true,
      title: `Created worktree at ${path} on ${branch}`,
      lines: [
        res.stdout.trim(),
        `Run \`arb\` again to open it in tmux.`,
      ].filter(Boolean),
    });
    setScreen('result');
  };

  if (screen === 'list') {
    return React.createElement(WorktreeList, {
      worktrees,
      cwd,
      onSelect: wt => {
        setSelected(wt);
        setScreen('action');
      },
      onNew: () => setScreen('new'),
      onQuit: () => exit(),
    });
  }

  if (screen === 'action' && selected) {
    const adoptReason = evaluateAdopt(selected, cwd);
    const closeReason = evaluateClose(selected);
    return React.createElement(ActionMenu, {
      worktree: selected,
      canAdopt: adoptReason === null,
      adoptBlockedReason: adoptReason,
      canClose: closeReason === null,
      closeBlockedReason: closeReason,
      onBack: () => {
        setSelected(null);
        setScreen('list');
      },
      onAction: action => {
        if (action === 'tmux') openTmux(selected);
        else if (action === 'adopt') setScreen('confirmAdopt');
        else if (action === 'close') setScreen('confirmClose');
      },
    });
  }

  if (screen === 'confirmClose' && selected) {
    return React.createElement(ConfirmClose, {
      worktree: selected,
      warnings: gatherCloseWarnings(selected),
      onCancel: () => setScreen('action'),
      onConfirm: opts => runClose(selected, opts),
    });
  }

  if (screen === 'confirmAdopt' && selected) {
    const warnings = gatherAdoptWarnings(selected, cwd);
    return React.createElement(ConfirmAdopt, {
      worktree: selected,
      cwd,
      cwdBranch: currentBranch(cwd),
      warnings,
      onCancel: () => setScreen('action'),
      onConfirm: () => runAdopt(selected),
    });
  }

  if (screen === 'new') {
    const parent = process.env.WORKTREE_HOME || '';
    const top = repoToplevel(cwd) ?? cwd;
    const repoName = basename(top);
    return React.createElement(NewWorktree, {
      defaultParent: parent,
      repoName,
      branchExistsFn: b => branchExists(b, cwd),
      onCancel: () => setScreen('list'),
      onCreate: runCreate,
    });
  }

  if (screen === 'result' && result) {
    return html`
      <${Box} flexDirection="column">
        <${Box} marginBottom=${1}>
          <${Text} bold=${true} color=${result.ok ? 'green' : 'red'}>
            ${result.ok ? '\u2713 ' : '\u2717 '}${result.title}
          </${Text}>
        </${Box}>
        ${result.lines.map((l, i) => html`<${Text} key=${i}>${l}</${Text}>`)}
        <${Box} marginTop=${1}>
          <${Text} dimColor=${true}>enter / q / esc → back to list</${Text}>
        </${Box}>
      </${Box}>
    `;
  }

  return null;
}
