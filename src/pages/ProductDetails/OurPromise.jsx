import React from "react";
import {
  Box,
  Grid,
  GridItem,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LockIcon, RepeatIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { FaTruck } from "react-icons/fa";

const promiseItems = [
  {
    title: "Secure Payment",
    // subtitle: "256-bit SSL",
    icon: <LockIcon boxSize="18px" />,
  },
  {
    title: "Free Shipping",
    // subtitle: "Orders ₹ 1000+",
    icon: <FaTruck size={16} />,
  },
  {
    title: "Easy Returns",
    // subtitle: "7 days",
    icon: <RepeatIcon boxSize="18px" />,
  },
  {
    title: "Authenticity",
    subtitle: "Guaranteed",
    icon: <CheckCircleIcon boxSize="18px" />,
  },
];

export default function OurPromise() {
  return (
    <Box w="full">
      {/* Title like screenshot */}
      <Text
        letterSpacing="0.18em"
        fontSize="10px"
        fontWeight="700"
        mb={2}
        textTransform="uppercase"
      >
        Your VIP Privileges
      </Text>

      {/* 2x2 grid */}
      <Grid
        templateColumns={"repeat(2, 1fr)"}
        gap={{ base: 2, sm: 3 }}
      >
        {promiseItems.map((item, i) => (
          <GridItem key={i}>
            <HStack
              w="full"
              align="center"
              spacing={3}
              bg="white"
              border="1px solid"
              borderColor="blackAlpha.200"
              rounded="10px"
              p={{ base: 2, md: 3 }}
              boxShadow="0 1px 0 rgba(0,0,0,0.02)"
            >
              {/* Icon circle */}
              <Box
                w="32px"
                h="32px"
                rounded="full"
                border="1px solid"
                borderColor="blackAlpha.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="blackAlpha.800"
                bg="white"
                boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                flexShrink={0}
              >
                {item.icon}
              </Box>

              {/* Text */}
              <VStack spacing="2px" align="start" lineHeight="1.1">
                <Text fontWeight="700" fontSize={{ base: "10px", md: "11px" }}>
                  {item.title}
                </Text>
                <Text
                  fontWeight="500"
                  fontSize={{ base: "9px", md: "10px" }}
                  color="blackAlpha.900"
                >
                  {item.subtitle}
                </Text>
              </VStack>
            </HStack>
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
}
