# Position, Explained

An interactive technical essay about positional encoding in transformers, by Rishabh Patil.

**Website:** https://rishabhpatil.github.io/pe-understanding/

The first edition covers sinusoidal encoding, RoPE, and ALiBi with inspectable SVG visualizations, a NumPy example, references to the original papers, and a downloadable citation. The site has no runtime framework or package dependencies.

## Local development

Requires Node.js 22 or newer. No package installation is needed.

```sh
npm run dev
# http://127.0.0.1:4173/pe-understanding/
npm test
npm run build
node scripts/serve.mjs --dist
```

Reload the browser after edits. Stop the server with Ctrl+C. Tests exercise positional math and analytics consent behavior. The build copies only `public/` to `dist/`, so documentation, tests, and local evidence are not deployed.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` checks pull requests and deploys pushes to `main` using GitHub Actions. Repository **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**. A successful `deploy` job reports the published URL. To deploy without a source change, use **Actions → Test and deploy GitHub Pages → Run workflow**.

All asset links are relative so the project works under `/pe-understanding/`. Changing the repository name or domain also requires updating canonical URLs, sitemap, citation, the production analytics hostname and cookie path, and local preview prefix.

## Analytics activation

Analytics is intentionally **off until configured**. See [the analytics setup guide](docs/analytics.md). Add the public GA4 measurement ID as repository variable `GA_MEASUREMENT_ID`, then rerun deployment. No API key or private credential belongs in the site.

Visitors choose whether to accept analytics. Browser privacy signals and local previews suppress collection. Defined interactions include method changes, slider changes, code copies, citation downloads, paper/source links, and a conservative reading proxy. The privacy page explains this behavior.

## Documenting reach

[The evidence guide](docs/evidence.md) describes monthly website exports, separate GitHub traffic captures, attribution, limitations, and a record template. `npm run evidence` captures raw GitHub data into the ignored `evidence-private/` directory. It needs an environment-provided GitHub token with repository Administration: read permission for traffic endpoints; without one it records public metadata and reports the incomplete capture.

## Project structure

| Path | Purpose |
| --- | --- |
| `public/index.html` | Article, metadata, accessible controls |
| `public/style.css` | Responsive layout and print styles |
| `public/app.js` | SVG diagrams and interactions |
| `public/math.js` | Positional encoding formulas |
| `public/analytics.js` | Optional consent-gated GA4 integration |
| `public/privacy.html` | Visitor-facing privacy explanation |
| `scripts/` | Build, preview, and evidence capture |
| `tests/` | Formula and privacy behavior checks |

## Editorial roadmap

- Get technical peer feedback and document substantive corrections.
- Add learned absolute and relative position embeddings.
- Expand RoPE into multiple frequency pairs, length extrapolation, interpolation, and scaling variants, with paper-specific assumptions and tests.
- Add reproducible experiments before making model-performance claims.
- Publish tagged releases and keep external citations separate from site-traffic metrics.

This is an educational explanation of established methods, not a claim to have invented them. Links to the original papers appear alongside the relevant explanations.
