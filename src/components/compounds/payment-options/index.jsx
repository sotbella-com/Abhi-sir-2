import React, { useEffect } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  get_available_payment_methods,
  remove_payment_instrument,
} from "@/api/services/sfccCheckout";
import { useUnifiedCartStore } from "@/context";
import { ShimmerShippingMethods } from "@/components/layouts/Simmers/ShimmerCheckout";

/* ============ black/white inline radio ============ */
const RadioBW = ({ name, value, checked, onChange, disabled }) => {
  const labelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    userSelect: "none",
    opacity: disabled ? 0.6 : 1,
  };
  const inputStyle = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    pointerEvents: "none",
  };
  const ringStyle = {
    width: 16,
    height: 16,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: "50%",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: checked ? "#000" : "transparent",
    transform: checked ? "scale(1)" : "scale(0.1)",
    transition: "transform 120ms ease-in-out, background 120ms ease-in-out",
  };

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  return (
    <label style={labelStyle}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        style={inputStyle}
      />
      <span style={ringStyle}>
        <span style={dotStyle} />
      </span>
    </label>
  );
};
/* ===================================================================== */

/**
 * Props:
 * - basketId (string)           // REQUIRED to call SFCC API
 * - paymentMethod (string)      // currently selected method id
 * - wallet (boolean)            // wallet was used
 * - remainingAmount (number)    // amount left after wallet application
 * - setPaymentMethod (fn)       // setter from parent
 */
