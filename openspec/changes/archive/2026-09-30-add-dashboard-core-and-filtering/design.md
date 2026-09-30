# Design

## Context

The repository contains `README.md` (the Design department's brief and feature sequence), `mock-data.json` (10 models, 10 fields, treated as read-only input per README:25), and three zero-byte placeholders: `index.html`, `styles.css`, `app.js`. Nothing has been built. See `proposal.md` for motivation and the two spec deltas for the behavioural contract this design implements.

Three properties of the data file shape the approach and are worth stating explicitly, because each one rules out an otherwise natural implementation:

- **Every model's `outputModality` is `Text`.** An output-modality filter is correct but cannot exclude any row on the current data.
- **Input modality is composite.** Two models carry `"Text+Image"` as a single string value, not two values.
- **Nine fields are camelCase; `ttft_ms` is not.** Any mapping from column to field must be exact.

The stack constraint is absolute: HTML5, CSS3, plain JavaScript, no libraries, no build step, no tests.

## Goals / Non-Goals

**Goals:**

- One rendering path from data to table, so filtering and sorting cannot diverge in behaviour.
- Filter and sort logic that is obviously correct by inspection, since there is no test suite to catch regressions.
- Column-to-field mapping that stays correct if the data file is replaced, which the brief explicitly promises will happen.

**Non-Goals:**

- Anything from Feature 2 (charts) or Feature 3 (detail view). No chart container, no row-click handler, no modal scaffold is introduced here.
- Extensibility beyond the current three controls. The pipeline is shaped for name + two modality filters, not for a general query language.
- Performance work. The data set is 10 rows and re-rendering the whole table is cheaper than the complexity of incremental updates.

## Decisions

### One state object, one pipeline, one render

All view state is three fields: the loaded models, the filter values, and the active sort. Every user interaction runs the same chain: filter, then sort, then render.

```
  fetch('mock-data.json')
            |
            v
     [ models ]        file order preserved, never mutated
            |
     derive options ──► #inputSelect  #outputSelect   (enabled on resolve)
            |
     filter(name AND inputModality AND outputModality)     [pure]
            |
     sort(key, dir)  dir = null → order preserved          [pure, non-mutating]
            |
     render(tbody)  +  aria-sort on the active <th>
```

*Why:* With one entry point there is no way for the sorted view and the filtered view to disagree, and every state change is a two-line diff. *Alternative considered:* mutating the array in place per interaction — rejected, because it destroys the file ordering that requirement "Initial order follows the data file" depends on, and the original order would then be unrecoverable without a re-fetch.

The sort step must not mutate its input. `[...rows].sort(...)` rather than `rows.sort(...)`, so file order survives a round trip through filtering.

### Two modality filters, not one combined filter

The brief says *"filtrar las filas por el nombre del modelo y por la modalidad (tanto de entrada como de salida)"*, which admits two readings: one filter that considers input and output together, or one filter per field. We take the second.

*Why:* The first reading produces a control that appears broken. If a single filter matches when input **or** output equals the selection, then selecting `Text` matches all 10 models via `outputModality`, and the filter excludes nothing — a reviewer clicking it sees no change and concludes it is broken. Splitting into two selects makes the input filter discriminating on day one (`Text` → 8, `Text+Image` → 2) and keeps the two axes independent, which also subsumes the combined reading as a special case.

*Alternative considered:* one select with exact match on `inputModality` only. Cheaper, but it silently drops the output axis the brief asks for, and would need revisiting when real data includes non-text output.

### Exact match per field, never substring, never split

Modality comparison is `===` against the field. The `"Text+Image"` string is treated as one opaque value.

*Why:* Substring matching would reintroduce exactly the no-op problem above — `"Text+Image".includes("Text")` is true, so a `Text` selection would keep all 10 models. Splitting on `+` would destroy the distinction that makes the value informative: "accepts text and images" is not the same claim as "accepts text", and a user choosing between those two models needs the combined label.

### Filter options derived from the loaded data

The option list for each select is built by scanning the loaded models, collecting distinct values, and sorting them, rather than hardcoding `Text` and `Text+Image`.

*Why:* `mock-data.json` is explicitly a placeholder — README:16 says real data comes later. Hardcoding makes the filters correct for exactly one file and wrong for its replacement; deriving costs a handful of lines and survives the swap, including modalities that do not exist yet. It also makes the output filter self-documenting: the day real data carries an `Audio` output, the option appears.

*Trade-off, accepted:* options cannot exist before the fetch resolves, so both selects must start disabled with no options. That is now an explicit requirement rather than a nicety — an empty enabled select would misrepresent the state of the data.

### No sort on load; file order is the default

`dir` starts as `null` and no column is marked sorted until a header is activated.

*Why:* The order in `mock-data.json` is not alphabetical — it reads as a deliberate ranking of "the open-source models that matter right now", which is the brief's own framing. Sorting by name on load would discard that curation before the user had expressed any preference. Starting unsorted also makes the feature demonstrable: the first header click visibly changes the order.

### Sort on raw field values; format only at render

The comparator reads the raw field. Price display converts to a per-million figure at render time, and the conversion never reaches the comparator.

*Why:* `0.00000023` displayed as `$0.23` is still correctly ordered, because the ×10⁶ factor is monotonic — but only if the comparator receives numbers. Sorting the formatted **strings** gives `"$0.23" > "$0.30"`, an order that looks correct until you notice it's alphabetical. Formatting at the boundary is the only placement where this cannot go wrong.

### Column keys are the JSON field names, verbatim

Each header carries the exact field name it sorts by, including `ttft_ms`.

*Why:* A rename or "consistency" fix applied to `ttft_ms` during implementation would break that column silently: the lookup returns `undefined`, the comparator returns `NaN`, `sort` treats every element as equivalent, and the header simply stops reordering. No error, no visual clue. Keeping the mapping literally identical to the data file means there is no translation layer to get wrong.

### Event delegation on the table header, attached once

A single listener on the table header container handles all column activation, reading the target column from the activated element. Filter controls are wired once at init.

*Why:* The table body is rebuilt on every render, so per-row or per-header listeners would need re-attaching after each one. Delegation attaches once and survives re-render for free.

### `aria-sort` is the single source of truth for sort indication

The active header carries `aria-sort="ascending"` or `"descending"`; all other headers carry none. The visual arrow is drawn in CSS from that same attribute, and it is the only thing that changes when the sort changes.

*Why:* One attribute drives both the sighted and the assistive-technology presentation, so the two cannot disagree. The cost is that the sort indicator is a state attribute rather than a glyph swap in script, which is the smaller of the two failure modes.

## Risks / Trade-offs

- **Opening `index.html` directly from the filesystem yields a blank table** → `fetch` is subject to CORS and fails on an `file://` origin in Chrome. The README must document serving the directory over HTTP (for example `python3 -m http.server`) as a prerequisite. This is the most likely first-30-seconds failure a reviewer will hit, and it will look like an application bug.
- **The output modality filter appears to do nothing** → every model in the current data outputs `Text`, so selecting it keeps all 10 rows. This is a property of open-weight models, not a defect. It is called out in the spec as a scenario so it reads as intended behaviour, and the filter is retained because it becomes meaningful against real data.
- **A column whose sort silently stops responding** → see the `ttft_ms` decision above. The mitigation is the verbatim mapping plus a manual check that all 10 headers reorder.
- **Consumption figures with no thousands separators are hard to scan** → deferred; see Open Questions.
- **Eleven columns exceed a narrow viewport** → wrap the table in a horizontally scrollable container rather than reducing the column set, since every field is required by the brief.
- **`mock-data.json` is CRLF in the working tree while `HEAD` is LF** → the current diff is 123 changed lines with zero content change. Normalise the line endings in a separate commit so the review diff for this change shows only real work.

## Migration Plan

Not applicable in the usual sense: three static files are added, none of which exist yet, and there is no deploy step, no persisted state and no consumer to migrate. Rollback is `git rm` the three files. The `mock-data.json` line-ending normalisation is deliberately a separate commit from the feature work so the two can be reverted independently.

## Open Questions

Both are display-level and safe to settle during implementation without touching the specs or the task breakdown:

- Should token consumption figures carry thousands separators, and should the locale follow the browser or be fixed?
- Should the price column show the currency explicitly (for example `$0.23 / 1M`) or rely on a column header that carries the unit?
