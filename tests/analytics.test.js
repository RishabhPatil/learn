import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics } from '../public/analytics.js';
function fixture(options = {}) {
  const scripts = [], storage = options.storage ?? new Map(); let reloads = 0;
  const window = { location: { hostname: 'rishabhpatil.github.io', origin: 'https://rishabhpatil.github.io', pathname: '/learn/positional-encoding/', reload() { reloads++; } }, navigator: {}, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } };
  const document = { referrer: 'https://example.org/private/path?email=secret', cookie: '', createElement: () => ({}), head: { append: el => scripts.push(el) } };
  if (options.path) window.location.pathname = options.path;
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
  assert.equal(config.page_location, 'https://rishabhpatil.github.io/learn/positional-encoding/');
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.cookie_path, '/learn');
  assert.equal(config.cookie_prefix, 'learn');
  f.api.setChoice('declined'); const count = f.window.dataLayer.length;
  f.api.track('code_copy'); assert.equal(f.window.dataLayer.length, count);
  assert.equal(f.window['ga-disable-G-TEST123'], true); assert.equal(f.reloads(), 1);
});
test('homepage and articles share consent but report their own page locations', () => {
  const home = fixture({ path: '/learn/' });
  home.api.setChoice('accepted');
  const homeConfig = home.window.dataLayer.map(args => [...args]).find(c => c[0] === 'config')[2];
  assert.equal(homeConfig.page_title, 'Learn — Learning & Research');
  const atlas = fixture({ storage: home.storage, path: '/learn/positional-encoding/atlas.html' });
  assert.equal(atlas.api.needsChoice, false);
  assert.equal(atlas.scripts.length, 1);
  const config = atlas.window.dataLayer.map(args => [...args]).find(c => c[0] === 'config')[2];
  assert.equal(config.page_title, 'The Position Atlas');
  assert.equal(config.page_location, 'https://rishabhpatil.github.io/learn/positional-encoding/atlas.html');
  atlas.api.setChoice('declined');
  const returnHome = fixture({ storage: home.storage, path: '/learn/' });
  assert.equal(returnHome.api.needsChoice, false);
  assert.equal(returnHome.scripts.length, 0);
});
test('missing ID, localhost, DNT and GPC never load analytics', () => {
  for (const options of [{ id: '' }, { id: 'invalid' }, { local: true }, { dnt: true }, { gpc: true }]) {
    const f = fixture(options); f.api.setChoice('accepted'); assert.equal(f.api.available, false); assert.equal(f.scripts.length, 0);
  }
});
test('normalization has its own identity, one pageview, and only fixed event labels', () => {
  for (const path of ['/learn/normalization/', '/learn/normalization/index.html']) {
    const f = fixture({ path });
    f.window.location.hash = '#values=1,2,3,4';
    f.api.setChoice('accepted'); f.api.setChoice('accepted');
    const commands = f.window.dataLayer.map(args => [...args]);
    assert.equal(f.scripts.length, 1);
    assert.equal(commands.filter(c => c[1] === 'page_view').length, 1);
    const config = commands.find(c => c[0] === 'config')[2];
    assert.equal(config.page_title, 'Normalization Explained');
    assert.equal(config.page_location, 'https://rishabhpatil.github.io' + path);
    for (const method of ['layernorm', 'rmsnorm', 'batchnorm', 'groupnorm']) {
      f.api.track('explorer_interaction', method);
      assert.deepEqual([...f.window.dataLayer.at(-1)], ['event', 'explorer_interaction', { method }]);
    }
    f.api.track('explorer_interaction', '[1,2,3,4]');
    assert.deepEqual([...f.window.dataLayer.at(-1)][2], {});
  }
});
test('blocked storage is safe and event data is restricted to predefined values', () => {
  const f = fixture({ blockedStorage: true }); f.api.setChoice('accepted');
  const count = f.window.dataLayer.length; f.api.track('visitor@example.com'); assert.equal(f.window.dataLayer.length, count);
  f.api.track('method_select', 'rope'); assert.deepEqual([...f.window.dataLayer.at(-1)], ['event', 'method_select', { method: 'rope' }]);
  f.api.track('method_select', 'visitor@example.com'); assert.deepEqual([...f.window.dataLayer.at(-1)][2], {});
});
