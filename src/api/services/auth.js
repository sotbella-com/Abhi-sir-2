import {
  getAuthToken,
  getAuthTokenObject,
  getCustomerId,
  saveUserToken,
} from "../../utils/tokenUtils";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";

// Salesforce Commerce Cloud API Configuration from environment variables
const SFCC_CONFIG = {
  shortCode: import.meta.env.VITE_SFCC_SHORTCODE,
  organizationId: import.meta.env.VITE_SFCC_ORG_ID,
  siteId: import.meta.env.VITE_SFCC_SITE_ID,
  baseUrl: import.meta.env.VITE_SFCC_BASE_URL,
  clientId: import.meta.env.VITE_SFCC_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SFCC_CLIENT_SECRET,
  locale: import.meta.env.VITE_SFCC_LOCALE,
};

// Generate Basic Auth header for SFCC API (prefer Client ID/Secret)
const getBasicAuth = () => {
  const clientId = SFCC_CONFIG.clientId;
  const clientSecret = SFCC_CONFIG.clientSecret;
  const basicUser = import.meta.env.VITE_SFCC_BASIC_AUTH_USERNAME;
  const basicPass = import.meta.env.VITE_SFCC_BASIC_AUTH_PASSWORD;

  // Prefer client credentials; fallback to explicit BASIC_* if provided
  const username = clientId || basicUser;
  const password = clientSecret || basicPass;

  if (!username || !password) {
    return null;
  }

  const credentials = btoa(`${username}:${password}`);
  const authHeader = `Basic ${credentials}`;

  return authHeader;
};

/**
 * Get client credentials token for server-side operations like customer creation
 * @returns {Promise<string>} Client credentials access token
 */
const getClientCredentialsToken = async () => {
  try {
    // console.log('🔧 CLIENT CREDENTIALS DEBUG:');
    // console.log('Base URL:', SFCC_CONFIG.baseUrl);
    // console.log('Organization ID:', SFCC_CONFIG.organizationId);
    // console.log('Client ID:', SFCC_CONFIG.clientId);

    const response = await fetch(
      `${SFCC_CONFIG.baseUrl}/shopper/auth/v1/organizations/${SFCC_CONFIG.organizationId}/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: getBasicAuth(),
          "x-dw-client-id": SFCC_CONFIG.clientId,
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          channel_id: SFCC_CONFIG.siteId,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Client credentials token failed: ${response.status} - ${errorText}`,
      );
    }

    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    throw error;
  }
};

/**
 * Send OTP to user's email/phone
 * @param {string} userId - Email or phone number
 * @returns {Promise<Object>} API response
 */
