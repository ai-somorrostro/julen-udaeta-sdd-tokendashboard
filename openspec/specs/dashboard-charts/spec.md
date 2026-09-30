# dashboard-charts Specification

## Purpose
Defines the two native visualisations that sit above the comparison table — the price comparison bar chart and the token consumption chart — how they derive their values from the loaded models, how they stay in step with the table's filters and sorting, and the states and accessibility affordances they share with it.

## Requirements

### Requirement: Visualisations drawn with native platform APIs

The dashboard SHALL render its visualisations using only the platform's native drawing APIs — Canvas 2D or SVG. It SHALL NOT load or depend on any charting library such as Chart.js or D3.js, nor any other external library, framework, stylesheet or script, and it SHALL require no build step. The visualisations SHALL be placed in a section above the comparison table, so the visual comparison is visible before the row-by-row table.

#### Scenario: Charts render without any dependency

- **WHEN** the dashboard is served as the three project files
- **THEN** both visualisations are drawn, with no package installation, compilation or network request for any charting dependency

#### Scenario: Visualisations precede the table

- **WHEN** the page is displayed
- **THEN** the visualisation section appears above the comparison table section

#### Scenario: No library is referenced

- **WHEN** the sources of the application are inspected
- **THEN** no external chart library is imported, referenced or fetched

### Requirement: Price comparison bar chart

The dashboard SHALL present a bar chart comparing, for each model, its input token price against its output token price. The two series SHALL be visually distinguished from each other by a legend that names input and output separately, and SHALL be drawn in different colours. The value axis SHALL be ordered, labelled with its unit, and each model's values SHALL be readable either from labels drawn on the chart or from a detail shown on hover.

The compared values SHALL be the price per one million tokens, derived from the model's `inputPricePerToken` and `outputPricePerToken` fields multiplied by one million, so that the chart is expressed in the same unit as the table's price columns.

#### Scenario: Both price series are compared per model

- **WHEN** the price chart is displayed
- **THEN** each model is shown with an input price bar and an output price bar, drawn side by side within the model's group

#### Scenario: Legend distinguishes the series

- **WHEN** the price chart is displayed
- **THEN** a legend names the input price series and the output price series, and the two series are drawn in different colours

#### Scenario: Axis is ordered and carries its unit

- **WHEN** the price chart's value axis is inspected
- **THEN** it runs from zero upwards with regularly spaced tick labels, and states that values are currency amounts per one million tokens

#### Scenario: Values are expressed per one million tokens

- **WHEN** a bar's height is derived from a model
- **THEN** it is proportional to that model's `inputPricePerToken` or `outputPricePerToken` multiplied by one million, matching the figures shown in the table's price columns

#### Scenario: Values are legible

- **WHEN** the user reads the chart
- **THEN** each bar's value can be obtained, either from a label or from the detail revealed on hover over that bar

### Requirement: Token consumption chart

The dashboard SHALL present the token consumption of each model at both a daily and a weekly level, with the two periods clearly identified. Daily and weekly figures SHALL each be drawn on their own scale, so that the substantially larger weekly volume does not compress the daily bars into illegibility. Each figure SHALL be readable, and the chart SHALL fit the layout of the dashboard.

A model's daily consumption SHALL be the sum of its `inputTokensDay` and `outputTokensDay` fields; its weekly consumption SHALL be the sum of its `inputTokensWeek` and `outputTokensWeek` fields.

#### Scenario: Both periods are shown and named

- **WHEN** the consumption chart is displayed
- **THEN** a daily panel and a weekly panel are present, each titled to identify which period it shows

#### Scenario: Periods are scaled independently

- **WHEN** the daily and weekly panels are compared
- **THEN** each panel scales its bars against its own maximum value, and the weekly figures do not flatten the daily bars

#### Scenario: Consumption is the sum of input and output

- **WHEN** a model's consumption is plotted
- **THEN** its daily bar represents the sum of its daily input and output tokens, and its weekly bar represents the sum of its weekly input and output tokens

#### Scenario: Figures are readable

- **WHEN** the consumption chart is displayed
- **THEN** each bar's figure is shown next to the bar, and the model each bar belongs to is identified

### Requirement: Visualisations follow the table's data and filters

