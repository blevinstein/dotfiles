---
name: incorporate-review
description: >-
  Fetch PR review comments with gh, assess them against the code, and produce a
  plan (plus draft replies for deferred items). Use when the user wants to
  incorporate review feedback, address PR comments, triage reviewer notes, or
  respond to a code review on the current branch.
user_invocable: true
---

# Incorporate Review

Triage open PR review feedback into a plan. Do **not** implement fixes until the
user chooses which items to address.

## Preconditions

1. Ensure `gh` is available (`command -v gh`). If missing, **stop**. Tell the
   user to install/authenticate GitHub CLI and link docs:
   - Install / overview: https://cli.github.com/
   - About GitHub CLI: https://docs.github.com/en/github-cli/github-cli/about-github-cli
   - Auth: https://cli.github.com/manual/gh_auth_login
2. Resolve repo and branch unless the user specifies otherwise:
   - Repo: current git remote (`gh repo view --json nameWithOwner -q .nameWithOwner`,
     or `git remote get-url origin`). Prefer the remote that tracks `master` or
     `main` if multiple remotes exist.
   - Branch: current branch (`git branch --show-current`), unless the user names
     a different branch or PR.

## Step 1: Fetch review comments

Find the PR for the branch, then pull review feedback:

```bash
gh pr list --repo OWNER/REPO --head BRANCH --json number,title,url,state
# or, in the current repo:
gh pr view --json number,title,url,state

# Inline review comments (diff threads)
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments --paginate

# Review summaries (approve / comment / request changes)
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews --paginate

# Conversation / issue comments (optional; skip pure CI bots unless relevant)
gh api repos/OWNER/REPO/issues/PR_NUMBER/comments --paginate
```

Prefer human reviewer comments and substantive bot findings (e.g. Bugbot,
security). Ignore noise (passing status checks, empty review bodies).

If no open PR exists for the branch, say so and ask for a PR number/URL.

## Step 2: Assess each comment against the code

For every substantive comment:

1. Open the cited file(s) / nearby code on the PR branch (or local checkout).
2. Decide: **valid & applicable**, **partially valid**, **invalid / outdated**,
   or **needs clarification**.
3. Note severity and whether fixing belongs in this PR vs a follow-up.

Base judgments on the current code, not the comment alone. Call out when a
comment is stale (already fixed) or misunderstands intent.

## Step 3: Plan — do not implement

**Switch to plan mode if available in your environment.** Present a plan only;
do not edit code yet.

Organize items so the user can choose implement vs defer:

| ID | Source | File / area | Assessment | Proposed action | Recommend |
|----|--------|-------------|------------|-----------------|-----------|
| R1 | @reviewer | path:line | valid / … | concrete fix or “no code change” | implement / defer / clarify |

Include:

- Brief rationale per item (why valid or not)
- Implementation sketch for “implement” recommendations (files, approach)
- Explicit ask: which items to implement now vs defer

Wait for the user’s selection before any implementation.

## Step 4: Draft reply comments (user only)

For items the user defers, declines, or marks clarify — and for assessments of
“invalid / outdated” or “needs clarification” — draft a GitHub reply **for the
user to copy**.

**DO NOT** run `gh pr comment`, `gh api …/comments`, or otherwise post to
GitHub unless the user explicitly requests this.

Draft replies as either:

**(a) Explanation** — why another approach was chosen, why the finding doesn’t
apply, or that it’s already fixed (point to commit/file if useful).

**(b) Clarification request** — what is unclear and what decision/input you need.

Format drafts so they’re easy to paste under each thread, e.g.:

```markdown
### Draft reply — R3 (@reviewer on `path/file.ts`)
Thread: <html_url>

> <short reply body>
```

## After the user chooses

Only once the user selects items to implement: leave plan mode if needed, apply
the approved fixes, and keep deferred-item drafts available for the user to post.
