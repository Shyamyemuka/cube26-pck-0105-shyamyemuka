/**
 * Pure evaluation metrics for Pack Manager
 * Defined in docs/EVAL_PLAN.md §6
 */

export function cohenKappa(rater1: string[], rater2: string[]): number {
  if (rater1.length !== rater2.length || rater1.length === 0) {
    return 0;
  }

  const n = rater1.length;
  const categories = Array.from(new Set([...rater1, ...rater2]));

  // Observed agreement
  let agreeCount = 0;
  for (let i = 0; i < n; i++) {
    if (rater1[i] === rater2[i]) {
      agreeCount++;
    }
  }
  const po = agreeCount / n;

  // Expected agreement by chance
  let pe = 0;
  for (const cat of categories) {
    const p1 = rater1.filter((r) => r === cat).length / n;
    const p2 = rater2.filter((r) => r === cat).length / n;
    pe += p1 * p2;
  }

  if (pe === 1) return 1;
  const kappa = (po - pe) / (1 - pe);
  return Number.isFinite(kappa) ? kappa : 0;
}

export interface ConfusionMatrix {
  classes: string[];
  matrix: Record<string, Record<string, number>>;
}

export function confusion(gold: string[], pred: string[], classes: string[]): ConfusionMatrix {
  const matrix: Record<string, Record<string, number>> = {};
  for (const g of classes) {
    matrix[g] = {};
    for (const p of classes) {
      matrix[g][p] = 0;
    }
  }

  for (let i = 0; i < gold.length; i++) {
    const g = gold[i];
    const p = pred[i];
    if (matrix[g] && matrix[g][p] !== undefined) {
      matrix[g][p]++;
    }
  }

  return { classes, matrix };
}

export interface WilsonInterval {
  center: number;
  lower: number;
  upper: number;
}

/**
 * Wilson score interval for binomial proportion with 95% confidence (z = 1.95996)
 */
export function wilsonInterval(positives: number, total: number, z = 1.95996): WilsonInterval {
  if (total <= 0) {
    return { center: 0, lower: 0, upper: 0 };
  }

  const p = positives / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const spread = (z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)) / denom;

  return {
    center: Math.max(0, Math.min(1, center)),
    lower: Math.max(0, Math.min(1, center - spread)),
    upper: Math.max(0, Math.min(1, center + spread)),
  };
}

export interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
}

export function latencyPercentiles(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, mean: 0, min: 0, max: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  function getPercentile(p: number) {
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
    return sorted[idx];
  }

  return {
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
    mean: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export interface BinaryCheckMetrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  uncertainCount: number;
}

export function calculateBinaryMetrics(counts: {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  uncertainCount?: number;
}): BinaryCheckMetrics {
  const { tp, fp, fn, tn } = counts;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    tp,
    fp,
    fn,
    tn,
    precision,
    recall,
    f1,
    uncertainCount: counts.uncertainCount || 0,
  };
}
