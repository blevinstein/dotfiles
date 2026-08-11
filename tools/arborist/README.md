# arborist

A tiny TUI for managing git worktrees + tmux.

## Install

The `arb` function lives in `~/.bash_compat` (shared across machines):

```bash
function arb {
  node ~/tools/arborist/index.js "$@"
}
```

Per-machine, set the default parent dir for new worktrees in `~/.bash_local`:

```bash
export WORKTREE_HOME="$HOME/worktrees"
```

Reload your shell and run `arb` from inside any git repo.

Dependencies: `git`, `tmux`, `node` (v18+). Works on macOS and Linux.

## Usage

Run `arb` from anywhere inside a git repo. You'll see a list of worktrees for that
repo plus a `+ New worktree` entry.

Selecting an existing worktree opens an action menu:

1. **Open in tmux** — attach to (or create) a tmux session named after the worktree's
   directory. If you're already inside tmux, it uses `switch-client`; otherwise
   it runs `tmux new-session -A -s <name> -c <path>`.
2. **Adopt here** — remove the worktree and check out its branch in the current
   folder. Only offered when it's safe:
     - cwd is inside the same repo
     - the selected worktree is neither the primary nor the current one
     - uncommitted changes in either the worktree or cwd are surfaced as warnings
       (the operation is not forced; git will refuse if a checkout would clobber
       uncommitted work)
3. **Close out** — remove the worktree without touching cwd, when you're done
   with a change. A follow-up prompt offers to also `git branch -D` the branch.
   Same primary/current guards as Adopt.
4. **Back**

Selecting `+ New worktree` walks you through:

1. Branch name (existing or new)
2. Path — defaults to `$WORKTREE_HOME/<repo>/<branch>`
3. Confirm → `git worktree add [-b] <path> <branch>`

If the branch doesn't exist locally, it's created from the current `HEAD` of the
repo you launched `arb` from.

## Keybindings

- `↑` / `↓` — move
- `enter` — select
- `q` / `esc` — back / quit

## Layout

```
~/tools/arborist/
  index.js               # entry: verifies git repo, renders <App/>, handles shell-out
  src/
    App.js               # screen router + app-level actions
    git.js               # git wrappers
    tmux.js              # tmux helpers (session name, has-session, attach/switch)
    screens/
      WorktreeList.js
      ActionMenu.js
      ConfirmAdopt.js
      ConfirmClose.js
      NewWorktree.js
```

Screens are React components rendered by [ink](https://github.com/vadimdemedes/ink)
using [htm](https://github.com/developit/htm) for JSX-like syntax without a build step.

## Notes / non-goals

- No fuzzy search (arrow keys only).
- New branches are always based on `HEAD` of the repo you launched from.
- No worktree pruning UI — run `git worktree prune` manually.
- No tests.
