# E-Commerce Website - Comprehensive Analysis

## 📋 Project Overview

**Project Name:** Sotbella (B2C Tailwind)
**Type:** E-Commerce Platform
**Backend:** Salesforce Commerce Cloud (SFCC)
**Frontend:** React 19 + Vite 6
**Repository:** https://github.com/sotbella-com/OUT-Website

---

## 🛠️ Technology Stack

### Frontend Framework & Build Tools
- **React:** 19.1.1 (Latest version)
- **Vite:** 6.3.5 (Build tool & dev server)
- **React Router DOM:** 7.1.1 (Routing)
- **TypeScript:** Not used (Pure JavaScript/JSX)

### UI Libraries & Styling
- **Chakra UI:** 2.10.9 (Primary UI component library)
- **Emotion:** 11.14.0 (CSS-in-JS for Chakra UI)
- **Tailwind CSS:** Not directly used (but project name suggests Tailwind)
- **Slick Carousel:** 1.8.1 (Image/product carousels)
- **Swiper:** 12.0.1 (Modern slider component)
- **Framer Motion:** 12.23.13 (Animations)
- **Lottie React:** 2.4.1 (JSON animations)

### State Management
- **Zustand:** 5.0.5 (Lightweight state management)
- **React Query (TanStack Query):** 5.75.4 (Server state management)
- **React Context API:** (Auth, Footer contexts)

### API & Data Fetching
- **Axios:** 1.7.9 (HTTP client)
- **Fetch API:** (Native browser API, primary method)

### Payment Integration
- **Stripe:** 7.4.0 (Payment processing)
  - `@stripe/react-stripe-js`
  - `@stripe/stripe-js`
- **Juspay Blaze SDK:** 0.7.0 (Alternative payment gateway)

### Form & Input Libraries
- **React Select:** 5.10.0 (Dropdowns)
- **React Phone Input 2:** 2.15.1 (Phone number input)
- **Ant Design:** 5.23.1 (Some components)

### Utilities
- **Lodash:** 4.17.21 (Utility functions)
- **HE:** 1.2.0 (HTML entity encoding/decoding)
- **React Toastify:** 11.0.3 (Notifications)
- **React Infinite Scroll:** 6.1.0 (Infinite scrolling)
- **React Intersection Observer:** 9.16.0 (Lazy loading)

### Development Tools
- **ESLint:** 9.17.0 (Code linting)
- **Terser:** 5.44.0 (Minification)
- **PM2:** (Process manager for production)

---

## 🏗️ Architecture Overview

### Project Structure
```
B2C_Tailwaind/
├── src/
│   ├── api/                    # API services & clients
│   │   ├── services/          # Individual service modules
│   │   └── sfccApiClient.js   # Main SFCC API client
│   ├── components/            # Reusable components
│   │   ├── atoms/             # Smallest components
│   │   ├── molecules/        # Composite components
│   │   ├── compounds/         # Complex components
│   │   ├── layouts/           # Layout components
│   │   └── common/            # Shared components
│   ├── context/               # React Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   ├── unifiedCartStore.js # Cart state (Zustand)
│   │   └── wishlistStore.js   # Wishlist state
│   ├── pages/                 # Page components
│   │   ├── home/              # Homepage
│   │   ├── ProductDetails/    # Product pages
│   │   ├── Cart/              # Shopping cart
│   │   ├── Auth/              # Authentication
│   │   ├── profile/           # User profile
│   │   └── Shipping/          # Checkout
│   ├── utils/                 # Utility functions
│   │   ├── tokenUtils.js      # Token management
│   │   ├── authTokenManager.js # Auth token lifecycle
│   │   └── storageManager.js  # LocalStorage management
│   ├── constants/             # Constants & config
│   ├── Hooks/                 # Custom React hooks
│   └── main.jsx               # Application entry point
├── vite.config.js             # Vite configuration
├── ecosystem.config.cjs       # PM2 configuration
└── nginx.conf                 # Nginx reverse proxy config
```

### Application Flow

1. **Entry Point:** `main.jsx`
   - Sets up React Router
   - Configures Chakra UI theme
   - Initializes React Query
   - Wraps app with AuthProvider

2. **Authentication Flow:**
   - Guest tokens generated automatically
   - User login via OTP (passwordless)
   - Token management via `authTokenManager`
   - Unified `auth_token` object in localStorage

