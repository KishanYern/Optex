import VisualizationCard from "@/components/VisualizationCard";
import { VISUALIZATIONS } from "@/lib/visualizations";

export default function HomePage() {
  return (
    <main className="px-6 sm:px-10 relative">
      {/* Masthead */}
      <section className="max-w-6xl mx-auto pt-16 sm:pt-28 pb-20 sm:pb-32">
        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-8">
          <aside
            className="col-span-12 sm:col-span-3 mb-8 sm:mb-0 reveal"
            style={{ animationDelay: "40ms" }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: "var(--ink-faint)" }}
            >
              optex
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.3em] mt-1"
              style={{ color: "var(--ink-faint)" }}
            >
              an interactive study
            </div>
            <div
              className="hidden sm:block mt-10 h-12 w-px"
              style={{ backgroundColor: "var(--rule-strong)" }}
            />
            <div
              className="hidden sm:block mt-10 font-mono text-[10px] uppercase tracking-[0.3em] leading-relaxed max-w-[12rem]"
              style={{ color: "var(--ink-faint)" }}
            >
              Live market data
              <br />
              · Open source
              <br />
              · Built to learn from
            </div>
          </aside>

          <div className="col-span-12 sm:col-span-9">
            <div
              className="font-mono text-[11px] uppercase tracking-[0.32em] mb-6 inline-flex items-center gap-3 reveal"
              style={{ color: "var(--accent)", animationDelay: "80ms" }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "var(--accent)",
                  boxShadow: "0 0 14px var(--accent-glow)",
                }}
              />
              An interactive study of options markets
            </div>

            <h1
              className="font-serif-display text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.9] tracking-[-0.025em] reveal"
              style={{ color: "var(--ink)", animationDelay: "140ms" }}
            >
              Learning to{" "}
              <span
                className="font-serif-italic"
                style={{ color: "var(--accent)" }}
              >
                see
              </span>
              <br />
              the options market.
            </h1>

            <p
              className="mt-10 max-w-2xl text-lg sm:text-xl leading-relaxed reveal"
              style={{ color: "var(--ink-soft)", animationDelay: "260ms" }}
            >
              A growing collection of visual tools for thinking about
              derivatives — implied volatility, risk-neutral densities, and the
              quiet structure that emerges from a wall of option quotes.
            </p>

            <p
              className="mt-6 max-w-2xl text-[15px] leading-relaxed reveal"
              style={{ color: "var(--ink-faint)", animationDelay: "320ms" }}
            >
              Each study pulls live market data, walks through the math, and
              shows what the textbook glosses over. Browse the index, or begin
              below.
            </p>
          </div>
        </div>
      </section>

      {/* Contents header */}
      <section className="max-w-6xl mx-auto">
        <div
          className="flex items-baseline gap-4 reveal"
          style={{ animationDelay: "360ms" }}
        >
          <span
            className="font-mono text-[11px] uppercase tracking-[0.32em]"
            style={{ color: "var(--ink-faint)" }}
          >
            The Studies
          </span>
          <span
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--rule)" }}
          />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.32em]"
            style={{ color: "var(--ink-faint)" }}
          >
            {String(VISUALIZATIONS.length).padStart(2, "0")} live ·{" "}
            <span style={{ color: "var(--ink-faint)" }}>more in progress</span>
          </span>
        </div>

        <div className="pb-32">
          {VISUALIZATIONS.map((v, i) => (
            <div
              key={v.slug}
              className="reveal"
              style={{ animationDelay: `${420 + i * 130}ms` }}
            >
              <VisualizationCard v={v} index={i} />
            </div>
          ))}

          {/* Forthcoming hint */}
          <div
            className="reveal grid grid-cols-12 gap-x-4 sm:gap-x-8 py-12 sm:py-16 border-t"
            style={{
              borderColor: "var(--rule)",
              animationDelay: `${420 + VISUALIZATIONS.length * 130}ms`,
            }}
          >
            <div className="col-span-12 sm:col-span-3">
              <div
                className="font-mono text-[11px] uppercase tracking-[0.3em]"
                style={{ color: "var(--ink-faint)" }}
              >
                In preparation
              </div>
            </div>
            <div className="col-span-12 sm:col-span-9">
              <p
                className="font-serif-italic text-2xl sm:text-3xl leading-snug max-w-3xl"
                style={{ color: "var(--ink-faint)" }}
              >
                Coming next — implied volatility surfaces, term structure of
                vol, and the geometry of the smile.
              </p>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: "var(--rule)" }} />
        </div>
      </section>

      {/* Colophon */}
      <footer className="max-w-6xl mx-auto pb-16 flex flex-col sm:flex-row items-baseline justify-between gap-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em]"
          style={{ color: "var(--ink-faint)" }}
        >
          Built openly · Set in Fraunces &amp; Geist
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em]"
          style={{ color: "var(--ink-faint)" }}
        >
          optex
        </div>
      </footer>
    </main>
  );
}
