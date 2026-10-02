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

const CHART_METRICS = {
  inputPricePer1M: model => model.inputPricePerToken * TOKENS_PER_MILLION,
  outputPricePer1M: model => model.outputPricePerToken * TOKENS_PER_MILLION,
  dailyTokens: model => model.inputTokensDay + model.outputTokensDay,
  weeklyTokens: model => model.inputTokensWeek + model.outputTokensWeek
};

const CHART_FONT = '11px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const CHART_FONT_BOLD = '600 11px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const CHART_PRICE_HEIGHT = 340;
const CHART_CONSUMPTION_ROW_HEIGHT = 26;
const CHART_CONSUMPTION_PADDING = { top: 44, right: 16, bottom: 14, left: 100 };

let tooltipElement = null;

const COLORS = {
  text: '#1c2128',
  good: '#dcfce7',
  warn: '#fef9c3',
  bad: '#fee2e2',
  muted: '#5b6572',
  grid: '#e6e9ed',
  input: '#2563eb',
  output: '#f97316',
  daily: '#0ea5e9',
  weekly: '#7c3aed'
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
  return `<tr data-name="${escapeHtml(model.name)}">${cells}</tr>`;
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
    renderCharts([]);
    return;
  }

  if (state.loading) {
    renderMessage('Cargando modelos...');
    renderCharts([]);
    return;
  }

  const rows = getSorted(getFiltered());
  if (rows.length === 0) {
    renderMessage('Ningún modelo coincide con los filtros aplicados.');
    renderCharts([]);
    return;
  }

  dom.tbody.innerHTML = rows.map(buildRow).join('');
  markSort();
  renderCharts(rows);
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
  dom.priceChart = document.getElementById('priceChart');
  dom.consumptionChart = document.getElementById('consumptionChart');
  dom.priceHits = [];
  dom.consumptionHits = [];
  dom.detailOverlay = document.getElementById('detail-overlay');
  dom.detailPanel = document.getElementById('detail-panel');
  dom.detailClose = document.getElementById('detail-close');
  dom.detailTitle = document.getElementById('detail-title');
  dom.detailContent = document.getElementById('detail-content');
  dom.detailCharts = document.getElementById('detail-charts');

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

  dom.tbody.addEventListener('click', event => {
    const row = event.target.closest('tr');
    if (!row || !dom.tbody.contains(row)) {
      return;
    }
    const name = row.getAttribute('data-name');
    if (!name) {
      return;
    }
    const model = state.models.find(candidate => candidate.name === name);
    if (model) {
      openDetail(model);
    }
  });

  dom.detailClose.addEventListener('click', closeDetail);
  dom.detailOverlay.addEventListener('click', closeDetail);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dom.detailPanel && !dom.detailPanel.hidden) {
      closeDetail();
    }
  });

  attachChartHover(dom.priceChart, () => dom.priceHits);
  attachChartHover(dom.consumptionChart, () => dom.consumptionHits);

  if (typeof ResizeObserver === 'function') {
    const observed = [dom.priceChart, dom.consumptionChart];
    let lastWidths = observed.map(canvas => canvas.getBoundingClientRect().width);
    let frame = null;
    const observer = new ResizeObserver(() => {
      const widths = observed.map(canvas => canvas.getBoundingClientRect().width);
      const widthChanged = widths.some((width, index) => Math.abs(width - lastWidths[index]) > 0.5);
      if (!widthChanged) {
        return;
      }
      lastWidths = widths;
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        renderCharts(getSorted(getFiltered()));
      });
    });
    observed.forEach(canvas => observer.observe(canvas));
  }
}

function niceCeil(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function prepareCanvas(canvas, cssHeight) {
  if (canvas.dataset.cssHeight !== String(cssHeight)) {
    canvas.style.height = `${cssHeight}px`;
    canvas.dataset.cssHeight = String(cssHeight);
  }
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(canvas.getBoundingClientRect().width, 1);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height: cssHeight };
}

function drawEmpty(context, width, height, message) {
  context.clearRect(0, 0, width, height);
  context.font = CHART_FONT;
  context.fillStyle = COLORS.muted;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(message, width / 2, height / 2);
}

