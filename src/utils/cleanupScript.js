/**
 * LocalStorage Cleanup Script
 * Run this script to clean up unnecessary data from localStorage
 * Available in development mode via console
 */

import localStorageCleaner from './localStorageCleaner';
import storageManager from './storageManager';

class CleanupScript {
  constructor() {
    this.cleaner = localStorageCleaner;
    this.storageManager = storageManager;
  }

  /**
   * Run full cleanup analysis
   */
  analyze() {
    ('🔍 Analyzing localStorage...');
    this.cleaner.printAnalysis();
    return this.cleaner.getStorageStats();
  }

  /**
   * Clean redundant data (safe cleanup)
   * @param {boolean} dryRun - If true, only show what would be cleaned
   */
  cleanRedundant(dryRun = true) {
    (`🧹 ${dryRun ? 'Analyzing' : 'Cleaning'} redundant data...`);
    const results = this.cleaner.cleanRedundantData(dryRun);
    
    if (dryRun) {
      ('🔍 Dry run complete. Run with dryRun=false to actually clean.');
    } else {
      ('✅ Redundant data cleaned!');
    }
    
    return results;
  }

  /**
   * Clean legacy data (safe cleanup)
   * @param {boolean} dryRun - If true, only show what would be cleaned
   */
  cleanLegacy(dryRun = true) {
    (`🏚️ ${dryRun ? 'Analyzing' : 'Cleaning'} legacy data...`);
    const results = this.cleaner.cleanByType('legacy', dryRun);
    
    if (dryRun) {
      ('🔍 Dry run complete. Run with dryRun=false to actually clean.');
    } else {
      ('✅ Legacy data cleaned!');
    }
    
    return results;
  }

  /**
   * Clean all unnecessary data (safe cleanup)
   * @param {boolean} dryRun - If true, only show what would be cleaned
   */
  cleanAll(dryRun = true) {
    (`🗑️ ${dryRun ? 'Analyzing' : 'Cleaning'} all unnecessary data...`);
    const results = this.cleaner.cleanByType('all', dryRun);
    
    if (dryRun) {
      ('🔍 Dry run complete. Run with dryRun=false to actually clean.');
    } else {
      ('✅ All unnecessary data cleaned!');
    }
    
    return results;
  }

  /**
   * Optimize storage by consolidating data
   * @param {boolean} dryRun - If true, only show what would be optimized
   */
  optimize(dryRun = true) {
    (`🔧 ${dryRun ? 'Analyzing' : 'Optimizing'} storage...`);
    const results = this.cleaner.optimizeStorage(dryRun);
    
    if (dryRun) {
      ('🔍 Dry run complete. Run with dryRun=false to actually optimize.');
    } else {
      ('✅ Storage optimized!');
    }
    
    return results;
  }

  /**
   * Run complete cleanup and optimization
   * @param {boolean} dryRun - If true, only show what would be done
   */
  fullCleanup(dryRun = true) {
    (`🚀 ${dryRun ? 'Analyzing' : 'Running'} full cleanup and optimization...`);
    
    const results = {
      analysis: this.analyze(),
      redundant: this.cleanRedundant(dryRun),
      legacy: this.cleanLegacy(dryRun),
      optimization: this.optimize(dryRun)
    };
    
    if (dryRun) {
      ('🔍 Full analysis complete. Run with dryRun=false to actually clean and optimize.');
    } else {
      ('✅ Full cleanup and optimization complete!');
    }
    
    return results;
  }

  /**
   * Get current storage statistics
   */
  stats() {
    const stats = this.cleaner.getStorageStats();
    ('📊 Current Storage Statistics:');
    (`Total Keys: ${stats.totalKeys}`);
    (`Total Size: ${stats.totalSize}`);
    (`Essential Keys: ${stats.essentialKeys}`);
    (`Redundant Keys: ${stats.redundantKeys} (${stats.redundantSize})`);
    (`Legacy Keys: ${stats.legacyKeys} (${stats.legacySize})`);
    (`Unknown Keys: ${stats.unknownKeys} (${stats.unknownSize})`);
    (`Potential Savings: ${stats.potentialSavings}`);
    
    return stats;
  }

  /**
   * Show help information
   */
  help() {
    ('🧹 LocalStorage Cleanup Script Help:');
    ('');
    ('Available commands:');
    ('  cleanup.analyze()                    - Analyze current localStorage');
    ('  cleanup.cleanRedundant(dryRun=true)  - Clean redundant data');
    ('  cleanup.cleanLegacy(dryRun=true)     - Clean legacy data');
    ('  cleanup.cleanAll(dryRun=true)        - Clean all unnecessary data');
    ('  cleanup.optimize(dryRun=true)        - Optimize storage');
    ('  cleanup.fullCleanup(dryRun=true)     - Run full cleanup');
    ('  cleanup.stats()                      - Show storage statistics');
    ('  cleanup.help()                       - Show this help');
    ('');
    ('Examples:');
    ('  cleanup.analyze()                    - See what can be cleaned');
    ('  cleanup.cleanRedundant(false)        - Actually clean redundant data');
    ('  cleanup.fullCleanup(false)           - Run complete cleanup');
    ('');
    ('Note: Always run with dryRun=true first to see what will be cleaned!');
  }
}

// Create singleton instance
const cleanupScript = new CleanupScript();

// Expose to window in development
if (import.meta.env.DEV) {
  window.cleanup = cleanupScript;
  ('🧹 Cleanup Script available as window.cleanup');
  ('📋 Run cleanup.help() to see available commands');
}

export default cleanupScript;
