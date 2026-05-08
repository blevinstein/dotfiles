---
name: use-vet
description: >-
  ALWAYS prefix every `curl` invocation with `vet` (e.g. `vet curl https://…`)
  — no exceptions. This applies to ALL curl usage: API calls, downloads,
  health checks, debugging, one-liners, scripts, anything. Never run a bare
  `curl` first and only fall back to `vet` if something fails — start with
  `vet curl` every single time. The ONLY situation in which you may run bare
  `curl` is when `vet` itself is unavailable: it is not installed (`command
  -v vet` is empty) OR a previous `vet curl` invocation exited 78 (parse
  error / daemon unreachable) for this exact command. If `vet` exits 77
  (denied by policy), STOP — do not retry without the prefix; report the
  block to the user and ask them to update their allowlist. Use this skill
  every time you reach for `curl`, including inside pipelines, command
  substitutions, and shell scripts.
---

# Skill: Prefix commands with `vet`

## Purpose

`vet` is a local security gate that intercepts CLI commands, parses them,
and checks them against an allowlist before executing. It runs as a
background daemon (`vetterd`) that evaluates every command and either
allows it (then execs it transparently) or denies it (exits non-zero
without running anything).

Using `vet` lets the user review and control what network requests,
file writes, and other sensitive operations you perform on their behalf.

## Which commands to prefix

Prefix **only the following commands** with `vet`:

- `curl`

Additional commands will be added to this list over time. Do not prefix
other commands — `vet` will parse-error on unrecognised commands and
you will lose time.

## How to use it

Replace the bare command with `vet <command> [args...]`:

```bash
# Instead of:
curl https://api.example.com/data

# Write:
vet curl https://api.example.com/data
```

The exit code, stdout, and stderr are identical to running the command
directly when allowed. Nothing about your argument syntax changes.

## What to do if `vet` errors

`vet` exits **78** (config error) when it cannot parse the command or
the daemon is unreachable. It exits **77** when the command is denied by
policy.

- **Exit 78 / parse error / unrecognised command**: fall back silently
  to running the command the normal way (without the `vet` prefix).
  Do not mention `vet` in your output — just run the command.
- **Exit 77 / denied**: do NOT retry without the prefix. Report to the
  user that the command was blocked and ask them to add an allowlist
  rule with `vet allow add` or adjust their policy.
- **Any other non-zero exit**: that is the wrapped command's own exit
  code; handle it the same way you would without `vet`.

## Quick reference

| Situation | Action |
|---|---|
| Recognised command, allowed | Transparent — no change needed |
| Recognised command, denied (exit 77) | Stop and tell the user |
| Unrecognised command or exit 78 | Retry without `vet` prefix |
| Daemon not running | Exit 78; retry without prefix |