function ellipsize(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let candidate = text;
  while (candidate.length > 1 && context.measureText(`${candidate}…`).width > maxWidth) {
    candidate = candidate.slice(0, -1);
  }
  return `${candidate}…`;
}

function drawLegend(context, entries, x, y) {
  let offset = x;
  context.font = CHART_FONT;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  for (const entry of entries) {
    context.fillStyle = entry.color;
    context.fillRect(offset, y - 5, 10, 10);
    context.fillStyle = COLORS.text;
    context.fillText(entry.label, offset + 15, y);
    offset += 15 + context.measureText(entry.label).width + 18;
  }
}

function drawVerticalAxis(context, geometry, maxValue, formatValue, unit) {
  const { left, top, width, height } = geometry;
  const ticks = 4;
  context.font = CHART_FONT;
  context.textBaseline = 'middle';
  context.textAlign = 'right';

  for (let tick = 0; tick <= ticks; tick += 1) {
    const value = (maxValue / ticks) * tick;
    const y = top + height - (value / maxValue) * height;
    context.strokeStyle = COLORS.grid;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, Math.round(y) + 0.5);
    context.lineTo(left + width, Math.round(y) + 0.5);
    context.stroke();
    context.fillStyle = COLORS.muted;
    context.fillText(formatValue(value), left - 8, y);
  }

  context.save();
  context.translate(14, top + height / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.fillStyle = COLORS.muted;
  context.fillText(unit, 0, 0);
  context.restore();
}

