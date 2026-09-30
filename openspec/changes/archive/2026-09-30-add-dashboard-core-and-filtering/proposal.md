# Proposal

## Why

The Design department needs a single internal view to compare the open-source language models the team is evaluating, because today each person checks prices and metrics across different sites and the comparison is slow and inconsistent. The project currently contains only `mock-data.json` — the table itself does not exist yet, so there is no base to add comparison features onto.

This change establishes that base and delivers Feature 1 from the project README: sorting and filtering. It is the first increment in a sequence (Feature 2 visualisations, Feature 3 detail view) that the README requires to be built one feature at a time.

## What Changes

- Create the dashboard shell: `index.html`, `styles.css` and `app.js` (all currently empty), populated exclusively from `mock-data.json` via `fetch`.
- Render the 10 models in a 10-column table covering input price, output price, TTFT, input modality, output modality, and daily/weekly input/output token consumption.
- Derive the modality filter options from the loaded data instead of hardcoding them, so the filters keep working when the placeholder data is replaced by the real feed.
- Add filtering by model name (case-insensitive substring) and by modality, using two independent selects — one for input modality, one for output modality — each matching its field exactly.
- Add sorting on any of the 10 columns by clicking its header, toggling between ascending and descending.
- Preserve the order of `mock-data.json` on load; no sort is applied until the user clicks a header.
- Keep sort state independent of filter state, so changing a filter never resets an active sort.
- Add the empty and load-failure states that filtering makes reachable.

**BREAKING**: none — nothing exists to break.

## Capabilities

### New Capabilities

- `dashboard-table`: Loading `mock-data.json` and rendering the model comparison table, including the derived modality filter controls, the disabled pre-load state, and the load-failure state.
- `table-filtering-sorting`: Filtering rows by model name and by input/output modality, and sorting by any column with an ascending/descending toggle, including the empty-result state and the initial file ordering.

### Modified Capabilities

None. No specs exist yet (`openspec list --specs` is empty).

## Impact

- **New files:** `index.html`, `styles.css`, `app.js` — all three are currently zero-byte placeholders on the `feature.julen.udaeta/01-base-y-filtros` branch.
- **Read-only input:** `mock-data.json`. Not modified by this change; the README restricts the project to the data already in that file.
- **Dependencies:** none. HTML5, CSS3 and vanilla JavaScript only — no libraries or frameworks, and no automated tests, per the README's global constraint and Feature 1's technical condition.
- **Out of scope:** Feature 2 (visualisations) and Feature 3 (detail view) are separate changes that build on the capabilities introduced here.
