import Link from "next/link";

import RNDMethodology from "@/components/RNDMethodology";
import { getVisualization, VISUALIZATIONS } from "@/lib/visualizations";

const META = getVisualization("rnd")!;
const INDEX = VISUALIZATIONS.findIndex((v) => v.slug === "rnd") + 1;

export default function LearnRNDPage() {
  return (
    <main className="px-6 sm:px-10">
      {/* Title block */}
      <header className="max-w-6xl mx-auto pt-12 sm:pt-20 pb-14">
        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-8">
          <aside
            className="col-span-12 sm:col-span-3 mb-6 sm:mb-0 reveal"
            style={{ animationDelay: "40ms" }}
          >
            <Link
              href="/learn"
              className="font-mono text-[10px] uppercase tracking-[0.3em] transition-colors hover:[color:var(--accent)]"
              style={{ color: "var(--ink-faint)" }}
            >
              ← Documentation
            </Link>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.3em] mt-3"
              style={{ color: "var(--ink-faint)" }}
            >
              Study {String(INDEX).padStart(2, "0")}
            </div>

            <div
              className="hidden sm:block mt-10 h-12 w-px"
              style={{ backgroundColor: "var(--rule-strong)" }}
            />

            <div
              className="hidden sm:block mt-10 space-y-2"
              style={{ color: "var(--ink-faint)" }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
                Reference
              </div>
              <div
                className="font-mono text-[10px] leading-relaxed max-w-[12rem]"
                style={{ color: "var(--ink-faint)" }}
              >
                Breeden &amp; Litzenberger
                <br />
                1978
              </div>
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
              The method · Risk-neutral density
            </div>

            <h1
              className="font-serif-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.92] tracking-[-0.025em] reveal"
              style={{ color: "var(--ink)", animationDelay: "140ms" }}
            >
              {META.title}
              <span style={{ color: "var(--accent)" }}>.</span>
            </h1>

            <p
              className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed reveal"
              style={{ color: "var(--ink-soft)", animationDelay: "220ms" }}
            >
              {META.description}
            </p>

            <div
              className="mt-10 reveal"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/visualizations/rnd"
                className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] transition-colors hover:[color:var(--accent-hot)]"
                style={{ color: "var(--accent)" }}
              >
                <span
                  className="inline-block h-px transition-all group-hover:w-14"
                  style={{ width: "2rem", backgroundColor: "currentColor" }}
                />
                Try the interactive study
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Methodology */}
      <section className="max-w-6xl mx-auto pb-32">
        <div
          className="flex items-baseline gap-4 mb-12 reveal"
          style={{ animationDelay: "360ms" }}
        >
          <span
            className="font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-faint)" }}
          >
            The Method
          </span>
          <span
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--rule)" }}
          />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-faint)" }}
          >
            Breeden – Litzenberger · 1978
          </span>
        </div>

        <div
          className="reveal"
          style={{ animationDelay: "420ms" }}
        >
          <RNDMethodology />
        </div>
      </section>

      {/* Footer nav */}
      <div
        className="max-w-6xl mx-auto pb-16 flex flex-col sm:flex-row items-baseline justify-between gap-6 border-t pt-10"
        style={{ borderColor: "var(--rule)" }}
      >
        <Link
          href="/learn"
          className="font-mono text-[10px] uppercase tracking-[0.3em] transition-colors hover:[color:var(--accent)]"
          style={{ color: "var(--ink-faint)" }}
        >
          ← All documentation
        </Link>
        <Link
          href="/visualizations/rnd"
          className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] transition-colors hover:[color:var(--accent-hot)]"
          style={{ color: "var(--accent)" }}
        >
          <span
            className="inline-block h-px transition-all group-hover:w-14"
            style={{ width: "2rem", backgroundColor: "currentColor" }}
          />
          Try the interactive study
        </Link>
      </div>
    </main>
  );
}
