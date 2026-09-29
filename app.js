'use strict';

const DATA_URL = 'mock-data.json';
const TOKENS_PER_MILLION = 1e6;

const FIELD_NAMES = [
  'name',
  'inputPricePerToken',
  'outputPricePerToken',
  'ttft_ms',
  'inputModality',
  'outputModality',
  'inputTokensDay',
  'outputTokensDay',
  'inputTokensWeek',
  'outputTokensWeek'
];

const PRICE_COLUMNS = ['inputPricePerToken', 'outputPricePerToken'];

const COLORS = {
  text: '#1c2128',
  good: '#dcfce7',
  warn: '#fef9c3',
  bad: '#fee2e2'
};

const LOCALE = document.documentElement.lang || 'es';
const priceFormat = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
});
const numberFormat = new Intl.NumberFormat(LOCALE);

const state = {
  models: [],
  filters: { name: '', inputModality: '', outputModality: '' },
  sort: { key: null, dir: null },
  medians: new Map(),
  loadError: null,
  loading: true
};

const dom = {};

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeMedians(models) {
  const medians = new Map();
  for (const key of FIELD_NAMES) {
    const values = models.map(model => model[key]).filter(value => typeof value === 'number');
    if (values.length > 0) medians.set(key, median(values));
  }
  return medians;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatCell(key, value) {
  if (PRICE_COLUMNS.includes(key)) {
    return priceFormat.format(value * TOKENS_PER_MILLION);
  }
  if (typeof value === 'number') {
    return numberFormat.format(value);
  }
  return value;
}

function cellStyle(key, value) {
  const reference = state.medians.get(key);
  if (reference === undefined || typeof value !== 'number') {
    return '';
  }
  if (PRICE_COLUMNS.includes(key)) {
    const background = value <= reference ? COLORS.good : COLORS.bad;
    return `color:${COLORS.text};background-color:${background}`;
  }
  return `color:${COLORS.text};background-color:${value >= reference ? 'transparent' : COLORS.warn}`;
}

function getFiltered() {
  const query = state.filters.name.trim().toLowerCase();
  const inputModality = state.filters.inputModality;
  const outputModality = state.filters.outputModality;

  return state.models.filter(model =>
    (query === '' || model.name.toLowerCase().includes(query)) &&
    (inputModality === '' || model.inputModality === inputModality) &&
    (outputModality === '' || model.outputModality === outputModality)
  );
}

function getSorted(rows) {
  const { key, dir } = state.sort;
  if (!key || !dir) {
    return rows;
  }

  const direction = dir === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    const result = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), LOCALE, { numeric: true, sensitivity: 'base' });
    return result * direction;
  });
}

function buildRow(model) {
  const cells = FIELD_NAMES.map(key => {
    const value = model[key];
    const style = cellStyle(key, value);
    return `<td${style ? ` style="${style}"` : ''}>${escapeHtml(formatCell(key, value))}</td>`;
  }).join('');
  return `<tr>${cells}</tr>`;
}

function renderMessage(text, variant) {
  const columns = dom.thead.querySelectorAll('th').length;
  const modifier = variant === 'error' ? ' table-message--error' : '';
  dom.tbody.innerHTML =
    `<tr class="table-message${modifier}"><td colspan="${columns}">${escapeHtml(text)}</td></tr>`;
}

function clearSortIndicators() {
  for (const header of dom.thead.querySelectorAll('th[aria-sort]')) {
    header.removeAttribute('aria-sort');
  }
}

function markSort() {
  const { key, dir } = state.sort;
  if (!key || !dir) {
    return;
  }
  const header = dom.thead.querySelector(`th[data-key="${key}"]`);
  if (header) {
    header.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
  }
}

function render() {
  clearSortIndicators();

  if (state.loadError) {
    renderMessage('No se han podido cargar los datos. Comprueba que mock-data.json está disponible.', 'error');
    return;
  }

  if (state.loading) {
    renderMessage('Cargando modelos...');
    return;
  }

  const rows = getSorted(getFiltered());
  if (rows.length === 0) {
    renderMessage('Ningún modelo coincide con los filtros aplicados.');
    return;
  }

  dom.tbody.innerHTML = rows.map(buildRow).join('');
  markSort();
}

function populateSelect(select, values) {
  const distinct = [...new Set(values)].sort((a, b) => a.localeCompare(b, LOCALE));
  select.replaceChildren(new Option('Todos', ''), ...distinct.map(value => new Option(value, value)));
  select.disabled = false;
}

function assertFields(models) {
  models.forEach((model, index) => {
    if (model === null || typeof model !== 'object') {
      throw new Error(`El elemento ${index} no es un objeto.`);
    }
    const missing = FIELD_NAMES.filter(key => !(key in model));
    if (missing.length > 0) {
      throw new Error(`Faltan campos en el elemento ${index}: ${missing.join(', ')}`);
    }
  });
}

async function loadModels() {
  state.loading = true;
  state.loadError = null;
  render();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('El archivo no contiene una lista de modelos.');
    }
    assertFields(data);

    state.models = data;
    state.medians = computeMedians(data);
    populateSelect(dom.inputSelect, data.map(model => model.inputModality));
    populateSelect(dom.outputSelect, data.map(model => model.outputModality));
  } catch (error) {
    state.models = [];
    state.loadError = error;
    console.error('Error al cargar los datos del dashboard:', error);
  } finally {
    state.loading = false;
    render();
  }
}

function toggleSort(key) {
  if (state.sort.key === key) {
    state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort.key = key;
    state.sort.dir = 'asc';
  }
  render();
}

function cacheDom() {
  dom.nameInput = document.getElementById('nameInput');
  dom.inputSelect = document.getElementById('inputSelect');
  dom.outputSelect = document.getElementById('outputSelect');
  dom.thead = document.querySelector('thead');
  dom.tbody = document.getElementById('tableBody');

  dom.nameInput.addEventListener('input', event => {
    state.filters.name = event.target.value;
    render();
  });

  dom.inputSelect.addEventListener('change', event => {
    state.filters.inputModality = event.target.value;
    render();
  });

  dom.outputSelect.addEventListener('change', event => {
    state.filters.outputModality = event.target.value;
    render();
  });

  dom.thead.addEventListener('click', event => {
    const header = event.target.closest('th[data-key]');
    if (header && dom.thead.contains(header)) {
      toggleSort(header.dataset.key);
    }
  });
}

function init() {
  cacheDom();
  render();
  loadModels();
}

document.addEventListener('DOMContentLoaded', init);
