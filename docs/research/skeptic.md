# Research skeptic — 2026-11-01

Review scope: source traceability and demo validity, not a literature-completeness claim. Read the normalization definitions and inference sections in the papers below and the pinned PyTorch 2.9.0 module source. Reviewed recent primary literature to avoid treating these four methods as the only possibilities. Existing Position Atlas concerns positional constructions; these six mechanisms have no material content overlap.

## Six candidate evaluations

Scores are editorial judgments in order usefulness / visualization / verifiability / distinction / feasibility (0–5), with the plan's 25/25/20/15/15 weights.

| Candidate | Scores; weighted | Concrete claim and useful demo | Sources, distinctions, readiness |
| --- | --- | --- | --- |
| Normalization | 5/5/5/5/5; 5.00 | Highlight exactly which tensor entries share statistics; changing another sample alters BatchNorm training but not GroupNorm. | LN, RMSNorm, BN, GN sources below. Distinct from position IDs. Ready: four methods are bounded and testable, with substantial cross-domain use. Do not claim universal stabilization or exact finite-epsilon scale invariance. |
| Residual paths and gates | 5/4/5/4/4; 4.45 | Compare the exact local Jacobians of x+f(x), f(x), and an explicitly specified gate. | [ResNet v1](https://arxiv.org/abs/1512.03385v1), [Highway Networks v2](https://arxiv.org/abs/1505.00387v2). Skip paths and learned gates are distinct. Ready after choosing a scalar or 2D construction; a local derivative does not prove convergence. |
| Latent bottlenecks | 5/5/4/4/3; 4.35 | Move a point across a nearest-code boundary and show discrete reconstruction changes. | [VQ-VAE v2](https://arxiv.org/abs/1711.00937v2), [Latent Diffusion v2](https://arxiv.org/abs/2112.10752v2). Learned perceptual compression is not an arbitrary downsample. Conditional readiness: explicitly illustrative fixed encoder/codebook; no semantic claims or image-quality proxy. |
| Training objectives | 5/4/4/4/3; 4.10 | Hold examples fixed and reveal which target supplies each gradient. | [BERT v2](https://arxiv.org/abs/1810.04805v2), [SimCLR v3](https://arxiv.org/abs/2002.05709v3), [DDPM v2](https://arxiv.org/abs/2006.11239v2). Masking, contrastive pairing, and denoising define different supervision and assumptions. Conditional readiness: reduce scope to two or three exact scalar losses before implementation. |
| Quantization | 5/5/5/4/5; 4.85 | Change clipping range and show quantized matrix-output error at a boundary. | [Integer-only inference v1](https://arxiv.org/abs/1712.05877v1), [LLM.int8 v2](https://arxiv.org/abs/2208.07339v2). Weight, activation, and cache quantization differ; integer range, rounding convention, scale and zero point must be explicit. Ready, but exact tensor error cannot establish task accuracy or GPU speed. |
| Sparse experts | 5/5/4/4/4; 4.50 | Route fixed scores, then create a capacity conflict on the first experiment click. | [Switch v3](https://arxiv.org/abs/2101.03961v3), [V-MoE v1](https://arxiv.org/abs/2106.05974v1). Top-k routing, capacity dropping, and expert specialization are different concepts; inference algorithms may be dropless. Ready as explicitly illustrative routing with no trained-specialization claim. |

Recommendation: implement Normalization first. Quantization is strong later but should not displace the already well-scoped first article. Inference memory and tokenization offer diverse next-article audiences; choose after the other scouts' scoring.

## Normalization audit and source versions

- [Layer Normalization, 1607.06450v1](https://arxiv.org/pdf/1607.06450v1), §3 Eq. 3 and §3.1: statistics within an example, independently at each recurrent time step. Normalized dimensions must be specified; “whole layer” is not a universal tensor-axis rule.
- [RMSNorm, 1910.07467v1](https://arxiv.org/html/1910.07467v1), §4 Eq. 4 and §4.1: divide by RMS, omit centering. Paper's idealized invariance analysis omits epsilon. Do not infer that mean removal is universally useless from its experiments.
- [Batch Normalization, 1502.03167v3](https://arxiv.org/pdf/1502.03167v3), §3 Algorithm 1, §3.1 and §3.2: current-batch population variance in the forward transform, separate inference estimates, spatial BN pooling over batch and spatial axes for each channel.
- [Group Normalization, 1803.08494v3](https://arxiv.org/pdf/1803.08494v3), §3.1 Eqs. 1–7 and §3.2: reduce channels in a group and all spatial sites within one sample; affine parameters are per channel. Channel count must divide group count.
- Pinned implementation: [PyTorch v2.9.0 normalization.py](https://github.com/pytorch/pytorch/blob/v2.9.0/torch/nn/modules/normalization.py) and [batchnorm.py](https://github.com/pytorch/pytorch/blob/v2.9.0/torch/nn/modules/batchnorm.py). LN uses per-normalized-element affine parameters and population variance; RMSNorm learns gain only. These modules delegate to functional kernels; this audit establishes the documented public contract, not GPU bitwise equivalence.
- Versioned API: [BatchNorm2d 2.9](https://docs.pytorch.org/docs/2.9/generated/torch.nn.BatchNorm2d.html), [LayerNorm 2.9](https://docs.pytorch.org/docs/2.9/generated/torch.nn.LayerNorm.html), [RMSNorm 2.9](https://docs.pytorch.org/docs/2.9/generated/torch.nn.RMSNorm.html), [GroupNorm 2.9](https://docs.pytorch.org/docs/2.9/generated/torch.nn.GroupNorm.html). Use an explicit common epsilon for comparison rather than silently copying unlike defaults.

## Equations and pitfalls to freeze in the brief

For a reduction set S of m activations, μ = sum(x)/m, v = sum((x−μ)²)/m, q = sum(x²)/m. Centered normalization is z = (x−μ)/sqrt(v+ε); RMS normalization is z = x/sqrt(q+ε). The stabilizer is inside the square root. Pre-affine centered variance is v/(v+ε), and RMSNorm's mean square is q/(q+ε), not exactly one. The normalized result is dimensionless; activation values use arbitrary units, while v, q, and ε have squared activation units.

1. Keep pre-affine z separate from y. Standard LN/BN/GN use y=γz+β; standard PyTorch RMSNorm uses y=γz. An optional RMS bias must be explicitly labeled an extension, or omitted.
2. A constant input gives centered z=0. Nonzero constant RMS input remains nonzero; zero input returns zero for positive ε. Do not permit ε=0 on a constant/zero group without explicit undefined handling.
3. A constant shift leaves centered normalization unchanged (in real arithmetic) but changes RMSNorm. Positive scaling is only approximately invariant at fixed positive ε. Negative scaling also changes sign before affine transformation.
4. For shape N×C×S, BN training reduces N,S; GN reduces the channels of a group and S for each N. Tokenwise LN/RMS reduce C for each N,S. GN with G=1 matches LN statistics only if LN reduces C,S together; it does not generally match tokenwise LN. Affine parameter shapes can differ even when statistics match.
5. PyTorch BN uses population variance for training output, but updates running_var from the unbiased m/(m−1) estimate. Its momentum convention is new=(1−a)old+a×batch statistic. Running statistics are estimates from training history, not automatically equal to current-batch statistics. Frozen inference values may be simple illustrative constants, but must say so. Without running-stat tracking, PyTorch uses batch statistics even in eval mode; the article may explicitly cover default tracked-stat inference only.
6. Avoid describing normalization as whitening or as making values Gaussian; neither follows from the transform.

## Independent reference constructions

- Vector [1,2,3,4]: μ=2.5, v=1.25, q=7.5, RMS=sqrt(7.5). At ε=1e−5, LN z≈[−1.341635420,−0.447211807,0.447211807,1.341635420]; RMS z≈[0.365148128,0.730296256,1.095444385,1.460592513]. These follow from hand-computed sufficient statistics, not implementation reuse.
- With a +10 shift, LN z stays the same. RMS q becomes 157.5 and z≈[0.876500952,0.956182857,1.035864762,1.115546667]. A shared bar scale must show the difference.
- Epsilon-sensitive exact case: x=[−1,1], ε=1 gives LN/RMS z=[−1/sqrt(2),1/sqrt(2)]; scale inputs by 2 while keeping ε=1 gives [−2/sqrt(5),2/sqrt(5)]. This visibly disproves exact finite-epsilon scale invariance.
- At ε=1 and x=[3,3], LN z=[0,0], RMS z=[3/sqrt(10),3/sqrt(10)]. At x=[0,0], both are zero. An affine LN γ=2, β=−1 makes every constant-group result −1.
- N=2,C=4,S=2 tensor flattened in N,C,S order as 1…16: BN c=0 sees [1,2,9,10], μ=5.5, v=16.25. GN G=2 at n=0,g=0 sees [1,2,3,4], μ=2.5,v=1.25. Changing x[n=1,c=0,s=0] changes BN output at n=0,c=0,s=0 but cannot change GN output there.
- For the BN c=0 group above, unbiased sample variance is 65/3, distinct from forward v=65/4. With initial running variance 1 and a=0.1, next running variance is 46/15≈3.066666667. Do not use this quantity for that training forward pass.

## Recent-literature and disputed-explanation check

[Transformers without Normalization, 2503.10622v1](https://arxiv.org/html/2503.10622v1), §2–4, introduces Dynamic Tanh as a replacement without moment reductions. It does not redefine LN/RMSNorm; it cautions against presenting normalization layers as indispensable. Exclude replacements from this first article.

[Numerical stability analysis of large language models, 2503.10251v2, 2026-06-22](https://arxiv.org/html/2503.10251v2), §3, distinguishes mathematical conditioning and floating-point error for LN and RMSNorm. A JavaScript double-precision demonstration is not a low-precision kernel or training-stability benchmark.

[How Does Batch Normalization Help Optimization?, 1805.11604v5](https://arxiv.org/abs/1805.11604v5) challenges the original internal-covariate-shift explanation. State what statistics are computed, not an unqualified causal story that controlling distribution shift explains all benefits.

Stopping condition met: six candidate evaluations and bounded normalization source/convention audit. Public files remain untouched.