function drawPriceChart(rows) {
  const canvas = dom.priceChart;
  const { context, width, height } = prepareCanvas(canvas, CHART_PRICE_HEIGHT);
  context.clearRect(0, 0, width, height);

  if (rows.length === 0) {
    drawEmpty(context, width, height, 'Sin datos para los filtros aplicados.');
    return;
  }

  const values = rows.flatMap(model => [CHART_METRICS.inputPricePer1M(model), CHART_METRICS.outputPricePer1M(model)]);
  const maxValue = niceCeil(Math.max(...values) * 1.12);
  const padding = { top: 34, right: 12, bottom: 96, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const groupWidth = plotWidth / rows.length;
  const barWidth = Math.max(4, Math.min(18, (groupWidth - 8) / 2));

  drawLegend(context, [
    { label: 'Precio entrada', color: COLORS.input },
    { label: 'Precio salida', color: COLORS.output }
  ], padding.left, 14);

  drawVerticalAxis(context, { left: padding.left, top: padding.top, width: plotWidth, height: plotHeight },
    maxValue, value => priceFormat.format(value), '$ por 1M tokens');

  const hits = [];
  context.textBaseline = 'middle';

  rows.forEach((model, index) => {
    const groupLeft = padding.left + groupWidth * index;
    const center = groupLeft + groupWidth / 2;
    const pair = [
      { value: CHART_METRICS.inputPricePer1M(model), color: COLORS.input },
      { value: CHART_METRICS.outputPricePer1M(model), color: COLORS.output }
    ];

    pair.forEach((series, seriesIndex) => {
      const barHeight = (series.value / maxValue) * plotHeight;
      const x = center - barWidth - 1 + seriesIndex * (barWidth + 2);
      const y = padding.top + plotHeight - barHeight;
      context.fillStyle = series.color;
      context.fillRect(x, y, barWidth, barHeight);
    });

    const hoverLeft = groupLeft + 1;
    hits.push({
      left: hoverLeft,
      right: groupLeft + groupWidth - 1,
      model,
      lines: [
        `Entrada: ${priceFormat.format(CHART_METRICS.inputPricePer1M(model))}`,
        `Salida:  ${priceFormat.format(CHART_METRICS.outputPricePer1M(model))}`
      ]
    });

    context.save();
    context.translate(center, padding.top + plotHeight + 8);
    context.rotate(-Math.PI / 4);
    context.font = CHART_FONT;
    context.fillStyle = COLORS.muted;
    context.textAlign = 'right';
    context.fillText(ellipsize(context, model.name, 104), 0, 0);
    context.restore();
  });

  dom.priceHits = hits;
}

function drawConsumptionChart(rows) {
  const canvas = dom.consumptionChart;
  const padding = CHART_CONSUMPTION_PADDING;
  const rowHeight = CHART_CONSUMPTION_ROW_HEIGHT;
  const cssHeight = padding.top + padding.bottom + Math.max(rows.length, 1) * rowHeight;
  const { context, width, height } = prepareCanvas(canvas, cssHeight);
  context.clearRect(0, 0, width, height);

  if (rows.length === 0) {
    drawEmpty(context, width, height, 'Sin datos para los filtros aplicados.');
    return;
  }

  const panelGap = 22;
  const panelWidth = (width - padding.left - padding.right - panelGap) / 2;
  const panels = [
    { key: 'dailyTokens', title: 'Consumo diario', color: COLORS.daily, left: padding.left },
    { key: 'weeklyTokens', title: 'Consumo semanal', color: COLORS.weekly, left: padding.left + panelWidth + panelGap }
  ];

  const hits = [];

  for (const panel of panels) {
    const maxValue = niceCeil(Math.max(...rows.map(model => CHART_METRICS[panel.key](model))));
    const scale = (value) => (value / maxValue) * (panelWidth - 62);

    context.font = CHART_FONT_BOLD;
    context.fillStyle = COLORS.text;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(panel.title, panel.left, padding.top - 20);

    context.font = CHART_FONT;
    context.fillStyle = COLORS.muted;
    context.textAlign = 'left';
    context.fillText(numberFormat.format(maxValue), panel.left, padding.top - 7);

    context.strokeStyle = COLORS.grid;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(Math.round(panel.left) + 0.5, padding.top);
    context.lineTo(Math.round(panel.left) + 0.5, padding.top + rows.length * rowHeight);
    context.stroke();

    rows.forEach((model, index) => {
      const y = padding.top + index * rowHeight;
      const value = CHART_METRICS[panel.key](model);
      const barHeight = rowHeight - 8;
      const barWidth = scale(value);

      context.fillStyle = panel.color;
      context.fillRect(panel.left, y + 4, barWidth, barHeight);

      context.font = CHART_FONT;
      context.fillStyle = COLORS.text;
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillText(numberFormat.format(value), panel.left + barWidth + 6, y + 4 + barHeight / 2);

      context.fillStyle = COLORS.text;
      context.textAlign = 'right';
      context.fillText(ellipsize(context, model.name, padding.left - 14), padding.left - 12, y + 4 + barHeight / 2);

      hits.push({
        left: panel.left,
        right: panel.left + Math.max(barWidth, 6),
        top: y,
        bottom: y + rowHeight,
        model,
        title: panel.title,
        lines: [`${numberFormat.format(value)} tokens`]
      });
    });
  }

  dom.consumptionHits = hits;
}

function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
}

function showTooltip(canvas, event, title, lines) {
  hideTooltip();
  const tip = document.createElement('div');
  tip.style.cssText = [
    'position:fixed',
    'z-index:20',
    'pointer-events:none',
    `background:${COLORS.text}`,
    'color:#ffffff',
    'padding:0.4rem 0.6rem',
    'border-radius:6px',
    'font:12px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    'box-shadow:0 6px 18px rgba(16,24,40,0.22)',
    'max-width:18rem',
    'white-space:nowrap'
  ].join(';');
  tip.style.left = '0px';
  tip.style.top = '0px';

  const heading = document.createElement('div');
  heading.style.cssText = 'font-weight:600;margin-bottom:0.15rem';
  heading.textContent = title;
  tip.appendChild(heading);

  for (const line of lines) {
    const row = document.createElement('div');
    row.textContent = line;
    tip.appendChild(row);
  }

  document.body.appendChild(tip);
  const bounds = canvas.getBoundingClientRect();
  const left = Math.min(event.clientX + 14, window.innerWidth - tip.offsetWidth - 10);
  const top = Math.max(event.clientY - tip.offsetHeight - 12, 8);
  tip.style.left = `${Math.max(left, 8)}px`;
  tip.style.top = `${top}px`;
  tooltipElement = tip;
}