The visualisations SHALL be driven by the same set of models and the same active filters and sorting as the table, so that what the charts show and what the table shows never disagree. They SHALL redraw when the data loads, when a filter changes, when the sort changes, and when the data fails to load.

#### Scenario: Charts reflect the loaded models

- **WHEN** the model data loads successfully
- **THEN** both visualisations are drawn from the loaded models

#### Scenario: Filtering narrows the charts

- **WHEN** a name or modality filter is applied
- **THEN** the visualisations redraw showing only the models that pass the filters, matching the rows remaining in the table

#### Scenario: Sorting reorders the charts

- **WHEN** the table is sorted by a column
- **THEN** the visualisations redraw in the same order as the table rows

#### Scenario: Charts agree with the table

- **WHEN** the dashboard is displayed in any filter or sort state
- **THEN** the set of models represented in the visualisations is identical to the set of rows in the table

### Requirement: Visualisation states match the table states

When there are no models to display — whether because the data has not loaded yet, because the active filters match nothing, or because loading failed — the visualisations SHALL present an explanatory message in place of their content, matching the state the table is showing. The dashboard SHALL NOT present an empty plotting area as though it were a complete result.

#### Scenario: Nothing matches the filters

- **WHEN** the active filters match no model
- **THEN** both visualisations display a message indicating there is no data for the applied filters, and neither draws bars

#### Scenario: Data is still loading

- **WHEN** the model data has not finished loading
- **THEN** the visualisations present a message rather than plotting an empty axis

#### Scenario: Data failed to load

- **WHEN** the model data cannot be loaded
- **THEN** the visualisations present a message rather than plotting an empty axis, consistent with the failure message shown in the table

### Requirement: Detail available per mark on hover and on click

The dashboard SHALL reveal the underlying figures for an individual mark in the visualisations when the user hovers it, and SHALL do the same when the user clicks or taps it, so the detail is reachable on touch devices as well as with a pointer.

#### Scenario: Hovering a mark reveals its figures

- **WHEN** the user hovers a bar in either visualisation
- **THEN** a detail is shown identifying the model and giving that bar's figures, including its period or price series

#### Scenario: Clicking a mark reveals its figures

- **WHEN** the user clicks or taps a bar in either visualisation
- **THEN** the same detail is shown as when hovering it

#### Scenario: Detail is dismissed when no longer applicable

- **WHEN** the pointer leaves the mark, moves to empty space, or the visualisations redraw
- **THEN** the detail is no longer shown

### Requirement: Visualisations stay legible on resize and high-density displays

The visualisations SHALL render sharply on displays with a non-default pixel density, by scaling their drawing surface to the device's pixel ratio, and SHALL redraw when that ratio changes. They SHALL redraw when their available width changes, and SHALL size their height to the content they draw rather than leaving empty space.

#### Scenario: Drawing surface matches pixel density

- **WHEN** the dashboard is displayed on a display whose device pixel ratio is greater than one
- **THEN** each visualisation's drawing surface is scaled by that ratio, so marks and text are drawn crisply rather than scaled up and blurred

#### Scenario: A pixel ratio change is picked up

- **WHEN** the device pixel ratio changes while the dashboard is displayed
- **THEN** the visualisations redraw at the new ratio

#### Scenario: A width change is picked up

- **WHEN** the available width of the visualisations changes
- **THEN** the visualisations redraw to fit the new width

#### Scenario: Height follows the content

- **WHEN** the set of models shown in the consumption chart changes
- **THEN** the chart's height follows the number of models it draws, without leaving unused vertical space

#### Scenario: Redrawing does not feed back on itself

- **WHEN** a redraw adjusts the height the visualisations occupy
- **THEN** that adjustment does not itself trigger a further redraw

### Requirement: Non-visual description of each visualisation

Each visualisation SHALL expose a textual description of what it shows, so that its content is available to assistive technology, and SHALL carry a visible caption naming it.

#### Scenario: Each chart is described

- **WHEN** the visualisations are inspected by assistive technology
- **THEN** each is exposed as an image with a description of the comparison it presents

#### Scenario: Each chart is visibly named

- **WHEN** the visualisations are displayed
- **THEN** each carries a visible caption identifying the data it shows
