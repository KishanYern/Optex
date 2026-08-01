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

export type GexItem = {
  strike: number;
  mid: number;
  volume: number;
  oi: number;
  iv: number;
  gamma: number;
  gex: number;
};

export type GexChainResponse = {
  ticker: string;
  expiry: string;
  spot: number;
  call_wall: number;
  put_wall: number;
  calls: GexItem[];
  puts: GexItem[];
};

export type HeatmapItem = {
  expiry: string;
  strike: number;
  type: string;
  premium: number;
  gex: number;
};

export type HeatmapResponse = {
  ticker: string;
  heatmap: HeatmapItem[];
};
