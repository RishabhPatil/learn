import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMoments, normalize } from '../public/normalization/math.js';

const close = (actual, expected, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const closeArray = (actual, expected, tolerance) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => close(value, expected[i], tolerance));
};
const vector = (method, values = [1, 2, 3, 4], extra = {}) => normalize({ values, shape: [1, values.length, 1], method, ...extra });
const tensor = [1, 3, 2, 4, 5, 7, 6, 8, 2, 4, 3, 5, 6, 8, 7, 9];
const tensorNorm = (method, extra = {}) => normalize({ values: tensor, shape: [2, 4, 2], method, ...extra });

test('four-feature hand fixture has population moments and independent known LN/RMS outputs', () => {
  const moments = calculateMoments([1, 2, 3, 4]);
  close(moments.mean, 2.5); close(moments.variance, 1.25); close(moments.rms, Math.sqrt(7.5));
  const ln = vector('layer', undefined, { epsilon: 0.75 });
  closeArray(ln.output, [-1.5 / Math.SQRT2, -0.5 / Math.SQRT2, 0.5 / Math.SQRT2, 1.5 / Math.SQRT2]);
  const rms = vector('rms', undefined, { epsilon: 1.5 });
  closeArray(rms.output, [1 / 3, 2 / 3, 1, 4 / 3]);
  close(rms.stats[0].denominator, 3);
});

test('centering removes a uniform shift while RMSNorm preserves its effect', () => {
  closeArray(vector('layer', [4, 5, 6, 7]).output, vector('layer').output);
  assert.ok(Math.abs(vector('rms', [4, 5, 6, 7]).output[0] - vector('rms').output[0]) > 0.3);
  close(calculateMoments(vector('layer').normalized).mean, 0);
  assert.ok(calculateMoments(vector('rms').normalized).mean > 0.9);
});

test('finite epsilon prevents exact positive-scale invariance, with a visible tiny-input fixture', () => {
  for (const method of ['layer', 'rms']) {
    const original = vector(method, [-0.001, 0.001]);
    const doubled = vector(method, [-0.002, 0.002]);
    closeArray(original.output, [-1 / Math.sqrt(11), 1 / Math.sqrt(11)]);
    closeArray(doubled.output, [-Math.sqrt(2 / 7), Math.sqrt(2 / 7)]);
    assert.ok(doubled.output[1] - original.output[1] > 0.2);
    closeArray(vector(method, [-2, 2], { epsilon: 1e-30 }).output, [-1, 1]);
  }
});

test('constant and zero vectors are finite; RMS retains nonzero constants', () => {
  for (const method of ['layer', 'rms', 'batch', 'group']) {
    const options = { shape: [2, 4, 2], method, values: Array(16).fill(0) };
    closeArray(normalize(options).output, Array(16).fill(0));
    const constants = normalize({ ...options, values: Array(16).fill(3), epsilon: 7 });
    closeArray(constants.output, Array(16).fill(method === 'rms' ? 0.75 : 0));
  }
});

test('changing activation units scales mean/RMS linearly and variance/epsilon quadratically', () => {
  const a = calculateMoments([1, 2, 3, 4]), b = calculateMoments([10, 20, 30, 40]);
  close(b.mean, 10 * a.mean); close(b.rms, 10 * a.rms); close(b.variance, 100 * a.variance);
  for (const method of ['layer', 'rms']) {
    closeArray(vector(method, [-1, 1], { epsilon: 3 }).output, [-0.5, 0.5]);
    closeArray(vector(method, [-10, 10], { epsilon: 300 }).output, [-0.5, 0.5]);
  }
});

test('LN/RMS reduce channels independently for each sample and spatial slot', () => {
  for (const method of ['layer', 'rms']) {
    const result = tensorNorm(method);
    assert.deepEqual(result.stats.map(stat => stat.indices), [[0, 2, 4, 6], [1, 3, 5, 7], [8, 10, 12, 14], [9, 11, 13, 15]]);
    closeArray(result.stats.map(stat => stat.mean), [3.5, 5.5, 4.5, 6.5]);
    result.stats.forEach(stat => close(stat.variance, 4.25));
    assert.deepEqual(result.groupOf, [0, 1, 0, 1, 0, 1, 0, 1, 2, 3, 2, 3, 2, 3, 2, 3]);
  }
});

test('BN reduces batch and space for each channel, with a hand variance', () => {
  const result = tensorNorm('batch');
  assert.deepEqual(result.stats.map(stat => stat.indices), [[0, 1, 8, 9], [2, 3, 10, 11], [4, 5, 12, 13], [6, 7, 14, 15]]);
  closeArray(result.stats.map(stat => stat.mean), [2.5, 3.5, 6.5, 7.5]);
  result.stats.forEach(stat => close(stat.variance, 1.25));
  const changed = tensorNorm('batch', { values: tensor.map((value, i) => value + (i >= 8 ? 6 : 0)) });
  assert.ok(Math.abs(changed.output[0] - result.output[0]) > 0.1);
});

