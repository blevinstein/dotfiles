---
name: do-plan
description: Pick a task from the current repo's TODO.md and create a plan to implement it. Use when the user wants you to choose a TODO item and plan it, or names a specific TODO item to plan.
user_invocable: true
---

# do-plan

If the current workspace has no `TODO.md`, say this skill does not apply.

Read `TODO.md` and choose the best implementable unchecked task. Prefer tasks
that are concrete, self-contained, and in earlier or higher-priority sections.
If the user names a specific TODO item, plan that item instead.

Return a plan only. Do not implement the task.

If every task is done or the remaining tasks are too ambiguous to plan well,
say so and ask the user which area to target.