const PaymentOptions = ({
  basketId,
  paymentMethod,
  wallet,
  remainingAmount,
  setPaymentMethod,
  paymentInstrumentId,
  isHidden,
  selectedAddress,
}) => {
  const { forceReinitializeCart, refreshCartFromAPI } = useUnifiedCartStore();

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["payment-methods", { basketId }],
    queryFn: get_available_payment_methods,
    enabled: !!basketId,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // ✅ prevents auto refetch
  });

  useEffect(() => {
    if (!basketId || paymentMethod !== "WALLET") return;

    const handleRemove = async () => {
      try {
        const result = await remove_payment_instrument({
          basketId,
          paymentInstrumentId,
        });
        console.log("Removed successfully:", result);
      } catch (err) {
        console.error("Error removing payment instrument:", err);
      }
    };

    handleRemove();
  }, [basketId, paymentMethod]);

  useEffect(() => {
    if (
      isError &&
      (error?.code === "BASKET_NOT_FOUND" ||
        /BASKET_NOT_FOUND/.test(String(error?.message)))
    ) {
      forceReinitializeCart()
        .then(() => refreshCartFromAPI())
        .catch(() => {
          /* ignore */
        });
    }
  }, [isError, error]);

  const mostReturnPincodes = [
    "711403",
    "282001",
    "380015",
    "395007",
    "248001",
    "134109",
    "400097",
    "411048",
    "518002",
    "641035",
    "801503",
    "400102",
    "401107",
    "132103",
    "560102",
    "452001",
    "400053",
    "492001",
    "302019",
  ];
  const postalCode = selectedAddress?.postalCode;

  // const methods = data?.methods || [];
  const methods = (
    isHidden === "true"
      ? (data?.methods || []).filter((method) => method.id === "BREEZE")
      : data?.methods || []
  ).filter(
    (method) =>
      !(mostReturnPincodes.includes(postalCode) && method.id === "COD"),
  );

  // Disable rules:
  const isDisabledFor = (methodId) => {
    const isCod = String(methodId).toUpperCase() === "COD";
    if (isCod) return !!wallet;
    return !!wallet && Number(remainingAmount) === 0;
  };

  const handleRadioChange = (value) => {
    if (isDisabledFor(value)) return;
    setPaymentMethod(value);
  };

  // Auto-pick default
  useEffect(() => {
    if (!methods.length) return;

    // If already selected, don't override
    if (paymentMethod) return;

    const defaultMethod =
      methods.find((m) => m.default) ||
      methods.find((m) => !isDisabledFor(m.id)) ||
      methods[0];

    if (defaultMethod) {
      setPaymentMethod(defaultMethod.id);
    }
  }, [methods, paymentMethod]);

  return (
    <>
      <Text
        as="h6"
        textTransform="uppercase"
        fontWeight="normal"
        mt={4}
        mb={2}
        fontSize={{ base: "sm", lg: "md" }}
      >
        Payment method
      </Text>

      <Box w="full">
        {/* ===== Loading / Error / Empty (keep inside one box too) ===== */}
        {isFetching && <ShimmerShippingMethods />}

        {isError && (
          <Box
            w="full"
            borderWidth={{ base: "1.5px", lg: "1px" }}
            borderColor={{ base: "black", lg: "#888888" }}
            borderRadius={{ base: "lg", lg: 0 }}
            boxShadow={{
              base: "0 0 14px rgba(0, 0, 0, 0.24)",
              lg: "none",
            }}
            p={{ base: 3, lg: 4 }}
          >
            <Text fontSize="sm" color="red.600">
              Failed to load payment methods. {String(error?.message || "")}
            </Text>
          </Box>
        )}

        {!isFetching && !isError && methods.length === 0 && (
          <Box
            w="full"
            borderWidth={{ base: "1.5px", lg: "1px" }}
            borderColor={{ base: "black", lg: "#888888" }}
            borderRadius={{ base: "lg", lg: 0 }}
            boxShadow={{
              base: "0 0 14px rgba(0, 0, 0, 0.24)",
              lg: "none",
            }}
            p={{ base: 3, lg: 4 }}
          >
            <Text fontSize="sm" color="gray.700">
              No payment methods available for this basket.
            </Text>
          </Box>
        )}

        {/* ===== Methods ===== */}
        {!isFetching && !isError && methods.length > 0 && (
          <>
            {/* ✅ MOBILE: one container box like Shipping method */}
            <Box
              display={{ base: "block", lg: "none" }}
              // borderWidth="1.5px"
              // borderColor="black"
              // borderRadius="lg"
              // boxShadow="0 0 14px rgba(0, 0, 0, 0.24)"
              overflow="hidden"
            >
              {methods.map((m) => {
                const disabled = isDisabledFor(m.id);
                const isChecked = paymentMethod === m.id;

                return (
                  <Box
                    key={m.id}
                    px="12px"
                    // py="12px"
                    cursor={disabled ? "not-allowed" : "pointer"}
                    opacity={disabled ? 0.6 : 1}
                    onClick={() => !disabled && handleRadioChange(m.id)}
                  >
                    <Flex align="start">
                      <RadioBW
                        name="radioPaymentMethod"
                        value={m.id}
                        checked={isChecked}
                        disabled={disabled}
                        onChange={() => handleRadioChange(m.id)}
                      />

                      <Box ml={3} mt={-1}>
                        <Text
                          fontSize="sm"
                          mb={0}
                          fontWeight={isChecked ? "600" : "400"}
                        >
                          {m.name || m.id}
                        </Text>

                        <Box
                          fontSize="12px"
                          lineHeight={5}
                          color="#3d3d3d"
                          fontStyle={"italic"}
                        >
                          <Text
                            fontSize="12px"
                            color="#3d3d3d"
                            fontStyle="italic"
                          >
                            {m.description}
                          </Text>
                        </Box>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </Box>

            {/* ✅ DESKTOP: keep your existing cards (separate boxes) */}
            <Box display={{ base: "none", lg: "block" }}>
              <Flex wrap="wrap" gap={1}>
                {methods.map((m) => {
                  const disabled = isDisabledFor(m.id);
                  const isChecked = paymentMethod === m.id;

                  return (
                    <Box
                      key={m.id}
                      w="full"
                      display="flex"
                      p={{ base: 2, lg: 4 }}
                      borderWidth={{ base: "1.5px", lg: "1px" }}
                      borderColor={{ base: "black", lg: "#888888" }}
                      borderRadius={{ base: "lg", lg: 0 }}
                      boxShadow={{
                        base: "0 0 14px rgba(0, 0, 0, 0.24)",
                        lg: "none",
                      }}
                      cursor={disabled ? "not-allowed" : "pointer"}
                      opacity={disabled ? 0.6 : 1}
                      onClick={() => !disabled && handleRadioChange(m.id)}
                    >
                      <Flex align="center" w="full">
                        <RadioBW
                          name="radioPaymentMethod"
                          value={m.id}
                          checked={isChecked}
                          disabled={disabled}
                          onChange={() => handleRadioChange(m.id)}
                        />

                        <Box ml={3}>
                          <Text
                            fontSize="14px"
                            fontWeight="normal"
                            lineHeight="22px"
                            textAlign="left"
                            color="black"
                          >
                            {m.name || m.id}
                          </Text>
                          <Text
                            fontSize="12px"
                            color="#3d3d3d"
                            fontStyle="italic"
                          >
                            {m.description}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </Flex>
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default PaymentOptions;
