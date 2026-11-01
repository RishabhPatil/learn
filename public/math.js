export function sinusoidal(position, dimension, dimensions = 32, base = 10000) {
  const angle = position / base ** (2 * Math.floor(dimension / 2) / dimensions);
  return dimension % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
}

export function rotate([x, y], angle) {
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}

export function dot(a, b) { return a.reduce((sum, value, i) => sum + value * b[i], 0); }

export function alibiBias(query, key, slope) {
  return key > query ? -Infinity : -slope * (query - key);
}

export function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map(value => Math.exp(value - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(value => value / sum);
}
