# Site ID Analysis - International Website

## Overview
This is an international website that supports multiple Salesforce Commerce Cloud (SFCC) site IDs based on user geolocation. The system automatically detects the user's country and maps it to the appropriate site ID.

## Configured Site IDs

The following site IDs are configured in `src/utils/geolocation.js`:

1. **sotbella_in** (Default) - United Arab Emirates
   - Countries: AE, United Arab Emirates, UAE
   - Also used as fallback for unmapped countries

2. **sotbella_uk** - United Kingdom
   - Countries: GB, United Kingdom

3. **sotbella_us** - United States
   - Countries: US, United States

4. **sotbella_eu** - European Union
   - Countries: All 27 EU member states (AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE)

## How Site ID Detection Works

1. **Geolocation Detection**: Uses IP-based geolocation services (ipapi.co, ip-api.com, geojs.io)
2. **Country Mapping**: Maps detected country code to site ID via `COUNTRY_TO_SITE_ID`
3. **Caching**: Results are cached in memory and localStorage for performance
4. **Manual Override**: Users can manually set site ID via `setManualSiteId()`
5. **Fallback**: Defaults to `sotbella_in` if detection fails

## Files Using Dynamic Site IDs (✅ Correct)

These files correctly use dynamic site IDs based on geolocation:

1. **src/utils/geolocation.js** - Core geolocation and site ID mapping
2. **src/Hooks/useSiteId.js** - React hook for site ID
3. **src/api/sfccApiClient.js** - Uses `getCurrentSiteIdSync()` in `buildUrl()`
4. **src/api/services/sfccSearchService.js** - Uses dynamic site ID
5. **src/api/services/enhancedProductSearch.js** - Uses dynamic site ID
6. **src/api/services/categories.js** - Uses dynamic site ID
7. **src/api/services/menuApi.js** - Uses dynamic site ID
8. **src/api/services/homeapi.js** - Uses dynamic site ID
9. **src/api/services/newsletter.js** - Uses dynamic site ID
10. **src/api/services/sfccCustomers.js** - Uses dynamic site ID via `withSite()`
11. **src/api/services/sfccPreferences.js** - Uses dynamic site ID
12. **src/pages/home/Search/NavSearch.jsx** - Passes `siteId: null` (uses dynamic)
13. **src/pages/Category/index.jsx** - Passes `siteId: null` (uses dynamic)
14. **src/pages/ProductDetails/components/similarProducts.jsx** - Passes `siteId: null` (uses dynamic)
15. **src/pages/ProductDetails/StyleWithList.jsx** - Passes `siteId: null` (uses dynamic)
16. **src/pages/Cart/YouMayLike.jsx** - Passes `siteId: null` (uses dynamic)

## Files Using Static Site IDs (❌ Needs Fix)

These files use static site IDs from environment variables and should be updated to use dynamic site IDs:

### 1. **src/api/services/auth.js**
   - **Line 8**: `siteId: import.meta.env.VITE_SFCC_SITE_ID` in `SFCC_CONFIG`
   - **Line 53**: `channel_id: SFCC_CONFIG.siteId || 'sotbella_in'` in `getClientCredentialsToken()`
   - **Line 97**: `channel_id: "sotbella_in"` (hardcoded) in `sendOTP()`
   - **Line 165**: `siteId=${SFCC_CONFIG.siteId}` in `verifyOTP()`
   - **Line 245**: `siteId=${SFCC_CONFIG.siteId}` in `createUser()`
   - **Impact**: Authentication and user creation may use wrong site ID

### 2. **src/api/services/tokenManager.js**
   - **Line 10**: `siteId: import.meta.env.VITE_SFCC_SITE_ID` in `TOKEN_CONFIG`
   - **Line 118**: `channel_id=${TOKEN_CONFIG.siteId}` in `generateNewToken()`
   - **Line 175**: `channel_id: TOKEN_CONFIG.siteId` in `refreshToken()`
   - **Line 470**: `channel_id: TOKEN_CONFIG.siteId` in `generateGuestToken()`
   - **Line 654**: `channel_id=${TOKEN_CONFIG.siteId}` in `refreshGuestToken()`
   - **Impact**: Token generation uses static site ID

