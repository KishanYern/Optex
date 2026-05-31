import Link from "next/link";

import type { Visualization } from "@/lib/visualizations";

type Props = {
  v: Visualization;
  index: number;
};

const TOPICS: Record<string, string> = {
  rnd: "Risk-neutral pricing · Smoothing",
};

export default function VisualizationCard({ v, index }: Props) {
  const live = v.status === "live";
  const number = `Study ${String(index + 1).padStart(2, "0")}`;
  const topic = TOPICS[v.slug] ?? "Options markets";

  const inner = (
    <article
      className="group relative grid grid-cols-12 gap-x-4 sm:gap-x-8 py-12 sm:py-16 border-t"
      style={{ borderColor: "var(--rule)" }}
    >
      {/* Index column */}
      <div className="col-span-12 sm:col-span-3 flex sm:flex-col items-baseline sm:items-start gap-4 sm:gap-3 mb-5 sm:mb-0">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.3em]"
          style={{ color: live ? "var(--accent)" : "var(--ink-faint)" }}
        >
          {number}
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-2"
          style={{ color: "var(--ink-faint)" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: live ? "var(--accent)" : "var(--ink-faint)" }}
          />
          {live ? "Live" : "In preparation"}
        </div>
        <div
          className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] mt-2 max-w-[12rem] leading-relaxed"
          style={{ color: "var(--ink-faint)" }}
        >
          Topic — {topic}
        </div>
      </div>

      {/* Title + writing */}
      <div className="col-span-12 sm:col-span-6">
        <h3
          className="font-serif-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.015em]"
          style={{ color: "var(--ink)" }}
        >
          <span
            className={
              live ? "transition-colors group-hover:[color:var(--accent)]" : ""
            }
          >
            {v.title}
          </span>
          <span style={{ color: "var(--accent)" }}>.</span>
        </h3>

        <p
          className="mt-6 font-serif-italic text-lg sm:text-xl leading-snug max-w-2xl"
          style={{ color: "var(--ink-soft)" }}
        >
          {v.blurb}
        </p>

        <p
          className="mt-5 text-[15px] leading-relaxed max-w-2xl"
          style={{ color: "var(--ink-soft)" }}
        >
          {v.description}
        </p>
      </div>

      {/* Begin affordance */}
      <div className="col-span-12 sm:col-span-3 mt-8 sm:mt-3 flex sm:justify-end sm:items-start">
        {live ? (
          <span
            className="read-link font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--accent)" }}
          >
            <span className="transition-all group-hover:tracking-[0.36em]">
              Begin study
            </span>
          </span>
        ) : (
          <span
            className="font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-faint)" }}
          >
            Soon
          </span>
        )}
      </div>
    </article>
  );

  if (!live) return inner;

  return (
    <Link href={`/visualizations/${v.slug}`} className="block">
      {inner}
    </Link>
  );
}
