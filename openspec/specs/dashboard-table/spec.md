# dashboard-table Specification

## Purpose
Defines how the model comparison table obtains its data, how that data is presented as rows and columns, and the states the table shows before, during and after loading.

## Requirements

### Requirement: Data sourced exclusively from the local mock data file

The dashboard SHALL load model data only from the `mock-data.json` file located alongside `index.html`, and SHALL NOT define model data anywhere else in the application. The loaded set SHALL consist of exactly 10 models, each exposing the fields `name`, `inputPricePerToken`, `outputPricePerToken`, `ttft_ms`, `inputModality`, `outputModality`, `inputTokensDay`, `outputTokensDay`, `inputTokensWeek` and `outputTokensWeek`.

#### Scenario: Data loads successfully

- **WHEN** the dashboard is opened
- **THEN** the 10 models from `mock-data.json` are read and made available for display

#### Scenario: No alternative data source exists

- **WHEN** the displayed data is inspected
- **THEN** every value shown traces back to a field of a model in `mock-data.json`

### Requirement: Model comparison table with all metric columns

The dashboard SHALL present the loaded models in a single table. The table SHALL contain one column per model field, for a total of 10 columns, and one row per model, for a total of 10 rows. Each column SHALL be headed by a label identifying the metric it displays.

#### Scenario: All models are listed

- **WHEN** the table is displayed after a successful load
- **THEN** it contains exactly 10 rows, one per model in `mock-data.json`

#### Scenario: Every metric is represented

- **WHEN** the table headers are inspected
- **THEN** 10 columns are present, covering model name, input price, output price, time to first token, input modality, output modality, and input/output token consumption for both the daily and weekly periods

#### Scenario: A row shows the metrics of its own model

- **WHEN** a row is inspected
- **THEN** each of its cells displays the value of the corresponding field for that model, and no value is shared with or copied from another row

### Requirement: Readable presentation of each metric

Token prices SHALL be displayed as a currency amount per one million tokens. Time to first token SHALL be displayed in milliseconds. Token consumption figures SHALL be displayed as whole numbers. The displayed figures SHALL be readable at a glance, and the underlying values SHALL remain those loaded from the data file.

#### Scenario: Prices are readable

- **WHEN** a price cell is displayed
- **THEN** it shows a currency amount per one million tokens, such as `$0.23`, rather than the raw per-token figure `0.00000023`

#### Scenario: Latency and consumption keep their units

- **WHEN** a time-to-first-token cell and a token consumption cell are displayed
- **THEN** the latency is shown in milliseconds and the consumption is shown as a whole number of tokens

### Requirement: Modality filter options derived from the data

The dashboard SHALL provide two modality filters, one for input modality and one for output modality. The selectable values of each filter SHALL be derived from the values present in the loaded data rather than being fixed in the application: the input filter SHALL offer every distinct value found in the models' input modality field, and the output filter SHALL offer every distinct value found in the models' output modality field. Each filter SHALL additionally offer an unset option that applies no constraint. Composite modality values such as `Text+Image` SHALL be offered as a single distinct value and SHALL NOT be split into separate options.

#### Scenario: Input options reflect the loaded data

- **WHEN** the loaded models are inspected for input modality
- **THEN** the input modality filter offers an option for each distinct value found, which for the current data means `Text` and `Text+Image`

#### Scenario: Output options reflect the loaded data

- **WHEN** the loaded models are inspected for output modality
- **THEN** the output modality filter offers an option for each distinct value found, which for the current data means `Text`

#### Scenario: New data introduces a new modality

- **WHEN** the data file is later replaced with data containing an input modality value not present today
- **THEN** the input modality filter offers that value without any change to the application

#### Scenario: Composite values are not split

- **WHEN** the input modality filter options are listed for the current data
- **THEN** `Text+Image` appears as one option, and neither `Text` nor `Image` appear as a consequence of splitting it

### Requirement: Filters unavailable until data has loaded

Until the model data has loaded successfully, both modality filters SHALL be disabled and SHALL offer no selectable values. They SHALL become enabled once the model data is available.

#### Scenario: Filters before load

- **WHEN** the dashboard is displayed before the model data has loaded
- **THEN** both modality filters are disabled and cannot be operated

#### Scenario: Filters after load

- **WHEN** the model data has loaded successfully
- **THEN** both modality filters are enabled and offer their derived options

### Requirement: Load failure is reported in place of the table

If the model data cannot be loaded, the dashboard SHALL NOT display an empty or partial table as though it were complete. It SHALL display a message in the table body area indicating that the data could not be loaded, and both modality filters SHALL remain disabled.

#### Scenario: Data file is unavailable

- **WHEN** the model data cannot be loaded
- **THEN** the table body shows a failure message and no model rows are presented as valid data

#### Scenario: Filters stay unavailable after a failure

- **WHEN** the model data could not be loaded
- **THEN** both modality filters remain disabled

### Requirement: No external dependencies

The dashboard SHALL be built with HTML5, CSS3 and plain JavaScript only. It SHALL NOT load or depend on any external library, framework, stylesheet or script. It SHALL require no build step to run.

#### Scenario: Application runs with no dependency resolution

- **WHEN** the dashboard is served as the three project files
- **THEN** it renders and behaves as specified without any package installation or compilation step
