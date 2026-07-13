// src/api/services/returnExchange.js (example path)
// Adjust imports to match your project structure
// import { SFCC_CONFIG } from "@/config/sfccConfig";
import { SFCC_CONFIG } from "@/api/services/auth"; // or wherever your token fn is
import { getAuthToken } from "@/utils/tokenUtils";

/**
 * Create return/exchange request (SFCC Return-Exchange API)
 * API expects JSON body (as per screenshots).
 *
 * @param {Object} params
 * @param {Object} params.payload - { orderId, actionType, itemId, reason, description, mediaLinks, returnData }
 */
export const create_return_request = async ({ payload }) => {
//     console.log("payload (raw):", payload); // will show FormData {}
// console.log("payload entries:");
// for (const [k, v] of payload.entries()) {
//   console.log(k, v);
// }

  const url =
    `${SFCC_CONFIG.baseUrl}/custom/order/v1/organizations/` +
    `${SFCC_CONFIG.organizationId}/returnExchange?siteId=${SFCC_CONFIG.siteId}`;

  const accessToken = await getAuthToken();
  if (!accessToken) {
    // match your existing patterns (return empty / false instead of throwing)
    return {
      status: false,
      message: "Auth token missing",
      raw: null,
    };
  }
  const fd = payload;

  const orderId = String(fd.get("orderId") || "");
  const type = String(fd.get("type") || "RETURN");
  const reason = String(fd.get("reason") || "");
  const description = String(fd.get("description") || "");

  const items = JSON.parse(fd.get("items") || "[]");
  const itemId = String(items?.[0]?.productId || ""); // ✅ SFCC expects productId here

  const bankName = String(fd.get("bankName") || "");
  const accountNumber = String(fd.get("accountNumber") || "");
  const ifscCode = String(fd.get("ifscCode") || "");
  const mobileNumber = String(fd.get("mobileNumber") || "");

  // Extract mediaUrl from FormData (can be multiple)
  const mediaLinks = fd.getAll("mediaUrl"); 

  const body = {
    orderId,
    actionType: type,
    itemId,
    reason,
    description,
    mediaLinks,
    ...(bankName || accountNumber || ifscCode || mobileNumber
      ? {
          returnData: {
            bankName,
            accountNumber,
            ifscCode,
            mobileNumber,
          },
        }
      : {}),
  };

  // console.log("✅ BODY SENT TO SFCC:", body);

  // basic validation (optional but helpful)
  if (!body.orderId || !body.itemId || !body.reason) {
    return {
      status: false,
      message: "Missing required fields: orderId / itemId / reason",
      raw: body,
    };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  const data = await resp.json();
  // console.log("✅ RESPONSE FROM SFCC:", data);
  if (!resp.ok) {
    throw new Error(`Return failed: ${data.title}`);
  }


  /**
   * Your screenshot response shape is like:
   * {
   *   "success": true,
   *   "message": "Return processed successfully",
   *   "result": { "success": true, "message": "Return processed successfully" }
   * }
   *
   * But your UI code checks `success.status`.
   * So we normalize it to `{ status: boolean, message: string, data: ... }`
   */
  return {
    status: !!data?.success,
    message: data?.message || data?.result?.message || "",
    data, // keep full raw response too
  };
};


export const exchange_same_item = async ({ payload }) => {
  // payload expected:
  // {
  //   orderId, itemId, reason, description,
  //   mediaLinks: [],
  //   exchangeItemId
  // }

  const url =
    `${SFCC_CONFIG.baseUrl}/custom/order/v1/organizations/` +
    `${SFCC_CONFIG.organizationId}/returnExchange?siteId=${SFCC_CONFIG.siteId}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const body = {
    orderId: String(payload?.orderId || ""),
    actionType: String(payload?.actionType || "EXCHANGE-SAME"), // ✅ Dynamic actionType
    itemId: String(payload?.itemId || ""),
    reason: String(payload?.reason || ""),
    description: String(payload?.description || ""),
    mediaLinks: Array.isArray(payload?.mediaLinks) ? payload.mediaLinks : [],
    exchangeData: {
      exchangeItemId: String(payload?.exchangeItemId || ""),
      ...payload?.exchangeData, // ✅ Merge extra data (like quantity)
    },
  };

  // Basic validation (optional but recommended)
  if (!body.orderId) throw new Error("orderId is required");
  if (!body.itemId) throw new Error("itemId is required");
  if (!body.exchangeData.exchangeItemId)
    throw new Error("exchangeItemId is required");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Return failed: ${data.title}`);
  }

  // Expected response (from your screenshot):
  // {
  //   success: true,
  //   message: "Action processed successfully",
  //   result: { success: true, newOrderId: "00003203" }
  // }
  return data;
};
