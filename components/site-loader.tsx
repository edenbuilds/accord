"use client";
import { useCallback, useEffect, useState } from "react";
import CenterLinesLoading from "./effects/lines-loader/CenterLinesLoading";

// Hyperiux lines loader, once per browser session. The layout's inline script
// hides it for returning visitors; a CSS failsafe hides it if scripts fail.
export default function SiteLoader() {
  const [state, setState] = useState<"run" | "fade" | "gone">("run");
  const done = useCallback(() => {
    try {
      sessionStorage.setItem("accord.seen", "1");
    } catch {}
    setState("fade");
  }, []);
  useEffect(() => { const timer = setTimeout(done, 2300); return () => clearTimeout(timer); }, [done]);
  if (state === "gone") return null;
  return (
    <div
      className={`site-loader ${state === "fade" ? "fade" : ""}`}
      aria-hidden="true"
      onTransitionEnd={() => state === "fade" && setState("gone")}
    >
      <CenterLinesLoading
        title="Accord"
        subtitle="Your tools. Connected."
        lineCount={17}
        darkLineColor="#648563"
        duration={0.35}
        onComplete={done}
      />
    </div>
  );
}
