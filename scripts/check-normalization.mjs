// Optional browser acceptance check. Does not install dependencies or start a server.
// Usage: PLAYWRIGHT_MODULE=<module specifier or file URL> node scripts/check-normalization.mjs
// Default module: playwright. Serve public/ at localhost:4173 first.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { baselineState, runExperiment, decodeState, methodIds } from '../public/normalization/state.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = 'evidence-private/normalization';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], failedRequests = [], checks = [];
const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4173';
const url = `${origin}/learn/normalization/`;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto(url);
  await page.waitForSelector('.activation-cell');
  for (const method of methodIds) {
    await page.locator('#method').selectOption(method);
    for (let step = 0; step < 5; step++) {
      assert.equal(await page.locator('#progress').innerText(), `${step + 1} / 5`);
      assert.ok((await page.locator('#tour-body').innerText()).length > 50);
      assert.equal(await page.locator('.activation-cell').count(), method === 'layer' || method === 'rms' ? 4 : 16);
      assert.ok(!(await page.locator('#visualization').innerText()).match(/NaN|Infinity|undefined/));
      if (step >= 2) assert.equal(await page.locator('.output-view').count(), 1);
      if (step < 4) await page.locator('#next').click();
    }
    await page.locator('#experiment').click();
    assert.deepEqual(decodeState(new URL(page.url()).hash), runExperiment(method));
    await page.locator('.activation-cell').last().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.activation-cell[aria-pressed=true]').getAttribute('data-index'), String(baselineState(method).values.length - 1));
    assert.equal(await page.locator(':focus').getAttribute('data-index'), String(baselineState(method).values.length - 1));
    await page.locator('#open-settings').click();
    await page.locator('#epsilon').selectOption('1');
    await page.locator('#input-value').fill('-2'); await page.locator('#input-value').press('Tab');
    await page.locator('#affine').check();
    if (method === 'group') await page.locator('#groups').selectOption('4');
    if (method === 'batch') await page.locator('#mode').selectOption('inference');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'open-settings');
    assert.equal(decodeState(new URL(page.url()).hash).step, 4);
    const savedUrl = page.url(), before = await page.locator('#tour-observation').innerText();
    await page.reload(); await page.waitForSelector('.activation-cell');
    assert.equal(page.url(), savedUrl); assert.equal(await page.locator('#tour-observation').innerText(), before);
    await page.locator('#share').click();
    assert.equal(await page.locator('#share-url').inputValue(), savedUrl);
    await page.locator('#copy-link').click();
    await page.waitForFunction(() => document.getElementById('share-status').textContent.length > 0);
    assert.match(await page.locator('#share-status').innerText(), /Link copied|Select and copy/);
    await page.keyboard.press('Escape'); assert.equal(await page.locator(':focus').getAttribute('id'), 'share');
    await page.locator('#open-reference').click();
    assert.ok((await page.locator('#reference-content').innerText()).includes('PyTorch'));
    await page.keyboard.press('Escape'); assert.equal(await page.locator(':focus').getAttribute('id'), 'open-reference');
    await page.locator('#previous').click();
    assert.equal(await page.locator('#progress').innerText(), '4 / 5');
    assert.equal(decodeState(new URL(page.url()).hash).affine, false);
    await page.locator('#reset').click(); assert.deepEqual(decodeState(new URL(page.url()).hash), baselineState(method));
    checks.push(`${method}: 5 steps, experiment, keyboard selection, scientific settings, share/reload, dialogs, reset`);
  }
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 720 }]) {
    await page.setViewportSize(viewport);
    for (const method of ['layer', 'batch', 'group']) {
      await page.locator('#method').selectOption(method);
      for (let step = 0; step < 5; step++) {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, `horizontal overflow ${viewport.width}/${method}/${step}`);
        const nav = await page.locator('.tour-navigation').boundingBox();
        assert.ok(nav.y >= 0 && nav.y + nav.height <= viewport.height + 1);
        await page.screenshot({ path: `${output}/${viewport.width}-${method}-${step}.png` });
        if (step < 4) await page.locator('#next').click();
      }
    }
    await page.locator('#open-settings').click();
    await page.screenshot({ path: `${output}/${viewport.width}-settings.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press('Escape');
    checks.push(`${viewport.width}×${viewport.height}: no page horizontal overflow; step navigation in viewport; screenshots captured (inspection separate)`);
  }
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  const report = { checks, errors, failedRequests, note: 'Screenshots require human/visual inspection; capture alone is not visual acceptance.' };
  await writeFile(`${output}/browser-checks.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
