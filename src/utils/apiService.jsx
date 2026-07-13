import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { getAuthToken } from "./tokenUtils";
import axios from "axios";

// Create an instance of axios with the base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Helper function to get the token
const getToken = async () => {
  try {
    // Use the auth token manager to get a valid token (handles expiration automatically)
    return await getAuthToken();
  } catch (error) {
    // Fallback to localStorage for backward compatibility
    return localStorage.getItem(LOCAL_KEYS.TOKEN) || null;
  }
};

export const apiRequest = async (
  method,
  endpoint,
  data = null,
  params = {},
  isFormData = false
) => {
  try {
    const token = await getToken();

    const config = {
      method,
      url: endpoint,
      params,
      headers: {},
    };

    // Add the token to the Authorization header if it exists
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // If the data is FormData, set appropriate Content-Type
    if (isFormData) {
      config.data = data;
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.data = data;
      config.headers["Content-Type"] = "application/json";
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message || "Unknown Error";
  }
};

// Helpers for common HTTP methods
export const getRequest = (endpoint, params) =>
  apiRequest("get", endpoint, null, params);

export const postRequest = (endpoint, data, isFormData = false) =>
  apiRequest("post", endpoint, data, {}, isFormData);

export const deleteRequest = (endpoint, data) =>
  apiRequest("delete", endpoint, data);

export const patchRequest = (endpoint, data, isFormData = false) =>
  apiRequest("patch", endpoint, data, {}, isFormData);
