export const methodIds = ['layer', 'rms', 'batch', 'group'];
export const vector = Object.freeze([1, 2, 3, 4]);
export const tensor = Object.freeze([1, 3, 2, 4, 5, 7, 6, 8, 2, 4, 3, 5, 6, 8, 7, 9]);
export const storedMean = Object.freeze([2.5, 3.5, 6.5, 7.5]);
export const storedVariance = Object.freeze([2, 2, 2, 2]);

export function baselineState(method = 'layer') {
  if (!methodIds.includes(method)) method = 'layer';
  const isVector = method === 'layer' || method === 'rms';
  return { method, step: 0, selected: 0, values: [...(isVector ? vector : tensor)],
    shape: isVector ? [1, 4, 1] : [2, 4, 2], epsilon: 1e-5, groups: 2,
    mode: 'train', affine: false, experiment: '' };
}

export function guidedState(method, step) {
  const state = baselineState(method);
  state.step = Math.max(0, Math.min(4, Math.trunc(step) || 0));
  if (state.step === 3) {
    if (state.shape[0] === 1) {
      state.values = state.values.map(x => x + 3);
      state.experiment = 'shift';
    } else {
      state.values = state.values.map((x, i) => x + (i >= 8 ? 6 : 0));
      state.experiment = 'companion';
    }
  }
  return state;
}

export function runExperiment(method) {
  const state = baselineState(method);
  state.step = 4;
  state.experiment = state.shape[0] === 1 ? 'scale' : 'companion';
  state.values = state.values.map((x, i) => state.shape[0] === 1 ? x * 2 : x + (i >= 8 ? 6 : 0));
  return state;
}

export function mathOptions(state, baseline = false) {
  return { values: baseline ? baselineState(state.method).values : state.values,
    shape: state.shape, method: state.method, epsilon: state.epsilon, groups: state.groups,
    mode: state.mode, runningMean: [...storedMean], runningVariance: [...storedVariance],
    gamma: state.affine ? 2 : 1, beta: state.affine && state.method !== 'rms' ? 1 : 0 };
}

export function comparisonLabel(state) {
  if (state.step < 3) return '';
  if (state.experiment === 'shift') return 'Baseline → add 3 to every feature';
  if (state.experiment === 'scale') return 'Baseline → multiply every feature by 2';
  if (state.experiment === 'companion') return 'Baseline → add 6 to sample n1 only';
  return 'Baseline input → current input · same settings';
}

export function encodeState(state) {
  const p = new URLSearchParams({ method: state.method, step: String(state.step), selected: String(state.selected) });
  if (state.step === 4) {
    p.set('values', state.values.join(',')); p.set('epsilon', String(state.epsilon));
    p.set('groups', String(state.groups)); p.set('mode', state.mode);
    p.set('affine', state.affine ? '1' : '0'); p.set('experiment', state.experiment);
  }
  return '#' + p.toString();
}

export function decodeState(hash = '') {
  if (hash.length > 4000) return baselineState();
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const method = methodIds.includes(p.get('method')) ? p.get('method') : 'layer';
  const step = Number(p.get('step'));
  const state = guidedState(method, Number.isInteger(step) && step >= 0 && step <= 4 ? step : 0);
  const selected = Number(p.get('selected'));
  if (Number.isInteger(selected) && selected >= 0 && selected < state.values.length) state.selected = selected;
  if (state.step !== 4) return state;
  const parts = p.get('values')?.split(',');
  if (parts?.length === state.values.length && parts.every(x => x.trim() !== '' && Number.isFinite(Number(x)) && Math.abs(Number(x)) <= 1000)) state.values = parts.map(Number);
  const epsilon = Number(p.get('epsilon'));
  if (epsilon >= 1e-8 && epsilon <= 1) state.epsilon = epsilon;
  const groups = Number(p.get('groups'));
  if ([1, 2, 4].includes(groups)) state.groups = groups;
  state.mode = p.get('mode') === 'inference' ? 'inference' : 'train';
  state.affine = p.get('affine') === '1';
  // Labels are claims about an experiment. Only retain a label for its exact preset.
  const preset = runExperiment(method);
  if (p.get('experiment') === preset.experiment && state.values.every((x, i) => x === preset.values[i]) &&
    state.epsilon === preset.epsilon && state.groups === preset.groups && state.mode === preset.mode && !state.affine) state.experiment = preset.experiment;
  return state;
}
