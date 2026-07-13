import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlazeSDK from '@juspay/blaze-sdk-web';
import { cancel_sfcc_order } from "@/api/services/sfccCheckout";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { logger } from "@/utils/logger.js";
import { useAuth } from "@/context/AuthContext";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { clearPaymentState } from "@/utils/paymentStateManager";

const getRequestId = () => crypto.randomUUID();

export const useBreezeSDK = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(() => {
     // Check if we are returning from Breeze payment gateway
     return window.location.search.includes('atomsSt') || window.location.search.includes('breeze');
  });

  // Safety timeout to release the lock if SDK doesn't respond
  useEffect(() => {
    if (isProcessing) {
      const timer = setTimeout(() => {
        logger.warn("Breeze SDK processing timeout - force releasing lock");
        setIsProcessing(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  useEffect(() => {
    const initiateSDK = async () => {
      try {
        const initiatePayload = {
          merchantId: 'sotbella',
          shopUrl: import.meta.env.VITE_BREEZE_SHOP_URL,
          environment: 'release'
        };
        const initSDKPayload = {
          requestId: getRequestId(),
          service: 'in.breeze.onecco',
          payload: initiatePayload
        };

        const blazeCallback = async (event) => {
          // console.log('Event received:', event);
          let responseObj = event;
          if (typeof event === 'string') {
            try {
              responseObj = JSON.parse(event);
            } catch (e) {
              // console.error("Failed to parse Breeze response JSON", e);
            }
          }

          let payloadObj = responseObj?.payload;

          logger.log("Breeze Payload Type:", typeof payloadObj);

          if (typeof payloadObj === 'string') {
            try {
              payloadObj = JSON.parse(payloadObj);
            } catch (e) {
              // console.error("Failed to parse Breeze payload JSON", e);
            }
          }

          const eventName = payloadObj?.eventName;
          // console.log(eventName, "00000000000000000000")

          // if (eventName === 'eventStream') {
          //   const event = event?.payload?.event; // This looks suspicious in original code (event vs responseObj), but copying logic for now. Wait, in original: `const event = event?.payload?.event;` where second `event` is the param. This bug might be in original. 
          //   // Original code:
          //   // const blazeCallback = async (event) => { ...
          //   //   if (eventName === 'eventStream') {
          //   //      const event = event?.payload?.event; 
          //   // Variable shadowing? `event` param vs `event` variable? No, `const event` redeclaration in block scope. 
          //   // Ideally `const streamEvent = responseObj?.payload?.event;`
          //   // But let's look at `const event = event?.payload?.event;` in original (Line 393). initializing `event` with `event` (param) payload. 
          //   // In the callback `event` is the argument. 
          //   // The original code was `const event = event?.payload?.event;` which is a ReferenceError if `event` is let/const in same scope, but here it's inside `if` block. 
          //   // However `event` from argument is shadowed. `event?.payload` refers to argument? No, `event` is TDZ.
          //   // Ah, wait. `const event` inside `if` block shadows the argument `event`. Initializer `event?.payload?.event` will throw ReferenceError if it tries to access the `const event` being declared. 
          //   // BUT, if it accesses the *argument*, it might work in some JS engines/modes but usually TDZ. 
          //   // Let's assume the user meant `responseObj?.payload?.event`.
            
          //   const streamEvent = responseObj?.payload?.event;
          //   console.log(streamEvent, "11111111111111111111")
            
          //   if (streamEvent === 'InitiateCheckout') {
          //     console.log('InitiateCheckout page rendered');
          //   }
          //   else if (streamEvent === 'AddPaymentInfo') {
          //     console.log('Payment page rendered');
          //   }
          //   else if (streamEvent === 'AddedAddress') {
          //     console.log('New address added');
          //   }
          //   else if (streamEvent === 'UpdatedAddress') {
          //     console.log('Address changed');
          //   }
          //   else if (streamEvent === 'PayNow') {
          //     console.log('Pay button clicked');
          //   }
          //   else if (streamEvent === 'OrderComplete') {
          //     console.log('Order complete');
          //   }
          //   else if (streamEvent === 'Purchase') {
          //     const orderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //     if (orderId) {
          //       console.log("999999999999999")
          //       navigate(`/thankyou?orderId=${orderId}`);
          //     } else {
          //       navigate('/thankyou');
          //     }
          //     BlazeSDK.terminate();
          //   }
          //   else {
          //     console.log('Unexpected event received or sidebar closed, calling cancelOrder API:', eventName || 'Unknown/Close');
          //     const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //     if (currentOrderId) {
          //       try {
          //         await cancel_sfcc_order({
          //           orderId: currentOrderId,
          //           cancellationReason: "abandoned"
          //         });
          //         console.log('Order cancelled successfully due to unexpected event/close');
          //       } catch (err) {
          //         console.error('Failed to cancel order:', err);
          //       }
          //     } else {
          //       console.warn('No order ID found to cancel');
          //     }
          //   }
          // }
          // else if (eventName === 'processResult') {
          //   // const action = event?.payload?.action; // Shadowing issue again if I used `event` var. Use responseObj.
          //   console.log("00000000000000000000000000000000")
          //   if (payloadObj?.error) {
          //      // Checkout failed
          //      console.log('Error:', responseObj?.payload?.errorCode);
          //      const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //      if (currentOrderId) {
          //        try {
          //          await cancel_sfcc_order({
          //            orderId: currentOrderId,
          //            cancellationReason: "abandoned"
          //          });
          //          console.log('Order cancelled successfully due to unexpected event/close');
          //        } catch (err) {
          //          console.error('Failed to cancel order:', err);
          //        }
          //      } else {
          //        console.warn('No order ID found to cancel');
          //      }
          //   } else if (payloadObj?.ctaAction === 'trackOrder') {
          //     console.log("track order clicked");
          //     const orderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //     if (orderId) {
          //       navigate(`/ordersummary?orderId=${orderId}`);
          //     } else {
          //       console.log("No order ID found to navigate to order details");
          //     }
          //     BlazeSDK.terminate();
          //   } else if (payloadObj?.ctaAction === 'shopMore') {
          //     console.log("shop more clicked");
          //     navigate('/');
          //     BlazeSDK.terminate();
          //   } else if (payloadObj?.status === 'backPressed') {
          //     console.log("back pressed");
          //     const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //     if (currentOrderId) {
          //       try {
          //         await cancel_sfcc_order({
          //           orderId: currentOrderId,
          //           cancellationReason: "abandoned"
          //         });
          //         console.log('Order cancelled successfully due to unexpected event/close');
          //       } catch (err) {
          //         console.error('Failed to cancel order:', err);
          //       }
          //     } else {
          //       console.warn('No order ID found to cancel');
          //     }
          //   }
          //   else {
          //     const orderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //     if (orderId) {
          //       console.log("999999999999999")
          //       navigate(`/thankyou?orderId=${orderId}`);
          //     } else {
          //       navigate('/thankyou');
          //     }
          //     BlazeSDK.terminate();
          //   }
          // }
          // else if (eventName === "invokeMethod") {
          //   const method = responseObj?.payload?.methodName;
          //    if (method === 'clearCart') {
          //      const orderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //      if (orderId) {
          //        console.log("999999999999999")
          //        navigate(`/thankyou?orderId=${orderId}`);
          //      } else {
          //        navigate('/thankyou');
          //      }
          //      BlazeSDK.terminate();
          //    }
          //    else {
          //      console.log("Unexpected event received or sidebar closed, calling cancelOrder API:", method || 'Unknown/Close');
          //      const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //      if (currentOrderId) {
          //        try {
          //          await cancel_sfcc_order({
          //            orderId: currentOrderId,
          //            cancellationReason: "abandoned"
          //          });
          //          console.log('Order cancelled successfully due to unexpected event/close');
          //        } catch (err) {
          //          console.error('Failed to cancel order:', err);
          //        }
          //      } else {
          //        console.warn('No order ID found to cancel');
          //      }
          //    }
          // }
          // else {
          //   console.log("Unexpected event received or sidebar closed, calling cancelOrder API:", eventName || 'Unknown/Close');
          //   const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
          //   if (currentOrderId) {
          //     try {
          //       await cancel_sfcc_order({
          //         orderId: currentOrderId,
          //         cancellationReason: "abandoned"
          //       });
          //       console.log('Order cancelled successfully due to unexpected event/close');
          //     } catch (err) {
          //       console.error('Failed to cancel order:', err);
          //     }
          //   } else {
          //     console.warn('No order ID found to cancel');
          //   }
          // }


          if(eventName === "eventStream"){
            const event = payloadObj?.event;
            if(event === "Purchase"){
              // console.log("purchase event received");
              
              // Clear cart and payment state before redirecting
              const { clearBasketAfterPayment } = useUnifiedCartStore.getState();
              clearBasketAfterPayment();
              clearPaymentState();
              localStorage.removeItem('basket_items_snapshot');
              localStorage.removeItem('stripe_payment_intent_id');
              localStorage.removeItem('order_payment_pending');

              const orderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID) || localStorage.getItem("PLACED_ORDER_ID");
              // console.log("orderId", orderId);
              if (orderId) {
                // console.log("Navigate to thank you page", orderId);
                window.location.href = `/thankyou?orderId=${orderId}`;
              } else {
                // console.log("Navigate to thank you page without order id");
                window.location.href = '/thankyou';
              }
              BlazeSDK.terminate();
            }
            if(payloadObj?.orderStatus === "FAILED"){
              // console.log("order failed event received");
                const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID) || localStorage.getItem("PLACED_ORDER_ID");
                if (currentOrderId) {
                  try {
                    // console.log("111111111111111111111111111111")
                    await cancel_sfcc_order({
                      orderId: currentOrderId,
                      cancellationReason: "abandoned"
                    });
                    // console.log('Order cancelled successfully due to unexpected event/close');
                  } catch (err) {
                    // console.error('Failed to cancel order:', err);
                  } 
                  finally {
                    setIsProcessing(false);
                  }


                  // Retrieve redirect URL from localStorage
                  const redirectUrl = localStorage.getItem('breeze_redirect_url') || '/';

                  // Clear the localStorage item
                  localStorage.removeItem('breeze_redirect_url');

                  window.location.href = redirectUrl;
                  BlazeSDK.terminate();
                } 
                else {
                   setIsProcessing(false);
                }
            }

          }

          if(eventName === "processResult"){
            // const ctaAction = payloadObj?.ctaAction;
            if(payloadObj?.status === 'backPressed' || payloadObj?.error === true || payloadObj?.status === 'error'){
                // console.log("back pressed");
                const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID) || localStorage.getItem("PLACED_ORDER_ID");
                if (currentOrderId) {
                  try {
                    // console.log("2222222222222222222222222222")
                    await cancel_sfcc_order({
                      orderId: currentOrderId,
                      cancellationReason: "abandoned"
                    });
                    // console.log('Order cancelled successfully due to unexpected event/close');
                  } catch (err) {
                    // console.error('Failed to cancel order:', err);
                  } 
                  finally {
                    setIsProcessing(false);
                  }
                  
                  // Retrieve redirect URL from localStorage
                  const redirectUrl = localStorage.getItem('breeze_redirect_url') || '/';

                  // Clear the localStorage item
                  localStorage.removeItem('breeze_redirect_url');

                  window.location.href = redirectUrl;
                  BlazeSDK.terminate();
                } 
                else {
                   setIsProcessing(false);
                } 
            } 
            else if(payloadObj?.status === 'failed'){
              // console.log("failed");
              const currentOrderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID) || localStorage.getItem("PLACED_ORDER_ID");
              if (currentOrderId) {
                try {
                  // console.log("333333333333333333333333333333333")
                  await cancel_sfcc_order({
                    orderId: currentOrderId,
                    cancellationReason: "abandoned"
                  });
                  // console.log('Order cancelled successfully due to unexpected event/close');
                  window.location.href = '/';
                } catch (err) {
                  // console.error('Failed to cancel order:', err);
                } 
                finally {
                   setIsProcessing(false);
                }
                BlazeSDK.terminate();
              } 
              else {
                 setIsProcessing(false);
              }
            }
            
            else if (payloadObj?.ctaAction === 'trackOrder') {
                // User clicked Track Order
                // console.log("Track Order clicked");

              // Clear cart and payment state before redirecting
              const { clearBasketAfterPayment } = useUnifiedCartStore.getState();
              clearBasketAfterPayment();
              clearPaymentState();
              localStorage.removeItem('basket_items_snapshot');
              localStorage.removeItem('stripe_payment_intent_id');
              localStorage.removeItem('order_payment_pending');

              const orderId = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID) || localStorage.getItem("PLACED_ORDER_ID");
              // console.log("orderId", orderId);
              if (orderId) {
                // console.log("Navigate to thank you page", orderId);
                window.location.href = `/thankyou?orderId=${orderId}`;
              } else {
                // console.log("Navigate to thank you page without order id");
                window.location.href = '/thankyou';
              }
              BlazeSDK.terminate();
            } else if (payloadObj?.ctaAction === 'shopMore') {
                // User clicked Shop More
                // console.log("Shop More clicked");
                window.location.href = '/';
                BlazeSDK.terminate();
            }
          }
        };

        logger.log("Initiating Blaze SDK...", initSDKPayload);
        BlazeSDK.initiate(initSDKPayload, blazeCallback);
      } catch (e) {
        // console.error("Failed to initiate Blaze SDK", e);
      }
    };
    initiateSDK();
  }, [navigate, isAuthenticated]);

  return { isProcessing };
};
