/**
 * API Services Index
 * Centralized exports for all API services
 */

// Token Management
export { default as tokenManager, getValidToken, clearTokens, getTokenStatus } from './tokenManager.js';

// SFCC API Client
export { default as sfccApiClient, sfccGet, sfccPost, sfccPut, sfccDelete, sfccPatch } from '../sfccApiClient.js';

// Home API
export { fetchHomePageContent } from './homeapi.js';

export { fetchContentPage } from './policies.js';

// Categories API
export { fetchCategories, fetchRootCategories, transformCategoriesData } from './categories.js';

// Guest Cart Service
export { default as GuestCartService } from './guestCart';

// Re-export existing services
export * from './auth.js';
export * from './sfccOrders.js';
export * from './wishlist.js';

// Export customer services
export {
  getCustomer,
  getCustomerMe,
  getCustomerProfile,
  createCustomerAddress,
  getCustomerAddressById,
  updateCustomerAddress,
  deleteCustomerAddress,
  updateCustomerDetails
} from './sfccCustomers.js';