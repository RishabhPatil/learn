import { cp, mkdir, writeFile } from 'node:fs/promises';
const id = (process.env.GA_MEASUREMENT_ID || '').trim();
if (id && !/^G-[A-Z0-9]+$/.test(id)) throw new Error('GA_MEASUREMENT_ID must be a GA4 G-… measurement ID.');
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await writeFile('dist/config.js', `export const analyticsId = ${JSON.stringify(id)};\n`);
await writeFile('dist/.nojekyll', '');
console.log(`Built dist/ (analytics ${id ? 'configured; visitor consent required' : 'disabled'}).`);
