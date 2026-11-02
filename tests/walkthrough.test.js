import test from 'node:test';
import assert from 'node:assert/strict';
import { methods } from '../public/positional-encoding/atlas-data.js';
import { tours } from '../public/positional-encoding/atlas-tours.js';
import { lessonPreset, sampleText } from '../public/positional-encoding/atlas-walkthrough.js';
import { buildContext, coordinates, phase } from '../public/positional-encoding/atlas-math.js';

test('every walkthrough resolves to valid token selections and encoding quantities', () => {
  for (const method of methods) {
    assert.equal(tours[method.id].length, 5);
    for (let step = 0; step < 5; step++) {
      const preset = lessonPreset(method.id, step);
      const context = buildContext({ scene: preset.scene, grid: 4, ...sampleText(method.id) });
      const positions = coordinates(context, method.id, preset.options);
      for (const index of [preset.query, preset.key]) {
        assert.ok(positions[index] && !positions[index].excluded, `${method.id}, step ${step}: inspectable token`);
        if (method.kind === 'rotary') assert.ok(Number.isFinite(phase(positions[index], method.id, preset.pair, preset.options)));
      }
      assert.ok(tours[method.id][step].title && tours[method.id][step].body);
    }
  }
});

test('guided comparisons isolate column, row, and frame changes without changing tokenization', () => {
  const get = (method, step) => {
    const p = lessonPreset(method, step);
    const positions = coordinates(buildContext({ scene: p.scene, grid: 4, ...sampleText(method) }), method, p.options);
    return { p, positions, delta: positions[p.key].ids.map((v, i) => v - positions[p.query].ids[i]) };
  };
  assert.deepEqual(get('mrope', 2).delta, [0, 0, 1]);
  assert.deepEqual(get('mrope', 3).delta, [0, 1, 0]);
  assert.equal(get('mrope', 2).positions.length, get('mrope', 3).positions.length);
  assert.deepEqual(get('time-mrope', 3).delta, [4, 0, 0]);
  const a = lessonPreset('mrope', 0); a.options.base = 100;
  assert.equal(lessonPreset('mrope', 0).options.base, 10000, 'Restart returns independent defaults');
});
