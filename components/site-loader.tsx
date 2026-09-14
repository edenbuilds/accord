"use client";
import { useCallback, useState } from "react";
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
  if (state === "gone") return null;
  return (
    <div
      className={`site-loader ${state === "fade" ? "fade" : ""}`}
      aria-hidden="true"
      onTransitionEnd={() => state === "fade" && setState("gone")}
    >
      <CenterLinesLoading
        title="Accord"
        subtitle="Turn any API into a safe AI tool."
        lineCount={29}
        darkLineColor="#c9b8f2"
        duration={0.85}
        onComplete={done}
      />
    </div>
  );
}
