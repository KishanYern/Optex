"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { VISUALIZATIONS } from "@/lib/visualizations";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-neutral-900">
      <div className="flex items-center justify-between px-4 sm:px-6 h-12">
        <Link href="/" className="font-mono text-sm text-emerald-400 hover:text-emerald-300">
          optex<span className="text-neutral-600">{" // options viz"}</span>
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="p-2 -mr-2 text-neutral-300 hover:text-emerald-400"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {open ? (
              <>
                <path d="M4 4 L16 16" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 4 L4 16" stroke="currentColor" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <path d="M3 6 H17" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 10 H17" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 14 H17" stroke="currentColor" strokeWidth="1.5" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 top-12 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav
            className="absolute right-0 top-12 w-72 max-w-[90vw] bg-neutral-950 border-l border-b border-neutral-800 p-3 flex flex-col gap-1"
          >
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm font-mono text-neutral-300 hover:bg-neutral-900 hover:text-emerald-400 border border-transparent hover:border-neutral-800"
            >
              home
            </Link>
            <div className="text-[10px] uppercase tracking-wider text-neutral-600 px-3 pt-3 pb-1">
              Visualizations
            </div>
            {VISUALIZATIONS.map((v) => (
              <Link
                key={v.slug}
                href={`/visualizations/${v.slug}`}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-mono text-neutral-300 hover:bg-neutral-900 hover:text-emerald-400 border border-transparent hover:border-neutral-800 flex flex-col gap-0.5"
              >
                <span className="flex items-center gap-2">
                  {v.title}
                  {v.status === "coming-soon" && (
                    <span className="text-[10px] uppercase text-amber-500 border border-amber-900/50 px-1">
                      soon
                    </span>
                  )}
                </span>
                <span className="text-xs text-neutral-500">{v.blurb}</span>
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
