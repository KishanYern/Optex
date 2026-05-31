export type Diagnostics = {
  integral: number;
  n_monotonicity_violations: number;
  n_convexity_violations: number;
  n_negative_density: number;
  fit_rmse: number;
  mean: number;
  forward: number;
};

export type RNDResponse = {
  ticker: string;
  expiry: string;
  spot: number;
  T: number;
  r: number;
  K_grid: number[];
  iv_smoothed: number[];
  iv_raw_K: number[];
  iv_raw: number[];
  C_smoothed: number[];
  C_raw_K: number[];
  C_raw: number[];
  rnd: number[];
  rnd_raw_K: number[];
  rnd_raw: (number | null)[];
  diagnostics: Diagnostics;
};

export type ExpiriesResponse = {
  ticker: string;
  expiries: string[];
};