3. **Cart Management:**
   - Unified cart store (Zustand) handles both guest & customer carts
   - Automatic cart merging on login
   - Guest cart → Customer cart transition
   - Real-time cart updates via custom events

4. **API Communication:**
   - SFCC API client with automatic token refresh
   - Proxy setup for development (`/sfcc` → SFCC API)
   - Direct API calls in production

---

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Salesforce Commerce Cloud Configuration
VITE_SFCC_SHORTCODE=dyp4l3dm
VITE_SFCC_ORG_ID=f_ecom_blxz_stg
VITE_SFCC_SITE_ID=sotbella_in
VITE_SFCC_BASE_URL=/sfcc  # Proxy base (dev) or direct URL (prod)
VITE_SFCC_CLIENT_ID=<client_id>
VITE_SFCC_CLIENT_SECRET=<client_secret>
VITE_SFCC_LOCALE=en-IN

# Optional Basic Auth (fallback)
VITE_SFCC_BASIC_AUTH_USERNAME=<username>
VITE_SFCC_BASIC_AUTH_PASSWORD=<password>

# Passwordless Login
VITE_SFCC_PASSWORDLESS_CALLBACK_URL=<callback_url>

# Application URLs
VITE_API_URL=<api_url>
VITE_BASE_URL=<base_url>
VITE_IMAGE_URL=<image_cdn_url>

# Payment Gateway
VITE_STRIPE_PUBLISHABLE_KEY=<stripe_publishable_key>
```

### Environment-Specific Behavior

**Development:**
- Uses Vite proxy (`/sfcc`) to avoid CORS issues
- Runs on port 3005
- Hot Module Replacement (HMR) enabled
- Debug utilities available in console

**Production:**
- Direct API calls to SFCC
- Nginx reverse proxy for `/sfcc` endpoint
- PM2 process manager
- Runs on port 3000
- Optimized builds with code splitting

---

## 🔌 API Integration

### Salesforce Commerce Cloud (SFCC) Integration

**Base Configuration:**
- **Shortcode:** `dyp4l3dm`
- **Organization ID:** `f_ecom_blxz_stg`
- **Site ID:** `sotbella_in`
- **API Base:** `https://dyp4l3dm.api.commercecloud.salesforce.com`

**Key API Endpoints Used:**

1. **Authentication:**
   - `/shopper/auth/v1/organizations/{org}/oauth2/token` - Token generation
   - `/shopper/auth/v1/organizations/{org}/oauth2/passwordless/login` - OTP login
   - `/shopper/auth/v1/organizations/{org}/oauth2/passwordless/verify` - OTP verification

2. **Products:**
   - `/product/shopper-products/v1/organizations/{org}/products` - Product search
   - `/product/shopper-products/v1/organizations/{org}/products/{id}` - Product details

3. **Cart/Basket:**
   - `/checkout/shopper-baskets/v2/organizations/{org}/baskets` - Basket operations
   - `/customer/shopper-customers/v1/organizations/{org}/customers/{id}/baskets` - Customer baskets

4. **Orders:**
   - `/checkout/shopper-orders/v1/organizations/{org}/orders` - Order creation
   - `/checkout/shopper-orders/v1/organizations/{org}/orders/{id}` - Order details

5. **Customers:**
   - `/customer/shopper-customers/v1/organizations/{org}/customers/{id}` - Customer profile

**API Client Features:**
- Automatic token refresh
- Request timeout (30 seconds)
- Error handling & retry logic
- CORS handling via proxy

---

## 🗄️ State Management

### 1. **Authentication State (AuthContext)**
- **Location:** `src/context/AuthContext.jsx`
- **Purpose:** User authentication & session management
- **State:**
  - User data (customerId, email, firstName, lastName)
  - Token management
  - Login/logout state
- **Actions:**
  - `sendOTP()` - Send OTP for login
  - `verifyOTP()` - Verify OTP & login
  - `createUser()` - Register new user
  - `logout()` - Clear session

### 2. **Cart State (Zustand Store)**
- **Location:** `src/context/unifiedCartStore.js`
- **Purpose:** Unified cart management (guest + customer)
- **State:**
  - Basket data
  - Basket ID & type (guest/customer)
  - Item count & total
  - Loading & error states