### 3. **src/pages/profile/EditAddress.jsx**
   - **Line 59**: `siteId=${SFCC_CONFIG.siteId}` in `buildCustomerUrl()`
   - **Line 62**: `siteId=${SFCC_CONFIG.siteId}` in `buildAddressUrl()`
   - **Impact**: Address operations use wrong site ID

### 4. **src/pages/Shipping/EditShippingAddress.jsx**
   - **Line 65**: `siteId=${SFCC_CONFIG.siteId}` in `buildCustomerUrl()`
   - **Line 68**: `siteId=${SFCC_CONFIG.siteId}` in `buildAddressUrl()`
   - **Impact**: Shipping address operations use wrong site ID

### 5. **src/context/unifiedCartStore.js**
   - **Line 753**: `import.meta.env.VITE_SFCC_SITE_ID` in `addItemToCustomerBasket()`
   - **Line 832**: `import.meta.env.VITE_SFCC_SITE_ID` in `updateItemQuantity()`
   - **Line 913**: `import.meta.env.VITE_SFCC_SITE_ID` in `removeItemFromBasket()`
   - **Line 1007**: `import.meta.env.VITE_SFCC_SITE_ID` in `applyCoupon()`
   - **Line 1059**: `import.meta.env.VITE_SFCC_SITE_ID` in `removeCoupon()`
   - **Line 1084**: `import.meta.env.VITE_SFCC_SITE_ID` in `updateShippingMethod()`
   - **Impact**: Cart operations use wrong site ID

### 6. **src/api/services/guestCart.js**
   - **Line 38**: `import.meta.env.VITE_SFCC_SITE_ID` in `createGuestBasket()`
   - **Line 101**: `import.meta.env.VITE_SFCC_SITE_ID` in `addItemToGuestBasket()`
   - **Line 135**: `import.meta.env.VITE_SFCC_SITE_ID` in `updateGuestBasketItem()`
   - **Line 280**: `import.meta.env.VITE_SFCC_SITE_ID` in `removeGuestBasketItem()`
   - **Line 332**: `import.meta.env.VITE_SFCC_SITE_ID` in `getGuestBasket()`
   - **Impact**: Guest cart operations use wrong site ID

### 7. **src/api/services/sfccCheckout.js**
   - Uses `SFCC_CONFIG.siteId` (needs verification)
   - **Impact**: Checkout operations may use wrong site ID

### 8. **src/utils/authTokenManager.js**
   - **Line 87**: Uses `getCurrentSiteIdSync()` but falls back to `import.meta.env.VITE_SFCC_SITE_ID`
   - **Line 97**: `channel_id: siteId` - This one is partially correct but should ensure dynamic site ID

## Key Functions Available

### From `src/utils/geolocation.js`:
- `getCurrentSiteId()` - Async function to get current site ID
- `getCurrentSiteIdSync()` - Synchronous function (returns cached or default)
- `setManualSiteId(siteId)` - Manually override site ID
- `clearGeolocationCache()` - Clear cache and force re-detection
- `getDetectedCountry()` - Get detected country code
- `DEFAULT_SITE_ID` - Constant: 'sotbella_in'
- `COUNTRY_TO_SITE_ID` - Mapping object

### From `src/Hooks/useSiteId.js`:
- `useSiteId()` - React hook: `{ siteId, isLoading, error }`
- `useSiteIdSync()` - React hook: returns site ID synchronously

## Recommendations

1. **Update SFCC_CONFIG**: Make `siteId` a getter function instead of static value
2. **Update TOKEN_CONFIG**: Use dynamic site ID for token generation
3. **Update all cart operations**: Use `getCurrentSiteIdSync()` instead of env variable
4. **Update address operations**: Use dynamic site ID
5. **Update auth operations**: Use dynamic site ID for channel_id
6. **Consider site ID context**: Create a React context for site ID to avoid prop drilling

## Testing Checklist

- [ ] Test site ID detection for each country (UK, US, EU, UAE)
- [ ] Test manual site ID override
- [ ] Test cart operations with different site IDs
- [ ] Test authentication with different site IDs
- [ ] Test address operations with different site IDs
- [ ] Test product search with different site IDs
- [ ] Test checkout flow with different site IDs
- [ ] Verify localStorage caching works correctly
- [ ] Test fallback to default site ID when detection fails

