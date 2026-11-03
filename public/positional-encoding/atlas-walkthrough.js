import { methods } from './atlas-data.js';
import { defaults, buildContext } from './atlas-math.js';

// A longer fixed sentence reaches the clipping/logarithmic regions without a context builder.
export function sampleText(methodId) {
  return ['shaw','t5'].includes(methodId)
    ? {prefix:'The small red object moves slowly across the image while the camera follows it from left to right',suffix:'Where is it now?'}
    : {prefix:'Find the red object',suffix:'Where is it now?'};
}

export const stepNames = ['Why this idea?', 'Position IDs', 'Encoding', 'Compare', 'Experiment & tradeoff'];

// Deterministic examples make Previous, Next, and Restart reproducible.
// The controller initializes step 5 with its focused experiment baseline.
export function lessonPreset(methodId, step = 0) {
  const method = methods.find(m => m.id === methodId);
  if (!method) throw new Error(`Unknown encoding: ${methodId}`);
  const index = Math.max(0, Math.min(4, Math.trunc(step) || 0));
  const scene = method.family === 'Video' ? 'video'
    : method.family === 'Foundations' || ['rope', 'pi', 'yarn'].includes(methodId) ? 'text' : 'image';
  const context = buildContext({ scene, grid: 4, ...sampleText(methodId) });
  const first = context.groups[0]?.start ?? 2;
  let query = first, key = first + 1, pair = 0;
  const options = { ...defaults };
  if (['mrope', 'time-mrope'].includes(methodId)) pair = 16;
  if (['interleaved', 'mrope-i'].includes(methodId)) pair = 2;
  if (['shaw','t5'].includes(methodId)) { query = 2; key = 11; }
  if (methodId === 'alibi') { query = 6; key = 2; }
  if (methodId === 'circle') { query = context.tokens.length - 1; key = first; }
  if (index === 3) {
    key = scene === 'text' ? 7 : first + 4;
    if (methodId === 'shaw') key = 14;
    if (methodId === 't5') key = 13;
    if (methodId === 'alibi') { query = 7; key = 0; }
    if (methodId === 'circle' || methodId === 'vrope' || methodId === 'v2pe') key = first + 15;
    if (methodId === 'mrope') pair = 8;
    if (['interleaved', 'mrope-i'].includes(methodId)) pair = 1;
    if (methodId === 'mhrope') options.head = 1;
    if (['videorope', 'time-mrope'].includes(methodId)) { key = first + 32; pair = methodId === 'videorope' ? 23 : 0; }
  }
  return { step: index, scene, view: index === 0 ? 'source' : 'encoded', query, key, pair, options };
}
