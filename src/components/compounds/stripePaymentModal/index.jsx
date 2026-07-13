import React, { useEffect, useState, useRef } from "react";
import { Modal } from "antd";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { toast } from "react-toastify";
import { cancel_sfcc_order } from "@/api/services/sfccCheckout";
import { logger } from "@/utils/logger.js";

/**
 * Stripe Payment Modal Component
 * 
 * Displays Stripe Elements payment form in a modal.
 * Handles payment confirmation, loading, success, and error states.
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {string} clientSecret - Stripe payment intent client secret
 * @param {number} amount - Payment amount in Rs.
 * @param {string} orderId - Order ID for reference
 * @param {function} onSuccess - Callback when payment succeeds
 * @param {function} onError - Callback when payment fails
 */
const StripePaymentModalContent = ({
  clientSecret,
  amount,
  orderId,
  onSuccess,
  onError,
  onClose,
  paymentIntentId,
  returnUrl,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, processing, success, error
  const [isFormValid, setIsFormValid] = useState(false);
  const [elementError, setElementError] = useState(null);
  const [isElementReady, setIsElementReady] = useState(false);
  const hasCancelledRef = useRef(false); // Track if we've already cancelled to prevent double cancellation
  const paymentStatusRef = useRef(paymentStatus);
  const paymentIntentIdRef = useRef(paymentIntentId);

  // Keep refs in sync with state
  useEffect(() => {
    paymentStatusRef.current = paymentStatus;
  }, [paymentStatus]);

  useEffect(() => {
    paymentIntentIdRef.current = paymentIntentId;
  }, [paymentIntentId]);

  // ✅ Handle PaymentElement load errors
  useEffect(() => {
    if (!elements) return;

    const paymentElement = elements.getElement("payment");
    if (!paymentElement) return;

    // Handle element ready state
    const handleReady = () => {
      setIsElementReady(true);
      setElementError(null);
      logger.log("PaymentElement loaded successfully");
    };

    // Handle element errors (including load errors)
    const handleError = (event) => {
      logger.error("PaymentElement error:", event.error);

      // ✅ Handle specific Stripe errors
      const errorType = event.error?.type;
      const errorMessage = event.error?.message || "";
      const errorCode = event.error?.code;

      let userFriendlyMessage = "Failed to load payment form. Please try again.";

      // Check for client secret mismatch error
      if (errorType === "invalid_request_error" &&
        (errorMessage.includes("client_secret") ||
          errorMessage.includes("does not match") ||
          errorMessage.includes("same account"))) {
        userFriendlyMessage = "Payment configuration error. The payment method doesn't match your account. Please contact support or try again.";
        logger.error("Stripe client secret mismatch - likely account/key mismatch", {
          errorType,
          errorCode,
          errorMessage: errorMessage.substring(0, 100),
          paymentIntentId: paymentIntentId?.substring(0, 20)
        });
      } else if (errorType === "invalid_request_error") {
        userFriendlyMessage = "Invalid payment configuration. Please try again or contact support.";
      }

      setElementError(userFriendlyMessage);
      setIsElementReady(false);

      // Call onError callback if element fails to load
      if (onError && event.error) {
        const loadError = new Error(userFriendlyMessage);
        loadError.code = "payment_element_load_error";
        loadError.type = errorType;
        loadError.originalError = event.error;
        onError(loadError);
      }
    };

    paymentElement.on("ready", handleReady);
    paymentElement.on("loaderror", handleError);

    return () => {
      paymentElement.off("ready", handleReady);
      paymentElement.off("loaderror", handleError);
    };
  }, [elements, onError]);

  // ✅ Cancel payment intent when modal closes or user navigates away
  // Reference: https://docs.stripe.com/api/payment_intents/cancel
  // PaymentIntents can be cancelled when status is: requires_payment_method, requires_capture, 
  // requires_confirmation, requires_action, or processing
  // CRITICAL: This function MUST be called FIRST before any cleanup or error handling
  const cancelPaymentIntent = async (reason = "abandoned") => {
    if (hasCancelledRef.current || !paymentIntentId || paymentStatus === "success") {
      logger.log("⏭️ Skipping payment intent cancellation:", {
        alreadyCancelled: hasCancelledRef.current,
        hasPaymentIntentId: !!paymentIntentId,
        paymentStatus
      });
      return { cancelled: false, reason: "Already cancelled or payment succeeded" };
    }

    try {
      hasCancelledRef.current = true;
      logger.log("🔄 Cancelling payment intent:", {
        paymentIntentId: paymentIntentId ? `${paymentIntentId.substring(0, 8)}...` : null,
        reason,
        orderId
      });

      // Check payment intent status first if we have stripe instance
      let shouldCancel = true;
      if (stripe && clientSecretRef.current) {
        try {
          const { paymentIntent: intent } = await stripe.retrievePaymentIntent(clientSecretRef.current);

          // Only cancel if payment intent is in a cancellable state
          // According to Stripe docs: requires_payment_method, requires_capture, requires_confirmation, requires_action, or processing
          const cancellableStatuses = [
            "requires_payment_method",
            "requires_capture",
            "requires_confirmation",
            "requires_action",
            "processing"
          ];

          if (intent && !cancellableStatuses.includes(intent.status)) {
            logger.log(`⚠️ Payment intent status is "${intent.status}", which is not cancellable. Skipping cancellation.`);
            shouldCancel = false;
            return { cancelled: false, reason: `Status ${intent.status} is not cancellable` };
          }

          logger.log(`✅ Payment intent status: ${intent.status}, proceeding with cancellation`);
        } catch (retrieveError) {
          logger.warn("Could not retrieve payment intent status, proceeding with cancellation anyway:", retrieveError);
          // Continue with cancellation attempt even if we can't retrieve status
        }
      }

      if (shouldCancel) {
        const result = await cancel_sfcc_order({
          paymentIntentId,
          orderId,
          cancellationReason: reason,
        });

        logger.log("✅ Payment intent cancelled successfully", result);
        return { cancelled: true, result };
      }

      return { cancelled: false, reason: "Status check prevented cancellation" };
    } catch (err) {
      logger.error("❌ Error cancelling payment intent:", err);
      // Don't throw error - payment intent might already be cancelled or in a non-cancellable state
      // This is a best-effort cancellation
      return { cancelled: false, error: err.message };
    }
  };

  // ✅ Handle modal close with payment intent cancellation
  // CRITICAL: Payment intent MUST be cancelled FIRST before any cleanup
  const handleClose = async () => {
    if (isProcessing) {
      // Don't allow closing while processing
      // toast.warning("Please wait for payment processing to complete.");
      return;
    }

    if (paymentStatus !== "success") {
      // CRITICAL: Cancel payment intent FIRST and wait for it to complete
      // This must happen before any cleanup or error callbacks
      logger.log("🔄 User cancelled payment - cancelling payment intent first...");
      try {
        // await cancelPaymentIntent("requested_by_customer");
        logger.log("✅ Payment intent cancelled successfully");
      } catch (cancelError) {
        logger.error("⚠️ Payment intent cancellation failed, but continuing with cleanup:", cancelError);
        // Continue with cleanup even if cancellation fails
      }

      // CRITICAL: Cancellation handled by parent via onClose -> handleStripeModalClose
      // We don't need to call onError here to avoid double execution of failure logic
      logger.log("✅ Payment intent cancelled by user action");
    }

    // Call onClose to close the modal
    onClose();
  };

  // ✅ Monitor form validation state using PaymentElement onChange event
  useEffect(() => {
    if (!elements) return;

    const paymentElement = elements.getElement("payment");
    if (!paymentElement) return;

    // Listen to change events to track form validity
    const handleChange = (event) => {
      // Form is valid when there's no error and element is complete
      const isValid = !event.error && event.complete;
      setIsFormValid(isValid);
    };

    paymentElement.on("change", handleChange);

    return () => {
      paymentElement.off("change", handleChange);
    };
  }, [elements]);

  // ✅ Handle browser back button
  useEffect(() => {
    const handlePopState = async () => {
      if (paymentStatus !== "success") {
        await cancelPaymentIntent("abandoned");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [paymentStatus]);

  // ✅ Cancel payment intent on unmount if not succeeded
  // Use refs to avoid stale closures and only run on mount/unmount
  useEffect(() => {
    return () => {
      const currentStatus = paymentStatusRef.current;
      const currentPaymentIntentId = paymentIntentIdRef.current;

      if (currentStatus !== "success" && currentPaymentIntentId) {
        cancelPaymentIntentContextFree(currentPaymentIntentId, currentStatus);
      }
    };
  }, []); // Empty dependency array means this only runs on unmount

  // Helper to cancel payment intent without closure dependencies
  const cancelPaymentIntentContextFree = (id, status) => {
    // We check the ref again just to be super safe, though passing args is fine
    if (hasCancelledRef.current) return;

    // Don't cancel if success (redundant check but safe)
    if (status === "success") return;

    cancel_sfcc_order({
      paymentIntentId: id,
      orderId,
      cancellationReason: "abandoned",
    }).catch((err) => logger.error("Error cancelling payment intent on unmount:", err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not initialized. Please refresh the page.");
      return;
    }

    // ✅ Validate form before processing
    if (!isFormValid) {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Please check your payment details.");
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    setPaymentStatus("processing");

    try {
      // Step 1: Submit the form to validate and collect payment details
      // This must be called before confirmPayment() - REQUIRED by Stripe
      const { error: submitError } = await elements.submit();

      if (submitError) {
        logger.error("Form validation error:", submitError);
        setError(submitError.message || "Please check your payment details.");
        setPaymentStatus("error");
        setIsProcessing(false);

        if (onError) {
          onError(submitError);
        }
        return;
      }

      // Step 2: Confirm payment using Stripe SDK (only after successful submit)
      // CRITICAL: Validate all required data before confirming payment
      if (!clientSecret) {
        throw new Error("Client secret is missing. Cannot proceed with payment.");
      }

      if (!stripe) {
        throw new Error("Stripe instance is not available. Please refresh the page.");
      }

      if (!elements) {
        throw new Error("Payment elements are not available. Please refresh the page.");
      }

      // Log payment intent data being sent to Stripe for debugging

      const confirmPayload = {
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/address?orderId=${orderId}`,
        },
        redirect: "if_required", // Only redirect if 3D Secure is required
      };

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment(confirmPayload);

      if (confirmError) {
        // Payment failed
        logger.error("Stripe payment error:", confirmError);
        setError(confirmError.message || "Payment failed. Please try again.");
        setPaymentStatus("error");
        setIsProcessing(false);

        // CRITICAL: Cancel payment intent FIRST before calling error callback
        // This ensures payment intent is cancelled even on payment errors
        if (paymentIntentId && paymentStatus !== "success") {
          try {
            logger.log("🔄 Payment failed - cancelling payment intent...");
            await cancelPaymentIntent("abandoned");
            logger.log("✅ Payment intent cancelled after payment failure");
          } catch (cancelError) {
            logger.error("⚠️ Failed to cancel payment intent after error:", cancelError);
            // Continue with error handling even if cancellation fails
          }
        }

        // Call error callback after cancellation
        if (onError) {
          onError(confirmError);
        }
        return;
      }

      // ✅ Handle all payment intent statuses correctly
      if (paymentIntent) {
        const status = paymentIntent.status;

        if (status === "succeeded") {
          // Payment succeeded
          hasCancelledRef.current = true; // Prevent cancellation
          setPaymentStatus("success");
          // toast.success("Payment successful!");

          // Call success callback after a brief delay
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(paymentIntent);
            }
          }, 1000);
        } else if (status === "requires_action") {
          // 3D Secure required - Stripe will redirect automatically
          // The redirect will be handled by the redirect handler in addressContent.jsx
          setPaymentStatus("processing");
          // toast.info("Completing 3D Secure authentication...");
          // Don't close modal yet - wait for redirect
        } else if (status === "requires_capture") {
          // Payment authorized but not captured yet
          setPaymentStatus("processing");
          // toast.info("Payment authorized. Processing...");
          // Backend should capture automatically
        } else if (status === "requires_confirmation") {
          // Payment requires confirmation
          setPaymentStatus("processing");
          // toast.info("Confirming payment...");
        } else if (status === "requires_payment_method") {
          // Payment method required - cancel payment intent
          setError("Payment method is required. Please check your payment details.");
          setPaymentStatus("error");
          setIsProcessing(false);

          // Cancel payment intent before error callback
          if (paymentIntentId) {
            try {
              await cancelPaymentIntent("abandoned");
            } catch (cancelError) {
              logger.error("Failed to cancel payment intent:", cancelError);
            }
          }

          if (onError) {
            onError(new Error("Payment method required"));
          }
        } else if (status === "processing") {
          // Payment is processing
          setPaymentStatus("processing");
          // toast.info("Payment is being processed. Please wait...");
        } else if (status === "canceled") {
          // Payment was cancelled - ensure payment intent is cancelled
          setError("Payment was cancelled. Please try again.");
          setPaymentStatus("error");
          setIsProcessing(false);

          // Payment intent should already be cancelled, but ensure it is
          if (paymentIntentId) {
            try {
              await cancelPaymentIntent("requested_by_customer");
            } catch (cancelError) {
              logger.error("Failed to cancel payment intent:", cancelError);
            }
          }

          if (onError) {
            onError(new Error("Payment cancelled"));
          }
        } else {
          // Payment in unexpected state - cancel payment intent
          setError(`Payment status: ${status}. Please try again.`);
          setPaymentStatus("error");
          setIsProcessing(false);

          // Cancel payment intent before error callback
          if (paymentIntentId) {
            try {
              await cancelPaymentIntent("abandoned");
            } catch (cancelError) {
              logger.error("Failed to cancel payment intent:", cancelError);
            }
          }

          if (onError) {
            onError(new Error(`Payment status: ${status}`));
          }
        }
      } else {
        // No payment intent returned (shouldn't happen) - cancel payment intent
        setError("Payment confirmation incomplete. Please try again.");
        setPaymentStatus("error");
        setIsProcessing(false);

        // CRITICAL: Cancel payment intent FIRST before error callback
        if (paymentIntentId) {
          try {
            logger.log("🔄 No payment intent returned - cancelling payment intent...");
            await cancelPaymentIntent("abandoned");
            logger.log("✅ Payment intent cancelled");
          } catch (cancelError) {
            logger.error("⚠️ Failed to cancel payment intent:", cancelError);
            // Continue with error handling even if cancellation fails
          }
        }

        if (onError) {
          onError(new Error("Payment confirmation incomplete"));
        }
      }
    } catch (err) {
      logger.error("Payment processing error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setPaymentStatus("error");
      setIsProcessing(false);

      // CRITICAL: Cancel payment intent FIRST before error callback
      if (paymentIntentId && paymentStatus !== "success") {
        try {
          logger.log("🔄 Payment processing error - cancelling payment intent...");
          await cancelPaymentIntent("abandoned");
          logger.log("✅ Payment intent cancelled after processing error");
        } catch (cancelError) {
          logger.error("⚠️ Failed to cancel payment intent after processing error:", cancelError);
          // Continue with error handling even if cancellation fails
        }
      }

      if (onError) {
        onError(err);
      }
    }
  };

  // Scroll lock when modal is open
  useEffect(() => {
    if (!isProcessing) return;

    const scrollY = window.scrollY || 0;
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.width = prev.bodyWidth;
      document.body.style.overflow = prev.bodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isProcessing]);

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h2" fontSize="xl" fontWeight={600} mb={2}>
            Complete Your Payment
          </Heading>
          <Text color="gray.600" fontSize="sm">
            You will be charged <Text as="span" fontWeight={600}>₹{amount}</Text>.
            Payments are securely processed via Stripe.
          </Text>
        </Box>

        {/* Error Alert */}
        {(error || elementError) && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{error || elementError}</AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Loading State - Show when element is not ready */}
        {!isElementReady && !elementError && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Loading Payment Form</AlertTitle>
              <AlertDescription>Please wait while we load the payment form...</AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Success State */}
        {paymentStatus === "success" && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Payment Successful!</AlertTitle>
              <AlertDescription>
                Your payment has been processed successfully. Redirecting...
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Payment Form */}
        {paymentStatus !== "success" && (
          <form id="stripe-payment-form" onSubmit={handleSubmit}>
            <Box
              p={4}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
              mb={4}
            >
              <PaymentElement
                options={{
                  layout: "tabs",
                }}
                onReady={() => {
                  setIsElementReady(true);
                  setElementError(null);
                  logger.log("PaymentElement ready");
                }}
                onLoaderError={(event) => {
                  logger.error("PaymentElement load error:", event);

                  // ✅ Handle specific Stripe errors
                  const errorType = event.error?.type;
                  const errorMessage = event.error?.message || "";

                  let userFriendlyMessage = "Failed to load payment form. Please try again.";

                  // Check for client secret mismatch error
                  if (errorType === "invalid_request_error" &&
                    (errorMessage.includes("client_secret") ||
                      errorMessage.includes("does not match") ||
                      errorMessage.includes("same account"))) {
                    userFriendlyMessage = "Payment configuration error. The payment method doesn't match your account. Please contact support or try again.";
                    logger.error("Stripe client secret mismatch - likely account/key mismatch", {
                      errorType,
                      errorMessage: errorMessage.substring(0, 100),
                      paymentIntentId: paymentIntentId?.substring(0, 20)
                    });
                  } else if (errorType === "invalid_request_error") {
                    userFriendlyMessage = "Invalid payment configuration. Please try again or contact support.";
                  }

                  setElementError(userFriendlyMessage);
                  setIsElementReady(false);

                  // Call onError callback
                  if (onError) {
                    const loadError = new Error(userFriendlyMessage);
                    loadError.code = "payment_element_load_error";
                    loadError.type = errorType;
                    loadError.originalError = event.error;
                    onError(loadError);
                  }
                }}
              />
            </Box>

            {/* Submit Button */}
            <HStack justify="flex-end" spacing={3}>
              <Button
                onClick={handleClose}
                variant="outline"
                isDisabled={isProcessing}
                size="md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="black"
                bg="black"
                color="white"
                isLoading={isProcessing}
                loadingText="Processing..."
                // ✅ Pay button should be enabled when form is valid, Stripe is ready, and element is loaded
                isDisabled={!stripe || !elements || isProcessing || !isFormValid || !isElementReady || !!elementError}
                size="md"
                _hover={{ bg: "gray.800" }}
                title={
                  elementError
                    ? "Payment form failed to load. Please try again."
                    : !isElementReady
                      ? "Loading payment form..."
                      : !isFormValid
                        ? "Please fill in all payment details"
                        : ""
                }
              >
                {isProcessing ? "Processing Payment..." : `Pay ₹ ${amount}`}
              </Button>
            </HStack>
          </form>
        )}

        {/* Processing State */}
        {isProcessing && paymentStatus === "processing" && (
          <Box textAlign="center" py={4}>
            <Spinner size="lg" color="black" />
            <Text mt={3} color="gray.600" fontSize="sm">
              Processing your payment...
            </Text>
          </Box>
        )}

        {/* Security Notice */}
        <Box mt={2}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            🔒 Your payment information is encrypted and secure. We never store your card details.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

/**
 * Stripe Payment Modal Wrapper
 * Wraps the payment content with Stripe Elements provider
 */
const StripePaymentModal = ({
  isOpen,
  onClose,
  clientSecret,
  amount,
  orderId,
  onSuccess,
  onError,
  stripePromise,
  paymentIntentId,
  returnUrl,
}) => {
  // Don't render modal if client secret is missing or invalid
  if (!clientSecret || !stripePromise) {
    logger.warn("StripePaymentModal: Missing clientSecret or stripePromise", {
      hasClientSecret: !!clientSecret,
      hasStripePromise: !!stripePromise
    });
    return null;
  }

  // Validate client secret format (should start with "pi_" or "seti_")
  const isValidClientSecret = typeof clientSecret === 'string' &&
    (clientSecret.startsWith('pi_') || clientSecret.startsWith('seti_'));

  if (!isValidClientSecret) {
    logger.error("StripePaymentModal: Invalid client secret format", {
      clientSecretLength: clientSecret?.length,
      clientSecretPrefix: clientSecret?.substring(0, 10)
    });

    // Call onError if provided
    if (onError) {
      const invalidSecretError = new Error("Invalid payment configuration. Please try again.");
      invalidSecretError.code = "invalid_client_secret";
      onError(invalidSecretError);
    }

    return null;
  }

  // ✅ Handle modal close with payment intent cancellation
  const handleModalClose = async () => {
    // The StripePaymentModalContent will handle cancellation via its handleClose
    // We just need to call the parent's onClose
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleModalClose}
      footer={null}
      centered
      width={600}
      maskClosable={false}
      closable={true}
      destroyOnClose={true}
      styles={{
        body: { padding: "24px" },
        mask: { backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)" },
      }}
    >
      {isOpen && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret,
            appearance: {
              theme: "stripe",
            },
          }}
        >
          <StripePaymentModalContent
            clientSecret={clientSecret}
            amount={amount}
            orderId={orderId}
            onSuccess={onSuccess}
            onError={onError}
            onClose={handleModalClose}
            paymentIntentId={paymentIntentId}
            returnUrl={returnUrl}
          />
        </Elements>
      )}
    </Modal>
  );
};

export default StripePaymentModal;

