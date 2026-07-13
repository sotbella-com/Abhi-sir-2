/**
 * Image URL processing utilities
 * Handles image URLs from SFCC API and provides fallbacks
 */

/**
 * Process image URL to use Vercel proxy if needed
 * @param {string} imageUrl - Original image URL from API
 * @returns {string} Processed image URL
 */
export function processImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Check if we're in development or production
    const isDevelopment = import.meta.env.DEV;
    const isVercel = import.meta.env.VITE_VERCEL === 'true';
    const isAWS = import.meta.env.VITE_AWS === 'true';
    const isEC2 = import.meta.env.VITE_EC2 === 'true';
    
    // Check if it's from SFCC and needs proxying
    if (imageUrl.includes('dyp4l3dm.api.commercecloud.salesforce.com') || 
        imageUrl.includes('blxz-001.dx.commercecloud.salesforce.com')) {
      
      // Extract the path after the domain
      const url = new URL(imageUrl);
      const path = url.pathname;
      
      // Use proxy for SFCC API images
      return `/sfcc${path}`;
    }
    
    if (imageUrl.includes('stgsfcc.sotbella.com')) {
      // For stgsfcc.sotbella.com, handle differently based on environment
      if (isDevelopment) {
        // In development, use the original URL directly
        return imageUrl;
      } else {
        // In production, use proxy based on platform
        const url = new URL(imageUrl);
        const path = url.pathname;
        
        // Check if it's a static asset (image/video)
        if (path.includes('/on/demandware.static/')) {
          // Extract just the filename for the proxy route
          const filename = path.split('/').pop();
          
          if (isVercel) {
            return `/proxy-images/${filename}`;
          } else if (isAWS || isEC2) {
            return `/proxy-images/${filename}`;
          } else {
            // Fallback to original URL
            return imageUrl;
          }
        } else {
          // Use the general proxy for other paths
          if (isVercel) {
            return `/stgsfcc${path}`;
          } else if (isAWS || isEC2) {
            return `/stgsfcc${path}`;
          } else {
            // Fallback to original URL
            return imageUrl;
          }
        }
      }
    }
    
    return imageUrl;
  }
  
  // If it's a relative path, make it absolute
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
}

/**
 * Get a fallback image URL
 * @returns {string} Fallback image URL
 */
export function getFallbackImageUrl() {
  return '/assets/placeholder-image.png';
}

/**
 * Check if an image URL is valid
 * @param {string} url - Image URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidImageUrl(url) {
  if (!url) return false;
  
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    // If it's not a full URL, check if it's a valid path
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Create an image with error handling
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {Object} props - Additional props
 * @returns {Object} Image element with error handling
 */
export function createImageWithErrorHandling(src, alt = '', props = {}) {
  const processedSrc = processImageUrl(src);
  
  return {
    src: processedSrc,
    alt,
    onError: (e) => {
      
      // Try fallback
      if (e.target.src !== getFallbackImageUrl()) {
        e.target.src = getFallbackImageUrl();
      } else {
        // Show error state
        e.target.style.backgroundColor = '#f0f0f0';
        e.target.style.display = 'flex';
        e.target.style.alignItems = 'center';
        e.target.style.justifyContent = 'center';
        e.target.innerHTML = 'Image unavailable';
      }
    },
    ...props
  };
}
