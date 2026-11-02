# Learn — Learning & Research

Technical essays, research notes, and interactive explorations by Rishabh Patil. The first project is Position, Explained.

**Website:** https://rishabhpatil.github.io/learn/

The introductory guide covers sinusoidal encoding, RoPE, and ALiBi with inspectable SVG visualizations, a NumPy example, original-paper references, and a downloadable citation.

**[The Position Atlas](https://rishabhpatil.github.io/learn/positional-encoding/atlas.html)** expands this into 20 explorable configurations: foundational absolute/relative encodings, rotary context extension, 2D axial/mixed RoPE, M-RoPE, interleaving, MRoPE-I, MHRoPE, Circle-RoPE, VRoPE, VideoRoPE, V2PE, and time-aligned MRoPE. It includes a neutral no-position baseline. It is a curated catalog, not an exhaustive literature claim.

The desktop atlas has a guided explanation on the left and a synchronized visualization on the right. Each method has five Previous/Next steps: input tokens, position IDs, encoding, comparison, and free exploration. Scientific notes, equations, notation, sources, and limits remain in the left pane. Fixed text/image/video examples make position IDs, additive vectors, relative terms, frequency allocation, and rotary phases inspectable. Drag or use arrow keys to orbit the 3D geometry; scroll or use +/- to zoom. Click to select token B, shift-click for token A, or use the accessible dropdowns and data tables.

There is no context builder or attention simulator. Patches carry positional IDs; pixel colors texture their tiles. The scenes are index geometry, **not trained hidden embeddings**. Configuration links preserve the walkthrough step and positional construction; older links without a step open the free explorer. Restart restores a deterministic teaching example. JSON exports preserve positional data. See [the implementation and source notes](docs/atlas.md).

The site has no runtime framework or package dependencies. The renderer is a small local Canvas implementation of orthographic 3D projection.

## Local development

Requires Node.js 22 or newer. No package installation is needed.

```sh
npm run dev
# http://127.0.0.1:4173/learn/
npm test
npm run build
node scripts/serve.mjs --dist
```

Reload the browser after edits. Stop the server with Ctrl+C. Tests exercise positional math and analytics consent behavior. The build copies only `public/` to `dist/`, so documentation, tests, and local evidence are not deployed.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` checks pull requests and deploys pushes to `main` using GitHub Actions. Repository **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**. A successful `deploy` job reports the published URL. To deploy without a source change, use **Actions → Test and deploy GitHub Pages → Run workflow**.

All asset links are relative so the project works under `/learn/`. Changing the repository name or domain also requires updating canonical URLs, sitemap, citation, the production analytics hostname and cookie path, and local preview prefix.

## Analytics activation

Analytics is intentionally **off until configured**. See [the analytics setup guide](docs/analytics.md). Add the public GA4 measurement ID as repository variable `GA_MEASUREMENT_ID`, then rerun deployment. No API key or private credential belongs in the site.

Visitors choose whether to accept analytics. Browser privacy signals and local previews suppress collection. Defined interactions include method changes, slider changes, code copies, citation downloads, paper/source links, and a conservative reading proxy. The privacy page explains this behavior.

## Documenting reach

[The evidence guide](docs/evidence.md) describes monthly website exports, separate GitHub traffic captures, attribution, limitations, and a record template. `npm run evidence` captures raw GitHub data into the ignored `evidence-private/` directory. It needs an environment-provided GitHub token with repository Administration: read permission for traffic endpoints; without one it records public metadata and reports the incomplete capture.

## Project structure

| Path | Purpose |
| --- | --- |
| `public/index.html` | Learning homepage and collection index |
| `public/learn.js` | Homepage analytics consent controls |
| `public/positional-encoding/index.html` | Article, metadata, accessible controls |
| `public/positional-encoding/style.css` | Responsive layout and print styles |
| `public/positional-encoding/app.js` | SVG diagrams and interactions |
| `public/positional-encoding/math.js` | Positional encoding formulas |
| `public/positional-encoding/atlas.html` | Scientific reference and fixed examples |
| `public/positional-encoding/atlas-data.js` | Sourced method catalog and scope notes |
| `public/positional-encoding/atlas-tours.js` | Five scientific walkthrough steps for each configuration |
| `public/positional-encoding/atlas-walkthrough.js` | Reproducible step presets and selections |
| `public/positional-encoding/atlas-walkthrough.css` | Responsive split-pane walkthrough layout |
| `public/positional-encoding/atlas-reference.js` | Scientific introductions, equations, and primary citations |
| `public/positional-encoding/atlas-math.js` | Position IDs, phases, vectors, and relative terms |
| `public/positional-encoding/atlas-scene.js` | Mouse/keyboard-controlled 3D renderer |
| `public/positional-encoding/atlas.js` | Method reference, fixed examples, selection, share/export UI |
| `public/analytics.js` | Optional consent-gated GA4 integration |
| `public/positional-encoding/privacy.html` | Visitor-facing privacy explanation |
| `scripts/` | Build, preview, and evidence capture |
| `tests/` | Formula and privacy behavior checks |

## Editorial roadmap

- Get technical peer feedback and document substantive corrections.
- Expand the research queue (xPos, LongRoPE, M-RoPE++, Compass-RoPE, Spiral RoPE) after checking complete constructions and adding method-specific tests.
- Add checkpoint-specific frequency ratios, token boundary/merging rules, and layer scheduling where supported by sources.
- Add reproducible experiments before making model-performance claims.
- Publish tagged releases and keep external citations separate from site-traffic metrics.

This is an educational explanation of established methods, not a claim to have invented them. Links to the original papers appear alongside the relevant explanations.

The guided layout is inspired by [Brendan Bycroft’s LLM Visualization](https://bbycroft.net/llm). The positional-encoding implementation and explanatory content are specific to this atlas.

## Publishing another article

Add an article under `public/<topic>/` and link it from `public/index.html`. Keep shared analytics and configuration imports at the site root; use the same GA4 property for the collection. Add the canonical article URL to `public/sitemap.xml`.

The repository was renamed from `pe-understanding` to `learn`. GitHub redirects the old repository URL. Legacy website redirects are maintained under `pe-understanding/` in `RishabhPatil.github.io`, preserving query strings and atlas configuration fragments. The learning homepage is now maintained in this repository, not in the personal-site repository.
