import Link from "next/link";

import MathText from "@/components/MathText";
import { VISUALIZATIONS } from "@/lib/visualizations";

export default function LearnPage() {
  const documented = VISUALIZATIONS.filter((v) => v.status === "live");

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
              documentation
            </div>
            <div
              className="hidden sm:block mt-10 h-12 w-px"
              style={{ backgroundColor: "var(--rule-strong)" }}
            />
            <div
              className="hidden sm:block mt-10 font-mono text-[10px] uppercase tracking-[0.3em] leading-relaxed max-w-[12rem]"
              style={{ color: "var(--ink-faint)" }}
            >
              Mathematics
              <br />
              · Data
              <br />
              · Design decisions
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
              A field guide to the method
            </div>

            <h1
              className="font-serif-display text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.9] tracking-[-0.025em] reveal"
              style={{ color: "var(--ink)", animationDelay: "140ms" }}
            >
              The{" "}
              <span
                className="font-serif-italic"
                style={{ color: "var(--accent)" }}
              >
                method
              </span>
              .
            </h1>

            <p
              className="mt-10 max-w-2xl text-lg sm:text-xl leading-relaxed reveal"
              style={{ color: "var(--ink-soft)", animationDelay: "260ms" }}
            >
              Written breakdowns of the mathematics, the data pipeline, and the
              design choices behind each study.
            </p>

            <p
              className="mt-6 max-w-2xl text-[15px] leading-relaxed reveal"
              style={{ color: "var(--ink-faint)", animationDelay: "320ms" }}
            >
              Each entry pairs with an interactive study. Read the method here,
              then explore it live.
            </p>
          </div>
        </div>
      </section>

      {/* Studies list */}
      <section className="max-w-6xl mx-auto">
        <div
          className="flex items-baseline gap-4 reveal"
          style={{ animationDelay: "360ms" }}
        >
          <span
            className="font-mono text-[11px] uppercase tracking-[0.32em]"
            style={{ color: "var(--ink-faint)" }}
          >
            Documented studies
          </span>
          <span
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--rule)" }}
          />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.32em]"
            style={{ color: "var(--ink-faint)" }}
          >
            {String(documented.length).padStart(2, "0")} entries
          </span>
        </div>

        <div className="pb-32">
          {documented.map((v, i) => (
            <div
              key={v.slug}
              className="reveal"
              style={{ animationDelay: `${420 + i * 130}ms` }}
            >
              <Link
                href={`/learn/${v.slug}`}
                className="group grid grid-cols-12 gap-x-4 sm:gap-x-8 py-12 sm:py-16 border-t"
                style={{ borderColor: "var(--rule)" }}
              >
                {/* Index column */}
                <div className="col-span-12 sm:col-span-3 flex sm:flex-col items-baseline sm:items-start gap-4 sm:gap-3 mb-5 sm:mb-0">
                  <div
                    className="font-mono text-[11px] uppercase tracking-[0.3em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Study {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.25em]"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Documentation
                  </div>
                </div>

                {/* Content */}
                <div className="col-span-12 sm:col-span-6">
                  <h2
                    className="font-serif-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.015em]"
                    style={{ color: "var(--ink)" }}
                  >
                    <span className="transition-colors group-hover:[color:var(--accent)]">
                      {v.title}
                    </span>
                    <span style={{ color: "var(--accent)" }}>.</span>
                  </h2>

                  <p
                    className="mt-6 font-serif-italic text-lg sm:text-xl leading-snug max-w-2xl"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    <MathText>{v.blurb}</MathText>
                  </p>

                  <p
                    className="mt-5 text-[15px] leading-relaxed max-w-2xl"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    <MathText>{v.description}</MathText>
                  </p>
                </div>

                {/* CTA */}
                <div className="col-span-12 sm:col-span-3 mt-8 sm:mt-3 flex sm:justify-end sm:items-start">
                  <span
                    className="read-link font-mono text-[11px] uppercase tracking-[0.3em]"
                    style={{ color: "var(--accent)" }}
                  >
                    <span className="transition-all group-hover:tracking-[0.36em]">
                      Read the method
                    </span>
                  </span>
                </div>
              </Link>
            </div>
          ))}

          <div className="h-px" style={{ backgroundColor: "var(--rule)" }} />
        </div>
      </section>

      {/* Colophon */}
      <footer className="max-w-6xl mx-auto pb-16 flex flex-col sm:flex-row items-baseline justify-between gap-3">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.3em] transition-colors hover:[color:var(--accent)]"
          style={{ color: "var(--ink-faint)" }}
        >
          ← Back to overview
        </Link>
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
