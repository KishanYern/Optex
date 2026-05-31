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

const FIELD_LABEL =
  "block font-mono text-[10px] uppercase tracking-[0.2em] mb-2";
const INPUT_BASE =
  "w-full h-9 px-3 font-mono text-sm focus:outline-none transition-colors";

export default function Controls(props: Props) {
  const [tickerInput, setTickerInput] = useState(props.ticker);

  const submitTicker = (e: React.FormEvent) => {
    e.preventDefault();
    props.setTicker(tickerInput.trim().toUpperCase());
  };

  return (
    <div
      className="border p-5"
      style={{
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg-panel)",
      }}
    >
      <div className="grid grid-cols-12 gap-4 sm:gap-5">
        {/* Ticker */}
        <form onSubmit={submitTicker} className="col-span-6 sm:col-span-2">
          <label
            className={FIELD_LABEL}
            style={{ color: "var(--ink-faint)" }}
            htmlFor="ctrl-ticker"
          >
            Ticker
          </label>
          <input
            id="ctrl-ticker"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            spellCheck={false}
            className={INPUT_BASE}
            style={{
              backgroundColor: "var(--bg-deep)",
              border: "1px solid var(--rule)",
              color: "var(--ink)",
            }}
          />
        </form>

        {/* Expiry */}
        <div className="col-span-6 sm:col-span-3">
          <label
            className={FIELD_LABEL}
            style={{ color: "var(--ink-faint)" }}
            htmlFor="ctrl-expiry"
          >
            Expiry
          </label>
          <select
            id="ctrl-expiry"
            value={props.expiry ?? ""}
            onChange={(e) => props.setExpiry(e.target.value)}
            disabled={!props.expiries.length}
            className={`${INPUT_BASE} disabled:opacity-40`}
            style={{
              backgroundColor: "var(--bg-deep)",
              border: "1px solid var(--rule)",
              color: "var(--ink)",
            }}
          >
            {props.expiries.length === 0 && <option value="">—</option>}
            {props.expiries.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* Smoothing */}
        <div className="col-span-12 sm:col-span-4">
          <label
            className={FIELD_LABEL}
            style={{ color: "var(--ink-faint)" }}
            htmlFor="ctrl-smoothing"
          >
            Smoothing
            <span className="ml-2" style={{ color: "var(--accent)" }}>
              {props.smoothing.toFixed(4)}
            </span>
          </label>
          <div
            className="h-9 px-3 flex items-center"
            style={{
              backgroundColor: "var(--bg-deep)",
              border: "1px solid var(--rule)",
            }}
          >
            <input
              id="ctrl-smoothing"
              type="range"
              min={0}
              max={0.01}
              step={0.0001}
              value={props.smoothing}
              onChange={(e) => props.setSmoothing(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* r override */}
        <div className="col-span-6 sm:col-span-2">
          <label
            className={FIELD_LABEL}
            style={{ color: "var(--ink-faint)" }}
            htmlFor="ctrl-r"
          >
            r override
            {props.rOverride === null && (
              <span className="ml-2" style={{ color: "var(--ink-faint)" }}>
                auto
              </span>
            )}
          </label>
          <input
            id="ctrl-r"
            type="number"
            step={0.001}
            value={props.rOverride ?? ""}
            placeholder="auto"
            onChange={(e) => {
              const v = e.target.value;
              props.setROverride(v === "" ? null : parseFloat(v));
            }}
            className={INPUT_BASE}
            style={{
              backgroundColor: "var(--bg-deep)",
              border: "1px solid var(--rule)",
              color: "var(--ink)",
            }}
          />
        </div>

        {/* Load button */}
        <div className="col-span-6 sm:col-span-1 flex flex-col">
          <span className={FIELD_LABEL} aria-hidden style={{ color: "transparent" }}>
            &nbsp;
          </span>
          <button
            onClick={props.onLoad}
            disabled={props.loading || !props.expiry}
            className="h-9 font-mono text-[11px] uppercase tracking-[0.25em] transition-all disabled:opacity-40"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--bg-deep)",
              border: "1px solid var(--accent)",
            }}
          >
            {props.loading ? "…" : "Load"}
          </button>
        </div>
      </div>

      {props.error && (
        <div
          className="mt-4 font-mono text-[12px] px-3 py-2 border"
          style={{
            color: "#FCA5A5",
            backgroundColor: "rgba(127, 29, 29, 0.18)",
            borderColor: "rgba(220, 38, 38, 0.45)",
          }}
        >
          {props.error}
        </div>
      )}
    </div>
  );
}
