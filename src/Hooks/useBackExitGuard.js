import { useCallback, useEffect, useRef, useState } from "react";

export function useBackExitGuard({
  enabled = true,
} = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const allowBackRef = useRef(false);
  const openedByBackRef = useRef(false);

  const openModal = useCallback(() => {
    openedByBackRef.current = false;
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const confirmExit = useCallback(() => {
    allowBackRef.current = true;
    setIsOpen(false);

    if (openedByBackRef.current) {
      // Browser back triggered → go back 2
      window.history.go(-2);
    } else {
      // Manual open → normal back
      window.history.go(-1);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.history.pushState({ __exitGuard: true }, "", window.location.href);

    const onPopState = () => {

      // ✅ NEW: Skip once (used by Stripe cancel)
      if (window.__SKIP_EXIT_GUARD_ONCE__) {
        window.__SKIP_EXIT_GUARD_ONCE__ = false;
        return;
      }

      if (allowBackRef.current) return;

      openedByBackRef.current = true;
      setIsOpen(true);

      window.history.pushState({ __exitGuard: true }, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled]);

  return {
    isExitModalOpen: isOpen,
    openExitModal: openModal,
    closeExitModal: closeModal,
    confirmExit,
  };
}