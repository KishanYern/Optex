"use client";

import { useCallback, useEffect, useState } from "react";
import Controls from "@/components/Controls";
import MathText from "@/components/MathText";
import { fetchExpiries, fetchGexChain, fetchGexHeatmap } from "@/lib/api";
import type { GexChainResponse, HeatmapResponse } from "@/lib/types";
import { getVisualization, VISUALIZATIONS } from "@/lib/visualizations";
import AISummary from "./AISummary";
import GexChart from "./GexChart";
import PremiumHeatmap from "./PremiumHeatmap";

const META = getVisualization("gex")!;
const INDEX = VISUALIZATIONS.findIndex((v) => v.slug === "gex") + 1;

export default function GEXPage() {
  const [ticker, setTicker] = useState("SPY");
  const [expiries, setExpiries] = useState<string[]>([]);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [data, setData] = useState<GexChainResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [expiriesLoading, setExpiriesLoading] = useState(true);
  const [expiriesError, setExpiriesError] = useState<string | null>(null);
  const [expiriesTicker, setExpiriesTicker] = useState<string | null>(null);
  const [expiriesKey, setExpiriesKey] = useState(0);

  const updateTicker = useCallback((next: string) => {
    setTicker(next);
    setExpiries([]);
    setExpiry(null);
    setData(null);
    setHeatmapData(null);
    setError(null);
    setExpiriesLoading(true);
    setExpiriesError(null);
    setExpiriesTicker(null);
  }, []);

  const retryExpiries = useCallback(() => {
    setExpiriesLoading(true);
    setExpiriesError(null);
    setExpiriesKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    fetchExpiries(ticker)
      .then((res) => {
        if (cancelled) return;
        setExpiries(res.expiries);
        setExpiriesTicker(ticker);
        setExpiriesLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setExpiriesError(e.message);
        setExpiriesLoading(false);
      });
      
    // Fetch heatmap data in parallel when ticker changes
    fetchGexHeatmap(ticker)
      .then((res) => {
        if (!cancelled) setHeatmapData(res);
      })
      .catch((e) => console.error("Heatmap fetch error:", e));
      
    return () => {
      cancelled = true;
    };
  }, [ticker, expiriesKey]);

  const load = useCallback(async () => {
    if (!expiry) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGexChain(ticker, expiry);
      setData(res);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, expiry]);

  return (
    <main className="px-6 sm:px-10">
      <header className="max-w-6xl mx-auto pt-12 sm:pt-20 pb-14">
        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-8">
          <aside className="col-span-12 sm:col-span-3 mb-6 sm:mb-0 reveal" style={{ animationDelay: "40ms" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>
              Study {String(INDEX).padStart(2, "0")}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mt-2 inline-flex items-center gap-2" style={{ color: "var(--ink-faint)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)", boxShadow: "0 0 10px var(--accent-glow)" }} />
              Live · interactive
            </div>
            <div className="hidden sm:block mt-8 h-10 w-px" style={{ backgroundColor: "var(--rule-strong)" }} />
          </aside>

          <div className="col-span-12 sm:col-span-9">
            <h1 className="font-serif-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.94] tracking-[-0.02em] reveal" style={{ color: "var(--ink)", animationDelay: "100ms" }}>
              {META.title}<span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <p className="mt-7 font-serif-italic text-xl sm:text-2xl leading-snug max-w-3xl reveal" style={{ color: "var(--ink-soft)", animationDelay: "200ms" }}>
              <MathText>{META.blurb}</MathText>
            </p>
            <p className="mt-6 text-[15px] sm:text-base leading-relaxed max-w-3xl reveal" style={{ color: "var(--ink-soft)", animationDelay: "280ms" }}>
              <MathText>{META.description}</MathText>
            </p>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto pb-28 pt-8 reveal" style={{ animationDelay: "420ms" }}>
        <Controls
          ticker={ticker}
          setTicker={updateTicker}
          expiries={expiries}
          expiry={expiry}
          setExpiry={setExpiry}
          smoothing={0}
          setSmoothing={() => {}}
          rOverride={null}
          setROverride={() => {}}
          loading={loading}
          onLoad={load}
          error={error}
          expiriesLoading={expiriesLoading}
          expiriesError={expiriesError}
          onRetryExpiries={retryExpiries}
          expiriesTicker={expiriesTicker}
          showSmoothing={false}
          showROverride={false}
        />

        <div className="mt-4">
          {data ? (
            <div className="flex flex-col gap-4">
              <AISummary data={data} heatmapData={heatmapData} />
              <GexChart d={data} />
              {heatmapData && <PremiumHeatmap data={heatmapData} spot={data.spot} />}
            </div>
          ) : (
            <div className="border p-12 text-center font-serif-italic text-lg" style={{ borderColor: "var(--rule)", backgroundColor: "var(--bg-panel)", color: "var(--ink-faint)" }}>
              {loading
                ? "fetching the chain…"
                : expiriesLoading
                  ? "loading expiries…"
                  : expiriesError
                    ? "Fix the error above, then choose an expiry and press Load."
                    : "Choose an expiry and press Load."}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
