import { describe, it, expect } from 'vitest';
import {
  cohenKappa,
  confusion,
  wilsonInterval,
  latencyPercentiles,
  calculateBinaryMetrics,
} from '../eval/metrics';

describe('Evaluation Metrics', () => {
  it('computes Cohen kappa = 1.0 for perfect agreement', () => {
    const r1 = ['SEAL', 'STOP_AND_FIX', 'UNCERTAIN', 'SEAL'];
    const r2 = ['SEAL', 'STOP_AND_FIX', 'UNCERTAIN', 'SEAL'];
    expect(cohenKappa(r1, r2)).toBeCloseTo(1.0);
  });

  it('computes reasonable Cohen kappa for partial agreement', () => {
    const r1 = ['SEAL', 'SEAL', 'STOP_AND_FIX', 'UNCERTAIN', 'SEAL'];
    const r2 = ['SEAL', 'STOP_AND_FIX', 'STOP_AND_FIX', 'UNCERTAIN', 'SEAL'];
    const kappa = cohenKappa(r1, r2);
    expect(kappa).toBeGreaterThan(0.5);
    expect(kappa).toBeLessThan(1.0);
  });

  it('computes confusion matrix correctly', () => {
    const gold = ['SEAL', 'SEAL', 'STOP_AND_FIX'];
    const pred = ['SEAL', 'UNCERTAIN', 'STOP_AND_FIX'];
    const classes = ['SEAL', 'STOP_AND_FIX', 'UNCERTAIN'];

    const cm = confusion(gold, pred, classes);
    expect(cm.matrix['SEAL']['SEAL']).toBe(1);
    expect(cm.matrix['SEAL']['UNCERTAIN']).toBe(1);
    expect(cm.matrix['STOP_AND_FIX']['STOP_AND_FIX']).toBe(1);
    expect(cm.matrix['STOP_AND_FIX']['SEAL']).toBe(0);
  });

  it('computes Wilson confidence interval within [0, 1]', () => {
    const interval = wilsonInterval(2, 50);
    expect(interval.center).toBeGreaterThan(0);
    expect(interval.lower).toBeGreaterThanOrEqual(0);
    expect(interval.upper).toBeLessThan(1);
    expect(interval.lower).toBeLessThan(interval.center);
    expect(interval.center).toBeLessThan(interval.upper);
  });

  it('computes latency percentiles correctly', () => {
    const latencies = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const stats = latencyPercentiles(latencies);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(1000);
    expect(stats.p50).toBe(600);
    expect(stats.p95).toBe(1000);
    expect(stats.mean).toBe(550);
  });

  it('computes precision, recall and F1 score for binary checks', () => {
    const counts = { tp: 8, fp: 2, fn: 1, tn: 39 };
    const metrics = calculateBinaryMetrics(counts);
    expect(metrics.precision).toBeCloseTo(0.8); // 8 / (8 + 2)
    expect(metrics.recall).toBeCloseTo(8 / 9); // 8 / (8 + 1)
    expect(metrics.f1).toBeGreaterThan(0.8);
  });
});
