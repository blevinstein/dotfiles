---
name: garden-layout-svg
description: Create or update garden planting layout SVGs from the garden repo—one interior SVG per raised bed and greenhouse: plants, 1/4in drip tubing, emitters at plant bases, timer/zone labels. Trace sketches from sketches/ for lot context only; true interior dimensions and in-bed spacing from PLAN/CROPS. Use when updating layout/interior-*.svg, beds-legend.md, planning emitter placement, or diagramming drip before planting.
---

# garden-layout-svg

## Repository

| | |
|--|--|
| **Remote** | `https://github.com/blevinstein/garden` |
| **Local checkout** | `~/dev/garden` |

Season content lives under **`~/dev/garden/<YYYY>/`**. Layout files under **`layout/`**; raster references under **`sketches/`**. Follow **`~/dev/garden/CONVENTIONS.md`** for naming and rules.

## Scope

- Read the user’s **raster sketch(es)** in `sketches/` (bed layout, drip layout, or combined—paths they give or most recent relevant files).
- Write or update **`layout/interior-<id>.svg`** (one file per enclosure: e.g. `interior-fs1.svg`, `interior-greenhouse.svg`). No whole-property site SVG is required unless the user asks.
- Maintain **`layout/beds-legend.md`**: each letter/symbol → common name (and variety if needed); add a **Drip / irrigation** subsection when the SVG includes tubing (line colors/styles, emitter mark, timer labels).
- Use **`CROPS.md`** and **`PLAN.md`** for counts, spacing, bed labels, and any irrigation notes already recorded.

### Drip irrigation (user standard)

The user runs **1/4 inch drip tubing** to **most beds**, with an **emitter at each plant base** (or at each planned plant position). **Several separate timers** control different drip circuits; the SVG should make it obvious **which timer feeds which bed or zone** (use the user’s names for timers, e.g. “Timer A”, “Back raised beds”, or valve labels—ask if unstated).

- Treat **drip sketches** like planting sketches: trace the intended **tubing path** from `sketches/`, not generic grid irrigation.
- Diagram tubing as **schematic polylines** (true 1/4" width is not required); keep **runs and branches** readable. Place **emitter markers** at plant letters/positions.
- Put irrigation in a dedicated top-level group, e.g. **`<g id="irrigation">`**, with per-bed subgroups if helpful (`irrigation-bed-a`). Draw **after** bed outlines so lines sit on top; use distinct stroke colors or dash patterns per **timer zone** and document them in the legend.
- Because each file is one bed/GH, **timer → zone** is usually one label per SVG; a **timer → beds** table in `beds-legend.md` still helps when several interiors share a zone.

Out of scope: long-form care or narrative planning (`garden-plan-of-record`); **`SCHEDULE.md`** (`garden-calendar-schedule`). Timer **programming** (durations, schedules) belongs in `PLAN.md` / `CARE.md` via **`garden-plan-of-record`** unless the user only wants it labeled on the diagram.

## SVG rules

- **Units:** One linear unit for the season (inches or cm)—must match `layout/README.md` or `PLAN.md`.
- **Bed size:** Draw each bed’s interior at the **stated width and length**; treat user-provided dimensions as authoritative.
- **Canvas:** Single bed or greenhouse interior only; **north** arrow at top of each file per `layout/README.md`.
- **In-bed detail:** Honor specified rows, in-row spacing, and plant counts (e.g. three onion rows at 6" spacing; kale at 18" on the opposite side of the box).
- **Structure:** Top-level groups **`plants`** and **`irrigation`** (and optional `bed-outline`). Use simple geometry (rects, lines, text for letters); optional dimension lines and light grid.
- **Do not overwrite** files under `sketches/`; they are source material.

## Reviewing layout SVGs (raster + Read tool)

Assistants do not reliably “see” SVG markup the way humans do in a viewer. **After editing each `interior-*.svg`, rasterize to a local `*-preview.png` and open it with the Read tool** to sanity-check composition, overlaps, and legibility.

1. **Rasterize** (pick one tool; ImageMagick is common on macOS Homebrew):

   ```bash
   magick -background white ~/dev/garden/<YYYY>/layout/interior-fs1.svg \
     -strip ~/dev/garden/<YYYY>/layout/interior-fs1-preview.png
   ```

   **ImageMagick caveat:** Its SVG delegate often **mangles** files that use **embedded `<style>` blocks**, **`font: …` shorthand**, or **`system-ui`** / exotic `font-family` stacks—output can look like random overlapping letters. For reliable previews use **inline** `fill`, `font-size`, `font-family="Arial, Helvetica, sans-serif"` on text, and a **spacious coordinate system** (e.g. ~20 user units per foot of bed interior so type is not microscopic). Optional: `-resize 1600` after the input for a larger PNG.

   Prefer an **in-SVG title block** and **minimal crowding**; put crop names in `beds-legend.md` when the interior is tight.

   Alternatives if available: `rsvg-convert -w 1600 -f png -o interior-fs1-preview.png interior-fs1.svg`, or Inkscape CLI export.

2. **Read** the preview PNG with the image-capable Read tool and note overlaps, tiny type, wrong positions, or missing elements.

3. **Cross-check** against the SVG source and `beds-legend.md`: automated image descriptions can **misread crowded labels**. Treat raster review as a layout pass, not ground truth for wording.

4. **Git:** Prefer adding `**/layout/*-preview.png` to the repo `.gitignore` (already done in this garden repo) so previews stay local unless the user wants them committed.

## Workflow

1. Confirm `<YYYY>` and read `CONVENTIONS.md` if needed.
2. Open the sketch image(s) and any stated bed dimensions; ask for missing **numeric** bed sizes, spacing, or **timer-to-bed** assignments before finalizing SVG.
3. Align letters/symbols with `beds-legend.md` and `CROPS.md`; add drip symbology and timer colors/dashes to the legend when drawing tubing.
4. If the user only has a planting sketch, offer to add a **drip layer** once they describe or sketch runs; if they only have a drip sketch, still anchor beds to stated sizes and plant positions from `CROPS.md` when available.
5. Save SVG under `layout/`; update `layout/README.md` if units, file naming, or layer meaning changes.
6. **Rasterize edited `interior-*.svg` files to local `*-preview.png` and Read them** (see **Reviewing layout SVGs** above); fix the SVG if the preview shows problems.
7. Mention in the reply where the SVG and legend were written so the user can commit.