function attachChartHover(canvas, hitAccessor) {
  const locate = event => {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    return hitAccessor().find(candidate =>
      x >= candidate.left && x <= candidate.right && y >= (candidate.top ?? 0) && y <= (candidate.bottom ?? bounds.height));
  };

  const preview = event => {
    const hit = locate(event);
    canvas.style.cursor = hit ? 'pointer' : 'default';
    if (hit) {
      showTooltip(canvas, event, hit.title || hit.model.name, hit.lines);
    } else {
      hideTooltip();
    }
  };

  canvas.addEventListener('mousemove', preview);
  canvas.addEventListener('click', preview);
  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
    hideTooltip();
  });
}

function renderCharts(rows) {
  hideTooltip();
  drawPriceChart(rows);
  drawConsumptionChart(rows);
}

function renderDetail(model) {
  dom.detailTitle.textContent = model.name;

  const entries = [
    ['Nombre', model.name],
    ['Precio entrada', priceFormat.format(model.inputPricePerToken * TOKENS_PER_MILLION) + ' /1M'],
    ['Precio salida', priceFormat.format(model.outputPricePerToken * TOKENS_PER_MILLION) + ' /1M'],
    ['TTFT', `${numberFormat.format(model.ttft_ms)} ms`],
    ['Modalidad entrada', model.inputModality],
    ['Modalidad salida', model.outputModality],
    ['Tokens entrada (día)', numberFormat.format(model.inputTokensDay)],
    ['Tokens salida (día)', numberFormat.format(model.outputTokensDay)],
    ['Tokens entrada (semana)', numberFormat.format(model.inputTokensWeek)],
    ['Tokens salida (semana)', numberFormat.format(model.outputTokensWeek)]
  ];
  dom.detailContent.innerHTML =
    `<dl style="display:contents">${entries.map(([label, value]) =>
      `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`;

  dom.detailCharts.innerHTML =
    '<canvas id="detailChart" width="560" height="220" role="img" aria-label="Desglose de consumo diario y semanal del modelo"></canvas>';
  drawDetailChart(model);
}

function drawDetailChart(model) {
  const canvas = document.getElementById('detailChart');
  if (!canvas) {
    return;
  }
  const cssHeight = 220;
  const { context, width, height } = prepareCanvas(canvas, cssHeight);
  context.clearRect(0, 0, width, height);

  const series = [
    { label: 'Entrada (día)', value: model.inputTokensDay, color: COLORS.daily },
    { label: 'Salida (día)', value: model.outputTokensDay, color: COLORS.input },
    { label: 'Entrada (semana)', value: model.inputTokensWeek, color: COLORS.weekly },
    { label: 'Salida (semana)', value: model.outputTokensWeek, color: COLORS.output }
  ];
  const maxValue = niceCeil(Math.max(...series.map(item => item.value)));
  const padding = { top: 12, right: 12, bottom: 12, left: 132 };
  const plotWidth = width - padding.left - padding.right;
  const rowHeight = (height - padding.top - padding.bottom) / series.length;

  context.font = CHART_FONT;
  series.forEach((item, index) => {
    const y = padding.top + index * rowHeight;
    const barWidth = (item.value / maxValue) * plotWidth;
    context.fillStyle = item.color;
    context.fillRect(padding.left, y + 4, barWidth, rowHeight - 8);
    context.fillStyle = COLORS.text;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(numberFormat.format(item.value), padding.left + barWidth + 6, y + rowHeight / 2);
    context.textAlign = 'right';
    context.fillText(ellipsize(context, item.label, padding.left - 12), padding.left - 8, y + rowHeight / 2);
  });
}

function openDetail(model) {
  renderDetail(model);
  dom.detailOverlay.hidden = false;
  dom.detailPanel.hidden = false;
  dom.detailClose.focus();
}

function closeDetail() {
  dom.detailOverlay.hidden = true;
  dom.detailPanel.hidden = true;
}

function init() {
  cacheDom();
  render();
  loadModels();
}

document.addEventListener('DOMContentLoaded', init);
