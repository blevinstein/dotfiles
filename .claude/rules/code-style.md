---
description: Brian's personal code-style preferences (applies across all repos)
alwaysApply: true
---

# Personal Code Style

These are personal preferences layered on top of whatever a given repo's
`AGENTS.md` / `CLAUDE.md` / linter config says. Repo-specific rules always win
if they conflict with anything here.

## General

- I REALLY don't like repeated code; this is a code smell indicating we should consider refactoring.
- I don't like hand-rolling complex code, e.g. cryptography or encodings, that could be provided by
  a library or other dependency.

## Testing

- Tests should have almost no independent functions defined; mostly these should be in helper files,
  or used only for creating fake data and such.

## Code Comments

- DO NOT add comments unnecessarily, or overly-verbose comments, or in a context where they are
  out-of-place.
- When composing a change, DO NOT remove comments that predate your change, UNLESS they were
  inaccurate, or you are replacing them with something better (more informative, more concise, etc)
- Comments should never refer to bug numbers, except in the context of a TODO item.
- Comments may provide permanent links to confluence or other documentation for reference.


