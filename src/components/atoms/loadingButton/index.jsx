import React from "react";
import { Button, Spinner } from "@chakra-ui/react";

const LoadingButton = ({
  text = "Submit",
  isLoading = false,
  fullWidth = true,
  disabled = false,
  loadingText = "Loading...",
  type = "button",
  onClick = () => { },
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      type={type}
      isDisabled={disabled || isLoading || props.disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      spinnerPlacement="start"
      fontSize={{ base: "sm", md: "md" }}
      fontWeight="normal"
      textTransform="uppercase"
      borderRadius="none"
      transition="background-color 0.2s ease"
      w={fullWidth ? "full" : "auto"}
      bg={disabled || isLoading ? "blackAlpha.500" : "black"}
      color={disabled || isLoading ? "black" : "white"}
      _hover={disabled || isLoading ? {} : { bg: "gray.900" }}
      _disabled={{ bg: "#E4E4E4", color: "blackAlpha.800", cursor: "not-allowed", opacity: 1 }}
      {...props}
    >
      {text}
    </Button>
  );
};

export default LoadingButton;
