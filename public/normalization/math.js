// Formula audit: PyTorch v2.9.0 normalization.py and batchnorm.py;
// RMS kernel convention also checked against v2.5.1 native/layer_norm.cpp.
// Illustrative float64 forward calculations; no running-stat updates or gradients.

function finiteArray(values, name, length) {
  if (!Array.isArray(values) || values.length === 0 ||
      (length !== undefined && values.length !== length) ||
      !values.every(Number.isFinite)) {
    throw new TypeError(`${name} must be a nonempty array of finite numbers${length === undefined ? '' : ` of length ${length}`}`);
  }
}

// Compensated summation limits rounding accumulation; callers scale to avoid
// overflowing an intermediate sum when its final mean is representable.
function sum(values) {
  let total = 0, correction = 0;
  for (const value of values) {
    const adjusted = value - correction;
    const next = total + adjusted;
    correction = (next - total) - adjusted;
    total = next;
  }
  return total;
}

function rootMeanSquare(values) {
  let scale = 0;
  for (const value of values) scale = Math.max(scale, Math.abs(value));
  if (scale === 0) return 0;
  return scale * Math.sqrt(sum(values.map(value => (value / scale) ** 2 / values.length)));
}

/** Population moments, with centered variance rather than E[x²]−E[x]². */
export function calculateMoments(values) {
  finiteArray(values, 'values');
  const mean = sum(values.map(value => value / values.length));
  const deviation = rootMeanSquare(values.map(value => value - mean));
  const variance = deviation * deviation;
  const rms = rootMeanSquare(values);
  if (![mean, variance, rms].every(Number.isFinite)) {
    throw new RangeError('Moments exceed the representable numerical range');
  }
  return { mean, variance, rms };
}

function channelParameter(value, channels, name) {
  if (Number.isFinite(value)) return Array(channels).fill(value);
  finiteArray(value, name, channels);
  return [...value];
}

/**
 * N,C,S storage: flat index (n*C+c)*S+s. LN/RMS reduce C per (n,s),
 * BN reduces N,S per C, and GN reduces C/G,S per N. Gains/biases are
 * per C, shared across N,S. RMSNorm is gain-only and rejects nonzero beta.
 * For stored BN statistics, rms/input* describe the current input set;
 * mean/variance/denominator are the stored statistics actually applied.
 */
export function normalize({
  values, shape, method = 'layer', epsilon = 1e-5, groups = 2,
  mode = 'train', runningMean, runningVariance, gamma = 1, beta = 0,
} = {}) {
  if (!Array.isArray(shape) || shape.length !== 3 ||
      !shape.every(dimension => Number.isSafeInteger(dimension) && dimension > 0)) {
    throw new TypeError('shape must contain three positive integer dimensions [N,C,S]');
  }
  const [N, C, S] = shape;
  const size = N * C * S;
  if (!Number.isSafeInteger(size)) throw new RangeError('shape is too large');
  finiteArray(values, 'values', size);
  if (!['layer', 'rms', 'batch', 'group'].includes(method)) throw new TypeError('Unknown normalization method');
  if (!['train', 'inference'].includes(mode)) throw new TypeError('Unknown statistics mode');
  if (!Number.isFinite(epsilon) || epsilon <= 0) throw new RangeError('epsilon must be positive and finite');
  if (method === 'group' && (!Number.isSafeInteger(groups) || groups < 1 || C % groups !== 0)) {
    throw new RangeError('groups must be a positive integer dividing C');
  }
  const gains = channelParameter(gamma, C, 'gamma');
  const biases = channelParameter(beta, C, 'beta');
  if (method === 'rms' && biases.some(value => value !== 0)) throw new RangeError('RMSNorm has gain only; beta must be zero');
  const stored = method === 'batch' && mode === 'inference';
  if (stored) {
    finiteArray(runningMean, 'runningMean', C);
    finiteArray(runningVariance, 'runningVariance', C);
    if (runningVariance.some(value => value < 0)) throw new RangeError('Stored variances must be nonnegative');
  }

  const sets = [];
  const groupOf = Array(size);
  for (let n = 0; n < N; n++) for (let c = 0; c < C; c++) for (let s = 0; s < S; s++) {
    const index = (n * C + c) * S + s;
    const group = method === 'batch' ? c
      : method === 'group' ? n * groups + Math.floor(c / (C / groups))
      : n * S + s;
    (sets[group] ??= []).push(index);
    groupOf[index] = group;
  }

  const normalized = Array(size), output = Array(size);
  const stats = sets.map((indices, group) => {
    const input = calculateMoments(indices.map(index => values[index]));
    const mean = stored ? runningMean[group] : input.mean;
    const variance = stored ? runningVariance[group] : input.variance;
    // hypot avoids overflowing the sum of squares in a finite denominator.
    const denominator = Math.hypot(method === 'rms' ? input.rms : Math.sqrt(variance), Math.sqrt(epsilon));
    for (const index of indices) {
      const channel = Math.floor(index / S) % C;
      normalized[index] = (method === 'rms' ? values[index] : values[index] - mean) / denominator;
      output[index] = normalized[index] * gains[channel] + biases[channel];
      if (!Number.isFinite(normalized[index]) || !Number.isFinite(output[index])) {
        throw new RangeError('Normalized output exceeds the representable numerical range');
      }
    }
    return {
      indices, mean, variance, rms: input.rms, denominator,
      source: stored ? 'stored' : 'input',
      inputMean: input.mean, inputVariance: input.variance, inputRms: input.rms,
    };
  });
  return { values: [...values], shape: [...shape], method, normalized, output, groupOf, stats };
}
