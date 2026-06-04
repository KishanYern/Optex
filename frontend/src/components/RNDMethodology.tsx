import MathText from "@/components/MathText";

import { Equation, Prose, Step } from "./DocComponents";

export default function RNDMethodology() {
  return (
    <div className="grid grid-cols-12 gap-x-4 sm:gap-x-8">
      <Step num="01" title="The identity">
        <Prose>
          Risk-neutral pricing says every European call is the discounted
          expectation of its payoff under the risk-neutral measure <i>Q</i>:
        </Prose>
        <Equation>
          C(K) = e<sup>−rT</sup> · <i>E</i>
          <sub className="font-serif-italic" style={{ fontSize: "0.78em" }}>
            Q
          </sub>
          {" "}[ max(<MathText>S_T</MathText> − K, 0) ]
        </Equation>
        <Prose>
          Differentiating twice with respect to K and rearranging gives the
          Breeden–Litzenberger identity:
        </Prose>
        <Equation>
          f(K) = e<sup>rT</sup> · ∂²C / ∂K²
        </Equation>
        <Prose>
          where <i>f</i> is the risk-neutral probability density of{" "}
          <MathText>S_T</MathText> evaluated at K. Recovering the density
          therefore reduces to taking the second derivative of the call price
          curve — provided we have a clean enough C(K) to differentiate.
        </Prose>
      </Step>

      <Step num="02" title="Why smooth in vol-space, not price-space">
        <Prose>
          Naïvely taking second differences of raw quote prices produces noise.
          The bid–ask spread, even on a liquid name, easily moves mid prices by
          a few cents — and the second-derivative operator amplifies that twice.
        </Prose>
        <Prose>
          Instead, we invert each quote into a Black–Scholes implied volatility,
          fit a cubic smoothing spline to IV(K) across strikes, and reprice C(K)
          on a dense, evenly-spaced grid before differencing. Implied vol is a
          far cleaner surface to smooth: even when prices are jagged, IV is
          typically smooth in its second derivative, which is exactly the
          property we need.
        </Prose>
      </Step>

      <Step num="03" title="Stitching the wings with put-call parity">
        <Prose>
          Deep ITM call quotes are dominated by intrinsic value — the time-value
          component (the part that actually carries probability information) is a
          tiny sliver swamped by quote noise. The same information lives, much
          more cleanly, in the OTM put at the same strike.
        </Prose>
        <Prose>
          For strikes below spot we use OTM puts and convert them to synthetic
          calls via put–call parity:
        </Prose>
        <Equation>
          C(K) = P(K) + S − K · e<sup>−rT</sup>
        </Equation>
        <Prose>
          For strikes at or above spot we use OTM calls directly. Each wing
          draws on the side where the contract carries clean signal, producing a
          synthetic call curve where every quote contributes.
        </Prose>
      </Step>

      <Step num="04" title="Arbitrage diagnostics">
        <Prose>
          A well-formed risk-neutral world demands three properties from the
          smoothed call curve:
        </Prose>
        <Prose>
          <span style={{ color: "var(--accent)" }}>(i)</span>{" "}
          <i>monotonicity</i> — C(K) must be decreasing in K, otherwise a
          spread arb exists.{" "}
          <span style={{ color: "var(--accent)" }}>(ii)</span>{" "}
          <i>convexity</i> — the second difference of C must be non-negative
          everywhere (the butterfly no-arbitrage condition).{" "}
          <span style={{ color: "var(--accent)" }}>(iii)</span> the resulting
          density f(K) must be non-negative and integrate to 1.
        </Prose>
        <Prose>
          The two strongest sanity checks are that{" "}
          <span style={{ color: "var(--accent)" }}>∫ f(K) dK ≈ 1</span> and
          that{" "}
          <span style={{ color: "var(--accent)" }}>
            E
            <sub className="font-serif-italic" style={{ fontSize: "0.78em" }}>
              Q
            </sub>
            [<MathText>S_T</MathText>] ≈ S · e<sup>rT</sup>
          </span>
          ; either deviating by more than a fraction of a percent suggests the
          smoothing is the limit, not the math.
        </Prose>
      </Step>
    </div>
  );
}
