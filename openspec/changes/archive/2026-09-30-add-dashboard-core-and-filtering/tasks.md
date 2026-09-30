# Tasks

Automated tests are explicitly out of scope for this project (README "Sin tests", Feature 1's technical condition). Every task is therefore verified by **observable behaviour** in the browser, using the scenarios in `specs/dashboard-table/spec.md` and `specs/table-filtering-sorting/spec.md` as the acceptance criteria. Serve the directory over HTTP (`python3 -m http.server`) before verifying anything — see task 3.4.

## 1. Repository Hygiene

- [x] 1.1 Normalise `mock-data.json` to LF line endings in its own commit, and verify `git diff --stat` for that commit reports a line-ending change only, with no content differences

## 2. Static Shell

- [x] 2.1 Build the `index.html` skeleton — filter region (name text input, two `<select>` elements, both `disabled` with a single unset option), and a `<table>` with a `<thead>` and an empty `<tbody>` — and verify the page renders an empty table with both selects visibly disabled and no console errors
- [x] 2.2 Give every header a `data-key` that is character-for-character the corresponding field name in `mock-data.json`, including `ttft_ms`, and verify each key resolves to a defined value on a loaded model
- [x] 2.3 Write `styles.css` with custom-property tokens, the table and header styling, the no-results and load-failure message styling, and a horizontally scrollable wrapper — and verify the table scrolls horizontally on a narrow viewport rather than overflowing the page
- [x] 2.4 Load `styles.css` from `index.html` and `app.js` with `defer` so the script runs after the DOM is parsed, and verify there is no uncaught error and no `null` element access on load

## 3. Data Loading

- [x] 3.1 Implement the `fetch` of `mock-data.json` into the models state, and verify all 10 models load and no model data is defined anywhere outside that file
- [x] 3.2 Handle the load-failure path — render a failure message in the `<tbody>` and leave both selects disabled — and verify by temporarily renaming the data file that no empty or partial table is presented as complete and both selects stay disabled
- [x] 3.3 Build each select's options from the loaded data (distinct input modality values into the input filter, distinct output modality values into the output filter, sorted, plus the unset option), treating `Text+Image` as one value, and verify the input filter offers exactly `Text` and `Text+Image`, the output filter offers exactly `Text`, and both selects are enabled once data has loaded
- [x] 3.4 Document in `README.md` that the dashboard must be served over HTTP (with `python3 -m http.server` as the example) and why opening it via `file://` fails, and verify the documented command starts a server that serves the dashboard correctly
  - *Verified 2026-09-30:* added section 5 to `README.md`; `python3 -m http.server 8123` served `index.html`, `styles.css`, `app.js` and `mock-data.json` with HTTP 200.

## 4. Table Rendering

- [x] 4.1 Render one row per model with one cell per field, and verify 10 rows appear, each showing only its own model's values
- [x] 4.2 Format prices as a currency amount per one million tokens, time to first token in milliseconds, and consumption as whole numbers — settling the two display details left open in `design.md` (thousands separators and whether the price column states its unit) at this point — and verify `0.00000023` displays as `$0.23`, TTFT shows `320`, and consumption shows `4200000` (or `4,200,000` if separators are chosen) with no rounding errors
- [x] 4.3 Render rows in the order they appear in `mock-data.json` on first load, and verify the first row is `Llama 3.3 70B` and the last is `GPT-OSS 120B`

## 5. Filtering

- [x] 5.1 Implement the name filter as a case-insensitive substring match, and verify `llama` and `LLAMA` return the same single row, and `DeepSeek` returns both `DeepSeek-V3` and `DeepSeek-R1`
- [x] 5.2 Implement the two modality filters as exact per-field matches, and verify `Text+Image` in the input filter returns exactly `Mistral Small 3.1` and `Gemma 3 27B`, while `Text` in the input filter returns 8 rows and excludes those two
- [x] 5.3 Combine the name filter and both modality filters conjunctively, and verify input `Text+Image` plus name `Gemma` leaves only `Gemma 3 27B`
- [x] 5.4 Render a no-results message in the `<tbody>` when the active filters match nothing, and verify input `Text+Image` plus the name `Phi` shows the message and no model rows
- [x] 5.5 Verify the output filter's documented degenerate case behaves as specified — selecting `Text` keeps all 10 rows — so it is confirmed as correct behaviour rather than left as an unexplained fault

## 6. Sorting

- [x] 6.1 Attach a single delegated listener to the table header, start with no active sort, and verify the table loads in file order with no column marked as sorted
- [x] 6.2 Implement ascending and descending ordering by the `data-key` value, toggling direction on repeat activation of the same column and starting ascending when a different column is chosen, and verify repeated clicks flip the order and flip it back
- [x] 6.3 Order on the raw field values, keeping the per-million price conversion out of the comparison, and verify the price columns order identically whether read as raw numbers or as displayed per-million figures
- [x] 6.4 Verify all 10 headers reorder their rows, including the two modality columns and `ttft_ms`
- [x] 6.5 Apply the active sort to the filtered rows, and verify a sort remains visible after a filter is applied and after it is cleared
- [x] 6.6 Preserve the active sort column and direction across every filter change, and verify changing the name filter does not reset a sort set beforehand
- [x] 6.7 Mark the active header with `aria-sort` (ascending/descending), clear it from all others, and drive the visual arrow from that same attribute — verify one column is indicated at a time, the indication flips with the toggle, and the sorted column is announced when navigating by screen reader

## 7. Integration Check

- [ ] 7.1 Walk every scenario in both spec files against the running dashboard and confirm each produces its stated outcome
  - *Still open:* every scenario was walked against the real `app.js` and `mock-data.json` through an out-of-repository Node DOM harness, which confirmed each stated outcome. What remains is the same walk in a real browser, covering what a DOM shim cannot attest: visual layout, responsive behaviour and native canvas rendering.
- [x] 7.2 Confirm the application still has no external dependency, no build step, and no test framework — verify the only three files served are `index.html`, `styles.css` and `app.js` plus the unmodified `mock-data.json`
  - *Verified 2026-09-30:* no `package.json` and no `node_modules`; `app.js` contains no `import`, `require` or remote URL; `git diff d3b3dbc HEAD -- mock-data.json` is empty, so the data file is byte-identical to the initial commit.
