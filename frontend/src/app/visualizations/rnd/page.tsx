"use client";

import { useCallback, useEffect, useState } from "react";

import { CallPriceChart, IVChart, RNDChart } from "@/components/Charts";
import Controls from "@/components/Controls";
import Diagnostics from "@/components/Diagnostics";
import MathText from "@/components/MathText";
import { fetchExpiries, fetchRND } from "@/lib/api";
import type { RNDResponse } from "@/lib/types";
import { getVisualization, VISUALIZATIONS } from "@/lib/visualizations";

const META = getVisualization("rnd")!;
const INDEX = VISUALIZATIONS.findIndex((v) => v.slug === "rnd") + 1;

export default function RNDPage() {
  const [ticker, setTicker] = useState("SPY");
  const [expiries, setExpiries] = useState<string[]>([]);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [smoothing, setSmoothing] = useState(0.0002);
  const [rOverride, setROverride] = useState<number | null>(null);
  const [data, setData] = useState<RNDResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Start true: the effect fires on mount and begins fetching immediately.
  // Loading state is set to true in event handlers (ticker change, retry) so
  // the effect body never calls setState synchronously.
  const [expiriesLoading, setExpiriesLoading] = useState(true);
  const [expiriesError, setExpiriesError] = useState<string | null>(null);
  const [expiriesTicker, setExpiriesTicker] = useState<string | null>(null);
  // Incrementing this triggers a retry of the expiry fetch without changing ticker.
  const [expiriesKey, setExpiriesKey] = useState(0);

  const updateTicker = useCallback((next: string) => {
    setTicker(next);
    setExpiries([]);
    setExpiry(null);
    setData(null);
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

  // Effect only sets state inside async callbacks — never synchronously.
  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    fetchExpiries(ticker)
      .then((res) => {
        if (cancelled) return;
        setExpiries(res.expiries);
        setExpiriesTicker(ticker);
        setExpiriesLoading(false);
        if (res.expiries.length > 0) {
          setExpiry(res.expiries[Math.min(2, res.expiries.length - 1)]);
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setExpiriesError(e.message);
        setExpiriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker, expiriesKey]);

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
    <main className="px-6 sm:px-10">
      {/* Title block */}
      <header className="max-w-6xl mx-auto pt-12 sm:pt-20 pb-14">
        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-8">
          <aside
            className="col-span-12 sm:col-span-3 mb-6 sm:mb-0 reveal"
            style={{ animationDelay: "40ms" }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: "var(--accent)" }}
            >
              Study {String(INDEX).padStart(2, "0")}
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.3em] mt-2 inline-flex items-center gap-2"
              style={{ color: "var(--ink-faint)" }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: "var(--accent)",
                  boxShadow: "0 0 10px var(--accent-glow)",
                }}
              />
              Live · interactive
            </div>
            <div
              className="hidden sm:block mt-8 h-10 w-px"
              style={{ backgroundColor: "var(--rule-strong)" }}
            />
            <div
              className="hidden sm:block mt-8 font-mono text-[10px] uppercase tracking-[0.28em] leading-relaxed max-w-[12rem]"
              style={{ color: "var(--ink-faint)" }}
            >
              Topic — Risk-neutral
              <br />
              pricing · Smoothing
            </div>
          </aside>

          <div className="col-span-12 sm:col-span-9">
            <h1
              className="font-serif-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.94] tracking-[-0.02em] reveal"
              style={{ color: "var(--ink)", animationDelay: "100ms" }}
            >
              {META.title}
              <span style={{ color: "var(--accent)" }}>.</span>
            </h1>

            <p
              className="mt-7 font-serif-italic text-xl sm:text-2xl leading-snug max-w-3xl reveal"
              style={{ color: "var(--ink-soft)", animationDelay: "200ms" }}
            >
              <MathText>{META.blurb}</MathText>
            </p>

            <p
              className="mt-6 text-[15px] sm:text-base leading-relaxed max-w-3xl reveal"
              style={{ color: "var(--ink-soft)", animationDelay: "280ms" }}
            >
              <MathText>{META.description}</MathText>
            </p>
          </div>
        </div>
      </header>

      {/* Section divider */}
      <div
        className="max-w-6xl mx-auto reveal"
        style={{ animationDelay: "340ms" }}
      >
        <div className="flex items-baseline gap-4">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-faint)" }}
          >
            The Workbench
          </span>
          <span
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--rule)" }}
          />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-faint)" }}
          >
            Live data · yfinance
          </span>
        </div>
      </div>

      {/* Working area */}
      <section
        className="max-w-6xl mx-auto pb-28 pt-8 reveal"
        style={{ animationDelay: "420ms" }}
      >
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
          expiriesLoading={expiriesLoading}
          expiriesError={expiriesError}
          onRetryExpiries={retryExpiries}
          expiriesTicker={expiriesTicker}
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
              <div
                className="border p-12 text-center font-serif-italic text-lg"
                style={{
                  borderColor: "var(--rule)",
                  backgroundColor: "var(--bg-panel)",
                  color: "var(--ink-faint)",
                }}
              >
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
      </section>

      {/* Methodology */}
      <Methodology />
    </main>
  );
}

