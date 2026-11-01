import test from 'node:test';
import assert from 'node:assert/strict';
import { sinusoidal, rotate, dot, alibiBias, softmax } from '../public/math.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
test('sinusoidal pairs start at (0,1), preserve unit norm, and use the stated frequency', () => {
  for (const base of [100, 1000, 10000]) for (let d = 0; d < 32; d += 2) {
    close(sinusoidal(0, d, 32, base), 0); close(sinusoidal(0, d + 1, 32, base), 1);
    close(sinusoidal(17, d, 32, base) ** 2 + sinusoidal(17, d + 1, 32, base) ** 2, 1);
    close(sinusoidal(17, d, 32, base), Math.sin(17 * Math.exp(-d / 32 * Math.log(base))));
  }
});
test('RoPE dot product has relative-position identity for arbitrary content vectors', () => {
  const q = [.3, -.7], k = [1.2, .9];
  for (let m = 0; m <= 24; m++) for (let n = 0; n <= 24; n++) {
    const score = dot(rotate(q, m * .25), rotate(k, n * .25));
    close(score, dot(q, rotate(k, (n - m) * .25)));
    close(score, dot(rotate(q, (m + 3) * .25), rotate(k, (n + 3) * .25)));
  }
});
test('causal ALiBi masks the future, is uniform at zero, and favors recent keys', () => {
  assert.equal(alibiBias(3, 4, .25), -Infinity);
  const uniform = softmax(Array.from({ length: 16 }, (_, j) => alibiBias(15, j, 0)));
  uniform.forEach(p => close(p, 1 / 16));
  const weighted = softmax(Array.from({ length: 16 }, (_, j) => alibiBias(15, j, .25)));
  close(weighted.reduce((a, b) => a + b), 1);
  weighted.slice(1).forEach((p, i) => assert.ok(p > weighted[i]));
  close(softmax([0, -Infinity])[1], 0);
});
