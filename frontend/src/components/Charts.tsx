"use client";

import type { Data } from "plotly.js";

import type { RNDResponse } from "@/lib/types";
import PlotlyChart from "./PlotlyChart";

const COLOR_RAW = "#737373";
const COLOR_SMOOTH = "#10b981";
const COLOR_SPOT = "#f59e0b";
const COLOR_FILL = "rgba(16,185,129,0.2)";

function spotLine(spot: number, label: string) {
  return {
    type: "line" as const,
    x0: spot,
    x1: spot,
    yref: "paper" as const,
    y0: 0,
    y1: 1,
    line: { color: COLOR_SPOT, width: 1, dash: "dot" as const },
    label: { text: label, font: { color: COLOR_SPOT, size: 10 } },
  };
}

export function IVChart({ d }: { d: RNDResponse }) {
  const traces: Data[] = [
    {
      x: d.iv_raw_K,
      y: d.iv_raw,
      mode: "markers",
      type: "scatter",
      name: "raw IV",
      marker: { color: COLOR_RAW, size: 6, symbol: "circle-open" },
    },
    {
      x: d.K_grid,
      y: d.iv_smoothed,
      mode: "lines",
      type: "scatter",
      name: "smoothed",
      line: { color: COLOR_SMOOTH, width: 2 },
    },
  ];
  return (
    <PlotlyChart
      data={traces}
      height={280}
      layout={{
        title: { text: "Implied volatility smile", font: { color: "#d4d4d4", size: 13 }, x: 0.02 },
        xaxis: { title: { text: "Strike K" } },
        yaxis: { title: { text: "IV (σ)" }, tickformat: ".0%" },
        shapes: [spotLine(d.spot, `S=${d.spot.toFixed(2)}`)],
      }}
    />
  );
}

export function CallPriceChart({ d }: { d: RNDResponse }) {
  const traces: Data[] = [
    {
      x: d.C_raw_K,
      y: d.C_raw,
      mode: "markers",
      type: "scatter",
      name: "raw (OTM-stitched)",
      marker: { color: COLOR_RAW, size: 6, symbol: "circle-open" },
    },
    {
      x: d.K_grid,
      y: d.C_smoothed,
      mode: "lines",
      type: "scatter",
      name: "smoothed C(K)",
      line: { color: COLOR_SMOOTH, width: 2 },
    },
  ];
  return (
    <PlotlyChart
      data={traces}
      height={280}
      layout={{
        title: { text: "Call price C(K) — raw vs smoothed", font: { color: "#d4d4d4", size: 13 }, x: 0.02 },
        xaxis: { title: { text: "Strike K" } },
        yaxis: { title: { text: "C" } },
        shapes: [spotLine(d.spot, "S")],
      }}
    />
  );
}

export function RNDChart({ d }: { d: RNDResponse }) {
  const rawPoints: Data = {
    x: d.rnd_raw_K,
    y: d.rnd_raw as (number | null)[],
    mode: "markers",
    type: "scatter",
    name: "raw 2nd diff",
    marker: { color: COLOR_RAW, size: 5, symbol: "circle-open" },
  };
  const smoothed: Data = {
    x: d.K_grid,
    y: d.rnd,
    mode: "lines",
    type: "scatter",
    name: "f(S_T)",
    line: { color: COLOR_SMOOTH, width: 2 },
    fill: "tozeroy",
    fillcolor: COLOR_FILL,
  };
  return (
    <PlotlyChart
      data={[rawPoints, smoothed]}
      height={340}
      layout={{
        title: { text: "Risk-neutral density f(S_T)", font: { color: "#d4d4d4", size: 13 }, x: 0.02 },
        xaxis: { title: { text: "S_T" } },
        yaxis: { title: { text: "density" } },
        shapes: [spotLine(d.spot, `S=${d.spot.toFixed(2)}`)],
      }}
    />
  );
}