export const sendOTP = async (phoneNumber) => {
  try {
    // Add country code 91 to phone number if not already present
    const formattedPhone = phoneNumber.startsWith("91")
      ? phoneNumber
      : `91${phoneNumber}`;

    const url = `${SFCC_CONFIG.baseUrl}/shopper/auth/v1/organizations/${SFCC_CONFIG.organizationId}/oauth2/passwordless/login`;

    const tokenObj = getAuthTokenObject();
    const usid =
      tokenObj?.usid ||
      import.meta.env.VITE_SFCC_STATIC_USID ||
      "33aac212-7e45-4c51-b444-caaa3c9b8331";

    const formData = new URLSearchParams({
      channel_id: import.meta.env.VITE_SFCC_SITE_ID,
      user_id: formattedPhone,
      mode: "callback",
      callback_uri: import.meta.env.VITE_SFCC_PASSWORDLESS_CALLBACK_URL,
      locale: import.meta.env.VITE_SFCC_LOCALE,
      usid: usid,
    });

    const authHeader = getBasicAuth();
    if (!authHeader) {
      throw new Error(
        "Failed to generate Basic Auth header - missing credentials",
      );
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
        "x-dw-client-id": SFCC_CONFIG.clientId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Send OTP failed: ${response.status} - ${errorData}`);
    }

    return {
      success: true,
      message: "OTP sent successfully",
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify OTP and get access token
 * @param {string} otp - OTP entered by user
 * @returns {Promise<Object>} Token response
 */
export const verifyOTP = async (otp) => {
  try {
    // 1) Get client credentials token
    const bearer = await getClientCredentialsToken();

    // 2) Get USID
    const tokenObj = getAuthTokenObject();
    const usid =
      tokenObj?.usid ||
      import.meta.env.VITE_SFCC_STATIC_USID ||
      "33aac212-7e45-4c51-b444-caaa3c9b8331";

    // 3) Get login data
    const loginDataRaw = localStorage.getItem(LOCAL_KEYS.LOGIN_DATA);
    const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;

    let login_id = "";
    if (loginData?.type === "email" && loginData?.email) {
      login_id = loginData.email;
    } else if (loginData?.phoneNumber) {
      const pn = String(loginData.phoneNumber);
      login_id = pn.startsWith("91") ? pn : `91${pn}`;
    }

    // 4) Endpoint
    const url = `${SFCC_CONFIG.baseUrl}/shopper/auth/v1/organizations/${SFCC_CONFIG.organizationId}/oauth2/passwordless/token`;

    // 5) Form-urlencoded payload
    const formData = new URLSearchParams();

    // Use the parameter names expected by the API
    formData.append("grant_type", "client_credentials");
    formData.append(
      "redirect_uri","http://localhost:3000/callback" );
    formData.append("hint", "pwdless_login");
    formData.append("pwdless_login_token", otp);
    formData.append("usid", usid);

    const username = import.meta.env.VITE_SFCC_CLIENT_ID;
    const password = import.meta.env.VITE_SFCC_CLIENT_SECRET;

    const basicAuth = btoa(`${username}:${password}`);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`, // ✅ Correct
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    // console.log(resp)

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OTP verification failed: ${resp.status} - ${errText}`);
    }

    const json = await resp.json();
    // console.log("Verify OTP Response:", json);
    // If your API returns { success, details: {...} }
    if (!json?.access_token) {
      throw new Error("Invalid response from verify API");
    }

    const d = json;

    return {
      success: true,
      data: {
        access_token: d.access_token,
        id_token: d.id_token,
        refresh_token: d.refresh_token,
        expires_in: d.expires_in,
        refresh_token_expires_in: d.refresh_token_expires_in,
        token_type: d.token_type || "Bearer",
        usid: d.usid,
        customerId: d.customer_id || d.customerId,
        enc_user_id: d.enc_user_id,
        customer_id: d.customer_id || d.customerId,
        idp_access_token: d.idp_access_token,
        idp_refresh_token: d.idp_refresh_token,
        dnt: d.dnt,
      },
    };
  } catch (error) {
    console.error("verifyOTP error:", error);
    throw error;
  }
};

export const loginVerification = async (accessToken, deviceId = "") => {
  const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/loginVerification?siteId=${SFCC_CONFIG.siteId}`;

  const body = deviceId ? { deviceId } : {};

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // console.log(resp)

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(
      `Login verification failed: ${resp.status} - ${errText}`
    );
  }

  return await resp.json();
};

// export const verifyOTP = async (otp) => {
//   try {
//     // 1) Get a bearer for the custom endpoint (client credentials)
//     const bearer = await getClientCredentialsToken();

//     // 2) usid: prefer the one inside unified auth_token
//     const tokenObj = getAuthTokenObject();
//     const usid =
//       tokenObj?.usid ||
//       import.meta.env.VITE_SFCC_STATIC_USID ||
//       "33aac212-7e45-4c51-b444-caaa3c9b8331";

//     // 3) login_id: pull from your stored login context
//     const loginDataRaw = localStorage.getItem(LOCAL_KEYS.LOGIN_DATA);
//     const loginData = loginDataRaw ? JSON.parse(loginDataRaw) : null;

//     // fallback logic: email if present, else phone (prefixed with 91)
//     let login_id = "";
//     if (loginData?.type === "email" && loginData?.email) {
//       login_id = loginData.email;
//     } else if (loginData?.phoneNumber) {
//       const pn = String(loginData.phoneNumber);
//       login_id = pn.startsWith("91") ? pn : `91${pn}`;
//     }

//     // 4) POST JSON to your custom verify endpoint
//     // const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/login?siteId=${SFCC_CONFIG.siteId}`;

//     const url = `${SFCC_CONFIG.baseUrl}/shopper/auth/v1/organizations/${SFCC_CONFIG.organizationId}/oauth2/passwordless/token`;

//     // {{HOST}}/shopper/auth/v1/organizations/{{organizationId}}/oauth2/passwordless/token
//     const resp = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${bearer}`,
//       },
//       body: JSON.stringify({
//         // pwdless_login_token: otp, // 4-digit OTP
//         // usid,
//         // login_id,
//         grantType: "client_credentials",
//         redirect_uri: "http://localhost:3000/callback",
//         hint: "pwdless_login",
//         pwdless_login_token: otp,
//         usid:usid,
//       }),
//     });

//     if (!resp.ok) {
//       const errText = await resp.text();
//       throw new Error(`OTP verification failed: ${resp.status} - ${errText}`);
//     }

//     const json = await resp.json();
//     // Expecting the shape from your doc:
//     // { success, message, details: { access_token, id_token, refresh_token, ... } }

//     if (!json?.success || !json?.details?.access_token) {
//       throw new Error("Invalid response from verify API");
//     }

//     const d = json.details;

//     // NOTE: Do NOT save user token here - let the caller (handleVerifyOTP) save it
//     // after extracting guest data. This ensures guest data can be extracted before
//     // the token is replaced.
//     // The caller will call saveUserToken after extracting guest data.

//     return {
//       success: true,
//       data: {
//         access_token: d.access_token,
//         id_token: d.id_token,
//         refresh_token: d.refresh_token,
//         expires_in: d.expires_in,
//         refresh_token_expires_in: d.refresh_token_expires_in,
//         token_type: d.token_type || "BEARER",
//         usid: d.usid,
//         customerId: d.customer_id || d.customerId,
//         enc_user_id: d.enc_user_id,
//         // Include all fields needed for saveUserToken
//         customer_id: d.customer_id || d.customerId,
//         idp_access_token: d.idp_access_token,
//         idp_refresh_token: d.idp_refresh_token,
//         dnt: d.dnt,
//       },
//     };
//   } catch (error) {
//     throw error;
//   }
// };

/**
 * Create new user account
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User creation response
 */
export const createUser = async (userData) => {
  try {
    // Use current auth token (guest/user) to create customer
    const accessToken = await getAuthToken();

    // Format phone number with country code
    const formattedPhone = userData.phoneNumber.startsWith("91")
      ? userData.phoneNumber
      : `91${userData.phoneNumber}`;

    const url = `${SFCC_CONFIG.baseUrl}/customer/shopper-customers/v1/organizations/${SFCC_CONFIG.organizationId}/customers?siteId=${SFCC_CONFIG.siteId}`;

    // console.log("🔧 CUSTOMER CREATION DEBUG:");
    // console.log("URL:", url);
    // console.log("Organization ID:", SFCC_CONFIG.organizationId);
    // console.log("Site ID:", SFCC_CONFIG.siteId);
    // console.log(
    //   "Access Token (first 20 chars):",
    //   accessToken?.substring(0, 20) + "..."
    // );

    // build customer object WITHOUT optional fields first
    const customerPayload = {
      login: formattedPhone,
      email: userData.email || `${formattedPhone}@sotbella.com`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneMobile: formattedPhone,
    };

    // add DOB only if present
    if (userData.birthday) {
      customerPayload.birthday = userData.birthday; // "YYYY-MM-DD"
    }

    // add gender only if user actually selected something
    if (
      userData.gender !== undefined &&
      userData.gender !== null &&
      userData.gender !== "" &&
      Number(userData.gender) !== 0
    ) {
      customerPayload.gender = userData.gender;
    }

    const payload = {
      customer: customerPayload,
      password: userData.password,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `User creation failed: ${response.status} - ${errorData}`,
      );
    }

    const userData_response = await response.json();

    return {
      success: true,
      data: userData_response,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user exists by attempting to send OTP
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<Object>} Result with success status and user existence
 */
export const checkUserExists = async (phoneNumber) => {
  try {
    await sendOTP(phoneNumber);
    return {
      success: true,
      userExists: true,
      message: "OTP sent successfully",
    };
  } catch (error) {
    // If send OTP fails, user doesn't exist
    return {
      success: false,
      userExists: false,
      message: "User not found",
    };
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token data
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const url = `${SFCC_CONFIG.baseUrl}/shopper/auth/v1/organizations/${SFCC_CONFIG.organizationId}/oauth2/token`;

    const formData = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: getBasicAuth(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();

    return {
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      },
    };
  } catch (error) {
    throw error;
  }
};

// Logout Customer (SLAS)
export const logoutCustomerSLAS = async () => {
  const tokenObj = getAuthTokenObject();
  const accessToken = tokenObj?.access_token;
  const refreshToken = tokenObj?.refresh_token;

  if (!accessToken || !refreshToken) {
    // console.warn("⚠️ SLAS logout skipped: access_token or refresh_token missing", {
    //   hasAccessToken: !!accessToken,
    //   hasRefreshToken: !!refreshToken,
    //   tokenObj,
    // });
    return { skipped: true };
  }

  const url = new URL(
    `${SFCC_CONFIG.baseUrl}/shopper/auth/v1/organizations/${SFCC_CONFIG.organizationId}/oauth2/logout`,
    window.location.origin,
  );

  url.searchParams.set("client_id", SFCC_CONFIG.clientId);
  url.searchParams.set("refresh_token", refreshToken);
  url.searchParams.set("channel_id", SFCC_CONFIG.siteId);

  // console.log("🔴 SLAS LOGOUT URL:", url.toString());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-dw-client-id": SFCC_CONFIG.clientId, // ✅ often required
    },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    // console.error("❌ SLAS logout error:", res.status, text);
    throw new Error(
      `SLAS logout failed (${res.status}): ${text || res.statusText}`,
    );
  }

  // logout may return json OR empty-ish
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
};

