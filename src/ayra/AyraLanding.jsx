/**
 * AYRA ad-landing surface (route `/ayra`).
 *
 * Clean, chrome-free luxe backdrop where paid traffic lands. The global
 * <AyraShopper/> auto-opens its conscious orb here and starts on the first
 * gesture (Begin button / orb tap). Mobile-first; mic capture needs a tap, so
 * this page is a guaranteed gesture entry point that dispatches "ayra:start".
 */
import { useEffect, useMemo } from "react";
import { getLaunchParams } from "./ayraBridge.js";

export default function AyraLanding() {
  const params = useMemo(() => getLaunchParams(), []);
  const occasion = (params.occasion || "").toString().trim();

  useEffect(() => { document.title = "AYRA — your Sotbella stylist"; }, []);

  const begin = () => {
    try { window.dispatchEvent(new CustomEvent("ayra:start", { detail: params })); } catch {}
  };

  return (
    <div
      onClick={begin}
      style={{
        position: "fixed", inset: 0, zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "18px", textAlign: "center",
        padding: "max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))",
        overflow: "hidden", overscrollBehavior: "none",
        background: "radial-gradient(120% 90% at 50% 8%, #1a1a1a 0%, #000 62%)",
        color: "#fff", fontFamily: "'Lato', system-ui, sans-serif",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ letterSpacing: ".42em", fontSize: 13, opacity: 0.72, textTransform: "uppercase", paddingLeft: ".42em" }}>
        Sotbella
      </div>
      <h1 style={{ fontSize: "clamp(26px, 7vw, 40px)", fontWeight: 300, lineHeight: 1.18, margin: 0, textWrap: "balance" }}>
        {occasion
          ? <>Let&apos;s style you for<br /><span style={{ fontWeight: 600 }}>{occasion}</span>.</>
          : <>Your stylist is<br /><span style={{ fontWeight: 600 }}>ready for you</span>.</>}
      </h1>
      <p style={{ fontSize: 15, opacity: 0.62, maxWidth: 320, margin: 0 }}>
        AYRA knows your taste — just talk, and she&apos;ll pull the pieces and build the look.
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); begin(); }}
        style={{
          marginTop: 6, padding: "14px 30px", borderRadius: 999, border: "1px solid rgba(255,255,255,.22)",
          background: "#fff", color: "#000", fontSize: 15, fontWeight: 600, letterSpacing: ".02em",
          cursor: "pointer",
        }}
      >
        Begin with AYRA
      </button>
    </div>
  );
}
