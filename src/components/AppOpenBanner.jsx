import { useEffect, useState, useRef } from "react";
import { Box, Container, HStack, Text, Button } from "@chakra-ui/react";

const ANDROID_STORE =
  "https://play.google.com/store/apps/details?id=com.sotbella.com";
const IOS_STORE =
  "https://apps.apple.com/in/app/sotbella-fashion/id6497331028";

export default function AppOpenBanner({ onVisibilityChange }) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const lastScrollY = useRef(0);
  const visibleRef = useRef(false); // ✅ IMPORTANT

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    if (!mobile) return;

    lastScrollY.current = window.scrollY;

    // ✅ Initial state
    setVisible(true);
    visibleRef.current = true;
    onVisibilityChange?.(true);

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // ⬇️ Scroll Down → Hide
      if (currentScroll > lastScrollY.current) {
        if (visibleRef.current) {
          setVisible(false);
          visibleRef.current = false;
          onVisibilityChange?.(false);
        }
      }

      // ⬆️ Scroll Up → Show (threshold 30px)
      else if (lastScrollY.current - currentScroll > 30) {
        if (!visibleRef.current) {
          setVisible(true);
          visibleRef.current = true;
          onVisibilityChange?.(true);
        }
      }

      lastScrollY.current = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [onVisibilityChange]); // ✅ FIXED

  if (!isMobile) return null;

  // ✅ Deep Linking
  const handleOpenApp = () => {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    let timeout;

    const storeRedirect = () => {
      if (isAndroid) window.location.href = ANDROID_STORE;
      else if (isIOS) window.location.href = IOS_STORE;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(timeout);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (isAndroid) {
      window.location.href =
        "intent://home#Intent;scheme=sotbella;package=com.sotbella.com;end";
    } else if (isIOS) {
      window.location.href = "sotbella://home";
    } else {
      window.location.href = ANDROID_STORE;
      return;
    }

    timeout = setTimeout(() => {
      if (document.visibilityState === "visible") {
        storeRedirect();
      }
    }, 1800);

    setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, 3000);
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      w="100%"
      zIndex={50}
      bg="black"
      color="white"
      borderBottom="1px solid rgba(255,255,255,0.1)"

      // 🎬 Smooth animation
      transform={visible ? "translateY(0)" : "translateY(-100%)"}
      opacity={visible ? 1 : 0}
      transition="transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease"
      willChange="transform, opacity"
    >
      <Container maxW="container.xl">
        <HStack justify="space-between" py={2}>
          <Box>
            <Text fontSize="xs" fontWeight="bold">
              Open in App for best experience
            </Text>
            <Text fontSize="10px" color="gray.300">
              Faster checkout & better performance
            </Text>
          </Box>

          <Button
            size="xs"
            bg="green.500"
            color="white"
            _hover={{ bg: "green.400" }}
            onClick={handleOpenApp}
          >
            Open App
          </Button>
        </HStack>
      </Container>
    </Box>
  );
}
