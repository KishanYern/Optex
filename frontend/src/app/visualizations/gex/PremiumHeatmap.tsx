"use client";

import { useMemo } from "react";
import type { HeatmapResponse } from "@/lib/types";

/** Format expiry "2025-08-15" → "Aug 15" */
function fmtExpiry(iso: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [, m, d] = iso.split("-");
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

/** Format GEX with K/M suffix */
function fmtGex(v: number): string {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

export default function PremiumHeatmap({ data }: { data: HeatmapResponse }) {
  const { expiries, strikes, grid, maxAbsGex } = useMemo(() => {
    if (!data || !data.heatmap || data.heatmap.length === 0) {
      return { expiries: [], strikes: [], grid: {}, maxAbsGex: 0 };
    }

    const exps = Array.from(new Set(data.heatmap.map((d) => d.expiry))).sort();
    // Reduce strike density — take every Nth strike so we get ≤ 30 rows
    const allStrikes = Array.from(
      new Set(data.heatmap.map((d) => d.strike))
    ).sort((a, b) => b - a);
    const step = Math.max(1, Math.ceil(allStrikes.length / 30));
    const filteredStrikes = allStrikes.filter((_, i) => i % step === 0);

    // Build grid and find max absolute GEX
    const grouped: Record<string, number> = {};
    for (const item of data.heatmap) {
      const key = `${item.strike}|${item.expiry}`;
      if (!grouped[key]) grouped[key] = 0;
      grouped[key] += item.gex;
    }
    
    let maxAbs = 0;
    const gridMap: Record<string, Record<string, number>> = {};
    for (const [key, sum] of Object.entries(grouped)) {
      const [strike, expiry] = key.split("|");
      if (!gridMap[strike]) gridMap[strike] = {};
      gridMap[strike][expiry] = sum;
      if (Math.abs(sum) > maxAbs) maxAbs = Math.abs(sum);
    }

    return {
      expiries: exps,
      strikes: filteredStrikes,
      grid: gridMap,
      maxAbsGex: maxAbs,
    };
  }, [data]);

  /** Map GEX intensity to green (positive) and red (negative) */
  const cellColor = (val: number, maxAbs: number) => {
    if (val === 0 || maxAbs === 0)
      return { bg: "transparent", text: "var(--ink-faint)" };

    const intensity = Math.min(Math.abs(val) / (maxAbs * 0.5), 1); // 0.5 to make colors pop more
    
    // Positive GEX: Green (142), Negative GEX: Red (0)
    const hue = val > 0 ? 142 : 0;
    const sat = val > 0 ? 60 : 70;
    const light = val > 0 ? 25 : 30; // Darker green, slightly lighter red
    const alpha = 0.1 + intensity * 0.8;
    
    const bg = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
    
    // Bright text for high intensity, softer for low intensity
    const textColor =
      intensity > 0.4 ? "rgba(255,255,255,0.95)" : "var(--ink-soft)";
    return { bg, text: textColor };
  };

  return (
    <div
      className="border p-5 sm:p-6 mt-6"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg-panel)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3
          className="font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "var(--ink-faint)" }}
        >
          Gamma Exposure Heatmap
        </h3>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: "var(--ink-faint)" }}
        >
          Net GEX per strike & expiry
        </span>
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full font-mono text-[12px] sm:text-[13px] tabular-nums border-collapse"
          style={{ color: "var(--ink-soft)" }}
        >
          <thead>
            <tr>
              <th
                className="p-2 text-left sticky left-0 z-10"
                style={{
                  backgroundColor: "var(--bg-panel)",
                  color: "var(--ink-faint)",
                  borderBottom: "1px solid var(--rule-strong)",
                  minWidth: "70px",
                }}
              >
                Strike
              </th>
              {expiries.map((exp) => (
                <th
                  key={exp}
                  className="p-2 text-right font-normal"
                  style={{
                    color: "var(--ink-faint)",
                    borderBottom: "1px solid var(--rule-strong)",
                    minWidth: "65px",
                  }}
                >
                  {fmtExpiry(exp)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strikes.map((strike) => (
              <tr
                key={strike}
                className="transition-colors hover:!bg-[rgba(167,139,250,0.06)]"
              >
                <td
                  className="p-2 text-left font-medium sticky left-0 z-10"
                  style={{
                    backgroundColor: "var(--bg-panel)",
                    color: "var(--ink-soft)",
                    borderRight: "1px solid var(--rule)",
                  }}
                >
                  {strike.toFixed(0)}
                </td>
                {expiries.map((exp) => {
                  const val = grid[String(strike)]?.[exp];
                  if (val === undefined || val === 0) {
                    return (
                      <td
                        key={exp}
                        className="p-2 text-right"
                        style={{
                          color: "var(--ink-faint)",
                          opacity: 0.3,
                        }}
                      >
                        —
                      </td>
                    );
                  }
                  const { bg, text } = cellColor(val, maxAbsGex);
                  return (
                    <td
                      key={exp}
                      className="p-2 text-right transition-colors"
                      style={{
                        backgroundColor: bg,
                        color: text,
                      }}
                    >
                      {fmtGex(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
