export function Equation({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-5 font-mono text-[15px] sm:text-base px-5 py-4 border overflow-x-auto"
      style={{
        color: "var(--ink)",
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg-panel)",
      }}
    >
      {children}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[15px] leading-relaxed max-w-3xl"
      style={{ color: "var(--ink-soft)" }}
    >
      {children}
    </p>
  );
}

export function Step({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="col-span-12 sm:col-span-3 mb-3 sm:mb-0">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "var(--accent)" }}
        >
          Step {num}
        </div>
        <div
          className="font-serif text-2xl sm:text-3xl mt-2 tracking-tight leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </div>
      </div>
      <div className="col-span-12 sm:col-span-9 mb-14 sm:mb-16 space-y-5">
        {children}
      </div>
    </>
  );
}
