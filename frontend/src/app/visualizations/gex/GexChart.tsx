"use client";

import { useMemo } from "react";
import type { GexChainResponse } from "@/lib/types";

/** Keep the profile focused on the part of the chain that can matter near spot. */
const MAX_STRIKES = 40;
const STRIKE_WINDOW = 0.15;

type StrikeRow = {
  strike: number;
  callGex: number;
  putGex: number;
  netGex: number;
};

export default function GexChart({ d }: { d: GexChainResponse }) {
  const callWall = d.calls.some((call) => call.gex > 0) ? d.call_wall : null;
  const putWall = d.puts.some((put) => put.gex < 0) ? d.put_wall : null;

  const rows = useMemo(() => {
    if (!d) return [];
    const strikes = new Set([
      ...d.calls.map((c) => c.strike),
      ...d.puts.map((p) => p.strike),
    ]);
    const callsByStrike = new Map(d.calls.map((call) => [call.strike, call]));
    const putsByStrike = new Map(d.puts.map((put) => [put.strike, put]));
    const all: StrikeRow[] = Array.from(strikes)
      .filter((strike) => Math.abs(strike - d.spot) / Math.max(d.spot, 1) <= STRIKE_WINDOW)
      .sort((a, b) => a - b)
      .map((k) => {
        const callGex = callsByStrike.get(k)?.gex || 0;
        const putGex = putsByStrike.get(k)?.gex || 0;
        return { strike: k, callGex, putGex, netGex: callGex + putGex };
      });

    if (!all.some((row) => row.callGex !== 0 || row.putGex !== 0)) return [];

    // Keep only strikes with meaningful GEX — sort by |netGex| desc, take top N
    const sorted = [...all].sort(
      (a, b) => Math.abs(b.netGex) - Math.abs(a.netGex)
    );
    const top = sorted.slice(0, MAX_STRIKES);
    // Re-sort by strike ascending for display
    return top.sort((a, b) => a.strike - b.strike);
  }, [d]);

  const maxAbs = useMemo(
    () => Math.max(...rows.map((r) => Math.abs(r.netGex)), 1),
    [rows]
  );

  const totalCallGex = useMemo(
    () => d.calls.reduce((sum, c) => sum + c.gex, 0),
    [d.calls]
  );
  const totalPutGex = useMemo(
    () => d.puts.reduce((sum, p) => sum + p.gex, 0),
    [d.puts]
  );

  const formatGex = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  };

  return (
    <div
      className="border p-5 sm:p-6"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg-panel)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "var(--ink-faint)" }}
        >
          Gamma Exposure (GEX) Profile
        </h3>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-4"
          style={{ color: "var(--ink-faint)" }}
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.85)" }}
            />
            Call (positive)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.85)" }}
            />
            Put (negative)
          </span>
        </div>
      </div>

      {/* Summary stat row */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 border"
        style={{
          borderColor: "var(--rule)",
          backgroundColor: "var(--bg-deep)",
        }}
      >
        <StatCell label="Spot" value={`$${d.spot.toFixed(2)}`} />
        <StatCell
          label="Call Wall"
          value={callWall == null ? "—" : `$${callWall.toFixed(0)}`}
          accent="rgba(34, 197, 94, 0.9)"
        />
        <StatCell
          label="Put Wall"
          value={putWall == null ? "—" : `$${putWall.toFixed(0)}`}
          accent="rgba(239, 68, 68, 0.9)"
        />
        <StatCell
          label="Net GEX"
          value={formatGex(totalCallGex + totalPutGex)}
          accent={
            totalCallGex + totalPutGex >= 0
              ? "rgba(34, 197, 94, 0.9)"
              : "rgba(239, 68, 68, 0.9)"
          }
        />
      </div>

      {/* Horizontal bar chart */}
      {rows.length === 0 ? (
        <div
          className="border px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ borderColor: "var(--rule)", color: "var(--ink-faint)" }}
        >
          No non-zero GEX in the ±15% near-money range.
          <span
            className="block mt-2 normal-case tracking-normal font-sans text-sm"
            style={{ color: "var(--ink-soft)" }}
          >
            Open interest or usable option quotes were not returned for this expiry.
          </span>
        </div>
      ) : (
      <div className="space-y-[2px]">
        {rows.map((row) => {
          const isCallWall = callWall != null && row.strike === callWall;
          const isPutWall = putWall != null && row.strike === putWall;
          const isSpot =
            Math.abs(row.strike - d.spot) ===
            Math.min(...rows.map((r) => Math.abs(r.strike - d.spot)));
          const barPct = (Math.abs(row.netGex) / maxAbs) * 100;
          const isPositive = row.netGex >= 0;

          return (
            <div
              key={row.strike}
              className="group relative flex items-center gap-2 py-[3px] transition-colors"
              style={{
                backgroundColor: isSpot
                  ? "rgba(167, 139, 250, 0.06)"
                  : "transparent",
              }}
            >
              {/* Strike label */}
              <div
                className="w-16 sm:w-20 shrink-0 text-right font-mono text-[12px] sm:text-[13px] tabular-nums"
                style={{
                  color: isCallWall
                    ? "rgba(34, 197, 94, 1)"
                    : isPutWall
                      ? "rgba(239, 68, 68, 1)"
                      : isSpot
                        ? "var(--accent)"
                        : "var(--ink-soft)",
                  fontWeight: isCallWall || isPutWall || isSpot ? 600 : 400,
                }}
              >
                {row.strike.toFixed(0)}
                {isCallWall && (
                  <span className="ml-1 text-[9px] opacity-70">CW</span>
                )}
                {isPutWall && (
                  <span className="ml-1 text-[9px] opacity-70">PW</span>
                )}
                {isSpot && !isCallWall && !isPutWall && (
                  <span className="ml-1 text-[9px] opacity-70">S</span>
                )}
              </div>

              {/* Bar area */}
              <div className="flex-1 relative h-5 flex items-center">
                <div
                  className="h-full rounded-r-sm transition-all duration-300"
                  style={{
                    width: `${Math.max(barPct, 0.5)}%`,
                    backgroundColor: isPositive
                      ? isCallWall
                        ? "rgba(34, 197, 94, 0.95)"
                        : "rgba(34, 197, 94, 0.5)"
                      : isPutWall
                        ? "rgba(239, 68, 68, 0.95)"
                        : "rgba(239, 68, 68, 0.5)",
                    boxShadow:
                      isCallWall || isPutWall
                        ? `0 0 12px ${isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                        : "none",
                  }}
                />
                {/* Value label on bar */}
                <span
                  className="ml-2 font-mono text-[11px] tabular-nums"
                  style={{
                    color: isPositive
                      ? "rgba(74, 222, 128, 0.9)"
                      : "rgba(252, 129, 129, 0.9)",
                  }}
                >
                  {formatGex(row.netGex)}
                </span>
              </div>

              {/* Tooltip */}
              <div
                className="absolute left-24 bottom-full mb-1 hidden group-hover:block z-20 p-3 rounded text-[11px] font-mono shadow-xl whitespace-nowrap"
                style={{
                  backgroundColor: "var(--bg-deep)",
                  border: "1px solid var(--rule-strong)",
                  color: "var(--ink)",
                }}
              >
                <div style={{ color: "var(--ink-faint)" }}>
                  Strike {row.strike}
                </div>
                <div
                  className="mt-1"
                  style={{ color: "rgba(74, 222, 128, 1)" }}
                >
                  Call GEX: {formatGex(row.callGex)}
                </div>
                <div style={{ color: "rgba(252, 129, 129, 1)" }}>
                  Put GEX: {formatGex(row.putGex)}
                </div>
                <div className="mt-1 pt-1 border-t" style={{ borderColor: "var(--rule)" }}>
                  Net: {formatGex(row.netGex)}
                </div>
                {isCallWall && (
                  <div
                    className="mt-1"
                    style={{ color: "rgba(34, 197, 94, 1)" }}
                  >
                    ★ Call Wall
                  </div>
                )}
                {isPutWall && (
                  <div className="mt-1" style={{ color: "rgba(239, 68, 68, 1)" }}>
                    ★ Put Wall
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="text-center">
      <div
        className="font-mono text-[9px] uppercase tracking-[0.25em] mb-1"
        style={{ color: "var(--ink-faint)" }}
      >
        {label}
      </div>
      <div
        className="font-mono text-[15px] tabular-nums font-medium"
        style={{ color: accent ?? "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}
