"use client";

import type { Diagnostics as Diag } from "@/lib/types";

type Props = {
  diag: Diag;
  spot: number;
  T: number;
  r: number;
};

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between border-b border-neutral-900 py-1 last:border-b-0">
      <span className="text-neutral-500 text-xs uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-sm ${warn ? "text-amber-400" : "text-neutral-200"}`}>{value}</span>
    </div>
  );
}

export default function Diagnostics({ diag, spot, T, r }: Props) {
  const integralWarn = Math.abs(diag.integral - 1) > 0.05;
  const meanErr = Math.abs(diag.mean - diag.forward) / diag.forward;
  const meanWarn = meanErr > 0.02;

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-4">
      <div className="text-xs uppercase tracking-wider text-emerald-500 mb-2">Diagnostics</div>
      <Row label="Spot S" value={spot.toFixed(2)} />
      <Row label="T (years)" value={T.toFixed(4)} />
      <Row label="r (cont.)" value={(r * 100).toFixed(2) + "%"} />
      <Row label="Forward S·e^(rT)" value={diag.forward.toFixed(2)} />
      <Row label="∫ f(K) dK" value={diag.integral.toFixed(4)} warn={integralWarn} />
      <Row label="E_Q[S_T]" value={diag.mean.toFixed(2)} warn={meanWarn} />
      <Row label="Mean error" value={(meanErr * 100).toFixed(2) + "%"} warn={meanWarn} />
      <Row
        label="C(K) monotonicity"
        value={diag.n_monotonicity_violations === 0 ? "OK" : `${diag.n_monotonicity_violations} viol.`}
        warn={diag.n_monotonicity_violations > 0}
      />
      <Row
        label="C(K) convexity"
        value={diag.n_convexity_violations === 0 ? "OK" : `${diag.n_convexity_violations} viol.`}
        warn={diag.n_convexity_violations > 0}
      />
      <Row
        label="Negative density"
        value={diag.n_negative_density === 0 ? "OK" : `${diag.n_negative_density} pts`}
        warn={diag.n_negative_density > 0}
      />
      <Row label="IV fit RMSE" value={diag.fit_rmse.toFixed(5)} />
    </div>
  );
}
