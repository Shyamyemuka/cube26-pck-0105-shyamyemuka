export interface Thresholds {
  T_PRESENT: number;
  T_COUNT: number;
  T_EXTRA: number;
  T_EXTRA_UNSURE: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  T_PRESENT: 0.70,
  T_COUNT: 0.75,
  T_EXTRA: 0.70,
  T_EXTRA_UNSURE: 0.35,
};

export function getThresholds(envOverrides?: Partial<Thresholds>): Thresholds {
  const env: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {};
  return {
    T_PRESENT: envOverrides?.T_PRESENT ?? (env.T_PRESENT ? parseFloat(env.T_PRESENT) : DEFAULT_THRESHOLDS.T_PRESENT),
    T_COUNT: envOverrides?.T_COUNT ?? (env.T_COUNT ? parseFloat(env.T_COUNT) : DEFAULT_THRESHOLDS.T_COUNT),
    T_EXTRA: envOverrides?.T_EXTRA ?? (env.T_EXTRA ? parseFloat(env.T_EXTRA) : DEFAULT_THRESHOLDS.T_EXTRA),
    T_EXTRA_UNSURE: envOverrides?.T_EXTRA_UNSURE ?? (env.T_EXTRA_UNSURE ? parseFloat(env.T_EXTRA_UNSURE) : DEFAULT_THRESHOLDS.T_EXTRA_UNSURE),
  };
}
