import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics } from '../public/analytics.js';
function fixture(options = {}) {
  const scripts = [], storage = new Map(); let reloads = 0;
  const window = { location: { hostname: 'rishabhpatil.github.io', origin: 'https://rishabhpatil.github.io', pathname: '/pe-understanding/', reload() { reloads++; } }, navigator: {}, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } };
  const document = { referrer: 'https://example.org/private/path?email=secret', cookie: '', createElement: () => ({}), head: { append: el => scripts.push(el) } };
  if (options.local) window.location.hostname = 'localhost';
  if (options.dnt) window.navigator.doNotTrack = '1';
  if (options.gpc) window.navigator.globalPrivacyControl = true;
  if (options.blockedStorage) window.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  const api = createAnalytics({ window, document, id: options.id ?? 'G-TEST123' });
  return { api, window, scripts, storage, reloads: () => reloads };
}
test('no collection before consent or after decline; acceptance sends one pageview', () => {
  const f = fixture(); assert.equal(f.scripts.length, 0);
  f.api.track('code_copy'); assert.equal(f.window.dataLayer, undefined);
  f.api.setChoice('declined'); assert.equal(f.scripts.length, 0);
  f.api.setChoice('accepted'); f.api.setChoice('accepted');
  assert.equal(f.scripts.length, 1);
  const commands = f.window.dataLayer.map(args => [...args]);
  assert.equal(commands.filter(c => c[1] === 'page_view').length, 1);
  const config = commands.find(c => c[0] === 'config')[2];
  assert.equal(config.page_referrer, 'https://example.org');
  assert.equal(config.page_location, 'https://rishabhpatil.github.io/pe-understanding/');
  assert.equal(config.allow_google_signals, false);
  f.api.setChoice('declined'); const count = f.window.dataLayer.length;
  f.api.track('code_copy'); assert.equal(f.window.dataLayer.length, count);
  assert.equal(f.window['ga-disable-G-TEST123'], true); assert.equal(f.reloads(), 1);
});
test('missing ID, localhost, DNT and GPC never load analytics', () => {
  for (const options of [{ id: '' }, { id: 'invalid' }, { local: true }, { dnt: true }, { gpc: true }]) {
    const f = fixture(options); f.api.setChoice('accepted'); assert.equal(f.api.available, false); assert.equal(f.scripts.length, 0);
  }
});
test('blocked storage is safe and event data is restricted to predefined values', () => {
  const f = fixture({ blockedStorage: true }); f.api.setChoice('accepted');
  const count = f.window.dataLayer.length; f.api.track('visitor@example.com'); assert.equal(f.window.dataLayer.length, count);
  f.api.track('method_select', 'rope'); assert.deepEqual([...f.window.dataLayer.at(-1)], ['event', 'method_select', { method: 'rope' }]);
  f.api.track('method_select', 'visitor@example.com'); assert.deepEqual([...f.window.dataLayer.at(-1)][2], {});
});