function Equation({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-5 font-mono text-[15px] sm:text-base px-5 py-4 border overflow-x-auto"
      style={{
        color: "var(--ink)",
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg-panel)",
      }}
    >
      {children}
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[15px] leading-relaxed max-w-3xl"
      style={{ color: "var(--ink-soft)" }}
    >
      {children}
    </p>
  );
}

function Step({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="col-span-12 sm:col-span-3 mb-3 sm:mb-0">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "var(--accent)" }}
        >
          Step {num}
        </div>
        <div
          className="font-serif text-2xl sm:text-3xl mt-2 tracking-tight leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </div>
      </div>
      <div className="col-span-12 sm:col-span-9 mb-14 sm:mb-16 space-y-5">
        {children}
      </div>
    </>
  );
}

function Methodology() {
  return (
    <section className="max-w-6xl mx-auto px-0 pb-32">
      <div className="flex items-baseline gap-4 mb-12">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "var(--ink-faint)" }}
        >
          The Method
        </span>
        <span className="flex-1 h-px" style={{ backgroundColor: "var(--rule)" }} />
        <span
          className="font-mono text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "var(--ink-faint)" }}
        >
          Breeden – Litzenberger · 1978
        </span>
      </div>

      <div className="grid grid-cols-12 gap-x-4 sm:gap-x-8">
        <Step num="01" title="The identity">
          <Prose>
            Risk-neutral pricing says every European call is the discounted
            expectation of its payoff under the risk-neutral measure{" "}
            <i>Q</i>:
          </Prose>
          <Equation>
            C(K) = e<sup>−rT</sup> · <i>E</i>
            <sub className="font-serif-italic" style={{ fontSize: "0.78em" }}>
              Q
            </sub>
            [ max(<MathText>S_T</MathText> − K, 0) ]
          </Equation>
          <Prose>
            Differentiating twice with respect to K and rearranging gives
            the Breeden–Litzenberger identity:
          </Prose>
          <Equation>
            f(K) = e<sup>rT</sup> · ∂²C / ∂K²
          </Equation>
          <Prose>
            where <i>f</i> is the risk-neutral probability density of{" "}
            <MathText>S_T</MathText> evaluated at K. Recovering the density
            therefore reduces to taking the second derivative of the call
            price curve — provided we have a clean enough C(K) to differentiate.
          </Prose>
        </Step>

        <Step num="02" title="Why smooth in vol-space, not price-space">
          <Prose>
            Naïvely taking second differences of raw quote prices produces
            noise. The bid–ask spread, even on a liquid name, easily moves
            mid prices by a few cents — and the second-derivative operator
            amplifies that twice.
          </Prose>
          <Prose>
            Instead, we invert each quote into a Black–Scholes implied
            volatility, fit a cubic smoothing spline to IV(K) across strikes,
            and reprice C(K) on a dense, evenly-spaced grid before
            differencing. Implied vol is a far cleaner surface to smooth:
            even when prices are jagged, IV is typically smooth in its
            second derivative, which is exactly the property we need.
          </Prose>
        </Step>

        <Step num="03" title="Stitching the wings with put-call parity">
          <Prose>
            Deep ITM call quotes are dominated by intrinsic value — the
            time-value component (the part that actually carries probability
            information) is a tiny sliver swamped by quote noise. The same
            information lives, much more cleanly, in the OTM put at the same
            strike.
          </Prose>
          <Prose>
            For strikes below spot we use OTM puts and convert them to
            synthetic calls via put–call parity:
          </Prose>
          <Equation>
            C(K) = P(K) + S − K · e<sup>−rT</sup>
          </Equation>
          <Prose>
            For strikes at or above spot we use OTM calls directly. Each
            wing draws on the side where the contract carries clean signal,
            producing a synthetic call curve where every quote contributes.
          </Prose>
        </Step>

        <Step num="04" title="Arbitrage diagnostics">
          <Prose>
            A well-formed risk-neutral world demands three properties from
            the smoothed call curve:
          </Prose>
          <Prose>
            <span style={{ color: "var(--accent)" }}>(i)</span>{" "}
            <i>monotonicity</i> — C(K) must be decreasing in K, otherwise a
            spread arb exists.{" "}
            <span style={{ color: "var(--accent)" }}>(ii)</span>{" "}
            <i>convexity</i> — the second difference of C must be
            non-negative everywhere (the butterfly no-arbitrage condition).{" "}
            <span style={{ color: "var(--accent)" }}>(iii)</span> the
            resulting density f(K) must be non-negative and integrate to 1.
          </Prose>
          <Prose>
            The diagnostics panel above counts violations of each. The two
            strongest sanity checks are that{" "}
            <span style={{ color: "var(--accent)" }}>∫ f(K) dK ≈ 1</span> and
            that{" "}
            <span style={{ color: "var(--accent)" }}>
              E
              <sub className="font-serif-italic" style={{ fontSize: "0.78em" }}>
                Q
              </sub>
              [<MathText>S_T</MathText>] ≈ S · e<sup>rT</sup>
            </span>
            ; either deviating by more than a fraction of a percent suggests
            the smoothing is the limit, not the math.
          </Prose>
        </Step>
      </div>
    </section>
  );
}