test('GN groups 1, 2, 4 select correct sets and hand moments without cross-sample coupling', () => {
  const one = tensorNorm('group', { groups: 1 });
  closeArray(one.stats.map(stat => stat.mean), [4.5, 5.5]);
  one.stats.forEach(stat => close(stat.variance, 5.25));
  assert.deepEqual(one.stats[0].indices, [0, 1, 2, 3, 4, 5, 6, 7]);
  const two = tensorNorm('group', { groups: 2 });
  closeArray(two.stats.map(stat => stat.mean), [2.5, 6.5, 3.5, 7.5]);
  two.stats.forEach(stat => close(stat.variance, 1.25));
  assert.deepEqual(two.stats.map(stat => stat.indices), [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]]);
  const four = tensorNorm('group', { groups: 4 });
  closeArray(four.stats.map(stat => stat.mean), [2, 3, 6, 7, 3, 4, 7, 8]);
  four.stats.forEach(stat => close(stat.variance, 1));
  for (const groups of [1, 2, 4]) {
    const baseline = tensorNorm('group', { groups });
    const changed = tensorNorm('group', { groups, values: tensor.map((value, i) => value + (i >= 8 ? 6 : 0)) });
    closeArray(changed.output.slice(0, 8), baseline.output.slice(0, 8));
  }
});

test('stored BN moments control inference; current input diagnostics stay distinct', () => {
  const settings = { mode: 'inference', runningMean: [2.5, 3.5, 6.5, 7.5], runningVariance: [2, 2, 2, 2], epsilon: 2 };
  const result = tensorNorm('batch', settings);
  closeArray(result.output.slice(0, 8), [-0.75, 0.25, -0.75, 0.25, -0.75, 0.25, -0.75, 0.25]);
  const changed = tensorNorm('batch', { ...settings, values: tensor.map((value, i) => value + (i >= 8 ? 6 : 0)) });
  closeArray(changed.output.slice(0, 8), result.output.slice(0, 8));
  assert.equal(changed.stats[0].source, 'stored');
  close(changed.stats[0].mean, 2.5); close(changed.stats[0].variance, 2);
  close(changed.stats[0].inputMean, 5.5); close(changed.stats[0].inputVariance, 13.25);
  close(changed.stats[0].rms, Math.sqrt(43.5));
  close(changed.stats[0].inputRms, changed.stats[0].rms);
});

test('affine parameters apply after normalization with correct channel sharing', () => {
  const gains = [2, -1, 0, 3], biases = [1, 2, 3, 4];
  for (const method of ['layer', 'batch', 'group']) {
    const plain = tensorNorm(method);
    const affine = tensorNorm(method, { gamma: gains, beta: biases });
    affine.output.forEach((value, index) => {
      const c = Math.floor(index / 2) % 4;
      close(value, gains[c] * plain.output[index] + biases[c]);
    });
    closeArray(affine.normalized, plain.normalized);
  }
  closeArray(vector('layer', [3, 3, 3, 3], { gamma: gains, beta: biases }).output, biases);
  closeArray(vector('rms', [1, 2, 3, 4], { gamma: gains, epsilon: 1.5 }).output, [2 / 3, -2 / 3, 0, 4]);
  assert.throws(() => vector('rms', undefined, { beta: 1 }), /gain only/);
});

test('centered variance survives large offsets and RMS avoids squaring overflow', () => {
  const moments = calculateMoments([1e12 + 1, 1e12 + 2, 1e12 + 3, 1e12 + 4]);
  close(moments.variance, 1.25);
  closeArray(vector('layer', [1e12 + 1, 1e12 + 2, 1e12 + 3, 1e12 + 4]).output, vector('layer').output);
  const hugeConstant = calculateMoments([1e200, 1e200]);
  assert.equal(hugeConstant.variance, 0); close(hugeConstant.rms, 1e200);
  closeArray(vector('rms', [1e200, 1e200]).output, [1, 1]);
});

test('invalid dimensions, values, settings and stored moments are rejected', () => {
  for (const values of [[], [NaN], [Infinity], ['1'], [undefined]]) assert.throws(() => calculateMoments(values));
  for (const shape of [[], [1, 4], [1, 0, 1], [1, 1.5, 1], [1, 4, 2]]) assert.throws(() => normalize({ values: [1, 2, 3, 4], shape }));
  for (const epsilon of [0, -1, Infinity, NaN]) assert.throws(() => vector('layer', undefined, { epsilon }));
  for (const groups of [0, 3, 5, 1.5, Infinity]) assert.throws(() => tensorNorm('group', { groups }));
  assert.throws(() => vector('unknown'));
  assert.throws(() => vector('layer', undefined, { mode: 'unknown' }));
  assert.throws(() => vector('layer', undefined, { gamma: [1, 2] }));
  assert.throws(() => vector('layer', undefined, { beta: NaN }));
  assert.throws(() => tensorNorm('batch', { mode: 'inference' }));
  assert.throws(() => tensorNorm('batch', { mode: 'inference', runningMean: [0, 0, 0, 0], runningVariance: [1, 1, -1, 1] }));
  assert.throws(() => calculateMoments([-1e200, 1e200]), /range/);
});

test('calculation does not mutate caller arrays', () => {
  const values = Object.freeze([...tensor]), shape = Object.freeze([2, 4, 2]);
  const result = normalize({ values, shape, method: 'group' });
  assert.deepEqual(result.values, values); assert.notEqual(result.values, values);
  assert.deepEqual(result.shape, shape); assert.notEqual(result.shape, shape);
});
