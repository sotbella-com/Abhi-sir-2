/**
 * Basket Restoration Helper
 * Handles reliable basket item restoration with retry mechanism
 */

/**
 * Restore basket items with retry mechanism
 * @param {Array} items - Basket items to restore
 * @param {Object} options - Restoration options
 * @returns {Promise<Object>} Restoration result
 */
export async function restoreBasketItemsWithRetry(items, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onProgress = null
  } = options;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      error: 'No items to restore',
      restoredItems: [],
      failedItems: []
    };
  }

  let attempt = 0;
  let restoredItems = [];
  let failedItems = [];

  while (attempt < maxRetries) {
    attempt++;
    
    if (onProgress) {
      onProgress({ attempt, maxRetries, status: 'retrying' });
    }

    try {
      // Import restore function dynamically
      const { useUnifiedCartStore } = await import('../context/unifiedCartStore');
      const { restoreBasketItems } = useUnifiedCartStore.getState();

      // Attempt restoration
      const result = await restoreBasketItems(items);
      
      if (result && result.success) {
        restoredItems = result.restoredItems || items;
       
        
        return {
          success: true,
          attempt,
          restoredItems,
          failedItems: []
        };
      } else {
        // Partial success or failure
        restoredItems = result?.restoredItems || [];
        failedItems = result?.failedItems || items.filter(item => 
          !restoredItems.some(restored => restored.productId === item.productId)
        );
        
        if (restoredItems.length === items.length) {
          // All items restored
          return {
            success: true,
            attempt,
            restoredItems,
            failedItems: []
          };
        }
      }
    } catch (error) {
      // console.error(`❌ Basket restoration attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Last attempt failed
        return {
          success: false,
          attempt,
          error: error.message,
          restoredItems: [],
          failedItems: items
        };
      }
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  return {
    success: false,
    attempt: maxRetries,
    error: 'All restoration attempts failed',
    restoredItems,
    failedItems
  };
}

/**
 * Enhanced basket snapshot with metadata
 * @param {Array} items - Basket items
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Enhanced snapshot
 */
export function createBasketSnapshot(items, metadata = {}) {
  return {
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.quantity || 1,
      // Include variant info if available
      variantId: item.variantId || item.productId,
      // Include pricing info for validation
      price: item.price || item.basePrice,
    })),
    metadata: {
      timestamp: Date.now(),
      itemCount: items.length,
      ...metadata
    }
  };
}

/**
 * Validate basket snapshot before restoration
 * @param {Object} snapshot - Basket snapshot
 * @returns {boolean} True if valid
 */
export function validateBasketSnapshot(snapshot) {
  if (!snapshot) return false;
  if (!snapshot.items || !Array.isArray(snapshot.items)) return false;
  if (snapshot.items.length === 0) return false;
  
  // Check if snapshot is too old (optional - 1 hour expiry)
  const maxAge = 60 * 60 * 1000; // 1 hour
  if (snapshot.metadata?.timestamp) {
    const age = Date.now() - snapshot.metadata.timestamp;
    if (age > maxAge) {
      // console.warn('⚠️ Basket snapshot is too old:', {
      //   age: Math.round(age / 1000 / 60),
      //   maxAge: Math.round(maxAge / 1000 / 60)
      // });
      return false;
    }
  }
  
  return true;
}

