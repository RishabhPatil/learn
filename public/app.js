import { sinusoidal, rotate, dot, alibiBias, softmax } from './math.js';
import { analyticsId } from './config.js';
import { createAnalytics } from './analytics.js';

const $ = id => document.getElementById(id);
const analytics = createAnalytics({ window, document, id: analyticsId });
const ns = 'http://www.w3.org/2000/svg';
const green = '#246c58', orange = '#bc6546', muted = '#64756a';
function svgEl(tag, attrs = {}, text) {
  const el = document.createElementNS(ns, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  if (text !== undefined) el.textContent = text;
  return el;
}
function line(svg, x1, y1, x2, y2, stroke = '#dce3d6', extra = {}) { svg.append(svgEl('line', { x1, y1, x2, y2, stroke, ...extra })); }
function label(svg, x, y, text, extra = {}) { svg.append(svgEl('text', { x, y, fill: muted, 'font-size': 11, ...extra }, text)); }
function color(value) {
  const from = [241, 238, 228], to = value < 0 ? [188, 101, 70] : [36, 108, 88];
  return `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * Math.abs(value))).join(',')})`;
}

function drawHero() {
  const svg = $('hero-waves');
  for (let x = 30; x <= 540; x += 51) line(svg, x, 10, x, 325);
  for (let row = 0; row < 6; row++) {
    const cy = 35 + row * 51;
    line(svg, 30, cy, 540, cy, '#cfdbca');
    let path = '';
    for (let x = 0; x <= 510; x += 2) {
      const y = cy - sinusoidal(x / 510 * 47, row * 2, 32, 10000) * 18;
      path += `${x ? 'L' : 'M'}${30 + x},${y} `;
    }
    svg.append(svgEl('path', { d: path, fill: 'none', stroke: row % 2 ? '#7d9470' : green, 'stroke-width': 2.2 }));
    label(svg, 9, cy + 4, String(row * 2).padStart(2, '0'), { 'font-size': 8 });
  }
  line(svg, 236, 12, 236, 321, orange, { 'stroke-dasharray': '4 4' });
  for (let row = 0; row < 6; row++) svg.append(svgEl('circle', { cx: 236, cy: 35 + row * 51 - sinusoidal(206 / 510 * 47, row * 2, 32, 10000) * 18, r: 4, fill: orange, stroke: '#e9eee5', 'stroke-width': 2 }));
  label(svg, 30, 349, 'POSITION 0', { 'font-size': 9 });
  label(svg, 540, 349, '47 →', { 'text-anchor': 'end', 'font-size': 9 });
}

function drawSinusoidal() {
  const svg = $('heatmap');
  const position = Number($('position').value), base = Number($('base').value);
  $('position-value').textContent = position;
  $('base-value').textContent = base.toLocaleString('en-US');
  svg.replaceChildren();
  const x0 = 64, y0 = 38, w = 18, h = 7.3;
  label(svg, 64, 18, 'DIMENSION →', { 'font-size': 10 });
  for (let d = 0; d < 32; d += 4) label(svg, x0 + d * w + 6, 31, String(d), { 'font-size': 9 });
  for (let p = 0; p < 48; p++) {
    for (let d = 0; d < 32; d++) {
      const rect = svgEl('rect', { x: x0 + d * w, y: y0 + p * h, width: w - 1.2, height: h - .7, fill: color(sinusoidal(p, d, 32, base)), rx: .8 });
      rect.append(svgEl('title', {}, `Position ${p}, dimension ${d}: ${sinusoidal(p, d, 32, base).toFixed(4)}`));
      svg.append(rect);
    }
    if (p % 8 === 0 || p === 47) label(svg, 49, y0 + p * h + 6, String(p), { 'font-size': 10, 'text-anchor': 'end' });
  }
  svg.append(svgEl('rect', { x: x0 - 3, y: y0 + position * h - 1.6, width: w * 32 + 4, height: h + 2.5, fill: 'none', stroke: '#162f26', 'stroke-width': 1.8, rx: 1 }));
  label(svg, 17, 230, 'POSITION', { transform: 'rotate(-90 17 230)', 'font-size': 10 });
  label(svg, 64, 418, 'Fast-changing pairs', { 'font-size': 11 });
  label(svg, 640, 418, 'Slow-changing pairs →', { 'text-anchor': 'end', 'font-size': 11 });
  $('sin-result').textContent = `Position ${position} → [${Array.from({ length: 4 }, (_, d) => sinusoidal(position, d, 32, base).toFixed(3)).join(', ')}, …]`;
}

function drawRope() {
  const svg = $('rotation'); svg.replaceChildren();
  const m = Number($('query').value), n = Number($('key').value), theta = .25;
  $('query-value').textContent = m; $('key-value').textContent = n;
  const cx = 340, cy = 219, r = 155;
  svg.append(svgEl('circle', { cx, cy, r, fill: '#f5f6ef', stroke: '#d5ded0' }));
  line(svg, cx - r - 30, cy, cx + r + 30, cy);
  line(svg, cx, cy - r - 25, cx, cy + r + 25);
  label(svg, cx + r + 38, cy + 4, 'x'); label(svg, cx + 8, cy - r - 16, 'y');
  for (let i = 0; i < 24; i++) {
    const angle = i * Math.PI / 12;
    line(svg, cx + Math.cos(angle) * (r - 4), cy - Math.sin(angle) * (r - 4), cx + Math.cos(angle) * (r + 4), cy - Math.sin(angle) * (r + 4), '#bdcdb8');
  }
  const q = rotate([1, 0], m * theta), k = rotate([1, 0], n * theta);
  for (const [vector, stroke, name, pos] of [[q, green, 'q', m], [k, orange, 'k', n]]) {
    const x = cx + vector[0] * r, y = cy - vector[1] * r;
    line(svg, cx, cy, x, y, stroke, { 'stroke-width': 3.5 });
    svg.append(svgEl('circle', { cx: x, cy: y, r: 6, fill: stroke }));
    // Separate labels when query and key coincide.
    label(svg, x + 12, y + (name === 'q' ? -13 : 21), `${name} at ${pos}`, { fill: stroke, 'font-size': 12 });
  }
  svg.append(svgEl('circle', { cx, cy, r: 4, fill: '#203c36' }));
  label(svg, 340, 432, 'Both vectors have length 1. Only their orientations change.', { 'text-anchor': 'middle', 'font-size': 10 });
  $('rope-result').textContent = `Δ = n − m = ${n - m} · relative angle = ${((n - m) * theta).toFixed(2)} rad · dot product = ${dot(q, k).toFixed(4)}`;
  $('shift').disabled = m >= 24 || n >= 24;
}

function drawAlibi() {
  const svg = $('bias'); svg.replaceChildren();
  const slope = Number($('slope').value);
  $('slope-value').textContent = slope.toFixed(2);
  const probabilities = softmax(Array.from({ length: 16 }, (_, j) => alibiBias(15, j, slope)));
  const max = Math.max(.1, Math.ceil(Math.max(...probabilities) * 10) / 10);
  const x0 = 58, y0 = 365, plotH = 300, w = 35;
  for (let i = 0; i <= 4; i++) {
    const y = y0 - i * plotH / 4;
    line(svg, x0, y, x0 + 16 * w, y);
    label(svg, x0 - 10, y + 4, `${Math.round(max * i / 4 * 100)}%`, { 'text-anchor': 'end', 'font-size': 10 });
  }
  probabilities.forEach((p, j) => {
    const height = p / max * plotH;
    const rect = svgEl('rect', { x: x0 + j * w + 4, y: y0 - height, width: w - 8, height, fill: j === 15 ? orange : green, rx: 2 });
    rect.append(svgEl('title', {}, `Key ${j}: ${(p * 100).toFixed(2)}%, bias ${alibiBias(15, j, slope).toFixed(2)}`)); svg.append(rect);
    label(svg, x0 + j * w + w / 2, y0 + 23, String(j), { 'text-anchor': 'middle', 'font-size': 10 });
  });
  label(svg, x0, 30, 'ATTENTION PROBABILITY', { 'font-size': 10 });
  label(svg, 340, 425, 'KEY POSITION →', { 'text-anchor': 'middle', 'font-size': 10 });
  $('alibi-result').textContent = `Slope ${slope.toFixed(2)} · key 0: ${(probabilities[0] * 100).toFixed(2)}% · key 15 (self): ${(probabilities[15] * 100).toFixed(2)}%`;
}

const equations = {
  sinusoidal: 'PE(p, 2i) = sin(p / B^(2i/d)) · PE(p, 2i+1) = cos(p / B^(2i/d))',
  rope: '⟨R(mθ)q, R(nθ)k⟩ = qᵀ R((n − m)θ) k',
  alibi: 'score(i, j) = qᵢ · kⱼ / √dₖ − sₕ(i − j), for j ≤ i'
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
function activate(method) {
  tabs.forEach(tab => {
    const selected = tab.dataset.method === method;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    $(`panel-${tab.dataset.method}`).hidden = !selected;
  });
  $('active-equation').textContent = equations[method];
  analytics.track('method_select', method);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab.dataset.method));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); activate(tabs[next].dataset.method); }
  });
});
for (const [ids, draw, method] of [[['position', 'base'], drawSinusoidal, 'sinusoidal'], [['query', 'key'], drawRope, 'rope'], [['slope'], drawAlibi, 'alibi']]) {
  ids.forEach(id => { $(id).addEventListener('input', draw); $(id).addEventListener('change', () => analytics.track('explorer_interaction', method)); });
}
$('shift').addEventListener('click', () => {
  if (Number($('query').value) >= 24 || Number($('key').value) >= 24) return;
  $('query').value = Number($('query').value) + 1; $('key').value = Number($('key').value) + 1; drawRope(); analytics.track('explorer_interaction', 'rope');
});
$('copy-code').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('code-snippet').textContent); $('copy-code').textContent = 'Copied!'; $('status').textContent = 'Python code copied.'; analytics.track('code_copy'); }
  catch { $('status').textContent = 'Copy is unavailable. Select the code and copy it manually.'; $('copy-code').textContent = 'Select code to copy'; }
});
document.querySelectorAll('[data-event]').forEach(link => link.addEventListener('click', () => analytics.track(link.dataset.event)));

