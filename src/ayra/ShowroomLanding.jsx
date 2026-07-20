/**
 * AYRA Showroom — persona ad-landing (route `/showroom`).
 *
 * Sotbella-first: the brand's own hero VIDEO (same CMS content as the homepage
 * NEW-IN hero) plays full-bleed behind a dark scrim, with the Sotbella logo up
 * front. Picking a moment is the user gesture that: turns on showroom mode,
 * fires the AyraShowroomView custom event (TEST pixel only), starts AYRA, and
 * drops the shopper into the REAL store with AYRA as an ambient presence.
 * Chrome-free, elegant, mobile-first.
 */
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHomePageContent } from "../api/services/homeapi.js";
import { processImageUrl } from "../utils/imageUtils";
import sotbellaLogo from "../assets/images/sotbell-new-logo.png";
import { getLaunchParams } from "./ayraBridge.js";
import { setShowroom } from "./showroomMode.js";
import { showroomView } from "./ayraEvents.js";

const MOMENTS = [
  { key: "birthday",   label: "Birthday",   sub: "your night to shine" },
  { key: "brunch",     label: "Brunch",     sub: "day-social, effortless" },
  { key: "photoshoot", label: "Photoshoot", sub: "made for the camera" },
  { key: "date",       label: "Date night", sub: "quietly unforgettable" },
  { key: "event",      label: "The event",  sub: "the one they'll remember" },
];

const isVideo = (t) => (t || "").toLowerCase().includes("video");

export default function ShowroomLanding() {
  const navigate = useNavigate();
  const params = useMemo(() => getLaunchParams(), []);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

  // Same CMS content (and cache key) as the homepage hero — brand video in front.
  const { data: apiData } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => fetchHomePageContent(null),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const media = useMemo(() => {
    const arr = apiData?.homePage?.["NEW-IN"] || [];
    // Prefer a video slide (mobile variant on mobile); fall back to first image.
    for (const it of arr) {
      const src = isMobile ? (it.link_mobile || it.link) : it.link;
      const type = isMobile ? (it.type_mobile || it.type) : it.type;
      if (src && isVideo(type)) {
        return { kind: "video", src, poster: isMobile ? it.thumbnail_mobile : it.thumbnail_desktop };
      }
    }
    const first = arr.find((it) => (isMobile ? it.link_mobile || it.link : it.link));
    if (first) {
      return { kind: "image", src: isMobile ? (first.link_mobile || first.link) : first.link };
    }
    return null;
  }, [apiData, isMobile]);

  useEffect(() => { document.title = "AYRA — styled for your moment | Sotbella"; }, []);

  const begin = (occasion) => {
    setShowroom(true);
    try { showroomView(occasion); } catch {}
    try {
      window.dispatchEvent(new CustomEvent("ayra:start", { detail: { ...params, occasion, mode: "showroom" } }));
    } catch {}
    navigate("/");
  };

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* Sotbella brand video, full-bleed behind the scrim */}
      {media?.kind === "video" && (
        <video
          style={S.media}
          src={processImageUrl(media.src)}
          poster={media.poster ? processImageUrl(media.poster) : undefined}
          autoPlay muted loop playsInline
          aria-hidden="true"
        />
      )}
      {media?.kind === "image" && (
        <img style={S.media} src={processImageUrl(media.src)} alt="" aria-hidden="true" />
      )}
      <div style={S.scrim} aria-hidden="true" />

      <div style={S.content}>
        {/* Sotbella logo in front (forced white for the dark scrim) */}
        <img src={sotbellaLogo} alt="Sotbella" style={S.logo} />
        <div style={S.eyebrow}>AYRA · your personal stylist</div>
        <h1 style={S.title}>What are we dressing for?</h1>
        <p style={S.sub}>Tell me the moment — I&apos;ll walk you through the pieces made for it.</p>

        <div style={S.grid}>
          {MOMENTS.map((m) => (
            <button key={m.key} className="moment" style={S.card} onClick={() => begin(m.key)}>
              <span style={S.cardLabel}>{m.label}</span>
              <span style={S.cardSub}>{m.sub}</span>
            </button>
          ))}
        </div>

        <button className="moment" style={S.skip} onClick={() => begin("")}>
          Just show me what&apos;s new →
        </button>
      </div>
    </div>
  );
}

const CSS = `
.moment { transition: transform .18s ease, border-color .18s ease, background .18s ease; }
.moment:hover, .moment:active { transform: translateY(-2px); border-color: rgba(255,255,255,.5); background: rgba(0,0,0,.45); }
`;

const S = {
  root: {
    position: "fixed", inset: 0, zIndex: 1, overflow: "hidden",
    background: "#0b0810", color: "#fff",
    fontFamily: "'Lato', system-ui, sans-serif", WebkitTapHighlightColor: "transparent",
  },
  media: {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "cover", objectPosition: "center top",
  },
  scrim: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg, rgba(5,3,8,.62) 0%, rgba(5,3,8,.38) 40%, rgba(5,3,8,.78) 100%)",
  },
  content: {
    position: "absolute", inset: 0, overflow: "auto",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: "12px", textAlign: "center",
    padding: "max(28px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom))",
  },
  logo: {
    height: 34, objectFit: "contain", marginBottom: 4,
    filter: "brightness(0) invert(1)", // white wordmark over the video scrim
  },
  eyebrow: { fontSize: 12, letterSpacing: ".38em", paddingLeft: ".38em", textTransform: "uppercase", opacity: 0.72 },
  title: {
    fontSize: "clamp(26px, 7vw, 40px)", fontWeight: 300, lineHeight: 1.18,
    margin: "4px 0 0", textWrap: "balance", textShadow: "0 2px 22px rgba(0,0,0,.55)",
  },
  sub: { fontSize: 15, opacity: 0.78, maxWidth: 340, margin: "0 0 10px", textShadow: "0 1px 14px rgba(0,0,0,.6)" },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12,
    width: "100%", maxWidth: 420,
  },
  card: {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
    padding: "18px 16px", borderRadius: 16, cursor: "pointer", textAlign: "left",
    border: "1px solid rgba(255,255,255,.28)", background: "rgba(0,0,0,.34)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fff",
  },
  cardLabel: { fontSize: 18, fontWeight: 600, letterSpacing: ".01em" },
  cardSub: { fontSize: 12.5, opacity: 0.7 },
  skip: {
    marginTop: 8, padding: "12px 22px", borderRadius: 999, cursor: "pointer",
    border: "1px solid rgba(255,255,255,.34)", background: "rgba(0,0,0,.3)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    color: "rgba(255,255,255,.92)", fontSize: 14, letterSpacing: ".01em",
  },
};
