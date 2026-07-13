import { createPortal } from "react-dom";

const STORES = [
  { code: "US", title: "USA", label: "United States of America", url: "https://sotbella.us", flag: "🇺🇸" },
  { code: "GB", title: "UK", label: "United Kingdom", url: "https://sotbella.uk", flag: "🇬🇧" },
  { code: "AE", title: "UAE", label: "United Arab Emirates", url: "https://sotbella.ae", flag: "🇦🇪" },
];

export default function GeoModal({ geo, onClose }) {
  if (!geo) return null;

  const suggestedStore =
    STORES.find((s) => s.code === geo?.countryCode) || STORES[0];

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647,
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#fff",
          width: "100%",
          maxWidth: "680px",
          minHeight: "auto",
          maxHeight: "90vh",
          borderRadius: "16px",
          padding: "clamp(20px, 4vw, 30px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: "15px",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "12px",
            fontSize: "18px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <h2
          style={{
            fontSize: "clamp(16px, 2.8vw, 18px)",
            fontWeight: 800,
            lineHeight: 1.4,
            margin: 0,
            paddingRight: "24px",
          }}
        >
          WELCOME TO SOTBELLA.COM
        </h2>

        <p
          style={{
            color: "#555",
            fontSize: "clamp(11px, 2.5vw, 13px)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          You are visiting us from <b>{suggestedStore.label}</b>, <br />
          Would you like to go to our{" "}
          <b>
            <i>{suggestedStore.title}</i>
          </b>{" "}
          site?
        </p>

        <button
          onClick={() => (window.location.href = suggestedStore.url)}
          style={{
            width: "100%",
            maxWidth: "420px",
            marginTop: "10px",
            padding: "12px 16px",
            background: "#000",
            color: "#fff",
            borderRadius: "8px",
            cursor: "pointer",
            border: "none",
            fontSize: "clamp(14px, 2.5vw, 16px)",
            fontWeight: 500,
          }}
        >
          Continue with {suggestedStore.title}
        </button>

        <div
          style={{
            margin: "12px 0",
            fontSize: "12px",
            color: "#888",
          }}
        >
          OR
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {STORES
            .filter((s) => s.code !== suggestedStore.code)
            .map((s) => (
              <button
                key={s.code}
                onClick={() => (window.location.href = s.url)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  border: "1px solid #000",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#fff",
                  minWidth: "120px",
                  flex: "1 1 140px",
                  maxWidth: "170px",
                  fontSize: "clamp(13px, 2.3vw, 13px)",
                }}
              >
                {/* <span>{s.flag}</span> */}
                <span>{s.label}</span>
              </button>
            ))}
        </div>
      </div>
    </div>,
    document.body
  );
}