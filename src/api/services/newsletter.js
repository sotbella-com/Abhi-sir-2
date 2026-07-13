import sfccApiClient from '../sfccApiClient';
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from '../../utils/geolocation';

/**
 * Newsletter subscription service
 * Handles email registration for newsletter subscription
 */

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID || "f_ecom_blxz_dev";

/**
 * Subscribe to newsletter
 * @param {string} email - Email address to subscribe
 * @returns {Promise<Object>} API response
 */
export const subscribeToNewsletter = async (email) => {
  try {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address');
    }

    // Prepare JSON data as per API specification
    const requestData = {
      email: email.trim()
    };

    // Get dynamic site ID
    const siteId = import.meta.env.VITE_SFCC_SITE_ID || DEFAULT_SITE_ID;
    
    // Try alternative newsletter subscription approach
    // Some SFCC implementations use different endpoints for newsletter signup
    const response = await sfccApiClient.post(
      `/custom/custom-data/v1/organizations/${ORG_ID}/emailRegistration?siteId=${siteId}`,
      requestData
    );

    return {
      success: true,
      data: response.data,
      message: 'Successfully subscribed to newsletter!'
    };
  } catch (error) {
    
    // Handle specific error cases
    if (error.response?.status === 409) {
      return {
        success: false,
        error: 'This email is already subscribed to our newsletter.',
        message: 'You are already subscribed!'
      };
    }
    
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Invalid email address.',
        message: 'Please enter a valid email address.'
      };
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication failed. Newsletter subscription may require different permissions.',
        message: 'Unable to subscribe at this time. Please contact support.'
      };
    }


    return {
      success: false,
      error: error.message || 'Failed to subscribe to newsletter',
      message: 'Something went wrong. Please try again later.'
    };
  }
};

/**
 * Check if email is already subscribed
 * @param {string} email - Email address to check
 * @returns {Promise<Object>} API response
 */
export const checkSubscriptionStatus = async (email) => {
  try {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    // Get dynamic site ID
    const siteId = import.meta.env.VITE_SFCC_SITE_ID || DEFAULT_SITE_ID || getCurrentSiteIdSync();
    
    const response = await sfccApiClient.get(
      `/custom/custom-data/v1/organizations/${ORG_ID}/emailRegistration?siteId=${siteId}&email=${encodeURIComponent(email.trim())}`
    );

    return {
      success: true,
      data: response.data,
      isSubscribed: response.data?.isSubscribed || false
    };
  } catch (error) {
    
    return {
      success: false,
      error: error.message || 'Failed to check subscription status',
      isSubscribed: false
    };
  }
};
