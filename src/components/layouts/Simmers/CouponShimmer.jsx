import { Box } from "@chakra-ui/react";

// Reusable shimmer skeleton component
const CouponShimmer = ({ count = 5 }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={4}
      padding="10px"
      width="100%"
      border="1px solid" borderColor="blackAlpha.200" px={5} py={4}
    >
      {[...Array(count)].map((_, index) => (
        <Box
          key={index}
          backgroundSize="200% 100%"
          height="40px"
          marginBottom="10px"
          className="shimmer"
        />
      ))}
    </Box>
  );
};

export default CouponShimmer;
