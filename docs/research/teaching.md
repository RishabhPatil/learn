# Teaching-design research pass

Reviewed 2026-11-01. This is an editorial evaluation, not an experimental result. Scores are 0–5 in the plan's order: cross-domain usefulness / visual teaching / verifiability / distinctiveness / feasibility. Weighted scores use 25% / 25% / 20% / 15% / 15%.

| Candidate | Interaction and misconception | Scores and reasons | Readiness / sources |
| --- | --- | --- | --- |
| Normalization | Select one activation and reveal the exact numbers sharing its statistics; shift all four vector components. Misconception: every normalization centers, and every method uses the same axes. | 5 / 5 / 5 / 4 / 5 = 4.85. Recurs in recurrent, convolutional and Transformer families; grouping and centering are immediately visible; finite tensor answers are independently testable; complements rather than duplicates Position; no trained model needed. | Ready. [LayerNorm v1](https://arxiv.org/abs/1607.06450v1), [RMSNorm v1](https://arxiv.org/abs/1910.07467v1), [BatchNorm v3](https://arxiv.org/abs/1502.03167v3), [GroupNorm v3](https://arxiv.org/abs/1803.08494v3). Final numerical convention belongs in math audit. |
| Inference memory | Append a token to a visibly growing K/V grid; keep query heads fixed while changing KV heads. Misconception: KV cache stores all past queries, or fewer KV heads mechanically implies a measured speedup. | 4 / 5 / 5 / 4 / 5 = 4.60. Applies to causal multimodal decoders but not every generator; storage grows visibly; exact byte accounting; strong practical bridge; integer dimensions suffice. | Ready with scope fixed to causal attention and storage, excluding allocator overhead and speed claims. [GQA v3](https://arxiv.org/abs/2305.13245v3). |
| What is a token outside language? | Change patch size on a fixed image, then optionally snap a projected toy vector to a codebook. Misconception: a patch is intrinsically a discrete vocabulary index. | 5 / 5 / 4 / 4 / 4 = 4.50. Directly spans modalities; grouping is tangible; learned projection must be explicitly illustrative; related to Position but answers a different question; fitting audio/video into one small visual requires care. | Ready after narrowing to grouping, projection, and optional discretization. [ViT v2](https://arxiv.org/abs/2010.11929v2), [VQ-VAE v2](https://arxiv.org/abs/1711.00937v2). |
| Low-rank adaptation | Change rank of a tiny factored update and inspect its action on the same input vector. Misconception: parameter-count reduction alone predicts fine-tuning quality. | 4 / 4 / 5 / 4 / 5 = 4.35. Matrix mechanism transfers across linear layers; needs a good visual to avoid a formula worksheet; exact multiplication and rank constraints are testable; distinct from Position; easy browser implementation. | Ready as a linear-algebra article with an explicitly illustrative update. [LoRA v2](https://arxiv.org/abs/2106.09685v2). Do not imply truncated SVD is how LoRA is trained. |
| Quantization | Drag one outlier while holding integer range fixed; see scale, rounding intervals and clipping change. Misconception: a small tensor error establishes model accuracy. | 5 / 5 / 4 / 4 / 4 = 4.50. Broad deployment relevance; bins and clipping are visible; rounding and calibration choices need careful convention; distinct; feasible without hardware benchmarks. | Ready with a single explicit affine quantizer first; separate weight, activation and cache use cases. [Jacob et al. v1](https://arxiv.org/abs/1712.05877v1). |
| Sparse experts | Route fixed scores to three experts, then lower capacity until an assignment overflows. Misconception: expert names prove learned semantic specializations, or total parameters equal active compute. | 4 / 5 / 4 / 4 / 4 = 4.25. Conditional computation spans model families; routing is legible; capacity/overflow policies vary; distinct; toy scores must be clearly untrained. | Ready with one specified routing and overflow policy. [Switch Transformer v3](https://arxiv.org/abs/2101.03961v3). |

## Normalization: minimal visual design

Retain the existing Position Atlas rhythm: full-height, 360px reading pane on the left and one dominant visualization on the right; warm paper, dark green, serif headings, sans-serif prose, monospace values. Four-method select at the top. The lesson contains a short method introduction, one current step, a computed takeaway, one focused experiment, and on-demand sources. Do not copy the atlas's camera controls or positional terminology.

The dominant view is a flat activation grid, not a 3D scene. Vectors show four labeled components. Tensor methods show two sample panels, four channel rows, two spatial columns (N=2, C=4, S=2). Highlight the selected cell with a dark outline, all cells in its reduction set with a green background, and unrelated cells with neutral background. A textual reduction caption states the axes. Cell numbers remain visible; selection uses native buttons or a native select, not color alone.

Progressive display: input cells first; then the selected reduction set and mean/variance or mean-square; then normalized output; finally baseline and changed output in the same scale with numeric difference. A single signed output strip is enough. Exact tables, affine parameters, epsilon and inference stored statistics live in a settings/details dialog. A current-value sentence must say whether it describes pre-affine normalized values or final output.

Phone layout: 44px header, 44px method picker, visual occupying roughly 40% of remaining height, scrollable lesson below, fixed 52px Previous/Next footer including safe-area inset. For 320px widths reduce margins, not text below 11px. Tensor labels should abbreviate to n0/c0/s0 with full names in the legend. Visual may scroll internally vertically, but there must be no page-level horizontal scroll. Dialog controls remain at least 40–44px high and scroll vertically.

## Five steps for each method

| Step | LayerNorm | RMSNorm | BatchNorm | GroupNorm |
| --- | --- | --- | --- | --- |
| 1 Input | Four components [1,2,3,4], dimensionless activations. | Same input to isolate centering. | Two samples × four channels × two spatial sites. Select n0/c0/s0. | Same tensor as BatchNorm, initially two groups. |
| 2 Construction | Highlight all four; show mean 2.5 and population variance 1.25. | Highlight all four; show mean-square 7.5 and RMS sqrt(7.5); explicitly no subtraction. | Highlight same channel over both samples and sites; show training mean/variance. | Highlight two channels and both sites within selected sample; show mean/variance. |
| 3 Result | Show normalized output, centered near zero; affine optional and off/default identity. | Show normalized output, nonzero mean; RMS is near 1 with finite epsilon. | Show selected output and clearly label training statistics. Explain affine is per channel. | Show selected output; no running-statistics switch. |
| 4 Controlled comparison | Add +4 to every vector component; normalized output stays the same subject to floating error. | Add +4 to every component; output changes because centering is absent. | Change only the other sample's matching channel; selected sample output changes during training. | Apply the same other-sample perturbation; selected sample output does not change. |
| 5 Experiment | First click scales baseline by 2; print small finite-epsilon difference. | First click scales baseline by 2; print small finite-epsilon difference. | First click uses fixed stored statistics and repeats companion perturbation, revealing independence. Stored values are illustrative, not learned live. | First click switches from 2 groups to 1 on unchanged baseline; reduction set changes visibly. |

All experiments first restore known baseline, change the advertised variable, and enter Explore. Changing any scientific setting also enters Explore. Restart restores method, step 1, baseline, identity affine, selected cell, and epsilon. A link preserves the complete state or explicitly states what it preserves. Switching method should avoid carrying incompatible tensor/vector controls across methods.

## Proposed interface (orchestrator freezes actual contract)

- `math.js`: pure `normalize({method, values, shape, groups, epsilon, gamma, beta, mode, runningMean, runningVariance})` returns `{output, normalized, groupIds, stats}`; `stats` includes reduction member indices and actual mean/variance/RMS denominator. Flatten tensor in N,C,S order. Renderer never computes scientific quantities independently.
- `lessons.js`: method names, introductions, five step objects (`title`, `body`, `view`, `experiment`), paper versions, limits, baseline arrays, experiment transformations. The orchestrator decides whether transformations live instead in controller presets.
- `render.js`: `render(container, {method, step, values, shape, result, selected, comparison}, onSelect)`; returns/sets accessible caption and exact table. No state ownership or analytics.
- `app.js`: orchestrator-owned state, preset transitions, controls, share/reset/dialog focus and analytics.
- `style.css`: visual agent-owned article layout and responsive styling, scoped to article body. Shared styles/navigation untouched.

## Novice hazards to prevent

1. Define “reduction set” as “numbers pooled to calculate this cell's statistics” before using the term.
2. A four-feature Transformer vector and a channel×spatial image tensor are different examples; name the shape switch when moving to BatchNorm.
3. Do not label mean-square as variance in RMSNorm.
4. Do not promise exact unit variance/RMS with positive epsilon, or after affine transformation.
5. “Inference” is not a different input; it changes which statistics BatchNorm uses.
6. Keep the numerical takeaway next to the lesson, and avoid making the reader infer a tiny difference from nearly overlapping bars.
