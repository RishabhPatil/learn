const names = { layer: 'LayerNorm', rms: 'RMSNorm', batch: 'BatchNorm', group: 'GroupNorm' };

export function formatNumber(value, digits = 6) {
  if (Object.is(value, -0) || value === 0) return '0';
  if (!Number.isFinite(value)) return String(value);
  const magnitude = Math.abs(value);
  return magnitude < 0.0001 || magnitude >= 100000
    ? value.toExponential(digits - 1)
    : Number(value.toPrecision(digits)).toString();
}

function coordinates(index, shape) {
  const [, channels, sites] = shape;
  return { n: Math.floor(index / (channels * sites)), c: Math.floor(index / sites) % channels, s: index % sites };
}

function label(index, shape, vector) {
  const { n, c, s } = coordinates(index, shape);
  return vector ? `feature ${c}` : `n${n} · c${c} · s${s}`;
}

function textElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  return element;
}

function plot(result, baseline, indices, selected, compare, narrow = false) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const width = narrow ? 300 : 640, height = narrow ? 42 + indices.length * 18 : 220;
  const left = narrow ? 70 : 50, right = 18, top = 32, bottom = 172;
  svg.setAttribute('class', narrow ? 'output-chart-narrow' : 'output-chart-wide');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', compare ? 'Baseline outlined bars and current filled bars, using the same output scale. Exact values follow.' : 'Output values. Exact values follow.');
  const add = (tag, attrs, content) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, val]) => node.setAttribute(key, val));
    if (content !== undefined) node.textContent = content;
    svg.append(node);
    return node;
  };
  const all = indices.flatMap(index => compare ? [result.output[index], baseline.output[index]] : [result.output[index]]);
  const extent = Math.max(0.1, ...all.map(Math.abs)) * 1.12;
  const y = value => top + (extent - value) / (2 * extent) * (bottom - top);
  const zero = y(0), slot = (width - left - right) / indices.length;
  const vector = result.values.length === 4 && result.shape[0] === 1 && result.shape[2] === 1;
  if (narrow) {
    const x = value => left + (value + extent) / (2 * extent) * (width - left - right);
    [-extent, 0, extent].forEach(tick => {
      add('line', { x1: x(tick), y1: 28, x2: x(tick), y2: height - 6, class: tick === 0 ? 'plot-zero' : 'plot-grid' });
      add('text', { x: x(tick), y: 16, 'text-anchor': 'middle', class: 'plot-axis' }, formatNumber(tick, 2));
    });
    indices.forEach((index, position) => {
      const center = 39 + position * 18;
      const { n, c, s } = coordinates(index, result.shape);
      add('text', { x: left - 10, y: center + 4, 'text-anchor': 'end', class: 'plot-label' }, vector ? `f${c}` : `n${n}c${c}s${s}`);
      const bar = (value, yPos, className) => add('rect', { x: Math.min(x(value), x(0)), y: yPos, width: Math.max(Math.abs(x(value) - x(0)), 0.7), height: compare ? 7 : 12, rx: 1.5, class: className });
      if (compare) bar(baseline.output[index], center - 8, 'plot-baseline');
      bar(result.output[index], compare ? center + 1 : center - 6, index === selected ? 'plot-current plot-selected' : 'plot-current');
    });
    return svg;
  }
  [-extent, 0, extent].forEach(tick => {
    add('line', { x1: left, y1: y(tick), x2: width - right, y2: y(tick), class: tick === 0 ? 'plot-zero' : 'plot-grid' });
    add('text', { x: left - 8, y: y(tick) + 4, 'text-anchor': 'end', class: 'plot-axis' }, formatNumber(tick, 3));
  });
  indices.forEach((index, position) => {
    const center = left + slot * (position + 0.5), barWidth = Math.min(compare ? 21 : 42, slot * 0.32);
    const bar = (value, x, className) => add('rect', { x, y: Math.min(y(value), zero), width: barWidth, height: Math.max(Math.abs(y(value) - zero), 0.7), rx: 2, class: className });
    if (compare) bar(baseline.output[index], center - barWidth - 2, 'plot-baseline');
    bar(result.output[index], compare ? center + 2 : center - barWidth / 2, index === selected ? 'plot-current plot-selected' : 'plot-current');
    const { n, c, s } = coordinates(index, result.shape);
    add('text', { x: center, y: 193, 'text-anchor': 'middle', class: 'plot-label' }, vector ? `f${c}` : `n${n} c${c}`);
    if (!vector) add('text', { x: center, y: 209, 'text-anchor': 'middle', class: 'plot-label plot-site' }, `s${s}`);
  });
  return svg;
}

