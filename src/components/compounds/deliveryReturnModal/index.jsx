import React, { useEffect } from "react";
import { Modal } from "antd";
import {
  Box,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  Stack,
} from "@chakra-ui/react";

const DeliveryReturnModal = ({ isOpen, onClose }) => {
  // 🔒 Lock scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY =
      window.scrollY || window.pageYOffset || 0;

    // save previous inline styles
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      // restore styles
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;

      // restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      title="Delivery & Returns"
    >
      <Box fontSize="sm" mt={6}> 
        <Stack spacing={4}>
          {/* Delivery */}
          <Box border="1px solid #E5E5E5"
            bg="#fafafaff"
            borderRadius="12px"
            p={3}  >
            <Heading
              as="h3"
              fontSize={{ base: "lg", md: "xl" }}
              mb={2}
            >
              Delivery
            </Heading>
            <Text mt={1}>Delivery: <Text as="strong">3–7 business days with real-time tracking. </Text></Text>
            <Text mt={1}>Real time tracking available via your Sotbella account.</Text>
          </Box>

          {/* Return & Exchange Policy */}
          <Box border="1px solid #E5E5E5"
            bg="#fafafaff"
            borderRadius="12px"
            p={3}>
            <Heading
              as="h3"
              fontSize={{ base: "lg", md: "xl" }}
              mb={2}
            >
              Return &amp; Exchange Policy
            </Heading>
            <Text mt={1}>3-day return & 7-day exchange from the date of delivery.</Text>
            <Text mt={1}>Items must be unused and in original packaging.</Text>
            <Text mt={1}>Refunds are processed within 7–10 business days after inspection.</Text>

            {/* <UnorderedList styleType="disc" pl={5} mt={5} spacing={1}>
              <ListItem>Size issue</ListItem>
              <ListItem>Faulty products</ListItem>
            </UnorderedList> */}
          </Box>

          {/* Note
          <Text fontSize="xs">
            Note: Sale or hygiene-sensitive items may not qualify for return or exchange
          </Text> */}
        </Stack>
      </Box>
    </Modal>
  );
};

export default DeliveryReturnModal;
