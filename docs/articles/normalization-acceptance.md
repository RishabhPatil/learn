# Normalization Explained — acceptance record

Review date: 2026-11-01 (America/Los_Angeles). Article: https://rishabhpatil.github.io/learn/normalization/ . This run refreshes 12 candidates, shortlists three and implements one. No second article was started. The supplied `docs/article-orchestrator-plan.md` was preserved without edits.

## Research and independent review

Three bounded subagents worked within separate file ownership: cross-domain/mathematical research, teaching/visual design, and source skepticism/writing. They were reused across implementation and review; at most three subagents ran beside the orchestrator. Full-source conventions, recent-literature caveats, ranked candidates and score rationales are recorded in [backlog](../article-backlog.md), [brief](normalization.md), and `docs/research/`.

The math author independently reviewed the lesson/controller as a novice; the lesson author independently reviewed math/state/renderer as an expert. These are bounded agent reviews, not external human peer review. [Expert review](../reviews/normalization-expert.md) and [novice review](../reviews/normalization-novice.md) document scope and evidence. Resolved findings: distinguish starting probe from current selection; raw RMS doubles while epsilon-adjusted divisor nearly doubles; define epsilon for direct RMS entry; distinguish green training sets from stored inference statistics. No unresolved finding invalidates the demonstration.

## Executed validation

- `npm test`: **42/42 passing**, including all existing positional tests. Normalization adds 13 mathematical and 3 state tests; analytics adds article identity/privacy coverage. Independent fixtures cover population moments, mean subtraction, finite-epsilon scaling, constants/zeros, dimensions/units, axes/groups, affine broadcasting, stored-stat independence, numerical stability and invalid input. The reviewer additionally exercised 96 extreme-setting state roundtrips.
- `npm run build`: succeeds; copies only `public/` to `dist/`. Local builds leave analytics disabled. The unchanged Pages workflow supplies the repository's configured measurement ID.
- `git diff --check`: passes. Position article/Atlas files and deployment workflow are unchanged.
- `scripts/check-normalization.mjs` with externally available Playwright and Chromium: all 20 guided states; four first-click experiments; keyboard cell selection/focus; scientific settings enter Explore; shared URL and reload preservation; Previous and Next; reset; native dialogs/Escape/focus return; Copy link action and its status. Zero browser exceptions or failed HTTP responses.
- Viewport checks at **1440×1000, 390×844, 320×720**: no page horizontal overflow; Previous/Next remain in the viewport. Screenshots saved outside published assets under ignored `evidence-private/normalization/` and actually opened/inspected. Representative desktop/vector/tensor/comparison, phone/narrow reduction/result, settings, and homepage inspected.
- Visual findings fixed: phone result/comparison charts now appear first; inputs/statistics are available by internal scrolling with a cue. At 320×720 all 16 input cells fit in reduction steps, with 44px targets. Precise output deltas remain readable when bars overlap. Desktop keeps the reading pane beside the visualization.
- Integration browser pass: homepage has two article entries and its new link opens the article; local article/navigation links return 200; existing Position Atlas loads its canvas and lesson without errors; canonical, structured metadata and sitemap contain the new URL.
- Actual article-module analytics checked in an isolated browser with production hostname and intercepted synthetic configuration: no script before consent; one script and one pageview after acceptance; same result for saved acceptance; DNT/GPC produce zero scripts/pageviews. Page title is Normalization Explained and page location excludes query/fragment. Events contain only predefined method labels, never tensor contents. Google requests were intercepted; this is not a claim of live GA account receipt.

Reproduce browser checks by serving the repo (`npm run dev`) and running `node scripts/check-normalization.mjs` with Playwright available, or setting `PLAYWRIGHT_MODULE` to its module file URL. Browser tooling is optional developer tooling and is not a runtime/site dependency. Capturing screenshots alone does not constitute inspection.

## Scope and release

The four examples are formula evaluations in JavaScript double precision on synthetic activations. No training, checkpoint, moving-average simulation, low-precision emulation, GPU measurement or model-accuracy comparison. Inference statistics are explicitly fixed illustrative values. Uniform affine controls are a special case of per-feature/channel parameters; RMSNorm uses gain only. Input editing is bounded to ±1000 and epsilon to [1e−8,1]. Primary formulas and pinned PyTorch 2.9.0 conventions are linked in the page.

Publication uses the existing `.github/workflows/pages.yml` on main. The release gate is a successful build/deploy workflow and an HTTP/browser check of the deployed article/assets. Workflow evidence is available in [GitHub Actions](https://github.com/RishabhPatil/learn/actions/workflows/pages.yml); the final delivery records the verified run. Preview servers owned by this run are stopped after release verification.

Next recommendations: **Inference memory** and **What is a token outside language?** They remain backlog entries only.
