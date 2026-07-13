import React from "react";
import { HStack, Button, Text } from "@chakra-ui/react";

const ChakraPagination = ({
  currentPage,
  totalPages,
  onChange,
  windowSize = 10,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  // compute sliding window
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const Btn = ({ page }) => (
    <Button
      key={page}
      onClick={() => onChange(page)}
      size="sm"
      variant="ghost"
      borderRadius="full"
      minW="24px"
      h="24px"
      fontSize={"xs"}
      px="0"
      _focus={{ boxShadow: "none" }}
      _active={{ boxShadow: "none" }}
      bg={page === currentPage ? "black" : "transparent"}
      color={page === currentPage ? "white" : "black"}
      _hover={{
        bg: page === currentPage ? "black" : "blackAlpha.100",
        color: page === currentPage ? "white" : "black",
      }}
    >
      {page}
    </Button>
  );

  return (
    <HStack spacing={3}>
      {/* Prev */}
      <Button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        isDisabled={currentPage === 1}
        variant="link"
        color="black"
        fontSize={"sm"}
        _focus={{ boxShadow: "none" }}
        _hover={{ textDecoration: "underline", color: "black" }}
      >
        PREV
      </Button>

      {/* First + leading ellipsis */}
      {start > 1 && (
        <>
          <Btn page={1} />
          {start > 2 && <Text color="black">…</Text>}
        </>
      )}

      {/* Window */}
      {pages.map((p) => (
        <Btn key={p} page={p} />
      ))}

      {/* trailing ellipsis + last */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <Text color="black">…</Text>}
          <Btn page={totalPages} />
        </>
      )}

      {/* Next */}
      <Button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        isDisabled={currentPage === totalPages}
        variant="link"
        color="black"
        fontSize={"sm"}
        _focus={{ boxShadow: "none" }}
        _hover={{ textDecoration: "underline", color: "black" }}
      >
        NEXT
      </Button>
    </HStack>
  );
};

export default ChakraPagination;