- **Key Actions:**
  - `initializeCart()` - Initialize cart on app start
  - `addToBasket()` - Add product to cart
  - `updateItemQuantity()` - Update item quantity
  - `removeFromBasket()` - Remove item
  - `handleLogin()` - Merge guest cart on login
  - `handleLogout()` - Switch to guest cart

### 3. **Wishlist State (Zustand Store)**
- **Location:** `src/context/wishlistStore.js`
- **Purpose:** User wishlist management

### 4. **Address State (Zustand Store)**
- **Location:** `src/context/useAddressStore.js`
- **Purpose:** Shipping address management

### 5. **Server State (React Query)**
- **Purpose:** API data caching & synchronization
- **Features:**
  - Automatic refetching
  - Cache management
  - Optimistic updates

---

## 🛒 Shopping Cart Architecture

### Cart Types

1. **Guest Cart:**
   - Temporary basket (`temporaryBasket: true`)
   - Tied to guest customer ID
   - Stored in memory (not persisted)
   - Merged into customer cart on login

2. **Customer Cart:**
   - Permanent basket (`temporaryBasket: false`)
   - Tied to logged-in customer ID
   - Persisted in localStorage
   - Synced across devices

### Cart Flow

```
App Start
  ↓
Check Auth State
  ↓
┌─────────────────┬─────────────────┐
│   Guest User    │  Logged-in User │
└─────────────────┴─────────────────┘
  ↓                    ↓
Create/Get          Get Customer
Guest Basket       Basket
  ↓                    ↓
Store in Memory    Store in localStorage
  ↓                    ↓
     Unified Cart Store
```

### Cart Merging Logic

When user logs in:
1. Get existing customer basket
2. Get guest basket items
3. Merge guest items into customer basket
4. Delete guest basket
5. Switch to customer basket
6. Clear guest data

---

## 💳 Payment Integration

### Payment Methods

1. **Stripe (Online Payment)**
   - Integration: `@stripe/react-stripe-js`
   - Payment Intent creation
   - Redirect to Stripe checkout
   - Webhook handling for payment confirmation

2. **Cash on Delivery (COD)**
   - Direct order placement
   - No payment gateway required

3. **Wallet Payment**
   - Customer wallet balance
   - Partial/full payment support

### Checkout Flow

```
Cart Page
  ↓
Select Address
  ↓
Choose Payment Method
  ↓
┌──────────────┬──────────────┬──────────────┐
│   Stripe     │     COD      │    Wallet    │
└──────────────┴──────────────┴──────────────┘
  ↓                    ↓              ↓
Create Payment    Place Order    Apply Wallet
Intent                          + Remaining
  ↓                    ↓              ↓
Redirect to      Thank You      Stripe for
Stripe                          Remaining
  ↓
Payment
Confirmation
  ↓
Thank You Page
```

---

## 🚀 Deployment Architecture

### Production Setup

**Server:** AWS EC2
**Domain:** intl.sotbella360.com (Production)
**Process Manager:** PM2
**Web Server:** Nginx (Reverse Proxy)

### Deployment Flow

1. **Build Process:**
   ```bash
   npm run build  # Creates optimized production build
   ```

2. **PM2 Configuration:**
   - App name: `sotbella`
   - Script: `npm run preview`
   - Port: 3000
   - Auto-restart: Enabled
   - Max memory: 1GB

3. **Nginx Configuration:**
   - Main app: `http://localhost:3000`
   - SFCC proxy: `/sfcc/` → SFCC API
   - Image proxy: `/stgsfcc/` → Image CDN
   - Static assets caching
   - Gzip compression
   - Security headers

### Deployment Script

Location: `ec2-deploy.sh`
- Installs Node.js 18
- Sets up PM2
- Configures Nginx
- Clones repository
- Builds application
- Starts services

---

## 🔑 Key Features

### 1. **Authentication**
- Passwordless login (OTP via phone/email)
- Guest user support
- Automatic token refresh
- Session persistence

### 2. **Product Management**
- Product search & filtering
- Category browsing
- Product details with image gallery
- Product recommendations

### 3. **Shopping Cart**
- Add/remove items
- Quantity updates
- Guest cart persistence
- Cart merging on login
- Real-time cart updates

### 4. **Checkout**
- Address management
- Multiple payment methods
- Order placement
- Order tracking

### 5. **User Account**
- Profile management
- Order history
- Address book
- Wallet & coupons
- Wishlist

