import React, { useMemo } from "react";
import { Modal } from "antd";
import Lottie from "lottie-react";
import { LoaderAnimation } from "@/assets/animation";
import { Box, Heading, Text } from "@chakra-ui/react";

const LottieModal = ({
  isOpen = false,
  onClose = () => {},
  animationData = LoaderAnimation,
  title = "Loading",
  subtitle = "",
}) => {
  const memoizedAnimationData = useMemo(() => animationData, [animationData]);

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      closable={false}
      maskClosable
      styles={{ body: { textAlign: "center", padding: "24px 16px" }, mask: { backgroundColor: "rgba(0, 0, 0, 0.4)" } }}
      destroyOnHidden
    >
      <Box maxW="200px" mx="auto">
        <Lottie animationData={memoizedAnimationData} loop />
      </Box>

      <Heading as="h2" fontSize="18px" fontWeight={600} mt={4}>
        {title}
      </Heading>

      {subtitle && (
        <Text color="#555" mt={2}>
          {subtitle}
        </Text>
      )}
    </Modal>
  );
};

export default LottieModal;
