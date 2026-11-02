import test from 'node:test';
import assert from 'node:assert/strict';
import { baselineState, guidedState, runExperiment, encodeState, decodeState, methodIds, mathOptions } from '../public/normalization/state.js';

test('all twenty guided states and experiments are deterministic and independent', () => {
  for (const method of methodIds) {
    for (let step = 0; step < 5; step++) {
      const s = guidedState(method, step);
      assert.deepEqual(decodeState(encodeState(s)), s);
      assert.equal(s.values.length, s.shape.reduce((a, b) => a * b, 1));
    }
    const baseline = baselineState(method), experiment = runExperiment(method);
    assert.equal(experiment.step, 4);
    assert.notDeepEqual(experiment.values, baseline.values);
    assert.deepEqual(decodeState(encodeState(experiment)), experiment);
    if (baseline.shape[0] === 2) assert.deepEqual(experiment.values.slice(0, 8), baseline.values.slice(0, 8));
  }
});
test('custom scientific state roundtrips, while invalid URL fields cannot enter calculations', () => {
  const s = { ...baselineState('batch'), step: 4, epsilon: 1, affine: true, groups: 4, mode: 'inference', selected: 15 };
  s.values[15] = -1000;
  assert.deepEqual(decodeState(encodeState(s)), s);
  const bad = decodeState('#method=group&step=4&values=NaN&epsilon=0&groups=3&selected=999&mode=evil&experiment=scale');
  assert.equal(bad.epsilon, 1e-5); assert.equal(bad.groups, 2); assert.equal(bad.selected, 0);
  assert.equal(bad.mode, 'train'); assert.equal(bad.experiment, '');
  assert.deepEqual(decodeState('#'.repeat(5000)), baselineState());
});
test('comparison baseline holds scientific settings fixed; RMS has no offset', () => {
  const s = runExperiment('rms'); s.affine = true; s.epsilon = 1;
  assert.equal(mathOptions(s).beta, 0); assert.equal(mathOptions(s).gamma, 2);
  assert.equal(mathOptions(s, true).epsilon, 1);
  assert.deepEqual(mathOptions(s, true).values, [1, 2, 3, 4]);
});
