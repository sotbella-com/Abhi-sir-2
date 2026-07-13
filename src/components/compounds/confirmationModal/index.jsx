import React, { useEffect } from "react";
import { Modal } from "antd";
import { LoadingButton } from "@/components/atoms";
import { Box, Heading, Text, HStack, Button } from "@chakra-ui/react";

const ConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  subtitle = "This action cannot be undone.",
  isLoading = false,
}) => {
  // 🔒 Scroll lock while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY || 0;

    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlScrollBehavior: document.documentElement.style.scrollBehavior,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
    };

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    const stopTouch = (e) => e.preventDefault();
    document.addEventListener("touchmove", stopTouch, { passive: false });

    return () => {
      document.removeEventListener("touchmove", stopTouch);

      document.documentElement.style.overflow = prev.htmlOverflow;
      document.documentElement.style.scrollBehavior = prev.htmlScrollBehavior;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.width = prev.bodyWidth;
      document.body.style.overflow = prev.bodyOverflow;

      const y = Math.abs(parseInt(prev.bodyTop || "0", 10)) || scrollY;
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      styles={{ mask: { backgroundColor: "rgba(0, 0, 0, 0.4)" } }}
      maskClosable
      destroyOnHidden
    >
      <Heading as="h2" size="md" mb="2" w={"97%"}>
        {title}
      </Heading>

      <Text color="#555" mb="6">
        {subtitle}
      </Text>

      <HStack justify="flex-end" spacing="3">
        <Button
          onClick={onCancel}
          bg="#f0f0f0"
          color="#333"
          _hover={{ bg: "#d9d9d9" }}
          rounded={"0"}
        >
          Cancel
        </Button>

        <LoadingButton
          text="Confirm"
          onClick={onConfirm}
          fullWidth={false}
          isLoading={isLoading}
        />
      </HStack>
    </Modal>
  );
};

export default ConfirmationModal;
