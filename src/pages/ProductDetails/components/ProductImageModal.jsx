import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  VStack,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Grid,
  IconButton,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const normalizeImages = (images) =>
  (images || []).map((img) =>
    typeof img === "string" ? { src: img, alt: "" } : img
  );

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const getDist = (t1, t2) => {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.hypot(dx, dy);
};

/**
 * ✅ Mobile: pinch zoom + pan + double tap
 * ✅ Laptop trackpad pinch: Ctrl+Wheel zoom
 * ❌ Normal mouse wheel scroll = NO zoom
 */
function ZoomableImage({ src, alt, onResetSignal }) {
  const containerRef = useRef(null);

  // scale: 1..4, x/y are translate values in px
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });

  const gRef = useRef({
    mode: null, // "pan" | "pinch" | "gesture" | null
    lastTapAt: 0,

    // pan
    panStartX: 0,
    panStartY: 0,
    panBaseX: 0,
    panBaseY: 0,

    // pinch (touch)
    pinchStartDist: 0,
    pinchStartScale: 1,

    // safari gesture
    gestureStartScale: 1,
  });

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, x: 0, y: 0 });
    gRef.current.mode = null;
  }, []);

  useEffect(() => {
    resetZoom();
  }, [onResetSignal, resetZoom]);

  const getBounds = useCallback((scale) => {
    const el = containerRef.current;
    if (!el) return { maxX: 0, maxY: 0 };
    const w = el.clientWidth;
    const h = el.clientHeight;
    const maxX = (w * (scale - 1)) / 2;
    const maxY = (h * (scale - 1)) / 2;
    return { maxX, maxY };
  }, []);

  const applyClampedPan = useCallback(
    (next) => {
      const { maxX, maxY } = getBounds(next.scale);
      return {
        ...next,
        x: clamp(next.x, -maxX, maxX),
        y: clamp(next.y, -maxY, maxY),
      };
    },
    [getBounds]
  );

  const toggleZoom = useCallback(() => {
    setZoom((prev) => {
      const nextScale = prev.scale > 1 ? 1 : 2;
      if (nextScale === 1) return { scale: 1, x: 0, y: 0 };
      return applyClampedPan({ ...prev, scale: nextScale });
    });
  }, [applyClampedPan]);

  /* -------------------------
     ✅ Prevent scroll ONLY when zooming/panning
     - touchmove: (mobile pinch/pan)
     - wheel: only when ctrlKey pinch (trackpad pinch)
     - gesture*: Safari pinch events
  -------------------------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 1) Mobile pinch/pan scroll-block
    const nativeTouchMove = (e) => {
      const mode = gRef.current.mode;
      if (zoom.scale > 1 || mode === "pinch" || mode === "pan") {
        e.preventDefault();
      }
    };

    // 2) Trackpad pinch zoom: wheel with ctrlKey=true
    const nativeWheel = (e) => {
      // ✅ Only react to trackpad pinch gesture
      // (Most browsers send pinch as ctrl+wheel)
      if (!e.ctrlKey) return;

      e.preventDefault(); // stop page zoom/scroll

      // deltaY: negative usually zoom in, positive zoom out (varies slightly)
      const delta = e.deltaY;

      // smooth step: tune as needed
      const step = clamp(-delta / 600, -0.35, 0.35);

      setZoom((prev) => {
        const nextScale = clamp(prev.scale + step, 1, 4);

        // back to 1 => reset pan
        if (nextScale === 1) return { scale: 1, x: 0, y: 0 };

        return applyClampedPan({ ...prev, scale: nextScale });
      });
    };

    // 3) Safari gesture events (optional but useful on some Macs)
    const onGestureStart = (e) => {
      // only if browser supports it
      e.preventDefault();
      gRef.current.mode = "gesture";
      gRef.current.gestureStartScale = zoom.scale;
    };

    const onGestureChange = (e) => {
      e.preventDefault();
      const base = gRef.current.gestureStartScale || 1;
      const nextScale = clamp(base * (e.scale || 1), 1, 4);

      setZoom((prev) => applyClampedPan({ ...prev, scale: nextScale }));
    };

    const onGestureEnd = (e) => {
      e.preventDefault();
      gRef.current.mode = null;

      setZoom((prev) => {
        if (prev.scale <= 1.02) return { scale: 1, x: 0, y: 0 };
        return applyClampedPan(prev);
      });
    };

    el.addEventListener("touchmove", nativeTouchMove, { passive: false });
    el.addEventListener("wheel", nativeWheel, { passive: false });

    // gesture events exist on Safari mostly
    el.addEventListener("gesturestart", onGestureStart, { passive: false });
    el.addEventListener("gesturechange", onGestureChange, { passive: false });
    el.addEventListener("gestureend", onGestureEnd, { passive: false });

    return () => {
      el.removeEventListener("touchmove", nativeTouchMove);
      el.removeEventListener("wheel", nativeWheel);

      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
      el.removeEventListener("gestureend", onGestureEnd);
    };
  }, [zoom.scale, applyClampedPan]);

  /* ----------------- Touch handlers (Mobile) ----------------- */
  const onTouchStart = (e) => {
    // Double tap (1 finger)
    if (e.touches.length === 1) {
      const now = Date.now();
      const last = gRef.current.lastTapAt;
      gRef.current.lastTapAt = now;

      if (now - last < 280) {
        toggleZoom();
        return;
      }
    }

    // Pinch start (2 fingers)
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      gRef.current.mode = "pinch";
      gRef.current.pinchStartDist = getDist(t1, t2);
      gRef.current.pinchStartScale = zoom.scale;
      return;
    }

    // Pan start (1 finger, only if zoomed)
    if (e.touches.length === 1 && zoom.scale > 1) {
      const t = e.touches[0];
      gRef.current.mode = "pan";
      gRef.current.panStartX = t.clientX;
      gRef.current.panStartY = t.clientY;
      gRef.current.panBaseX = zoom.x;
      gRef.current.panBaseY = zoom.y;
    } else {
      gRef.current.mode = null;
    }
  };

  const onTouchMove = (e) => {
    // Pinch move
    if (gRef.current.mode === "pinch" && e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const d = getDist(t1, t2);
      const startDist = gRef.current.pinchStartDist || d;

      const ratio = d / startDist;
      const nextScaleRaw = gRef.current.pinchStartScale * ratio;
      const nextScale = clamp(nextScaleRaw, 1, 4);

      setZoom((prev) => applyClampedPan({ ...prev, scale: nextScale }));
      return;
    }

    // Pan move
    if (gRef.current.mode === "pan" && e.touches.length === 1 && zoom.scale > 1) {
      const t = e.touches[0];
      const dx = t.clientX - gRef.current.panStartX;
      const dy = t.clientY - gRef.current.panStartY;

      setZoom((prev) =>
        applyClampedPan({
          ...prev,
          x: gRef.current.panBaseX + dx,
          y: gRef.current.panBaseY + dy,
        })
      );
    }
  };

  const onTouchEnd = (e) => {
    if (gRef.current.mode === "pinch" && e.touches.length < 2) {
      gRef.current.mode = null;
      setZoom((prev) => {
        if (prev.scale <= 1.02) return { scale: 1, x: 0, y: 0 };
        return applyClampedPan(prev);
      });
    }

    if (gRef.current.mode === "pan" && e.touches.length === 0) {
      gRef.current.mode = null;
      setZoom((prev) => applyClampedPan(prev));
    }
  };

  return (
    <Box
      ref={containerRef}
      w="100%"
      bg="white"
      overflow="hidden"
      cursor={zoom.scale > 1 ? "grab" : "zoom-in"}
      position="relative"
      userSelect="none"
      // ✅ scale==1 => allow vertical scroll
      // ✅ scale>1 => lock gestures
      touchAction={zoom.scale > 1 ? "none" : "pan-y"}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDoubleClick={toggleZoom} // desktop double click
    >
      <Image
        src={src}
        alt={alt}
        w="100%"
        h="auto"
        draggable={false}
        transform={`translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`}
        transformOrigin="center"
        transition={
          gRef.current.mode === "pinch" || gRef.current.mode === "pan" || gRef.current.mode === "gesture"
            ? "none"
            : "transform 120ms ease"
        }
        objectFit="contain"
        pointerEvents="none"
      />
    </Box>
  );
}

