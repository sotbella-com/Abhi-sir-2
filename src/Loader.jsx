import React from "react";
import { Center, Spinner } from "@chakra-ui/react";

const Loader = () => {
  return (
    <Center w="100%" py={6}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="lg"
      />
    </Center>
  );
};

export default Loader;

