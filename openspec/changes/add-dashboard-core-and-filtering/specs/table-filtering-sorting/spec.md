# Spec Delta

## Purpose

Defines how rows of the model comparison table are narrowed by model name and by input/output modality, and how the resulting rows are ordered by any column.

## ADDED Requirements

### Requirement: Filter rows by model name

The dashboard SHALL provide a text filter that narrows the table to models whose name matches the entered text. The match SHALL be case-insensitive and SHALL match any substring of the model name, so that entering a partial name narrows the table to every model containing that text. Models that do not match SHALL be removed from the table.

#### Scenario: Exact name narrows to one model

- **WHEN** `Llama 3.3 70B` is entered in the name filter
- **THEN** only that model remains visible in the table

#### Scenario: Partial name matches any containing model

- **WHEN** `DeepSeek` is entered in the name filter
- **THEN** every model whose name contains `DeepSeek`, regardless of the surrounding text, remains visible

#### Scenario: Matching ignores letter case

- **WHEN** `llama` is entered in the name filter
- **THEN** the same models are visible as when `LLAMA` is entered

#### Scenario: Clearing the filter restores every model

- **WHEN** the name filter is emptied
- **THEN** no restriction is applied by the name filter

### Requirement: Filter rows by input modality

The dashboard SHALL allow rows to be filtered by input modality. When a specific input modality is selected, only models whose input modality is exactly that value SHALL remain visible, and models with any other input modality — including models that merely contain that value as part of a composite value — SHALL be removed. When no input modality is selected, no restriction SHALL be applied by this filter.

#### Scenario: Selecting a modality narrows the table

- **WHEN** `Text+Image` is selected in the input modality filter
- **THEN** only the models whose input modality is `Text+Image` remain visible, which for the current data is Mistral Small 3.1 and Gemma 3 27B

#### Scenario: Matching is exact, not partial

- **WHEN** `Text` is selected in the input modality filter
- **THEN** models whose input modality is `Text` remain visible, and models whose input modality is `Text+Image` are excluded

#### Scenario: No selection applies no restriction

- **WHEN** no input modality is selected
- **THEN** every model remains visible with respect to this filter

### Requirement: Filter rows by output modality

The dashboard SHALL allow rows to be filtered by output modality. When a specific output modality is selected, only models whose output modality is exactly that value SHALL remain visible, and models with any other output modality SHALL be removed. When no output modality is selected, no restriction SHALL be applied by this filter.

#### Scenario: Selecting a modality narrows the table

- **WHEN** a specific output modality is selected
- **THEN** only models whose output modality is exactly that value remain visible

#### Scenario: No selection applies no restriction

- **WHEN** no output modality is selected
- **THEN** every model remains visible with respect to this filter

#### Scenario: A filter that matches the whole data set

- **WHEN** `Text` is selected in the output modality filter with the current data
- **THEN** all 10 models remain visible, because every model in the current data has an output modality of `Text`

### Requirement: Multiple filters combine

When more than one filter is active, a model SHALL remain visible only if it satisfies every active filter. The name filter and both modality filters therefore apply conjunctively, and the filters SHALL be applied to the full set of models rather than to one another's results.

#### Scenario: Filters intersect

- **WHEN** `Text+Image` is selected in the input modality filter and `Gemma` is entered in the name filter
- **THEN** only the model satisfying both remains visible

#### Scenario: No model satisfies the combination

- **WHEN** `Text+Image` is selected in the input modality filter and the name `Phi` is entered
- **THEN** no rows are shown as matching, because the only models accepting images are `Mistral Small 3.1` and `Gemma 3 27B`, neither of which contains `Phi`

### Requirement: Empty result is stated explicitly

When the active filters match no models, the dashboard SHALL display a message in the table body indicating that no model matches the current filters. It SHALL NOT present an empty table with no explanation.

#### Scenario: Filters match nothing

- **WHEN** the active filters match no model
- **THEN** the table body shows a no-results message instead of model rows

### Requirement: Sort by any column

Every column of the table SHALL be sortable by activating its header. The first activation of a header SHALL order the rows by that column in ascending order. Activating a header for a column that is not currently sorted SHALL order the rows by that column in ascending order.

#### Scenario: First activation sorts ascending

- **WHEN** a column header is activated for a column with no active sort
- **THEN** the rows are ordered by that column in ascending order

#### Scenario: A different column replaces the active sort

- **WHEN** a column header is activated and another column is already sorted
- **THEN** the rows are ordered by the newly activated column instead, in ascending order

#### Scenario: Every column is sortable

- **WHEN** each of the 11 column headers is activated in turn
- **THEN** each orders the rows by the metric that column displays

### Requirement: Sort direction toggles

Activating the header of the column that is currently sorted SHALL toggle the order between ascending and descending, with each activation flipping the direction.

#### Scenario: Repeat activation reverses the order

- **WHEN** a column header that is sorted ascending is activated again
- **THEN** the rows are ordered by that column in descending order

#### Scenario: Further activation restores ascending

- **WHEN** a column header that is sorted descending is activated again
- **THEN** the rows are ordered by that column in ascending order again

### Requirement: Sorting orders the filtered rows

An active sort SHALL be applied to the rows remaining after filtering, so that the visible rows are always shown in the sorted order, and the full set of surviving rows SHALL be ordered rather than only part of it.

#### Scenario: Sorted order holds while filtered

- **WHEN** a column is sorted and a filter is then applied
- **THEN** the rows that survive the filter are shown in the active sort order

#### Scenario: Removing the filter preserves the order

- **WHEN** a filter is removed
- **THEN** the rows that reappear continue in the active sort order

### Requirement: Filter changes do not reset the sort

Changing, applying or clearing a filter SHALL NOT alter the active sort column or its direction.

#### Scenario: Sort survives filter changes

- **WHEN** a column is sorted and the name filter is then changed
- **THEN** the same column remains sorted in the same direction

#### Scenario: Sorting still works while filtered

- **WHEN** a filter is active and a different column header is activated
- **THEN** the surviving rows are ordered by that newly activated column

### Requirement: Initial order follows the data file

Before any column header is activated, the rows SHALL be displayed in the order in which the models appear in `mock-data.json`. No sort SHALL be applied on load, and no column SHALL be presented as sorted, until the user activates a header.

#### Scenario: Order on first display

- **WHEN** the table is first displayed after loading
- **THEN** the rows appear in the same order as the models appear in the data file

#### Scenario: No column claims to be sorted initially

- **WHEN** the table is first displayed after loading
- **THEN** no column is presented as sorted in either direction

### Requirement: Current sort direction is exposed

The dashboard SHALL communicate which column is sorted and in which direction, both visually and to assistive technology, and SHALL update that indication whenever the sort changes.

#### Scenario: Sorted column is identified

- **WHEN** a column is sorted
- **THEN** that column's header is marked as sorted and indicates whether the order is ascending or descending, in a form perceivable without sight

#### Scenario: Indication follows the sort

- **WHEN** the sort direction is toggled
- **THEN** the header's indication is updated to reflect the new direction

#### Scenario: Only one column is indicated

- **WHEN** a different column becomes the sorted column
- **THEN** the previously sorted column is no longer indicated as sorted
