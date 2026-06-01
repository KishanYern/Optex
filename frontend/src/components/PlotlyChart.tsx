"use client";

import dynamic from "next/dynamic";
import type { Data, Layout, Config } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  height?: number;
};

const TERMINAL_LAYOUT: Partial<Layout> = {
  paper_bgcolor: "#0a0a0a",
  plot_bgcolor: "#0a0a0a",
  font: { family: "var(--font-geist-mono), ui-monospace, monospace", color: "#d4d4d4", size: 12 },
  margin: { l: 60, r: 30, t: 40, b: 50 },
  xaxis: {
    gridcolor: "#1f1f1f",
    zerolinecolor: "#2a2a2a",
    linecolor: "#3a3a3a",
    tickcolor: "#3a3a3a",
  },
  yaxis: {
    gridcolor: "#1f1f1f",
    zerolinecolor: "#2a2a2a",
    linecolor: "#3a3a3a",
    tickcolor: "#3a3a3a",
  },
  legend: { bgcolor: "rgba(0,0,0,0)", font: { color: "#d4d4d4" } },
  hoverlabel: { bgcolor: "#1a1a1a", bordercolor: "#3a3a3a", font: { color: "#e5e5e5" } },
};

const DEFAULT_CONFIG: Partial<Config> = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ["lasso2d", "select2d"],
};

export default function PlotlyChart({ data, layout, config, height = 300 }: Props) {
  const merged: Partial<Layout> = {
    ...TERMINAL_LAYOUT,
    ...layout,
    xaxis: { ...TERMINAL_LAYOUT.xaxis, ...(layout?.xaxis ?? {}) },
    yaxis: { ...TERMINAL_LAYOUT.yaxis, ...(layout?.yaxis ?? {}) },
    autosize: true,
    height,
  };
  return (
    <Plot
      data={data}
      layout={merged}
      config={{ ...DEFAULT_CONFIG, ...config }}
      style={{ width: "100%", height: `${height}px` }}
      useResizeHandler
    />
  );
}
