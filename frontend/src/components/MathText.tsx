// Lightweight math-text renderer. Walks a string and turns occurrences of
// `X_Y` into X<sub>Y</sub> (e.g. "f(S_T)" -> f(S<sub>T</sub>)). Avoids
// pulling in KaTeX/MathJax for the tiny amount of notation we use.
//
// Only matches a single base letter followed by `_` and an alphanumeric run,
// bounded by word boundaries — so `rate_limit`-style identifiers are left
// alone but `S_T`, `E_Q`, `K_t` get rendered.

import { Fragment } from "react";

export default function MathText({ children }: { children: string }) {
  const pattern = /\b([A-Za-z])_([A-Za-z][A-Za-z0-9]*)\b/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(children)) !== null) {
    if (m.index > lastIdx) {
      parts.push(
        <Fragment key={key++}>{children.slice(lastIdx, m.index)}</Fragment>,
      );
    }
    parts.push(
      <span key={key++}>
        {m[1]}
        <sub className="font-serif-italic" style={{ fontSize: "0.78em" }}>
          {m[2]}
        </sub>
      </span>,
    );
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < children.length) {
    parts.push(<Fragment key={key++}>{children.slice(lastIdx)}</Fragment>);
  }
  return <>{parts}</>;
}