### 6. **Content Management**
- Dynamic homepage sections
- Blog integration
- Policy pages (Terms, Privacy, etc.)

---

## 📦 Key Dependencies & Their Purpose

| Package | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `@chakra-ui/react` | UI component library |
| `zustand` | Lightweight state management |
| `@tanstack/react-query` | Server state & caching |
| `axios` | HTTP client (legacy, mostly using fetch) |
| `@stripe/stripe-js` | Payment processing |
| `lottie-react` | Animations |
| `react-slick` | Carousels |
| `react-toastify` | Notifications |

---

## 🔍 Code Patterns & Best Practices

### 1. **Token Management**
- Unified `auth_token` object in localStorage
- Automatic token refresh before expiry
- Separate guest & user token handling
- Token validation on API calls

### 2. **Error Handling**
- Centralized error handlers
- Cart error recovery mechanisms
- User-friendly error messages
- Retry logic for failed requests

### 3. **Performance Optimizations**
- Code splitting (vendor, router chunks)
- Lazy loading components
- Image optimization
- React Query caching
- Gzip compression

### 4. **Security**
- Token-based authentication
- CORS handling via proxy
- Security headers in Nginx
- Input validation
- XSS protection

---

## 🐛 Debugging & Development Tools

### Available Debug Functions (Development Only)

```javascript
// Cart debugging
window.cartDebug.debugCartState()  // Log current cart state
window.cartDebug.testCartUpdate()   // Test cart update event
window.cartDebug.testRefreshCart()  // Refresh cart from API
window.cartDebug.getCartState()     // Get full cart state
window.cartDebug.addToCart(productId, quantity)  // Add item
```

### Storage Debugging
- `storageDebugger.js` - Debug localStorage
- `localStorageCleaner.js` - Clean up storage
- `cleanupScript.js` - General cleanup

---

## 📝 Important Notes

1. **Token Management:**
   - All APIs use unified `auth_token` object
   - Tokens auto-refresh before expiry
   - Guest tokens generated automatically

2. **Cart Persistence:**
   - Guest carts: Memory only (not persisted)
   - Customer carts: Persisted in localStorage
   - Basket IDs stored separately

3. **API Proxy:**
   - Development: Uses Vite proxy (`/sfcc`)
   - Production: Uses Nginx proxy (`/sfcc/`)
   - Direct API calls also supported

4. **Environment Variables:**
   - All must be prefixed with `VITE_`
   - Loaded at build time
   - No runtime environment switching

5. **Build Output:**
   - Output directory: `dist/`
   - Assets directory: `assets/`
   - Source maps: Disabled (production)
   - Minification: Terser

---

## 🔄 Data Flow Example: Add to Cart

```
User clicks "Add to Cart"
  ↓
updateCartCountImmediately()  // Instant UI feedback
  ↓
Check if basket exists
  ↓
┌─────────────────┬─────────────────┐
│   Guest Cart    │  Customer Cart   │
└─────────────────┴─────────────────┘
  ↓                    ↓
GuestCartService   Customer Basket API
.addToBasket()     .addToCustomerBasket()
  ↓                    ↓
Refresh Basket     Refresh Basket
  ↓                    ↓
setBasket()        setBasket()
  ↓                    ↓
Update Zustand Store
  ↓
Dispatch 'cartUpdated' event
  ↓
UI Components Re-render
```

---

## 🎯 Recommendations for Future Development

1. **TypeScript Migration:** Consider migrating to TypeScript for better type safety
2. **Testing:** Add unit tests (Jest) and E2E tests (Playwright/Cypress)
3. **Error Monitoring:** Integrate Sentry or similar for error tracking
4. **Analytics:** Implement proper analytics tracking (Google Analytics, etc.)
5. **Performance:** Add service worker for offline support
6. **Accessibility:** Improve ARIA labels and keyboard navigation
7. **Documentation:** Add JSDoc comments to API functions
8. **Environment Management:** Use `.env.example` file for documentation

---

## 📚 Additional Resources

- **Repository:** https://github.com/sotbella-com/OUT-Website
- **SFCC Documentation:** Salesforce Commerce Cloud API docs
- **Chakra UI Docs:** https://chakra-ui.com
- **React Query Docs:** https://tanstack.com/query

---

*Last Updated: Based on current codebase analysis*
*Branch: master-int*

