---
name: use-vet
description: >-
  Intercepts curl commands and routes them through the `vet` security gate.
  Use whenever you are about to run `curl` — prefix it with `vet` instead
  (e.g. `vet curl https://…`). If vet exits 78 (parse error / daemon down),
  retry without the prefix. If it exits 77 (denied), stop and tell the user.
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
