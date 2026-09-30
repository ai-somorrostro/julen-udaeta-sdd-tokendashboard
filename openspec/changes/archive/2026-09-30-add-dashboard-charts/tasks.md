# Tasks

Automated tests are explicitly out of scope for this project (README "Sin tests", Feature 2's technical condition). Every task is therefore verified by **observable behaviour** in the browser, using the scenarios in `specs/dashboard-charts/spec.md` as the acceptance criteria. Serve the directory over HTTP (`python3 -m http.server`) before verifying anything.

## 1. Static Shell

- [x] 1.1 Add a visualisation section above the comparison table in `index.html`, holding two charts, and verify the charts appear before the table and that the table, its filters and its sorting are unchanged
- [x] 1.2 Add the chart grid, card, canvas and caption styles to `styles.css` using the existing custom-property tokens, and verify the two charts sit side by side on a wide viewport and stack on a narrow one

## 2. Derived Values

- [x] 2.1 Derive the plotted values from the real `mock-data.json` fields through a single metrics map — input and output price per million tokens, and daily and weekly consumption as the sum of input and output — and verify the per-million prices match the figures the table's price columns show for the same models

## 3. Price Comparison Chart

- [x] 3.1 Draw a grouped bar chart with an input bar and an output bar per model, and verify both series are present for all 10 models
- [x] 3.2 Draw a legend naming the input and output series, in different colours, and verify the two series are distinguishable and correctly named
- [x] 3.3 Draw an ordered value axis from zero with regular tick labels and a unit, and verify the axis ascends and states currency per one million tokens
- [x] 3.4 Label each model on the category axis, and verify long names stay readable rather than colliding or being cut mid-word

## 4. Consumption Chart

- [x] 4.1 Draw a daily panel and a weekly panel, each titled to identify its period, and verify both periods are present and identifiable
- [x] 4.2 Scale each panel against its own maximum, and verify the weekly volume does not compress the daily bars into illegibility
- [x] 4.3 Show each bar's figure next to the bar and identify the model each bar belongs to, and verify a bar can be traced to its model and its number

## 5. Synchronisation with the Table

- [x] 5.1 Drive both charts from the table's already-filtered and already-sorted rows, and verify filtering by name and by modality narrows the charts to the same models as the table
- [x] 5.2 Redraw on sort change, and verify the charts follow the table's order
- [x] 5.3 Give the charts the loading, empty and failure states the table shows, and verify that with no matching models both charts present a message and draw no bars

## 6. Rendering Quality

- [x] 6.1 Scale the drawing surface by the device pixel ratio, and verify the charts are crisp rather than blurred on a high-density display
- [x] 6.2 Redraw when the available width changes and when the device pixel ratio changes, and verify neither change leaves the charts stretched or stale
- [x] 6.3 Size the consumption chart's height to the number of models drawn, and verify narrowing the filter set does not leave unused vertical space
- [x] 6.4 Confirm redrawing does not feed back on itself when the charts change their own height, and verify the charts settle rather than redrawing continuously

## 7. Detail and Accessibility

- [x] 7.1 Reveal a bar's underlying figures on hover, identifying the model and giving the price series or consumption period, and verify hovering a bar in either chart reports that bar's own figures
- [x] 7.2 Reveal the same detail on click or tap, so it is reachable on touch devices, and verify the detail appears and is dismissed when the mark is no longer under the pointer
- [x] 7.3 Expose a description of each chart to assistive technology and give each a visible caption, and verify both charts are described and visibly named

## 8. Integration Check

- [ ] 8.1 Walk every scenario in `specs/dashboard-charts/spec.md` against the running dashboard in a real browser
  - *Still open:* every scenario was walked against the real `app.js` and `mock-data.json` through an out-of-repository Node DOM harness, which confirmed each stated outcome. What remains is the same walk in a real browser, which is the only way to attest the parts a shim cannot reach: legibility of the rotated labels, the visual grouping of the two panels, responsive stacking, and native canvas rendering on a high-density display.
- [x] 8.2 Confirm the application still has no external dependency, no build step and no test framework, and verify no charting library is referenced and only `index.html`, `styles.css`, `app.js` and the unmodified `mock-data.json` are served