/** Render only; state, presets, analytics, and mathematical reductions belong to the caller. */
export function renderNormalization(container, { state, result, baseline, comparisonLabel = '', onSelect }) {
  const sceneChanged = container.dataset.renderedScene !== `${state.method}:${state.step}`;
  container.dataset.renderedScene = `${state.method}:${state.step}`;
  const focusIndex = container.contains(document.activeElement) ? document.activeElement?.dataset?.index : undefined;
  const dataWasOpen = container.querySelector('.exact-data')?.open || false;
  container.replaceChildren();
  const selected = Math.max(0, Math.min(result.values.length - 1, state.selected || 0));
  const vector = result.values.length === 4 && result.shape[0] === 1 && result.shape[2] === 1;
  const stats = result.stats[result.groupOf[selected]];
  const members = new Set(stats.indices);
  const step = state.step;
  const compare = step >= 3 && Boolean(comparisonLabel) && Boolean(baseline);
  const stored = stats.source === 'stored';
  const figure = textElement('div', 'norm-figure', '');
  figure.dataset.step = String(step);
  const heading = textElement('div', 'figure-topline', '');
  heading.append(textElement('span', 'figure-kicker', vector ? 'ONE FEATURE VECTOR' : 'TWO SAMPLES · FOUR CHANNELS · TWO SITES'));
  heading.append(textElement('span', 'figure-units', 'input · arbitrary activation units'));
  figure.append(heading);
  figure.append(textElement('p', 'visual-scroll-cue', 'Scroll this visual for inputs, statistics and exact values ↓'));

  const grid = textElement('div', vector ? 'activation-grid vector-grid' : 'activation-grid tensor-grid', '');
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Select an activation to inspect the numbers sharing its normalization statistics');
  for (let n = 0; n < result.shape[0]; n++) {
    const panel = textElement('div', 'sample-panel', '');
    if (!vector) panel.append(textElement('p', 'sample-label', `Sample n${n}`));
    const cells = textElement('div', vector ? 'feature-cells' : 'tensor-cells', '');
    for (let c = 0; c < result.shape[1]; c++) {
      for (let s = 0; s < result.shape[2]; s++) {
        const index = (n * result.shape[1] + c) * result.shape[2] + s;
        const cell = textElement('button', 'activation-cell', '');
        cell.type = 'button';
        cell.dataset.index = index;
        cell.dataset.member = String(members.has(index) && step >= 1);
        cell.dataset.selected = String(index === selected);
        cell.setAttribute('aria-pressed', String(index === selected));
        cell.setAttribute('aria-label', `${label(index, result.shape, vector)}, input ${formatNumber(result.values[index], 10)}${members.has(index) && step >= 1 ? ', shares the selected statistics' : ''}`);
        cell.append(textElement('span', 'cell-coordinate', vector ? `f${c}` : `c${c} · s${s}`));
        cell.append(textElement('span', 'cell-value', formatNumber(result.values[index], 5)));
        cell.addEventListener('click', () => onSelect?.(index));
        cells.append(cell);
      }
    }
    panel.append(cells);
    grid.append(panel);
  }
  figure.append(grid);
  const inputCue = textElement('p', 'input-scroll-cue', 'Scroll for the selected statistics ↓');
  figure.append(inputCue);
  const axisText = state.method === 'layer' || state.method === 'rms'
    ? 'Pool features in this vector'
    : state.method === 'batch'
      ? 'Pool samples and sites; keep channel fixed'
      : `Pool ${result.shape[1] / state.groups} channels and all sites; keep sample fixed`;
  const caption = textElement('p', 'reduction-caption', step === 0
    ? `Select a cell. ${vector ? 'f labels a feature.' : 'n = sample, c = channel, s = spatial site.'} The dark outline marks your probe.`
    : stored ? `${axisText}. In inference, use fixed stored statistics for that channel; the green cells show the training reduction set.`
      : `${axisText}. Green cells are the ${members.size} numbers used for the selected statistics.`);
  figure.append(caption);

  if (step >= 1) {
    const statStrip = textElement('dl', 'stat-strip', '');
    const fields = state.method === 'rms'
      ? [['Mean', stats.mean], ['Mean square', stats.rms ** 2], ['Input RMS', stats.rms], ['Divisor', stats.denominator]]
      : [[stored ? 'Stored mean' : 'Mean', stats.mean], [stored ? 'Stored variance' : 'Variance', stats.variance], ['Input RMS', stored ? stats.inputRms ?? stats.rms : stats.rms], ['Divisor', stats.denominator]];
    fields.forEach(([name, value]) => {
      const pair = textElement('div', 'stat-pair', '');
      pair.append(textElement('dt', '', name), textElement('dd', '', formatNumber(value)));
      statStrip.append(pair);
    });
    figure.append(statStrip);
  }

  if (step >= 2) {
    const output = textElement('section', 'output-view', '');
    output.setAttribute('aria-label', 'Outputs for the selected reduction set');
    const outputHeading = textElement('div', 'output-heading', '');
    outputHeading.append(textElement('h3', '', state.affine ? 'After the affine transform' : 'After normalization'));
    outputHeading.append(textElement('span', '', state.affine ? 'output y · illustrative affine units' : 'output z · dimensionless'));
    output.append(outputHeading);
    if (compare) {
      const legend = textElement('p', 'comparison-legend', '');
      legend.append(textElement('span', 'legend-baseline', 'Baseline'), textElement('span', 'legend-current', comparisonLabel.replace(/^Baseline\s*→\s*/, '')));
      output.append(legend);
    }
    output.append(plot(result, baseline, stats.indices, selected, compare), plot(result, baseline, stats.indices, selected, compare, true));
    const selectedOutput = formatNumber(result.output[selected], 9);
    const readout = textElement('p', 'selected-readout', `${label(selected, result.shape, vector)} → ${selectedOutput}`);
    if (compare) {
      const delta = result.output[selected] - baseline.output[selected];
      readout.append(textElement('span', 'delta-value', `Δ from baseline: ${formatNumber(delta, 9)}`));
    }
    output.append(readout);
    figure.append(output);
  }

  const details = textElement('details', 'exact-data', '');
  details.open = dataWasOpen;
  details.append(textElement('summary', '', 'Inspect exact values'));
  const tableWrap = textElement('div', 'table-wrap', '');
  const table = textElement('table', '', '');
  const captionNode = textElement('caption', '', `JavaScript double precision, displayed to 12 significant digits. ε = ${formatNumber(state.epsilon, 10)}. z is before affine; y is after affine.`);
  table.append(captionNode);
  const head = textElement('thead', '', ''), headRow = textElement('tr', '', '');
  ['Cell', 'Input x', 'Normalized z', 'Output y', ...(compare ? ['Baseline y', 'Δ y'] : [])].forEach(name => {
    const th = textElement('th', '', name); th.scope = 'col'; headRow.append(th);
  });
  head.append(headRow); table.append(head);
  const body = textElement('tbody', '', '');
  result.values.forEach((value, index) => {
    const row = textElement('tr', index === selected ? 'selected-row' : '', '');
    const th = textElement('th', '', label(index, result.shape, vector)); th.scope = 'row'; row.append(th);
    [value, result.normalized[index], result.output[index], ...(compare ? [baseline.output[index], result.output[index] - baseline.output[index]] : [])]
      .forEach(number => row.append(textElement('td', '', formatNumber(number, 12))));
    body.append(row);
  });
  table.append(body); tableWrap.append(table); details.append(tableWrap); figure.append(details);
  container.append(figure);
  if (sceneChanged) container.scrollTop = 0;
  if (focusIndex !== undefined) container.querySelector(`[data-index="${focusIndex}"]`)?.focus({ preventScroll: true });

  const methodName = names[state.method] || state.method;
  let takeaway = step === 0 ? `${result.values.length} activations. Select one to follow its calculation.`
    : stored ? `${methodName} uses fixed stored mean ${formatNumber(stats.mean)} and variance ${formatNumber(stats.variance)}. The current batch does not supply those statistics.`
      : `${methodName} uses ${members.size} values for this ${vector ? 'vector' : 'reduction set'}. ${state.method === 'rms' ? 'It divides by RMS with epsilon; it does not subtract the mean.' : `The mean is ${formatNumber(stats.mean)} and population variance is ${formatNumber(stats.variance)}.`}`;
  if (step >= 2) takeaway = `${label(selected, result.shape, vector)}: input ${formatNumber(result.values[selected])} → ${state.affine ? 'affine output' : 'normalized output'} ${formatNumber(result.output[selected], 9)}.${compare ? ` Baseline ${formatNumber(baseline.output[selected], 9)}; difference ${formatNumber(result.output[selected] - baseline.output[selected], 9)}.` : ''}`;
  return { takeaway };
}
