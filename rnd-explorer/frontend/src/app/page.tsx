"use client";

import { useCallback, useEffect, useState } from "react";

import { CallPriceChart, IVChart, RNDChart } from "@/components/Charts";
import Controls from "@/components/Controls";
import Diagnostics from "@/components/Diagnostics";
import { fetchExpiries, fetchRND } from "@/lib/api";
import type { RNDResponse } from "@/lib/types";

export default function Page() {
  const [ticker, setTicker] = useState("SPY");
  const [expiries, setExpiries] = useState<string[]>([]);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [smoothing, setSmoothing] = useState(0.0002);
  const [rOverride, setROverride] = useState<number | null>(null);
  const [data, setData] = useState<RNDResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTicker = useCallback((next: string) => {
    setTicker(next);
    setExpiries([]);
    setExpiry(null);
    setData(null);
    setError(null);
  }, []);

  // Fetch expiries whenever ticker changes
  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    fetchExpiries(ticker)
      .then((res) => {
        if (cancelled) return;
        setExpiries(res.expiries);
        if (res.expiries.length > 0) {
          setExpiry(res.expiries[Math.min(2, res.expiries.length - 1)]);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const load = useCallback(async () => {
    if (!expiry) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRND(ticker, expiry, {
        smoothing,
        r: rOverride ?? undefined,
      });
      setData(res);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, expiry, smoothing, rOverride]);

  return (
    <main className="min-h-screen bg-black text-neutral-200 p-4 sm:p-6">
      <header className="mb-4">
        <h1 className="font-mono text-lg text-emerald-400">
          rnd-explorer<span className="text-neutral-600">{" // single-expiry risk-neutral density"}</span>
        </h1>
      </header>

      <Controls
        ticker={ticker}
        setTicker={updateTicker}
        expiries={expiries}
        expiry={expiry}
        setExpiry={setExpiry}
        smoothing={smoothing}
        setSmoothing={setSmoothing}
        rOverride={rOverride}
        setROverride={setROverride}
        loading={loading}
        onLoad={load}
        error={error}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mt-4">
        <div className="flex flex-col gap-4">
          {data ? (
            <>
              <IVChart d={data} />
              <CallPriceChart d={data} />
              <RNDChart d={data} />
            </>
          ) : (
            <div className="border border-neutral-800 bg-neutral-950 p-12 text-center text-neutral-500 font-mono text-sm">
              {loading
                ? "fetching chain..."
                : "select an expiry and press load."}
            </div>
          )}
        </div>

        <div>
          {data && (
            <Diagnostics
              diag={data.diagnostics}
              spot={data.spot}
              T={data.T}
              r={data.r}
            />
          )}
        </div>
      </div>
    </main>
  );
}
