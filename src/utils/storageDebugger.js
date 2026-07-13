/**
 * Storage Debugger - Utility for debugging localStorage state
 * Provides functions to inspect and manage localStorage data
 */

import storageManager from './storageManager';

class StorageDebugger {
  /**
   * Log current storage state to console
   */
  static logStorageState() {
    ('🔍 Current Storage State:');
    ('========================');
    
    const state = storageManager.getStorageState();
    
    ('👤 User Data:', state.user);
    ('👻 Guest Data:', state.guest);
    ('🛒 Cart Data:', state.cart);
    ('⚙️ App Data:', state.app);
    
    const authState = storageManager.getAuthState();
    ('🔐 Auth State:', authState);
  }

  /**
   * Clear all data and show before/after state
   */
  static clearAllAndLog() {
    ('🧹 Clearing ALL data...');
    this.logStorageState();
    
    storageManager.clearAllData();
    
    ('✅ All data cleared');
    this.logStorageState();
  }

  /**
   * Clear only user data and show before/after state
   */
  static clearUserAndLog() {
    ('🧹 Clearing USER data only...');
    this.logStorageState();
    
    storageManager.clearUserData();
    
    ('✅ User data cleared, guest data preserved');
    this.logStorageState();
  }

  /**
   * Clear only guest data and show before/after state
   */
  static clearGuestAndLog() {
    ('🧹 Clearing GUEST data only...');
    this.logStorageState();
    
    storageManager.clearGuestData();
    
    ('✅ Guest data cleared, user data preserved');
    this.logStorageState();
  }

  /**
   * Show storage usage statistics
   */
  static showStorageStats() {
    let totalSize = 0;
    const stats = {
      user: { count: 0, size: 0 },
      guest: { count: 0, size: 0 },
      cart: { count: 0, size: 0 },
      app: { count: 0, size: 0 },
      other: { count: 0, size: 0 }
    };

    // Calculate sizes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      totalSize += size;

      if (storageManager.userKeys.includes(key)) {
        stats.user.count++;
        stats.user.size += size;
      } else if (storageManager.guestKeys.includes(key)) {
        stats.guest.count++;
        stats.guest.size += size;
      } else if (storageManager.cartKeys.includes(key)) {
        stats.cart.count++;
        stats.cart.size += size;
      } else if (storageManager.appKeys.includes(key)) {
        stats.app.count++;
        stats.app.size += size;
      } else {
        stats.other.count++;
        stats.other.size += size;
      }
    }

    ('📊 Storage Statistics:');
    ('=====================');
    (`Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
    (`User Data: ${stats.user.count} items, ${(stats.user.size / 1024).toFixed(2)} KB`);
    (`Guest Data: ${stats.guest.count} items, ${(stats.guest.size / 1024).toFixed(2)} KB`);
    (`Cart Data: ${stats.cart.count} items, ${(stats.cart.size / 1024).toFixed(2)} KB`);
    (`App Data: ${stats.app.count} items, ${(stats.app.size / 1024).toFixed(2)} KB`);
    (`Other Data: ${stats.other.count} items, ${(stats.other.size / 1024).toFixed(2)} KB`);
  }

  /**
   * Export storage state as JSON
   */
  static exportStorageState() {
    const state = storageManager.getStorageState();
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storage-state-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    ('📁 Storage state exported');
  }

  /**
   * Simulate logout process
   */
  static simulateLogout() {
    ('🚪 Simulating logout process...');
    this.logStorageState();
    
    storageManager.clearUserData();
    
    ('✅ Logout simulation complete');
    this.logStorageState();
  }

  /**
   * Simulate login process
   */
  static simulateLogin() {
    ('🔐 Simulating login process...');
    
    // Add some mock user data
    const mockUserData = {
      id: 'mock-user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '919876543210'
    };
    
    localStorage.setItem('user_data', JSON.stringify(mockUserData));
    localStorage.setItem('ACCESS_TOKEN', 'mock-access-token-123');
    localStorage.setItem('CUSTOMER_ID', 'mock-customer-123');
    
    ('✅ Login simulation complete');
    this.logStorageState();
  }
}

// Make debugger available globally in development
if (import.meta.env.DEV) {
  window.storageDebugger = StorageDebugger;
  ('🔧 Storage Debugger available as window.storageDebugger');
  ('Available methods:');
  ('- storageDebugger.logStorageState()');
  ('- storageDebugger.clearAllAndLog()');
  ('- storageDebugger.clearUserAndLog()');
  ('- storageDebugger.clearGuestAndLog()');
  ('- storageDebugger.showStorageStats()');
  ('- storageDebugger.exportStorageState()');
  ('- storageDebugger.simulateLogout()');
  ('- storageDebugger.simulateLogin()');
}

export default StorageDebugger;