const ProductImageModal = ({ isOpen, onClose, images = [], startIndex = 0 }) => {
  const imgs = normalizeImages(images);

  const bigRefs = useRef([]);
  bigRefs.current = imgs.map((_, i) => bigRefs.current[i] ?? null);
  const rightScrollRef = useRef(null);
  const [active, setActive] = useState(startIndex ?? 0);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setActive(startIndex ?? 0);
    setResetSignal((n) => n + 1);

    const t = setTimeout(() => {
      bigRefs.current[startIndex ?? 0]?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);

    return () => clearTimeout(t);
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const container = rightScrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const idxAttr = visible.target.getAttribute("data-idx");
          if (idxAttr !== null) {
            setActive(parseInt(idxAttr, 10));
          }
        }
      },
      { root: container, threshold: [0.35, 0.6, 0.9] }
    );

    bigRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isOpen, imgs.length]);

  const scrollTo = (i) => {
    setActive(i);
    setResetSignal((n) => n + 1);
    bigRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!isOpen) return;
    setResetSignal((n) => n + 1);
  }, [active, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" closeOnOverlayClick motionPreset="none">
      <ModalOverlay />
      <ModalContent bg="white" maxW="100vw" h="100vh" borderRadius="0" px={{ base: "0", lg: "50px" }}>
        <ModalBody p={0} h="100%">
          <Grid templateColumns={{ base: "1fr", lg: "240px 1fr" }} h="full">
            {/* LEFT thumbnails */}
            <Box
              display={{ base: "none", lg: "block" }}
              overflowY="auto"
              className="scrollbar-hide"
              borderRight="1px solid"
              borderColor="gray.200"
              p={{ base: 0, lg: 6 }}
            >
              <VStack align="stretch" spacing={3}>
                {imgs.map((img, i) => {
                  const isActive = i === active;
                  return (
                    <Box
                      key={i}
                      as="button"
                      onClick={() => scrollTo(i)}
                      bg="gray.100"
                      border="1px solid"
                      borderColor={isActive ? "black" : "gray.200"}
                      _hover={{ borderColor: "black" }}
                    >
                      <Image src={img.src} alt={img.alt || `Thumbnail ${i + 1}`} objectFit="cover" w="full" h="full" />
                    </Box>
                  );
                })}
              </VStack>
            </Box>

            {/* RIGHT big images */}
            <Box
              ref={rightScrollRef}
              position="relative"
              overflowY="auto"
              className="scrollbar-hide"
              p={{ base: 0, lg: 6 }}
              bg="white"
            >
              <Box
                position="fixed"
                top={{ base: 4, lg: 7 }}
                right={{ base: 6, lg: 24 }}
                zIndex={30}
                display="flex"
                justifyContent="flex-end"
                pb={"2"}
                pr={"2"}
              >
                <IconButton
                  aria-label="Close"
                  icon={<CloseIcon boxSize={{ base: 3, lg: 4 }} />}
                  onClick={onClose}
                  borderRadius="full"
                  bg="gray.100"
                  border="1px solid"
                  borderColor="gray.300"
                  w={{ base: "40px", lg: "40px" }}
                  h={{ base: "40px", lg: "40px" }}
                  _hover={{ bg: "gray.100" }}
                  _active={{ bg: "gray.100" }}
                  _focus={{ boxShadow: "none" }}
                />
              </Box>

              <VStack align="stretch" spacing={6}>
                {imgs.map((img, i) => (
                  <Box
                    key={i}
                    data-idx={i}
                    ref={(el) => (bigRefs.current[i] = el)}
                    minH={{ base: "60vh", lg: "80vh" }}
                  >
                    <ZoomableImage
                      src={img.src}
                      alt={img.alt || `Image ${i + 1}`}
                      onResetSignal={`${resetSignal}-${i}`}
                    />
                  </Box>
                ))}
              </VStack>
            </Box>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProductImageModal;
