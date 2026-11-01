import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

// Raw captures stay local and are ignored by Git. Supply an existing token only
// through the environment; never paste it into this file or a shell argument.
const token = process.env.GITHUB_TOKEN;
const repo = 'RishabhPatil/pe-understanding';
const timestamp = new Date().toISOString();
const directory = resolve('evidence-private', timestamp.replaceAll(':', '-'));
await mkdir(directory, { recursive: true });
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'pe-understanding-evidence', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
const endpoints = ['', '/traffic/views', '/traffic/clones', '/traffic/popular/referrers', '/traffic/popular/paths'];
const records = [];
for (const endpoint of endpoints) {
  const name = endpoint ? endpoint.slice(1).replaceAll('/', '-') : 'repository';
  const url = `https://api.github.com/repos/${repo}${endpoint}`;
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) { records.push({ endpoint: url, status: response.status, captured: false }); continue; }
    const raw = await response.text();
    await writeFile(resolve(directory, name + '.json'), raw);
    records.push({ endpoint: url, status: response.status, captured: true, file: name + '.json', sha256: createHash('sha256').update(raw).digest('hex') });
  } catch { records.push({ endpoint: url, captured: false, error: 'Network request failed' }); }
}
let commit = null;
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* First commit might not exist yet. */ }
await writeFile(resolve(directory, 'manifest.json'), JSON.stringify({ captured_at_utc: timestamp, repository: repo, commit, records, caveats: ['Repository traffic is not website traffic.', 'Traffic endpoints cover the last 14 days.', 'Overlapping snapshots must be deduplicated by day.', 'A checksum detects later changes; it is not independent proof of origin.'] }, null, 2));
console.log(`Saved ${records.filter(r => r.captured).length}/${records.length} sources to ${directory}`);
if (records.some(r => !r.captured)) {
  console.error('Incomplete capture. Traffic requires repository Administration: read access. See the manifest for each status.');
  process.exitCode = 1;
}
