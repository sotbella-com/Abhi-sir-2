import React from 'react';
import { Box, Skeleton, VStack, HStack, Container } from '@chakra-ui/react';

const HomepageShimmer = () => {
  return (
    <Box w="100%" minH="100vh" bg="gray.50">
      {/* Navbar Shimmer */}
      <Box bg="white" p={4} borderBottom="1px" borderColor="gray.200">
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Box height="30px" width="30px" display={{ base: "block", md: "none" }} className='shimmer' />
            <Box className='shimmer' height="32px" width="120px" display={{ base: "block", md: "none" }} />
            <HStack spacing={2} display={{ base: "none", md: "flex" }}>
              <Box className='shimmer' height="30px" width="30px" borderRadius="" />
              <Box className='shimmer' height="30px" width="80px" borderRadius="" />
              <Box className='shimmer' height="30px" width="80px" borderRadius="" />
              <Box className='shimmer' height="30px" width="80px" borderRadius="" />
            </HStack>
            <HStack spacing={4} display={{ base: "none", md: "block" }}>
              <Box className='shimmer' height="32px" width="100px" />
            </HStack>
            <HStack spacing={2}>
              <Box className='shimmer' height="30px" width="30px" borderRadius="full" />
              <Box className='shimmer' height="30px" width="30px" borderRadius="full" />
              <Box className='shimmer' height="30px" width="30px" borderRadius="full" />
              <Box className='shimmer' height="30px" width="30px" borderRadius="full" />
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Hero Section Shimmer */}
      <Box h="100vh" position="relative">
        <Box className='shimmer' height="100%" />
        <Box position="absolute" bottom="20%" left="50%" transform="translateX(-50%)">
          <VStack spacing={4}>
            <Box className='shimmer' height="40px" width="200px" />
          </VStack>
        </Box>
      </Box>

      {/* Section 1 Shimmer */}
      <Box h="100vh" p={8}>
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Box className='shimmer' height="40px" width="300px" />
            <HStack spacing={4} w="100%" overflow="hidden">
              {[...Array(4)].map((_, i) => (
                <Box className='shimmer' key={i} height="400px" width="300px" flexShrink={0} />
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Section 2 Shimmer */}
      <Box h="100vh" p={8} bg="gray.50">
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Box className='shimmer' height="40px" width="250px" />
            <HStack spacing={4} w="100%" overflow="hidden">
              {[...Array(6)].map((_, i) => (
                <Box className='shimmer' key={i} height="300px" width="200px" flexShrink={0} />
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Section 3 Shimmer */}
      <Box h="100vh" p={8}>
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Box className='shimmer' height="40px" width="350px" />
            <HStack spacing={4} w="100%" overflow="hidden">
              {[...Array(5)].map((_, i) => (
                <Box className='shimmer' key={i} height="350px" width="280px" flexShrink={0} />
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Section 4 Shimmer */}
      <Box h="100vh" p={8} bg="gray.50">
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Box className='shimmer' height="40px" width="280px" />
            <HStack spacing={4} w="100%" overflow="hidden">
              {[...Array(4)].map((_, i) => (
                <Box className='shimmer' key={i} height="400px" width="300px" flexShrink={0} />
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Section 5 Shimmer */}
      <Box h="100vh" p={8}>
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Box className='shimmer' height="40px" width="320px" />
            <HStack spacing={4} w="100%" overflow="hidden">
              {[...Array(6)].map((_, i) => (
                <Box className='shimmer' key={i} height="300px" width="200px" flexShrink={0} />
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Footer Shimmer */}
      <Box bg="white" p={8}>
        <Container maxW="container.xl">
          <VStack spacing={6}>
            <HStack spacing={8} w="100%" justify="space-between">
              {[...Array(4)].map((_, i) => (
                <VStack key={i} align="start" spacing={2}>
                  <Box className='shimmer' height="20px" width="100px" />
                  <Box className='shimmer' height="16px" width="80px" />
                  <Box className='shimmer' height="16px" width="80px" />
                  <Box className='shimmer' height="16px" width="80px" />
                </VStack>
              ))}
            </HStack>
            <Box className='shimmer' height="40px" width="200px" />
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomepageShimmer;
