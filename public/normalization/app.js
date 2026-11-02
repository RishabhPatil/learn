import { normalize } from './math.js';
import { methods } from './lessons.js';
import { renderNormalization } from './renderer.js';
import { baselineState, guidedState, runExperiment, mathOptions, comparisonLabel, encodeState, decodeState } from './state.js';
import { createAnalytics } from '../analytics.js';
import { analyticsId } from '../config.js';

const $ = id => document.getElementById(id);
const analytics = createAnalytics({ window, document, id: analyticsId });
let state = decodeState(location.hash);
const completed = new Set();
const methodEvent = () => ({ layer: 'layernorm', rms: 'rmsnorm', batch: 'batchnorm', group: 'groupnorm' })[state.method];

function cellLabel(index) {
  if (state.shape[0] === 1) return `feature ${index}`;
  return `n${Math.floor(index / 8)} · c${Math.floor(index / 2) % 4} · s${index % 2}`;
}
function render() {
  const method = methods.find(m => m.id === state.method);
  const lesson = method.steps[state.step];
  $('method').value = state.method;
  $('method-title').textContent = method.name;
  $('method-summary').textContent = method.summary;
  $('step-label').textContent = state.step === 4 ? 'EXPLORE · YOUR CURRENT INPUT' : `STEP ${state.step + 1} OF 5`;
  $('tour-title').textContent = lesson.title;
  $('tour-body').textContent = lesson.body;
  $('experiment').textContent = method.experimentLabel;
  $('experiment-description').textContent = method.experimentDescription;
  $('progress').textContent = `${state.step + 1} / 5`;
  $('previous').disabled = state.step === 0;
  $('next').disabled = state.step === 4;
  $('view-label').textContent = state.shape[0] === 1 ? 'ONE VECTOR · FOUR FEATURES' : 'TWO SAMPLES · FOUR CHANNELS · TWO SLOTS';
  const result = normalize(mathOptions(state));
  const baseline = normalize(mathOptions(state, true));
  const rendered = renderNormalization($('visualization'), { state, result, baseline,
    comparisonLabel: comparisonLabel(state), onSelect: selectCell });
  $('tour-observation').textContent = rendered.takeaway;
  syncSettings();
  history.replaceState(null, '', encodeState(state));
}
function selectCell(index) {
  const fromVisual = $('visualization').contains(document.activeElement);
  state.selected = index;
  render();
  if (fromVisual) $('visualization').querySelector(`[data-index="${index}"]`)?.focus({ preventScroll: true });
}
function syncSettings() {
  $('selected-cell').replaceChildren(...state.values.map((_, i) => new Option(cellLabel(i), String(i))));
  $('selected-cell').value = String(state.selected);
  $('input-value').value = state.values[state.selected];
  // Shared links can contain any valid epsilon, so keep their exact setting inspectable.
  for (const option of [...$('epsilon').options]) if (option.dataset.custom) option.remove();
  if (![...$('epsilon').options].some(o => Number(o.value) === state.epsilon)) {
    const option = new Option(String(state.epsilon), String(state.epsilon)); option.dataset.custom = 'true'; $('epsilon').add(option);
  }
  $('epsilon').value = [...$('epsilon').options].find(o => Number(o.value) === state.epsilon).value;
  $('groups').value = String(state.groups); $('mode').value = state.mode; $('affine').checked = state.affine;
  $('groups-field').hidden = state.method !== 'group'; $('mode-field').hidden = state.method !== 'batch';
  $('stored-note').hidden = state.method !== 'batch';
  $('affine-label').textContent = state.method === 'rms' ? 'Apply gain 2 (RMSNorm has no bias)' : 'Apply gain 2 and bias 1';
}
function explore(change) {
  state = { ...state, ...change, step: 4, experiment: '' };
  $('settings-status').textContent = 'Explore updated. The visual uses your current input and settings.';
  render();
  analytics.track('explorer_interaction', methodEvent());
}
function navigate(step) {
  state = guidedState(state.method, step);
  render(); $('lesson').scrollTop = 0;
  if (state.step === 4 && !completed.has(state.method)) {
    completed.add(state.method); analytics.track('article_read', methodEvent());
  }
}
$('method').addEventListener('change', event => {
  state = baselineState(event.target.value); render(); $('lesson').scrollTop = 0;
  analytics.track('method_select', methodEvent());
});
$('previous').addEventListener('click', () => navigate(state.step - 1));
$('next').addEventListener('click', () => navigate(state.step + 1));
$('reset').addEventListener('click', () => navigate(0));
$('experiment').addEventListener('click', () => {
  state = runExperiment(state.method); render(); analytics.track('explorer_interaction', methodEvent());
});
$('selected-cell').addEventListener('change', event => selectCell(Number(event.target.value)));
$('input-value').addEventListener('change', event => {
  if (!event.target.validity.valid || event.target.value.trim() === '') {
    $('settings-status').textContent = 'Enter a finite value between −1000 and 1000.'; syncSettings(); return;
  }
  const values = [...state.values]; values[state.selected] = Number(event.target.value); explore({ values });
});
for (const id of ['epsilon', 'groups', 'mode', 'affine']) $(id).addEventListener('change', event => {
  explore({ [id]: id === 'affine' ? event.target.checked : id === 'mode' ? event.target.value : Number(event.target.value) });
});
$('zero-input').addEventListener('click', () => explore({ values: state.values.map(() => 0) }));
$('constant-input').addEventListener('click', () => explore({ values: state.values.map(() => 3) }));
$('baseline-input').addEventListener('click', () => explore({ values: baselineState(state.method).values }));

