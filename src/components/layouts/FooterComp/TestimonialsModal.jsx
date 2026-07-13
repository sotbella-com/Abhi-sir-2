import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

function ensurePortalRoot(id = "custom-modal-root") {
  let root = document.getElementById(id);
  if (!root) {
    root = document.createElement("div");
    root.id = id;
    document.body.appendChild(root);
  }
  return root;
}

function ensureStylesInjected() {
  const STYLE_ID = "__custom_modal_styles__";
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes customModalFadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes customModalScaleIn {
      from { transform: translate(-50%, -50%) scale(0.98); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function getFocusable(container) {
  if (!container) return [];
  const selectors = [
    "a[href]",
    "area[href]",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "iframe",
    "object",
    "embed",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable]",
  ];
  return Array.from(container.querySelectorAll(selectors.join(","))).filter(
    (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
  );
}

function useLockBodyScroll(lock, preserveScrollBarGap = true) {
  useEffect(() => {
    if (!lock) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollBarGap =
      window.innerWidth - document.documentElement.clientWidth;

    // Save previous inline styles to restore later
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
      overscrollBehavior: document.body.style.overscrollBehavior,
    };

    // Lock html to hide scrollbar; lock body with fixed positioning
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain"; // prevent bounce on iOS
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.width = "100%";

    if (preserveScrollBarGap && scrollBarGap > 0) {
      // Use padding-right so layout doesn't shift when scrollbar disappears
      document.body.style.paddingRight = `${scrollBarGap}px`;
    }

    return () => {
      // Restore styles
      document.documentElement.style.overflow = prev.htmlOverflow || "";
      document.body.style.overscrollBehavior = prev.overscrollBehavior || "";
      document.body.style.position = prev.position || "";
      document.body.style.top = prev.top || "";
      document.body.style.left = prev.left || "";
      document.body.style.width = prev.width || "";
      document.body.style.paddingRight = prev.paddingRight || "";
      document.body.style.overflow = prev.bodyOverflow || "";

      // Restore scroll
      const y = Math.abs(parseInt(document.body.style.top || "0", 10)) || scrollY;
      window.scrollTo(0, y);
    };
  }, [lock, preserveScrollBarGap]);
}

export default function TestimonialsModal({
  isOpen,
  onClose,
  children,
  closeOnOverlay = true,
  zIndex = 2000,
  centered = true,
  maxWidth,
  height,
  width,
  preserveScrollBarGap = true,
  initialFocusRef,
  ariaLabel,
  titleId,
  ...kwargs
}) {
  const portalRoot = ensurePortalRoot();
  ensureStylesInjected();

  const contentRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useLockBodyScroll(isOpen, preserveScrollBarGap);

  // Focus trap + ESC to close
  useEffect(() => {
    if (!isOpen) return;

    lastFocusedRef.current = document.activeElement;

    const focusTarget =
      initialFocusRef?.current || getFocusable(contentRef.current)[0];
    if (focusTarget) focusTarget.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === "Tab") {
        const nodes = getFocusable(contentRef.current);
        if (!nodes.length) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const current = document.activeElement;

        if (e.shiftKey) {
          if (current === first || !contentRef.current.contains(current)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (current === last || !contentRef.current.contains(current)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      const prev = lastFocusedRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    animation: "customModalFadeIn 120ms ease-out",
    zIndex,
    // Prevent touch scrolling on overlay area (outside modal)
    touchAction: "none",
  };

  const wrapperStyle = centered
    ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    : { position: "fixed", top: "10vh", left: "50%", transform: "translateX(-50%)" };

  const contentStyle = {
    ...wrapperStyle,
    width: width || "clamp(320px, 70vw, 820px)",
    maxWidth: maxWidth || "95vw",
    height,
    maxHeight: "80vh",
    background: "#fff",
    boxShadow: "0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.06)",
    overflow: "hidden",
    animation: "customModalScaleIn 140ms ease-out",
    zIndex: zIndex + 1,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
  };

  const closeBtnStyle = {
    position: "absolute",
    top: 10,
    right: 10,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
  };

  const modalNode = (
    <>
      <div
        style={overlayStyle}
        onClick={(e) => {
          e.stopPropagation();
          if (closeOnOverlay) onClose?.();
        }}
        // Guard wheel/touch on overlay in case any browser passes it through
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        ref={contentRef}
        style={contentStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          style={closeBtnStyle}
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
        {/* Modal content area (scrolls independently) */}
        <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalNode, portalRoot);
}
