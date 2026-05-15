---
name: session-wrap-up
description: Memorialize learnings from the current session — what failed, what the user had to correct, what worked well, and what reusable artifacts were built. Use when the user says "wrap up", "end of session", "summarize learnings", "memorialize this session", or wants to capture session knowledge before closing.
disable-model-invocation: true
---

# Session Wrap-Up

Review the current session and propose a set of durable changes to capture what was learned.

## Step 1: Review the Session

Gather context about what happened during the session:

- Reflect on the current conversation thread — what was discussed, tried, and built
- Run `git diff HEAD` and `git log --oneline -20` to see what changed in the repo
- Note any scripts, queries, config files, or other artifacts created or modified

## Step 2: Categorize Learnings

Organize findings into these categories. Skip any category with nothing notable.

**Failures and dead ends**
- Approaches that were tried and didn't work, and why
- Commands, APIs, or patterns that behaved unexpectedly

**Corrections from the user**
- Cases where the user had to redirect or correct the agent
- What the correct approach turned out to be

**Things that worked well**
- Patterns, tools, commands, or workflows that were effective
- Shortcuts or techniques worth repeating

**Reusable artifacts**
- Scripts, queries, or helpers written during the session that could be useful again
- Config snippets or templates worth preserving

**Tool suggestions** (proactive)
- New CLI tools, MCP servers, or other integrations that would have made the session easier or faster

## Step 3: Decide Where to Save Each Learning

For each learning, choose the most appropriate destination:

| Destination | When to use |
|---|---|
| `~/.claude/skills/<name>/SKILL.md` | Reusable cross-project procedure or workflow |
| `~/.claude/skills/<name>/scripts/` | Script that belongs to a skill — lives alongside the SKILL.md that documents how to use it |
| Project scripts folder | Script that is specific to this project and not useful elsewhere; document it in the project's `AGENTS.md` or equivalent agent-facing markdown |
| Project `AGENTS.md` (root) | Permanent guidance applicable to all agents working in this repo |
| `.cursor/rules/<name>.mdc` | Situational guidance; set the `description` frontmatter field to control when it auto-applies |

It is fine to propose **no changes** if the session was routine and nothing novel was learned.

## Step 4: Present the Proposal

If there are **no changes to propose**, say so directly — do not switch to plan mode.

If there are changes to propose, **switch to Plan mode before presenting them.** Nothing should be written until the user reviews and approves.

The proposal should cover:

1. Each learning and where you propose to save it
2. The specific content you would write (full file contents or diffs, not just summaries)
3. Any tool suggestions, framed as recommendations (not something to implement automatically)

Once the user confirms the plan, switch back to agent mode and implement the approved changes.

