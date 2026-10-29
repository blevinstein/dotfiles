---
description: General tool-use preferences (applies across all repos)
alwaysApply: true
---

# Tool Use

- Prefer `jq` over `python3` when inspecting, filtering, or transforming JSON in shell commands; it is usually shorter and easier for a human to review and approve.
- If `jq` is unavailable, fall back to `python3` and mention that installing `jq` would make future JSON commands easier to review.
- Prefer `rg` over `grep` when searching file contents.
- When the `use-vet` skill is available, always use `vet curl` instead of `curl`.
