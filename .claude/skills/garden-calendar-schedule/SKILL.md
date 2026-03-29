---
name: garden-calendar-schedule
description: Regenerate or create the rolling approximately-three-month garden task schedule (SCHEDULE.md) in the garden git repo from PLAN.md and CROPS.md—weekly breakdown for the near term, coarser buckets further out, indoor seeding and transplant timing from frost dates. Use when the user asks for a seasonal calendar, what to do this week, next three months of tasks, or to refresh SCHEDULE.md.
---

# garden-calendar-schedule

## Repository

| | |
|--|--|
| **Remote** | `https://github.com/blevinstein/garden` |
| **Local checkout** | `~/dev/garden` |

Work in **`~/dev/garden/<YYYY>/`**. Obey **`~/dev/garden/CONVENTIONS.md`**.

## Scope

- Read **`PLAN.md`** (frost dates, zone, constraints) and **`CROPS.md`** (what is growing, seed vs transplant).
- Write or replace **`SCHEDULE.md`** with a **rolling ~3-month** view from **today’s date** (or a date the user specifies).
- **Structure:**
  - Header: **Generated:** ISO date; note inputs (e.g. “from PLAN.md + CROPS.md, frost dates as stated in PLAN.md”).
  - **Roughly the next 4 weeks:** weekly sections (Week of …) with concrete tasks.
  - **Remainder of the 3-month window:** weekly or biweekly buckets; use **monthly** sections only when weekly detail would be noise.
- Reference **`CARE.md`** for recurring care (fertilize, prune) without pasting long prose—point to sections.

Out of scope: editing **`PLAN.md` / `CROPS.md` / `CARE.md`** except when a contradiction must be fixed to make the schedule sane (prefer flagging the user); primary narrative edits belong to **`garden-plan-of-record`**. SVG work belongs to **`garden-layout-svg`**.

## Rules

- **Frost dates** must come from `PLAN.md` or explicit user message—do not guess.
- Tasks should be actionable (verb + object + crop/bed when useful).
- If the season folder or `SCHEDULE.md` is missing, create the folder/files per `CONVENTIONS.md` after confirming the year.

## Workflow

1. Identify `<YYYY>` and read `PLAN.md`, `CROPS.md`, and `CARE.md` if present.
2. Build the schedule from recorded frost dates and crop methods (direct sow vs transplant).
3. Rewrite `SCHEDULE.md` with the agreed structure and a fresh **Generated** line.
4. Tell the user the file path for an easy commit.
</think>
Fixing a typo in `garden-calendar-schedule/SKILL.md` (CROMS → CROPS).

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace