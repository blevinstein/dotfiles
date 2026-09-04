---
name: dbt-jinja-render
description: Render a dbt model's Jinja-templated SQL locally (no dbt/warehouse needed) to sanity-check syntax across both is_incremental() branches. Use when hand-editing dbt .sql model files with {% if is_incremental() %} blocks, ref()/source()/config() calls, and you want to catch unbalanced parens/trailing commas before running dbt or pasting into a SQL runner.
---

# dbt Jinja render (offline sanity check)

Renders a dbt model's raw `.sql` file through Jinja2 with `ref`/`source`/
`config`/`is_incremental`/`var`/`this` mocked out, for both
`is_incremental() = True` and `= False`, and checks paren balance / trailing
commas. Catches the most common `{% if is_incremental() %}` editing mistake:
a dangling comma or paren that only breaks in one of the two branches.

This does **not** validate the SQL is semantically correct against the
warehouse — it only proves the Jinja renders to *syntactically plausible* SQL
in both branches. Follow up with a real run (dbt, or paste the rendered SQL
into a SQL runner against a real connection — see the `looker-api` skill's
SQL Runner section if the warehouse is behind Looker) for real validation.

## Usage

```bash
python3 /Users/blevinstein/.claude/skills/dbt-jinja-render/scripts/render_dbt_model.py path/to/model.sql
```

Prints a paren-balance / trailing-comma check for both incremental branches,
followed by each branch's full rendered SQL.

Flags to narrow down a problem:

- `--quiet` — only print the check results, suppress the rendered SQL body.
- `--show true` / `--show false` — print only one branch's full rendered SQL
  (easier to scroll through when hunting for the exact dangling comma/paren,
  usually right where an `{% if is_incremental() %}...{% endif %}` block
  starts or ends inside a CTE's column list).

## Requirements

`jinja2` (already a dependency of dbt itself, so it's normally already
installed in the repo's Python environment; otherwise `pip install jinja2`).
