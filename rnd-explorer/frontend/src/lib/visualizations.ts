// Registry of all visualizations. The hamburger menu and the home grid both
// pull from this list, so adding a new one is a single-source-of-truth edit.

export type Visualization = {
  slug: string;            // URL: /visualizations/{slug}
  title: string;           // shown on card + menu
  blurb: string;           // one-line, shown on card and menu
  description: string;     // longer, shown on the visualization page itself
  status: "live" | "coming-soon";
};

export const VISUALIZATIONS: Visualization[] = [
  {
    slug: "rnd",
    title: "Risk-neutral density",
    blurb: "Recover the market's implied distribution of S_T from one expiry.",
    description:
      "Pulls a call/put chain for one expiration, stitches OTM puts and calls via " +
      "put-call parity into a synthetic call curve, fits a cubic smoothing spline " +
      "to implied vol across strikes, then takes the discrete second derivative " +
      "of C(K) (Breeden-Litzenberger) to extract f(S_T). Includes arbitrage " +
      "diagnostics and a raw vs smoothed overlay.",
    status: "live",
  },
];

export function getVisualization(slug: string): Visualization | undefined {
  return VISUALIZATIONS.find((v) => v.slug === slug);
}
