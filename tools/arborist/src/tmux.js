import { spawnSync, spawn } from 'node:child_process';
import { basename } from 'node:path';

export function tmuxInstalled() {
  const r = spawnSync('tmux', ['-V'], { stdio: ['ignore', 'pipe', 'pipe'] });
  return r.status === 0;
}

export function insideTmux() {
  return Boolean(process.env.TMUX);
}

// tmux session names cannot contain '.' or ':'; also strip whitespace and unusual chars.
export function sessionName(worktreePath) {
  const base = basename(worktreePath) || 'worktree';
  return base.replace(/[.:\s]/g, '_');
}

export function hasSession(name) {
  const r = spawnSync('tmux', ['has-session', '-t', `=${name}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return r.status === 0;
}

// Ensure a detached session exists at `path` with `name`. No-op if it already exists.
export function ensureSession(name, path) {
  if (hasSession(name)) return { ok: true };
  const r = spawnSync('tmux', ['new-session', '-d', '-s', name, '-c', path], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  return { ok: r.status === 0, stderr: r.stderr ?? '' };
}

// Attach to (or create and attach to) a session with inherited stdio.
// - If already inside tmux: create detached if needed, then switch-client.
// - Otherwise: new-session -A (attach or create) with stdio inherited.
// Returns a Promise that resolves when the tmux process exits.
export function attachOrCreate(name, path) {
  return new Promise((resolveP, rejectP) => {
    if (insideTmux()) {
      const ensured = ensureSession(name, path);
      if (!ensured.ok) {
        rejectP(new Error(`failed to create tmux session: ${ensured.stderr.trim()}`));
        return;
      }
      const r = spawnSync('tmux', ['switch-client', '-t', name], {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
      if (r.status !== 0) {
        rejectP(new Error(`tmux switch-client failed: ${(r.stderr ?? '').trim()}`));
        return;
      }
      resolveP({ code: 0 });
      return;
    }

    const child = spawn('tmux', ['new-session', '-A', '-s', name, '-c', path], {
      stdio: 'inherit',
    });
    child.on('error', rejectP);
    child.on('exit', code => resolveP({ code: code ?? 0 }));
  });
}