/**
 * Get stored login response data from localStorage
 * @returns {Object} Login response data
 */
export const getStoredLoginData = () => {
  return {
    access_token: localStorage.getItem("ACCESS_TOKEN"),
    id_token: localStorage.getItem("ID_TOKEN"),
    refresh_token: localStorage.getItem("REFRESH_TOKEN"),
    expires_in: localStorage.getItem("EXPIRES_IN"),
    refresh_token_expires_in: localStorage.getItem("REFRESH_TOKEN_EXPIRES_IN"),
    token_type: localStorage.getItem("TOKEN_TYPE"),
    usid: localStorage.getItem("USID"),
    customer_id: localStorage.getItem("CUSTOMER_ID"),
    enc_user_id: localStorage.getItem("ENC_USER_ID"),
    idp_access_token: localStorage.getItem("IDP_ACCESS_TOKEN"),
    idp_refresh_token: localStorage.getItem("IDP_REFRESH_TOKEN"),
    dnt: localStorage.getItem("DNT"),
  };
};

/**
 * Clear stored login response data from localStorage
 */
export const clearStoredLoginData = () => {
  const loginResponseKeys = [
    "ACCESS_TOKEN",
    "ID_TOKEN",
    "REFRESH_TOKEN",
    "EXPIRES_IN",
    "REFRESH_TOKEN_EXPIRES_IN",
    "TOKEN_TYPE",
    "USID",
    "CUSTOMER_ID",
    "ENC_USER_ID",
    "IDP_ACCESS_TOKEN",
    "IDP_REFRESH_TOKEN",
    "DNT",
  ];

  loginResponseKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/**
 * Clear stored guest token data from localStorage
 */
export const clearStoredGuestData = () => {
  const guestDataKeys = [
    "GUEST_ACCESS_TOKEN",
    "GUEST_ID_TOKEN",
    "GUEST_REFRESH_TOKEN",
    "GUEST_EXPIRES_IN",
    "GUEST_REFRESH_TOKEN_EXPIRES_IN",
    "GUEST_TOKEN_TYPE",
    "GUEST_USID",
    "GUEST_CUSTOMER_ID",
    "GUEST_ENC_USER_ID",
    "GUEST_IDP_ACCESS_TOKEN",
    "GUEST_IDP_REFRESH_TOKEN",
    "GUEST_DNT",
  ];

  guestDataKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/**
 * Get stored guest token data from localStorage
 * @returns {Object} Guest token data
 */
export const getStoredGuestData = () => {
  try {
    const guestToken = localStorage.getItem("guest_token");
    if (!guestToken) {
      return {};
    }

    const guestData = JSON.parse(guestToken);
    return {
      access_token: guestData.access_token,
      refresh_token: guestData.refresh_token,
      customer_id: guestData.customer_id,
      refresh_token_expires_in: guestData.refresh_token_expires_at
        ? Math.floor((guestData.refresh_token_expires_at - Date.now()) / 1000)
        : 0,
      generated_at: guestData.generated_at,
      last_refreshed_at: guestData.last_refreshed_at,
    };
  } catch (error) {
    return {};
  }
};

/**
 * Get current customer ID (from either user or guest data)
 * @returns {string|null} Current customer ID or null
 */
export const getCurrentCustomerId = async () => {
  // Use the centralized function from auth_token object
  return await getCustomerId();
};

/**
 * Get current user data (either logged-in user or guest)
 * @returns {Object} Current user data
 */
export const getCurrentUserData = () => {
  const userData = getStoredLoginData();
  const guestData = getStoredGuestData();

  // If user is logged in, return user data
  if (userData.customer_id) {
    return {
      ...userData,
      isGuest: false,
      type: "user",
    };
  }

  // Otherwise return guest data
  if (guestData.customer_id) {
    return {
      ...guestData,
      isGuest: true,
      type: "guest",
    };
  }

  return null;
};

export { SFCC_CONFIG };
