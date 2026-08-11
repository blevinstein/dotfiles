import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

function runGit(args, opts = {}) {
  const res = spawnSync('git', args, {
    encoding: 'utf8',
    cwd: opts.cwd ?? process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: res.status === 0,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
    status: res.status,
  };
}

export function isGitRepo(cwd = process.cwd()) {
  return runGit(['rev-parse', '--is-inside-work-tree'], { cwd }).ok;
}

export function repoToplevel(cwd = process.cwd()) {
  const r = runGit(['rev-parse', '--show-toplevel'], { cwd });
  return r.ok ? r.stdout.trim() : null;
}

export function repoCommonDir(cwd = process.cwd()) {
  const r = runGit(['rev-parse', '--git-common-dir'], { cwd });
  if (!r.ok) return null;
  return resolve(cwd, r.stdout.trim());
}

export function currentBranch(cwd = process.cwd()) {
  const r = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  return r.ok ? r.stdout.trim() : null;
}

// Parse `git worktree list --porcelain` output.
// Returns array of { path, head, branch (short name or null), detached, isMain, isCurrent, isBare, isLocked }.
export function parseWorktrees(cwd = process.cwd()) {
  const r = runGit(['worktree', 'list', '--porcelain'], { cwd });
  if (!r.ok) throw new Error(`git worktree list failed: ${r.stderr.trim()}`);

  const worktrees = [];
  let current = null;
  const flush = () => {
    if (current && current.path) worktrees.push(current);
    current = null;
  };

  for (const rawLine of r.stdout.split('\n')) {
    const line = rawLine.trimEnd();
    if (line === '') {
      flush();
      continue;
    }
    if (line.startsWith('worktree ')) {
      flush();
      current = {
        path: line.slice('worktree '.length),
        head: null,
        branch: null,
        detached: false,
        isBare: false,
        isLocked: false,
      };
    } else if (!current) {
      continue;
    } else if (line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
    } else if (line.startsWith('branch ')) {
      const ref = line.slice('branch '.length);
      current.branch = ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : ref;
    } else if (line === 'detached') {
      current.detached = true;
    } else if (line === 'bare') {
      current.isBare = true;
    } else if (line.startsWith('locked')) {
      current.isLocked = true;
    }
  }
  flush();

  const commonDir = repoCommonDir(cwd);
  const top = repoToplevel(cwd);
  const cwdReal = resolve(cwd);

  return worktrees.map((wt, idx) => ({
    ...wt,
    isMain: idx === 0,
    isCurrent: top !== null && resolve(wt.path) === resolve(top) && cwdReal.startsWith(resolve(wt.path)),
    commonDir,
  }));
}

export function isSameRepo(worktreePath, cwd = process.cwd()) {
  const a = repoCommonDir(worktreePath);
  const b = repoCommonDir(cwd);
  if (!a || !b) return false;
  return resolve(a) === resolve(b);
}

export function hasUncommitted(cwd = process.cwd()) {
  const r = runGit(['status', '--porcelain'], { cwd });
  if (!r.ok) return false;
  return r.stdout.trim().length > 0;
}

export function branchExists(branch, cwd = process.cwd()) {
  const r = runGit(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd });
  return r.ok;
}

export function listLocalBranches(cwd = process.cwd()) {
  const r = runGit(['for-each-ref', '--format=%(refname:short)', 'refs/heads/'], { cwd });
  if (!r.ok) return [];
  return r.stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

export function addWorktree({ path, branch, createBranch, base }, cwd = process.cwd()) {
  const args = ['worktree', 'add'];
  if (createBranch) {
    args.push('-b', branch, path);
    if (base) args.push(base);
  } else {
    args.push(path, branch);
  }
  return runGit(args, { cwd });
}

export function removeWorktree(path, cwd = process.cwd()) {
  return runGit(['worktree', 'remove', path], { cwd });
}

export function checkoutBranch(branch, cwd = process.cwd()) {
  return runGit(['checkout', branch], { cwd });
}

// Force-delete a local branch (equivalent to `git branch -D`).
export function deleteBranch(branch, cwd = process.cwd()) {
  return runGit(['branch', '-D', branch], { cwd });
}
