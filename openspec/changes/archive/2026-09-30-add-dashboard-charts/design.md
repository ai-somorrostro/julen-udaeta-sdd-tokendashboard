# Design

## Context

Feature 2 adds two charts to a dashboard that currently consists of a table, two filters and a sort. The constraints are tight: native Canvas or SVG only, no libraries, no build step, no tests. Everything must be drawn with the 2D context API, which has no axes, no scales and no legends — only rectangles, lines and text. The design decisions below are mostly about what to build on top of that, and where the informal Feature 2 note and the real data disagree.

## Decisions

### The note's field names do not exist in the data

The informal note at `openspec/specs/02-graficas.md` referred to `price_input_per_1m`, `price_output_per_1m`, `daily_tokens` and `weekly_tokens`. None of those exist in `mock-data.json`, which stores prices per token and consumption split by direction:

| Note's name | Actual fields | Plotted value |
| --- | --- | --- |
| `price_input_per_1m` | `inputPricePerToken` | `inputPricePerToken * 1e6` |
| `price_output_per_1m` | `outputPricePerToken` | `outputPricePerToken * 1e6` |
| `daily_tokens` | `inputTokensDay`, `outputTokensDay` | sum of both |
| `weekly_tokens` | `inputTokensWeek`, `outputTokensWeek` | sum of both |

Two decisions follow. The charts read the real field names, via a single `CHART_METRICS` map so no other part of the file has to know how a plotted value is derived. And the prices are converted to per-million, because the table's price columns are already per million: a chart whose bars were scaled from raw per-token values would be correct in isolation but would disagree with the table sitting directly beneath it, which is the specific confusion this feature exists to remove.

The note is removed rather than corrected in place: `openspec/specs/` holds capability folders, not loose files, and this change supersedes it. The requirements are carried over in full.

### Consumption uses two independently scaled panels

The note asked for "sparklines or bars" showing daily and weekly consumption. Weekly totals run about seven times the daily ones in the current data (49,000,000 against 7,050,000 at the top end). Drawing both against a single shared axis would compress every daily bar into the bottom eighth of the chart, which is not a readable way to compare daily consumption — and daily consumption is the figure the team actually watches.

So the chart is two panels, one per period, each scaled to its own maximum. The cost is that the panels no longer share a common baseline and their bar lengths are not comparable across panels, so each panel is titled, and the numeric value is drawn next to every bar rather than left to the reader to estimate. A shared axis was rejected as unreadable for the daily figures; a stacked input/output breakdown was rejected as out of scope for this feature's stated requirements.

### Canvas rather than SVG

The markup already needed an element per chart either way, and the two options split cleanly on redraw frequency. These charts are redrawn on every filter keystroke, on every sort toggle, on resize and on pixel-ratio change. Canvas redraws by clearing a bitmap and repainting, which is a handful of calls; the SVG equivalent is diffing and re-serialising a DOM subtree of the same marks on every keystroke, for a chart whose element count is in the low hundreds. Canvas also makes the device-pixel-ratio scaling a matter of multiplying the surface size and setting a transform.

The cost of Canvas is the one the note's "hover" requirement exposes: there are no DOM nodes to attach listeners to, so hit testing has to be written by hand. Each draw pass therefore records a hit region per mark, and a single delegated listener per canvas resolves the pointer position against those regions. SVG would have given this for free.

### The resize observer reacts to width only

The consumer of a resize callback here sets the canvas height, so observing the canvas naively risks a loop: redraw changes the height, the observer fires, redraw runs again. The observer therefore compares widths and ignores the callback when only the height moved. The result is one redraw per real width change, and a stable one when the charts resize themselves.

### Chart height follows the row count

The consumption chart is a horizontal layout, one row per model, so its height is `padding + rows * rowHeight` using the number of models actually shown. Sizing it from the total model count instead would leave dead vertical space whenever a filter narrowed the set, growing the gap the more the user filtered. The price chart is fixed height, since its vertical extent is a value axis and its horizontal extent is per-model width.

### Two states, one call site

Each chart has an early return for the no-rows case that draws a centred message, so the loading, empty and failure states all arrive through the same path as normal rendering: `render()` already knows which state it is in, and it passes that to the charts rather than the charts inferring it. This keeps the table and the charts incapable of disagreeing about which state the page is in — the same reason the charts take the table's already-filtered and already-sorted rows rather than re-deriving them.

## Risks

- **Chart drawing is the one part of the application that no automated check can fully attest.** A DOM shim can confirm which drawing calls were issued, and that is what the out-of-repository harness does, but it cannot confirm that the result looks right. The visual pass in a real browser is a delivery gate, not a formality.
- **Rotated x-axis labels are the most fragile part of the price chart.** Ten model names do not fit horizontally, so they are rotated 45° and ellipsised against a measured width budget. A longer model name, or a narrower viewport, degrades this first. The budget is set with margin for the current data, not derived from a font metric, so it is a number to revisit if the data changes.
- **Hand-written hit testing can drift from the drawing.** The regions are produced in the same pass that draws the marks, which keeps them aligned, but any later change to bar geometry has to be made in both places.