$('consent').hidden = !analytics.needsChoice;
$('privacy-settings').addEventListener('click', () => {
  if (analytics.available) { $('consent').hidden = false; $('decline-analytics').focus(); }
  else { $('status').textContent = 'Analytics is inactive on this visit: it is unconfigured, this is a preview, or a browser privacy signal is enabled.'; $('privacy-settings').textContent = 'Analytics inactive'; }
});
for (const [id, choice] of [['accept-analytics', 'accepted'], ['decline-analytics', 'declined']]) $(id).addEventListener('click', () => { analytics.setChoice(choice); $('consent').hidden = true; $('status').textContent = `Analytics ${choice}.`; });
$('close-consent').addEventListener('click', () => { $('consent').hidden = true; $('privacy-settings').focus(); });

// A conservative reading proxy: reach references after 60 seconds of visible time.
let visibleSeconds = 0, readSent = false;
setInterval(() => { if (!document.hidden) visibleSeconds++; }, 1000);
if ('IntersectionObserver' in window) {
  let referencesVisible = false;
  new IntersectionObserver(entries => { referencesVisible = entries[0].isIntersecting; }, { threshold: .2 }).observe($('references'));
  setInterval(() => { if (!readSent && !document.hidden && referencesVisible && visibleSeconds >= 60) { analytics.track('article_read'); readSent = true; } }, 1000);
}
drawHero(); drawSinusoidal(); drawRope(); drawAlibi();
