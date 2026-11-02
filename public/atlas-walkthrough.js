import { methods } from './atlas-data.js';
import { defaults, buildContext } from './atlas-math.js';

export const stepNames = ['Input', 'Position IDs', 'Encoding', 'Compare', 'Explore'];

// Deterministic examples make Previous, Next, and Restart reproducible.
// Free exploration (step 5) preserves the current construction in the UI.
export function lessonPreset(methodId, step = 0) {
  const method = methods.find(m => m.id === methodId);
  if (!method) throw new Error(`Unknown encoding: ${methodId}`);
  const index = Math.max(0, Math.min(4, Math.trunc(step) || 0));
  const scene = method.family === 'Video' ? 'video'
    : method.family === 'Foundations' || ['rope', 'pi', 'yarn'].includes(methodId) ? 'text' : 'image';
  const context = buildContext({ scene, grid: 4 });
  const first = context.groups[0]?.start ?? 2;
  let query = first, key = first + 1, pair = 0;
  const options = { ...defaults };
  if (['mrope', 'time-mrope'].includes(methodId)) pair = 16;
  if (['interleaved', 'mrope-i'].includes(methodId)) pair = 2;
  if (methodId === 'alibi') { query = 6; key = 2; }
  if (methodId === 'circle') { query = context.tokens.length - 1; key = first; }
  if (index === 3) {
    key = scene === 'text' ? 7 : first + 4;
    if (methodId === 'alibi') { query = 7; key = 0; }
    if (methodId === 'circle' || methodId === 'vrope' || methodId === 'v2pe') key = first + 15;
    if (methodId === 'mrope') pair = 8;
    if (['interleaved', 'mrope-i'].includes(methodId)) pair = 1;
    if (methodId === 'mhrope') options.head = 1;
    if (['videorope', 'time-mrope'].includes(methodId)) { key = first + 32; pair = methodId === 'videorope' ? 23 : 0; }
  }
  return { step: index, scene, view: index === 0 ? 'source' : 'encoded', query, key, pair, options };
}
