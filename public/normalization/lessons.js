// Original educational synthesis of the cited methods, reviewed 2026-11-01.
// The page evaluates formulas on illustrative activations; no weights are trained.

const normalizationCode = {
  title: 'PyTorch v2.9.0 · normalization modules',
  url: 'https://github.com/pytorch/pytorch/blob/v2.9.0/torch/nn/modules/normalization.py',
  note: 'Pinned LayerNorm, RMSNorm and GroupNorm definitions; explicit epsilon inside the square root, parameter shapes and forward calls.',
};

const commonScope = 'These are illustrative activations in arbitrary units, evaluated in JavaScript double precision. Variance and epsilon have squared activation units; the normalized result z is dimensionless. Gain multiplies z, and bias adds an offset afterward. The optional uniform parameters are hand-set examples, not learned weights. This is an educational synthesis of established methods, not original research or a training-quality benchmark.';

export const methods = [
  {
    id: 'layer',
    name: 'LayerNorm',
    summary: 'Center and rescale the features of one input vector. Other examples do not supply its statistics.',
    steps: [
      {
        title: 'Start with four features',
        body: 'The values [1, 2, 3, 4] are four features of one illustrative input, such as a token representation. Select a value to inspect it. These are activation values, not token IDs or probabilities.',
      },
      {
        title: 'Choose the numbers that belong together',
        body: 'All four features form one reduction set: the numbers combined to compute a statistic. Their mean is 2.5 and their variance is 1.25. Variance averages squared distances from the mean, using all four values as its divisor.',
      },
      {
        title: 'Subtract the mean, then divide',
        body: 'Subtract 2.5 from each feature, then divide by the square root of variance plus epsilon. Epsilon is a small positive stabilizer, here 0.00001. Before any gain or bias, the result has mean zero and variance just below one.',
      },
      {
        title: 'Add the same offset to every feature',
        body: 'Compare [1, 2, 3, 4] with [4, 5, 6, 7]. The mean rises by 3 too, so subtracting it removes the common offset. With epsilon and affine parameters held fixed, the normalized outputs agree, apart from floating-point rounding.',
      },
      {
        title: 'Explore the current example',
        body: 'Select a value to see which numbers supply its statistics. Adjust a value, epsilon, or the optional gain and bias, then inspect the computed result. Run the focused experiment to restore the fixed baseline and double its inputs; Reset restores the opening example.',
      },
    ],
    experimentLabel: 'Double the baseline inputs',
    experimentDescription: 'Restore [1, 2, 3, 4], epsilon 0.00001 and identity affine parameters; compare with [2, 4, 6, 8]. The normalized outputs are nearly unchanged. The precise difference is nonzero because epsilon stays fixed.',
    equation: 'μ = Σxᵢ / m; v = Σ(xᵢ − μ)² / m; zᵢ = (xᵢ − μ) / √(v + ε); yᵢ = γᵢzᵢ + βᵢ.',
    axes: 'This page reduces features C independently at each sample n and location s. In the opening example N=1, C=4, S=1. This feature-wise choice is common for token representations in language and vision Transformers; recurrent models can normalize each time step independently.',
    limits: `${commonScope} LayerNorm can normalize other explicitly chosen dimensions; its name alone does not specify those axes. Real affine parameters are per normalized feature. Finite epsilon prevents exact positive-scale invariance. This operation does not whiten features or make them Gaussian.`,
    sources: [
      {
        title: 'Ba, Kiros & Hinton · Layer Normalization',
        url: 'https://arxiv.org/pdf/1607.06450v1',
        note: '2016, v1. Section 3, Equation 3: within-example statistics; Section 3.1: recurrent time steps.',
      },
      normalizationCode,
    ],
  },
  {
    id: 'rms',
    name: 'RMSNorm',
    summary: 'Rescale the same features using their root mean square, without subtracting their mean.',
    steps: [
      {
        title: 'Keep the same four features',
        body: 'Begin again with [1, 2, 3, 4]. RMSNorm uses the same four-feature reduction set as the preceding LayerNorm example. The question now is what changes when we leave the mean in the signal.',
      },
      {
        title: 'Measure magnitude around zero',
        body: 'Square each value and average: (1 + 4 + 9 + 16) / 4 = 7.5. Its square root, about 2.739, is the root mean square, or RMS. This measures magnitude around zero, rather than spread around the mean.',
      },
      {
        title: 'Divide without centering',
        body: 'Divide each input by √(7.5 + epsilon). Epsilon is a small positive stabilizer, here 0.00001. All four outputs stay positive because no mean is subtracted. Their mean square is just below one. The optional gain scales the normalized result; this RMSNorm convention has no additive bias.',
      },
      {
        title: 'A shared offset now matters',
        body: 'Add 3 to every baseline feature while holding other settings fixed. Both the numerator and RMS change, and the normalized outputs differ. Compare this with LayerNorm: RMSNorm retains sensitivity to a common offset because it does not center.',
      },
      {
        title: 'Explore the current example',
        body: 'Inspect the selected feature and its reduction set. Try another value or epsilon, or enable the illustrative gain. Run the focused experiment to compare the fixed baseline with doubled inputs. Read the precise output difference when the bars appear almost identical.',
      },
    ],
    experimentLabel: 'Double the baseline inputs',
    experimentDescription: 'Restore [1, 2, 3, 4], epsilon 0.00001 and gain 1; compare with [2, 4, 6, 8]. Raw RMS doubles; the divisor including epsilon nearly doubles. The output is nearly unchanged: fixed positive epsilon makes the invariance approximate.',
    equation: 'q = Σxᵢ² / m; RMS = √q; zᵢ = xᵢ / √(q + ε); yᵢ = γᵢzᵢ. No mean subtraction or additive bias.',
    axes: 'Reduce features C independently at each sample n and location s, just as in this page’s LayerNorm example. RMSNorm was studied across recurrent language tasks, image–caption retrieval and image classification.',
    limits: `${commonScope} The gain-only affine convention follows the pinned implementation. RMSNorm does not promise zero mean or unit variance. A nonzero constant vector stays nonzero, while a zero vector gives zero with positive epsilon. The paper’s idealized scale invariance omits epsilon; this page keeps it explicit.`,
    sources: [
      {
        title: 'Zhang & Sennrich · Root Mean Square Layer Normalization',
        url: 'https://arxiv.org/html/1910.07467v1',
        note: '2019, v1. Section 4, Equation 4: RMS rescaling; Section 4.1: idealized invariance analysis; Section 6: evaluated tasks.',
      },
      normalizationCode,
    ],
  },
  {
    id: 'batch',
    name: 'BatchNorm',
    summary: 'During training, normalize each channel using values from multiple examples and locations. Inference can use stored statistics.',
    steps: [
      {
        title: 'Add samples and locations',
        body: 'The small tensor contains two samples, four channels per sample, and two locations per channel. Think of the locations as two flattened image sites. The selected value is a probe: we will watch whether changing another sample changes its output.',
      },
      {
        title: 'Follow one channel across the batch',
        body: 'In training mode, a channel’s reduction set spans both samples and both locations. For channel 0, the values are [1, 3, 2, 4], with mean 2.5 and variance 1.25. Other channels have their own statistics.',
      },
      {
        title: 'Use the current batch statistics',
        body: 'Center each value using its channel’s mean and divide by √(variance + epsilon). The selected value is normalized using its batch neighbors too. Gain and bias, if enabled, are applied afterward and are shared across locations within each channel.',
      },
      {
        title: 'Change only the other sample',
        body: 'Add 6 to every value in sample 1; keep sample 0 unchanged. Channel 0 now combines [1, 3, 8, 10]. Its mean becomes 5.5 and variance 13.25, so the starting cell n0,c0,s0 changes output despite its unchanged input. The readout follows whichever cell you select.',
      },
      {
        title: 'Explore training and inference',
        body: 'Change the selected input or switch between current-batch training and fixed-statistic inference. The statistic-source label tells you what supplies the calculation. Run the experiment to restore the training baseline and change only the other sample.',
      },
    ],
    experimentLabel: 'Change the other sample',
    experimentDescription: 'Restore the two-sample training baseline with epsilon 0.00001 and identity affine parameters; add 6 to sample 1 only. The probe in sample 0 changes because both samples supply its channel statistics.',
    equation: 'For each channel c: μc = Σn,s xₙ,c,s / (N·S); vc = Σn,s (xₙ,c,s − μc)² / (N·S); z = (x − μc) / √(vc + ε); y = γcz + βc. Inference substitutes stored μc and vc.',
    axes: 'Training reduces sample N and location S, separately for each channel C. This is spatial BatchNorm: S can flatten image height and width, or temporal/spatial sites. Inference here uses fixed stored statistics instead of reducing the displayed batch.',
    limits: `${commonScope} Inference uses illustrative stored means [2.5, 3.5, 6.5, 7.5] and variances [2, 2, 2, 2]; they are not learned or updated here. PyTorch’s training forward pass uses population variance, but running_var updates use an unbiased estimate. This page does not simulate those updates. It covers tracked-stat inference; implementations without tracking may use batch statistics even in evaluation mode.`,
    sources: [
      {
        title: 'Ioffe & Szegedy · Batch Normalization',
        url: 'https://arxiv.org/pdf/1502.03167v3',
        note: '2015, v3. Section 3, Algorithm 1: training transform; Section 3.1, Algorithm 2: inference; Section 3.2: spatial reductions.',
      },
      {
        title: 'PyTorch v2.9.0 · BatchNorm modules',
        url: 'https://github.com/pytorch/pytorch/blob/v2.9.0/torch/nn/modules/batchnorm.py',
        note: 'Pinned training/evaluation dispatch, tracked buffers, affine parameters and variance conventions.',
      },
    ],
  },
  {
    id: 'group',
    name: 'GroupNorm',
    summary: 'Pool a group of channels and their locations within one sample. Other samples stay outside the reduction set.',
    steps: [
      {
        title: 'Keep the same small tensor',
        body: 'Use the same two samples, four channels and two locations as BatchNorm. Only the choice of reduction set changes. We start with two channel groups: channels 0–1 belong together, and channels 2–3 belong together.',
      },
      {
        title: 'Stay inside one sample',
        body: 'For the starting cell n0,c0,s0, group 0 contains [1, 3, 2, 4]: both locations in channels 0 and 1. Its mean is 2.5 and variance is 1.25. No value from sample 1 enters this calculation. Selecting a different cell shows its own reduction set.',
      },
      {
        title: 'Normalize each group separately',
        body: 'Subtract the group mean and divide by √(group variance + epsilon). Each sample has its own groups. The optional affine transform is per channel, even though several channels share normalization statistics. GroupNorm uses input statistics in both training and inference.',
      },
      {
        title: 'Change only the other sample',
        body: 'Add 6 to sample 1 while keeping sample 0 and the group count fixed. The starting cell n0,c0,s0 has an untouched reduction set, so its output is unchanged. BatchNorm’s training result changed under the same intervention because it pooled both samples. The readout follows your current selection.',
      },
      {
        title: 'Explore the group boundary',
        body: 'Choose one, two or four groups and inspect which cells share statistics with the probe. Editing a value inside the selected group can affect its output; editing another sample cannot. Run the focused experiment to repeat that independence check from the baseline.',
      },
    ],
    experimentLabel: 'Change the other sample',
    experimentDescription: 'Restore the two-sample baseline, two groups, epsilon 0.00001 and identity affine parameters; add 6 to sample 1 only. The probe in sample 0 keeps exactly the same inputs and statistics, so its output is unchanged.',
    equation: 'Let A be the selected reduction set within sample n and channel group g. μ = (Σᵢ∈A xᵢ) / m; v = (Σᵢ∈A (xᵢ − μ)²) / m; m = (C/G)·S; z = (x − μ) / √(v + ε); y = γcz + βc.',
    axes: 'Reduce C/G channels and all locations S inside each sample N. G is the number of groups and must divide C. GroupNorm’s paper studies image recognition, detection/segmentation and video classification, where the batch dimension need not supply the statistics.',
    limits: `${commonScope} One group pools all channels and locations within a sample; four groups here leave one channel per group. One-group statistics match LayerNorm only when LayerNorm reduces those same dimensions, not necessarily feature-wise token LayerNorm. Matching statistics also does not imply matching affine parameter shapes. This demonstration establishes sample independence, not better model accuracy.`,
    sources: [
      {
        title: 'Wu & He · Group Normalization',
        url: 'https://arxiv.org/pdf/1803.08494v3',
        note: '2018, v3. Section 3.1, Equations 1–7: reduction sets and per-channel affine transform; Section 3.2: implementation.',
      },
      normalizationCode,
    ],
  },
];
