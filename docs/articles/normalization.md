# Normalization Explained — implementation brief

Reviewed and selected 2026-11-01. Author: Rishabh Patil. Canonical: https://rishabhpatil.github.io/learn/normalization/.

## Reader and scope

Question: which numbers are normalized together, and what does centering change? Prerequisites: arrays, averages, and basic arithmetic. Outcome: identify a reduction set, distinguish centering from RMS rescaling, and predict whether changing another sample changes an output.

Four constructions: feature-wise LayerNorm, gain-only RMSNorm, spatial BatchNorm, and GroupNorm. Exclude learned model outputs, optimization/performance rankings, residual placement, adaptive norms, training gradients, moving-average simulation, and low-precision emulation. These are exact formula evaluations in JavaScript double precision on illustrative activations, not measured model experiments.

## Teaching sequence and fixtures

Five steps per method: input → reduction set/statistics → normalized result → controlled comparison → experiment. The current selection is a probe, and highlighting shows the numbers used to normalize it. Equations, settings, exact data, sources, and scope are available on demand.

LN/RMS input `[1,2,3,4]`, shape `[1,4,1]`. Mean 2.5, population variance 1.25, raw RMS sqrt(7.5). Compare a constant shift +3 with all settings held fixed. Experiment starts again from this baseline and multiplies all components by 2. LN removes the shift; RMS does not. Positive scaling is only approximately invariant with finite epsilon.

BN/GN input `[1,3,2,4,5,7,6,8,2,4,3,5,6,8,7,9]`, shape `[2,4,2]`. The two spatial slots can represent two flattened locations. Compare and experiment add 6 to all values in sample n=1 while keeping sample n=0 and all settings fixed. Probe n=0,c=0,s=0 changes under training BN but not GN. Default G=2. BN inference uses explicitly illustrative, fixed stored means `[2.5,3.5,6.5,7.5]` and variances `[2,2,2,2]`; changing the other sample cannot alter these statistics. No moving average is learned by this page.

## Conventions and source-to-demonstration map

Flattening index is `(n*C+c)*S+s`, zero-based labels. Activations are illustrative arbitrary units; variance and epsilon have squared activation units; normalized z is dimensionless. Default epsilon=1e-5 inside the square root. Population variance uses divisor m. Default affine transform is identity. Optional illustrative uniform gain 2 and bias 1 follow normalization; RMS has gain only. Real LN/RMS parameters are per feature and BN/GN per channel; uniform controls are a special case, not trained values.

| Claim | Primary reference / pinned implementation | Equation / test | Visible demonstration |
| --- | --- | --- | --- |
| LN centers a feature vector independently | Ba et al. arXiv:1607.06450v1 §3, Eq.3; PyTorch v2.9.0 normalization.py LayerNorm | z=(x-mean)/sqrt(var+eps); hand outputs, shift and constant cases | Four cells and selected-set mean; shift comparison |
| RMS rescales without centering | Zhang & Sennrich arXiv:1910.07467v1 §4; PyTorch v2.9.0 RMSNorm | z=x/sqrt(mean(x²)+eps); hand outputs, nonzero-mean and zero cases | Positive outputs survive; shift changes result |
| Finite epsilon breaks exact scale invariance | Same formulas and explicit epsilon convention in PyTorch v2.9.0 | Small inputs and large epsilon; positive scale tests | ×2 experiment, precise output delta; epsilon setting |
| BN couples samples during training | Ioffe & Szegedy arXiv:1502.03167v3 §3 Alg.1, §3.2; PyTorch v2.9.0 batchnorm.py | Reduce N,S for each C; hand statistics and sample perturbation | Highlight same channel across both samples; changed other sample |
| BN inference may use stored statistics | Same §3.1 Alg.2; PyTorch v2.9.0 BatchNorm2d | Fixed means/variance; batch independence test | Train/inference control; stored-source label |
| GN groups channels within a sample | Wu & He arXiv:1803.08494v3 §3 Eq.7, Fig.3; PyTorch v2.9.0 GroupNorm | Reduce C/G,S for each N; group boundaries and G=1/4 tests | Change G and inspect highlight; other-sample independence |
| Affine parameters follow normalization | Four cited implementations | y=gamma*z+beta, RMS y=gamma*z; explicit tests | Optional affine setting and exact table |

BN's training forward population variance must not be confused with the unbiased variance used to update PyTorch running_var. GN G=1 matches all-feature/spatial LN statistics, not feature-only LN generally. LN/RMS here reduce channel/features C separately per (n,s); their introductory S=1 fixture avoids storage-layout ambiguity.

Sources: https://arxiv.org/pdf/1607.06450v1 ; https://arxiv.org/html/1910.07467v1 ; https://arxiv.org/pdf/1502.03167v3 ; https://arxiv.org/html/1803.08494v3 ; https://github.com/pytorch/pytorch/blob/v2.9.0/torch/nn/modules/normalization.py ; https://github.com/pytorch/pytorch/blob/v2.9.0/torch/nn/modules/batchnorm.py . Full-section audits and recent-literature caveats are recorded in `docs/research/`.

## Ownership and interfaces

- Research/math agent: `public/normalization/math.js`, `tests/normalization-math.test.js`.
- Visualization agent: `public/normalization/renderer.js`, `public/normalization/style.css`.
- Writer agent: `public/normalization/lessons.js`.
- Orchestrator: page shell, controller, pure state/presets, integration, analytics identity, backlog, acceptance record, deployment.

Pure math: `normalize({values,shape:[N,C,S],method,epsilon,groups,mode,runningMean,runningVariance,gamma,beta})` returns `{values,shape,method,normalized,output,groupOf,stats}`. Each stats entry has `{indices,mean,variance,rms,denominator,source}`. Methods layer/rms/batch/group, modes train/inference. `calculateMoments(values)` returns mean/variance/rms. Renderer: `renderNormalization(container,{state,result,baseline,comparisonLabel,onSelect})`. Lessons: methods array with id/name/summary/steps (title/body), experimentLabel/Description, equation/axes/limits/sources.

## Acceptance

Independent hand fixtures, constants/zeros/epsilon boundaries, axes/groups, stored-stat independence, affine behavior, input validation. All 20 guided states and four experiment transitions render; settings enter Explore; reset, selection, sharing/reload, dialogs, keyboard focus work. Inspect desktop and narrow phone screenshots. Independent expert/novice review and interaction QA. Existing tests, production build, canonical/sitemap/home navigation, consent gating and one correctly identified pageview. Preserve Position Atlas. Commit only reviewed scope, deploy existing Pages workflow, verify published page/assets. Screenshots remain outside public assets. Corrections: https://github.com/RishabhPatil/learn/issues/new .
