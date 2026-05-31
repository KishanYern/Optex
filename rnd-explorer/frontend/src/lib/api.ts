import type { ExpiriesResponse, RNDResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchExpiries(ticker: string): Promise<ExpiriesResponse> {
  const res = await fetch(`${API_BASE}/expiries/${encodeURIComponent(ticker)}`);
  return jsonOrThrow<ExpiriesResponse>(res);
}

export async function fetchRND(
  ticker: string,
  expiry: string,
  opts: { r?: number; smoothing?: number; nGrid?: number } = {},
): Promise<RNDResponse> {
  const params = new URLSearchParams();
  if (opts.r !== undefined) params.set("r", String(opts.r));
  if (opts.smoothing !== undefined) params.set("smoothing", String(opts.smoothing));
  if (opts.nGrid !== undefined) params.set("n_grid", String(opts.nGrid));
  const url = `${API_BASE}/rnd/${encodeURIComponent(ticker)}/${encodeURIComponent(expiry)}?${params}`;
  const res = await fetch(url);
  return jsonOrThrow<RNDResponse>(res);
}
