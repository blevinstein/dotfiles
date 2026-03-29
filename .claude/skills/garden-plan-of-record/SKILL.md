---
name: garden-plan-of-record
description: Maintain the seasonal garden plan of record in the garden git repo—crop choices, seeds vs starts, quantities, bed assignments, care (water, fertilizer, prune, harvest, preservation), infrastructure (trellis, row cover, irrigation), goals, constraints, and frost/zone assumptions. Use when the user wants to update PLAN.md, CROPS.md, or CARE.md; document decisions; reconcile the written plan with layout or schedule; or do general garden planning that is not specifically generating SVG layout or regenerating SCHEDULE.md.
---

# garden-plan-of-record

## Repository

| | |
|--|--|
| **Remote** | `https://github.com/blevinstein/garden` |
| **Local checkout** | `~/dev/garden` |

Work inside **`~/dev/garden/<YYYY>/`** for the active season (e.g. `~/dev/garden/2026/`). If the season folder does not exist, create it following **`~/dev/garden/CONVENTIONS.md`**.

## Scope

- **`PLAN.md`** — Narrative plan of record, goals, constraints, zone/frost (with source), infrastructure, links to `layout/` and `SCHEDULE.md`, decisions and open questions.
- **`CROPS.md`** — Crop list: variety, how many, seed vs transplant, which bed/zone, spacing notes; keep aligned with layout legend and schedule when those exist.
- **`CARE.md`** — Water, fertilizer, pruning/training, pests, harvest windows, preservation; use tables or sections per crop/bed.

Out of scope here (use the dedicated skills): producing or tracing **SVG** (`garden-layout-svg`), regenerating **`SCHEDULE.md`** (`garden-calendar-schedule`).

## Workflow

1. Read `~/dev/garden/CONVENTIONS.md` if unsure about paths or filenames.
2. Read the current `PLAN.md`, `CROPS.md`, and `CARE.md` before editing.
3. Apply edits that keep the three files consistent (same crop names, bed labels, frost assumptions).
4. If layout or schedule files exist, update `PLAN.md` links or short notes when the canonical file or assumptions change.
5. Prefer dated decision bullets in `PLAN.md` when overturning earlier choices.

## Assumptions

Do not invent frost dates or zone; use values the user states or values already recorded in `PLAN.md`. If missing, ask once, then record in `PLAN.md` for reuse.
