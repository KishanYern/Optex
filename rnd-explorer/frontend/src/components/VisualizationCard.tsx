import Link from "next/link";

import type { Visualization } from "@/lib/visualizations";

export default function VisualizationCard({ v }: { v: Visualization }) {
  const live = v.status === "live";
  const content = (
    <div
      className={`border h-full flex flex-col gap-3 p-5 transition-colors ${
        live
          ? "border-neutral-800 bg-neutral-950 hover:border-emerald-700 hover:bg-neutral-900"
          : "border-neutral-900 bg-neutral-950/50 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-mono text-base text-emerald-400">{v.title}</h2>
        {!live && (
          <span className="text-[10px] uppercase tracking-wider text-amber-500 border border-amber-900/50 px-1.5 py-0.5">
            soon
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-300">{v.blurb}</p>
      <p className="text-xs text-neutral-500 leading-relaxed">{v.description}</p>
      <div className="mt-auto pt-2 font-mono text-xs text-emerald-500">
        {live ? "open →" : "in development"}
      </div>
    </div>
  );

  return live ? (
    <Link href={`/visualizations/${v.slug}`} className="block h-full">
      {content}
    </Link>
  ) : (
    <div className="block h-full">{content}</div>
  );
}