function openDialog(id, opener) {
  const dialog = $(id); dialog._opener = opener; dialog.showModal();
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => dialog._opener?.focus());
}
$('open-settings').addEventListener('click', event => { $('settings-status').textContent = ''; openDialog('settings-dialog', event.currentTarget); });
$('open-reference').addEventListener('click', event => {
  const method = methods.find(m => m.id === state.method), content = $('reference-content');
  content.replaceChildren();
  const h = document.createElement('h3'); h.textContent = method.name; content.append(h);
  for (const [label, text] of [['Formula', method.equation], ['Axes', method.axes], ['Limits', method.limits]]) {
    const p = document.createElement('p'); const b = document.createElement('strong'); b.textContent = `${label}: `;
    p.append(b, String(text)); content.append(p);
  }
  const ul = document.createElement('ul');
  for (const source of method.sources) {
    const li = document.createElement('li'), a = document.createElement('a');
    a.href = source.url; a.textContent = source.title;
    a.addEventListener('click', () => analytics.track('reference_click', methodEvent()));
    li.append(a, ` — ${source.note}`); ul.append(li);
  }
  content.append(ul); openDialog('reference-dialog', event.currentTarget);
});
$('share').addEventListener('click', event => {
  $('share-url').value = location.href; $('share-status').textContent = ''; openDialog('share-dialog', event.currentTarget);
});
$('copy-link').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('share-url').value); $('share-status').textContent = 'Link copied.'; }
  catch { $('share-url').focus(); $('share-url').select(); $('share-status').textContent = 'Select and copy the URL above.'; }
});
window.addEventListener('hashchange', () => { state = decodeState(location.hash); render(); });
$('consent').hidden = !analytics.needsChoice;
$('privacy-settings').addEventListener('click', () => {
  if (analytics.available) {
    $('reference-dialog').close(); $('consent').hidden = false; $('decline-analytics').focus();
  } else $('analytics-status').textContent = 'Analytics is inactive: no measurement ID, a preview environment, or a browser privacy preference.';
});
for (const [id, choice] of [['accept-analytics', 'accepted'], ['decline-analytics', 'declined']]) $(id).addEventListener('click', () => {
  analytics.setChoice(choice); $('consent').hidden = true; $('open-reference').focus();
});
render();
