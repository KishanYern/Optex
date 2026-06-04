"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { VISUALIZATIONS } from "@/lib/visualizations";

import MathText from "./MathText";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          backgroundColor: "rgba(15, 10, 31, 0.78)",
          borderColor: "var(--rule)",
        }}
      >
        <div className="flex items-center justify-between px-6 sm:px-10 h-16">
          <Link
            href="/"
            className="flex items-baseline gap-3 group"
            aria-label="optex home"
          >
            <span
              className="font-serif text-[28px] leading-none tracking-[-0.015em]"
              style={{ color: "var(--ink)" }}
            >
              op
              <span
                className="font-serif-italic"
                style={{ color: "var(--accent)" }}
              >
                t
              </span>
              ex
            </span>
            <span
              className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.28em] -translate-y-[2px]"
              style={{ color: "var(--ink-faint)" }}
            >
              An interactive study of options markets
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/learn"
              className="font-mono text-[11px] uppercase tracking-[0.28em] transition-colors hover:[color:var(--accent)]"
              style={{ color: "var(--ink-soft)" }}
            >
              Learn
            </Link>
            <button
              type="button"
              aria-label={open ? "Close index" : "Open index"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="group flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] transition-colors"
              style={{ color: open ? "var(--accent)" : "var(--ink-soft)" }}
            >
              <span
                className="inline-block h-px transition-all"
                style={{
                  backgroundColor: "currentColor",
                  width: open ? "2.5rem" : "1.5rem",
                }}
              />
              {open ? "Close" : "Index"}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 menu-veil overflow-y-auto"
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "var(--bg-deep)" }}
          onClick={() => setOpen(false)}
        >
          {/* Inner glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50rem 35rem at 50% -10%, rgba(167, 139, 250, 0.22), transparent 60%)",
            }}
          />
          <nav
            className="relative z-10 min-h-full flex flex-col px-6 sm:px-10 pt-24 pb-12 max-w-5xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="menu-item flex items-baseline gap-4 mb-12"
              style={{ animationDelay: "60ms" }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--ink-faint)" }}
              >
                Index of Studies
              </span>
              <span className="flex-1 h-px" style={{ backgroundColor: "var(--rule)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--ink-faint)" }}
              >
                Esc to close
              </span>
            </div>

            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="menu-item group flex items-baseline gap-6 py-6 border-b transition-colors"
              style={{ borderColor: "var(--rule)", animationDelay: "140ms" }}
            >
              <span
                className="font-mono text-[11px] uppercase tracking-[0.28em] w-24"
                style={{ color: "var(--ink-faint)" }}
              >
                Home
              </span>
              <span
                className="font-serif-display text-4xl sm:text-5xl tracking-tight transition-colors group-hover:[color:var(--accent)]"
                style={{ color: "var(--ink)" }}
              >
                Back to overview
              </span>
            </Link>

            {VISUALIZATIONS.map((v, i) => {
              const live = v.status === "live";
              return (
                <Link
                  key={v.slug}
                  href={live ? `/visualizations/${v.slug}` : "#"}
                  onClick={(e) => {
                    if (!live) e.preventDefault();
                    else setOpen(false);
                  }}
                  className="menu-item group flex items-baseline gap-6 py-6 border-b transition-colors"
                  style={{
                    borderColor: "var(--rule)",
                    animationDelay: `${200 + i * 70}ms`,
                    opacity: live ? 1 : 0.45,
                    cursor: live ? "pointer" : "not-allowed",
                  }}
                >
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.28em] w-24"
                    style={{ color: live ? "var(--accent)" : "var(--ink-faint)" }}
                  >
                    Study {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div
                      className="font-serif-display text-4xl sm:text-5xl tracking-tight leading-[1.05] transition-colors group-hover:[color:var(--accent)]"
                      style={{ color: "var(--ink)" }}
                    >
                      {v.title}
                    </div>
                    <div
                      className="text-base sm:text-lg mt-2 max-w-xl"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      <MathText>{v.blurb}</MathText>
                    </div>
                  </div>
                  <span
                    className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.28em]"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {live ? "→ Begin" : "Soon"}
                  </span>
                </Link>
              );
            })}

            <div
              className="menu-item mt-12 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{
                color: "var(--ink-faint)",
                animationDelay: `${260 + VISUALIZATIONS.length * 70}ms`,
              }}
            >
              <span>{VISUALIZATIONS.length} of many planned</span>
              <span>optex</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
