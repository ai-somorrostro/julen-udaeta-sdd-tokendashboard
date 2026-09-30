# Proposal

## Why

The comparison table from Feature 1 answers precise questions about a single model or column, but it makes the overall shape of the evaluation hard to see: which model is cheapest, and how the daily and weekly consumption actually distribute across the ten candidates, are both questions the reader has to answer by scanning numbers by eye.

This change delivers Feature 2 from the project README: the visualisations, placed directly above the table so the comparison is available at a glance. The README's technical condition for this feature is a native implementation with Canvas or SVG, with no Chart.js or similar, and no tests.

This change was written after the implementation, and revises the informal Feature 2 note that previously sat at `openspec/specs/02-graficas.md`. That note is superseded and is being removed; the substantive difference is the field mapping recorded in `design.md`, because the note's field names do not exist in `mock-data.json`.

## What Changes

- Add a visualisation section above the comparison table, holding two charts.
- Add a price comparison bar chart showing, per model, the input and output price per one million tokens, with a legend separating the two series and a labelled value axis.
- Add a token consumption chart showing each model's daily and weekly token totals, with the two periods on independent scales so the larger weekly volume does not flatten the daily bars.
- Derive every plotted value from the fields actually present in `mock-data.json`, keeping the charts and the table columns on one unit.
- Drive the charts from the table's existing filtered and sorted rows, so both views can never disagree, and give them the same loading, empty and failure states as the table.
- Scale the drawing surfaces by the device pixel ratio, and redraw on resize and on ratio change.
- Reveal per-mark figures on hover and on click, so the detail is reachable on touch devices.
- Expose a description and a visible caption for each chart.

**BREAKING**: none — the change is additive. The table, its filters and its sorting are untouched.

## Capabilities

### New Capabilities

- `dashboard-charts`: The price comparison bar chart and the token consumption chart, the values they derive from the loaded models, their synchronisation with the table's filters and sorting, their loading/empty/failure states, per-mark detail on hover and click, resize and pixel-density handling, and their non-visual descriptions.

### Modified Capabilities

None. The `dashboard-table` and `table-filtering-sorting` specs are unchanged; the charts read the same rows the table renders and add no behaviour to it.

## Impact

- **Modified files:** `index.html` (adds the visualisation section and the two canvases), `styles.css` (adds the chart grid, card and caption styles), `app.js` (adds the chart metrics, drawing, tooltip and resize handling, and calls into them from the existing render path).
- **Read-only input:** `mock-data.json`. Unchanged; every plotted value derives from its existing fields.
- **Removed:** `openspec/specs/02-graficas.md`, an informal note that was not in OpenSpec's layout and whose field names do not match the data. Its requirements are carried over here, with the field mapping made explicit.
- **Dependencies:** none. Canvas 2D only, with no external library, framework or build step, and no automated tests, per the README's global constraint and Feature 2's technical condition.
- **Out of scope:** Feature 3 (per-model detail view) is a separate change that builds on the capabilities introduced here.
