"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X, Copy, Check } from "lucide-react";
import Tetris from "./originkit/ui/footer-02/tetris";
import { useCases } from "@/lib/use-cases";
import { SUMMARY } from "@/lib/content";

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M35 0H66L100 72L88 92C80 90 72 86 60 86C48 86 38 95 22 99L0 72ZM50 13L16 78C30 74 42 66 55 67C68 68 77 73 85 76Z"
      />
    </svg>
  );
}

export function Lockup({ by = true }: { by?: boolean }) {
  return (
    <span className="lockup">
      <Mark size={24} />
      accord
      {by && <small>by Eden Builds</small>}
    </span>
  );
}

const NAV = [
  ["Product", "/app"],
  ["Use cases", "/#use-cases"],
  ["Compare", "/compare"],
  ["Docs", "/docs"],
  ["Pricing", "/#pricing"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Link href="/" aria-label="Accord home" onClick={() => setOpen(false)}>
          <Lockup />
        </Link>
        <nav className="nav-links" aria-label="Main">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className={path === href ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/#live" className="btn btn-light nav-cta">
          Connect your agent <ArrowUpRight size={16} />
        </Link>
        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="nav-sheet" aria-label="Mobile">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link href="/#live" className="btn btn-light" onClick={() => setOpen(false)}>
            Connect your agent <ArrowUpRight size={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        ["Converter", "/app"],
        ["Live sandbox", "/#live"],
        ["Policy workbench", "/workbench"],
        ["Pricing", "/#pricing"],
        ["Join the waitlist", "/waitlist"],
      ],
    },
    { title: "Use cases", links: useCases.map((u) => [u.label, `/use-cases/${u.slug}`]) },
    {
      title: "Compare",
      links: [
        ["Accord vs native MCP", "/compare#native-mcp"],
        ["Accord vs API gateways", "/compare#api-gateways"],
        ["Accord vs Zapier and Make", "/compare#automation"],
        ["Roadmap", "/roadmap"],
      ],
    },
    {
      title: "Developers",
      links: [
        ["Documentation", "/docs"],
        ["Quickstart", "/docs#quickstart"],
        ["Security", "/docs#security"],
        ["llms.txt", "/llms.txt"],
        ["GitHub", "https://github.com/edenbuilds/accord"],
      ],
    },
  ];
  return (
    <footer className="foot">
      <div className="shell">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" aria-label="Accord home">
              <Lockup by={false} />
            </Link>
            <p>{SUMMARY}</p>
            <p className="by">
              Made by{" "}
              <a href="https://edenbuilds.me" {...external}>
                Eden Builds
              </a>
            </p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h4>{c.title}</h4>
              <ul>
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    {href.startsWith("http") ? (
                      <a href={href} {...external}>
                        {label}
                      </a>
                    ) : (
                      <Link href={href}>{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Eden Builds. Developer preview.</span>
          <span>
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · Sandbox responses are sample data.
          </span>
        </div>
      </div>
      <div className="foot-tetris" aria-hidden="true">
        <Tetris
          boardColor="#111a14"
          colors={["#2d4233", "#c9b8f2", "#dcf49a"]}
          cellSize={18}
          gap={2}
          rounded={4}
          dropSpeed={1}
          movement={2}
          startFilled={true}
        />
      </div>
    </footer>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState("");
  return (
    <button
      type="button"
      className="copy-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("Copied");
          setTimeout(() => setState(""), 2000);
        } catch {
          setState("Select and copy");
        }
      }}
    >
      {state === "Copied" ? <Check size={15} /> : <Copy size={15} />}
      <span aria-live="polite">{state || label}</span>
    </button>
  );
}

export function downloadJson(value: unknown, name: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
