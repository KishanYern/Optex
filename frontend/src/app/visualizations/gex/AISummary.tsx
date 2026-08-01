"use client";

import { useMemo } from "react";
import type { GexChainResponse, HeatmapResponse } from "@/lib/types";

type Props = {
  data: GexChainResponse;
  heatmapData: HeatmapResponse | null;
};

type Insight = {
  icon: string;
  title: string;
  body: string;
  color: string; // CSS color for the title
};

function formatCurrency(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatGex(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

/** Deterministic analysis of GEX data into human-readable insights. */
function analyzeGex(
  data: GexChainResponse,
  heatmapData: HeatmapResponse | null
): Insight[] {
  const insights: Insight[] = [];
  const spot = data.spot;
  const hasCallWall = data.calls.some((call) => call.gex > 0);
  const hasPutWall = data.puts.some((put) => put.gex < 0);
  const callWall = hasCallWall ? data.call_wall ?? spot : spot;
  const putWall = hasPutWall ? data.put_wall ?? spot : spot;

  const totalCallGex = data.calls.reduce((s, c) => s + c.gex, 0);
  const totalPutGex = data.puts.reduce((s, p) => s + p.gex, 0);
  const netGex = totalCallGex + totalPutGex;

  // 1. Market Positioning
  const callWallDist = ((callWall - spot) / spot) * 100;
  const putWallDist = ((spot - putWall) / spot) * 100;
  const positionBias =
    callWallDist < putWallDist ? "upside resistance" : "downside support";

  if (hasCallWall && hasPutWall && data.call_wall != null && data.put_wall != null) {
    insights.push({
    icon: "📍",
    title: "Market Positioning",
    body: `${data.ticker} is trading at ${formatCurrency(spot)}. The call wall sits ${callWallDist.toFixed(1)}% above spot at ${formatCurrency(callWall)}, while the put wall is ${putWallDist.toFixed(1)}% below at ${formatCurrency(putWall)}. Price is closer to ${positionBias} — ${callWallDist < putWallDist ? "dealers may pin the price below the call wall, limiting upside" : "there is more room to the upside before hitting resistance"}.`,
    color: "var(--accent)",
    });
  } else {
    insights.push({
      icon: "!",
      title: "Wall data unavailable",
      body: `${data.ticker} returned no usable near-money GEX for this expiry, so call and put walls are not reported.`,
      color: "var(--ink-faint)",
    });
  }

  // 2. Key Levels
  if (hasCallWall && hasPutWall && data.call_wall != null && data.put_wall != null) insights.push({
    icon: "🎯",
    title: "Key Levels",
    body: `Call wall at ${formatCurrency(callWall)} acts as a magnetic resistance level — market makers hedging here create a "ceiling" that absorbs rallies. Put wall at ${formatCurrency(putWall)} acts as a floor — dealer hedging accelerates buying on dips toward this level.`,
    color: "var(--accent-cyan)",
  });

  // 3. GEX Balance
  const gexRatio =
    totalCallGex !== 0
      ? Math.abs(totalCallGex / (Math.abs(totalPutGex) || 1))
      : 0;
  let gexOutlook: string;
  if (netGex > 0) {
    if (gexRatio > 3) {
      gexOutlook =
        "Dealers are strongly long gamma. Expect suppressed volatility and mean-reversion — moves get sold into. This is a low-vol, range-bound environment.";
    } else {
      gexOutlook =
        "Dealers are moderately long gamma. Expect dampened moves with a slight tendency toward price stability. Breakouts are less likely to sustain.";
    }
  } else {
    if (gexRatio < 0.3) {
      gexOutlook =
        "Dealers are heavily short gamma. Expect amplified moves — dealers must chase price (buy highs, sell lows). This is a high-vol regime where breakouts can accelerate.";
    } else {
      gexOutlook =
        "Dealers are slightly short gamma. The market is in a transitional zone — moves can accelerate more easily than in a positive GEX environment.";
    }
  }
  insights.push({
    icon: "⚖️",
    title: "GEX Balance",
    body: `Total call GEX: ${formatGex(totalCallGex)} · Total put GEX: ${formatGex(totalPutGex)} · Net: ${formatGex(netGex)}. ${gexOutlook}`,
    color: netGex >= 0 ? "rgba(74, 222, 128, 1)" : "rgba(252, 129, 129, 1)",
  });

  // 4. Implied Range
  if (hasCallWall && hasPutWall && data.call_wall != null && data.put_wall != null) {
    const callWallPrice = formatCurrency(callWall);
    const putWallPrice = formatCurrency(putWall);
    const range = callWall - putWall;
    const rangePct = ((range / spot) * 100).toFixed(1);
    insights.push({
    icon: "📐",
    title: "Implied Range",
    body: `Based on the GEX walls, the dealer-implied trading range is ${putWallPrice} – ${callWallPrice}, a ${rangePct}% band around spot. Price tends to oscillate within these walls unless a catalyst forces a breakout through one side.`,
    color: "var(--ink)",
    });
  }

  // 5. Heatmap insight (if available)
  if (heatmapData && heatmapData.heatmap.length > 0) {
    const byExpiry: Record<string, number> = {};
    for (const item of heatmapData.heatmap) {
      // Sum absolute GEX to find the expiry with the most gamma exposure
      byExpiry[item.expiry] = (byExpiry[item.expiry] || 0) + Math.abs(item.gex);
    }
    const sortedExpiries = Object.entries(byExpiry).sort(
      (a, b) => b[1] - a[1]
    );
    const topExpiry = sortedExpiries[0];
    if (topExpiry) {
      const months = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ];
      const [, m, d] = topExpiry[0].split("-");
      const fmtDate = `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;

      insights.push({
        icon: "🗓️",
        title: "Gamma Concentration",
        body: `The heaviest gamma exposure is concentrated in the ${fmtDate} expiration (${formatGex(topExpiry[1])} absolute GEX). This suggests it may be a key date for positioning — likely an OPEX, earnings event, or FOMC window that market participants are hedging around.`,
        color: "var(--accent)",
      });
    }
  }

  return insights;
}

export default function AISummary({ data, heatmapData }: Props) {
  const insights = useMemo(
    () => analyzeGex(data, heatmapData),
    [data, heatmapData]
  );

  return (
    <div
      className="border p-5 sm:p-6 mb-6"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg-panel)",
        backgroundImage:
          "radial-gradient(ellipse 60% 40% at 95% 5%, rgba(167, 139, 250, 0.06), transparent)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
          style={{
            backgroundColor: "rgba(167, 139, 250, 0.15)",
            border: "1px solid rgba(167, 139, 250, 0.2)",
          }}
        >
          ✦
        </div>
        <div>
          <h3
            className="font-mono text-[11px] uppercase tracking-[0.25em]"
            style={{ color: "var(--accent)" }}
          >
            AI Market Summary
          </h3>
          <p
            className="font-mono text-[9px] uppercase tracking-[0.2em] mt-0.5"
            style={{ color: "var(--ink-faint)" }}
          >
            Deterministic analysis of {data.ticker} GEX profile
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded transition-colors hover:bg-[rgba(167,139,250,0.04)]"
          >
            <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
            <div className="min-w-0">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.2em] font-medium mb-1.5"
                style={{ color: insight.color }}
              >
                {insight.title}
              </div>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                {insight.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div
        className="mt-5 pt-3 border-t font-mono text-[9px] uppercase tracking-[0.2em]"
        style={{
          borderColor: "var(--rule)",
          color: "var(--ink-faint)",
          opacity: 0.7,
        }}
      >
        Generated from live chain data · Not financial advice · For educational
        use only
      </div>
    </div>
  );
}
