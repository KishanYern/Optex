import VisualizationCard from "@/components/VisualizationCard";
import { VISUALIZATIONS } from "@/lib/visualizations";

export default function HomePage() {
  return (
    <main className="bg-black text-neutral-200 p-4 sm:p-6 lg:p-10">
      <section className="max-w-3xl mb-10">
        <h1 className="font-mono text-2xl text-emerald-400 mb-3">optex</h1>
        <p className="text-sm text-neutral-300 leading-relaxed">
          A collection of interactive tools for visualizing options markets —
          implied volatility surfaces, risk-neutral densities, term structure,
          and more. Each tool pulls live chain data and walks through the math
          step by step.
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Pick a visualization to start, or open the menu in the top right.
        </p>
      </section>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">
          Visualizations
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {VISUALIZATIONS.map((v) => (
            <VisualizationCard key={v.slug} v={v} />
          ))}
          <div className="border border-dashed border-neutral-900 p-5 flex items-center justify-center text-xs text-neutral-600 font-mono">
            more coming soon
          </div>
        </div>
      </section>
    </main>
  );
}
