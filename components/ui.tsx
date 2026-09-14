"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X, Copy, Check } from "lucide-react";
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4 30 15-25h6L10 30m10 0 9-16 9 16M14 23h19"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="header">
      <Link href="/" className="brand" aria-label="Accord home">
        <Mark />
        accord<span className="brand-by">by eden</span>
      </Link>
      <nav
        className={open ? "navigation open" : "navigation"}
        aria-label="Main navigation"
      >
        <Link onClick={() => setOpen(false)} href="/#platform">
          Platform
        </Link>
        <Link onClick={() => setOpen(false)} href="/#pricing">
          Pricing
        </Link>
        <Link
          className={path === "/docs" ? "active" : ""}
          onClick={() => setOpen(false)}
          href="/docs"
        >
          Developers
        </Link>
        <Link
          className={path === "/roadmap" ? "active" : ""}
          onClick={() => setOpen(false)}
          href="/roadmap"
        >
          Our direction
        </Link>
      </nav>
      <Link href="/workbench" className="button small header-cta">
        Open workbench <ArrowUpRight size={15} />
      </Link>
      <button
        className="menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="brand" href="/">
          <Mark />
          accord
        </Link>
        <p>Agent autonomy. On your terms.</p>
      </div>
      <div className="footer-links">
        <Link href="/docs">Documentation</Link>
        <Link href="/roadmap">Roadmap</Link>
        <a href="https://github.com/edenbuilds/accord">
          GitHub <ArrowUpRight size={14} />
        </a>
        <a href="https://edenbuilds.me">
          Eden Builds <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Eden Builds</span>
        <span>Developer preview · Built with intent.</span>
      </div>
    </footer>
  );
}
export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [state, setState] = useState("");
  return (
    <button
      className="copy-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("Copied");
          setTimeout(() => setState(""), 2000);
        } catch {
          setState("Select and copy the text");
        }
      }}
    >
      {state === "Copied" ? <Check size={15} /> : <Copy size={15} />}
      <span aria-live="polite">{state || label}</span>
    </button>
  );
}
export function downloadJson(value: unknown, name: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
