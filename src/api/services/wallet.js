import { getAuthToken } from "@/utils/tokenUtils";
import { SFCC_CONFIG } from "@/api/services/auth";
// import { getCurrentSiteId } from "@/utils/sfccSiteConfig";

/**
 * Wallet Transactions API
 * POST /custom/custom-data/v1/organizations/{orgId}/walletTransactions?siteId={siteId}
 */
export const getWalletTransactions = async ({
  startDate,
  endDate,
  limit = 10,
  page = 1,
  siteId = import.meta.env.VITE_SFCC_SITE_ID, // Default to dynamic siteId from geolocation
} = {}) => {
  // tokenUtils uses your unified auth_token (guest/user)
  const accessToken = await getAuthToken();

  if (!accessToken) {
    // helpful debug
    const t = getAuthTokenObject?.() || null;
    // console.warn("Wallet API: access token missing", { tokenObj: t });
    const err = new Error("Access token missing. Please login again.");
    err.code = "TOKEN_MISSING";
    throw err;
  }

  const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/walletTransactions?siteId=${siteId}`;

  const body = {};
  if (startDate) body.startDate = startDate;
  if (endDate) body.endDate = endDate;
  if (limit) body.limit = limit;
  if (page) body.page = page;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Many SFCC endpoints expect this header too (safe to include)
      "x-dw-client-id": SFCC_CONFIG.clientId,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const err = new Error(
      json?.message ||
        json?.error ||
        `Wallet API failed: ${res.status} ${res.statusText}`
    );
    err.status = res.status;
    err.payload = json || text;
    throw err;
  }

  return json;
};


/**
 * UI helper: normalize API transaction -> component format
 */
export const normalizeWalletTransaction = (t) => {
  // API types: order_deduction (debit), wallet/reward (credit) etc.
  const debitTypes = new Set(["order_deduction", "debit", "withdraw", "deduction"]);

  const isDebit = debitTypes.has(String(t?.type || "").toLowerCase());

  return {
    id: t?.transactionId,
    transactionId: t?.transactionId,
    orderId: t?.referenceId || null,
    remark: t?.remarks || t?.description || "-",
    type: isDebit ? "DEBIT" : "CREDIT",
    amount: Number(t?.amount || 0),
    date: t?.createdAt || t?.updatedAt || new Date().toISOString(),
    raw: t,
  };
};
