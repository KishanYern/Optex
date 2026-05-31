"use client";

import { useState } from "react";

type Props = {
  ticker: string;
  setTicker: (v: string) => void;
  expiries: string[];
  expiry: string | null;
  setExpiry: (v: string) => void;
  smoothing: number;
  setSmoothing: (v: number) => void;
  rOverride: number | null;
  setROverride: (v: number | null) => void;
  loading: boolean;
  onLoad: () => void;
  error: string | null;
};

export default function Controls(props: Props) {
  const [tickerInput, setTickerInput] = useState(props.ticker);

  const submitTicker = (e: React.FormEvent) => {
    e.preventDefault();
    props.setTicker(tickerInput.trim().toUpperCase());
  };

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={submitTicker} className="flex flex-col gap-1">
          <label className="text-xs uppercase text-neutral-500 tracking-wider">Ticker</label>
          <input
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            className="bg-black border border-neutral-700 px-2 py-1 font-mono text-sm w-28 focus:outline-none focus:border-emerald-500"
            spellCheck={false}
          />
        </form>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase text-neutral-500 tracking-wider">Expiry</label>
          <select
            value={props.expiry ?? ""}
            onChange={(e) => props.setExpiry(e.target.value)}
            disabled={!props.expiries.length}
            className="bg-black border border-neutral-700 px-2 py-1 font-mono text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-40"
          >
            {props.expiries.length === 0 && <option value="">—</option>}
            {props.expiries.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 grow min-w-[200px]">
          <label className="text-xs uppercase text-neutral-500 tracking-wider">
            Smoothing: <span className="text-neutral-300">{props.smoothing.toFixed(4)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={0.01}
            step={0.0001}
            value={props.smoothing}
            onChange={(e) => props.setSmoothing(parseFloat(e.target.value))}
            className="accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase text-neutral-500 tracking-wider">
            r override {props.rOverride === null && <span className="text-neutral-600">(auto)</span>}
          </label>
          <input
            type="number"
            step={0.001}
            value={props.rOverride ?? ""}
            placeholder="auto"
            onChange={(e) => {
              const v = e.target.value;
              props.setROverride(v === "" ? null : parseFloat(v));
            }}
            className="bg-black border border-neutral-700 px-2 py-1 font-mono text-sm w-24 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={props.onLoad}
          disabled={props.loading || !props.expiry}
          className="px-4 py-1 border border-emerald-700 bg-emerald-900/30 text-emerald-300 font-mono text-sm hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {props.loading ? "loading..." : "load"}
        </button>
      </div>

      {props.error && (
        <div className="text-red-400 font-mono text-sm border border-red-900/50 bg-red-950/30 px-2 py-1">
          {props.error}
        </div>
      )}
    </div>
  );
}
