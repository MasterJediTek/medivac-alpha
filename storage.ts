import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * MediVac One Storage Service
 * 
 * Implements a multi-tier storage architecture:
 * - L1: In-memory cache for instant access
 * - L2: AsyncStorage for persistent local storage
 * - L3: S3 cloud storage for backup and sync
 * 
 * SMPO.ink Protocol Compliant
 */

// L1 Cache - In-memory storage for fastest access
const L1Cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

// L3 Cache Configuration
interface L3Config {
  enabled: boolean;
  syncInterval: number; // milliseconds
  lastSync: number;
  pendingChanges: string[];
}

const L3_CONFIG: L3Config = {
  enabled: true,
  syncInterval: 300000, // 5 minutes
  lastSync: 0,
  pendingChanges: [],
};

// Storage Keys
export const STORAGE_KEYS = {
  PATIENTS: "@medivac/patients",
  APPOINTMENTS: "@medivac/appointments",
  TASKS: "@medivac/tasks",
  MEDICATIONS: "@medivac/medications",
  LAB_RESULTS: "@medivac/lab_results",
  MESSAGES: "@medivac/messages",
  SETTINGS: "@medivac/settings",
  USER_PROFILE: "@medivac/user_profile",
  SYNC_STATUS: "@medivac/sync_status",
  JEDI_CONFIG: "@medivac/jedi_config",
  VPN_CONFIG: "@medivac/vpn_config",
  CACHE_METADATA: "@medivac/cache_metadata",
};

// L1 Cache TTL defaults (in milliseconds)
const DEFAULT_TTL = {
  SHORT: 60000,      // 1 minute - for frequently changing data
  MEDIUM: 300000,    // 5 minutes - for semi-static data
  LONG: 3600000,     // 1 hour - for static data
  PERMANENT: -1,     // Never expires
};

/**
 * L1 Cache Operations
 */
export const L1 = {
  get: <T>(key: string): T | null => {
    const cached = L1Cache.get(key);
    if (!cached) return null;
    
    // Check TTL
    if (cached.ttl !== -1 && Date.now() - cached.timestamp > cached.ttl) {
      L1Cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  },

  set: <T>(key: string, data: T, ttl: number = DEFAULT_TTL.MEDIUM): void => {
    L1Cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  delete: (key: string): void => {
    L1Cache.delete(key);
  },

  clear: (): void => {
    L1Cache.clear();
  },

  getStats: () => ({
    size: L1Cache.size,
    keys: Array.from(L1Cache.keys()),
  }),
};

/**
 * L2 Storage Operations (AsyncStorage)
 */
export const L2 = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      // Check L1 first
      const cached = L1.get<T>(key);
      if (cached !== null) return cached;

      // Fetch from AsyncStorage
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      const parsed = JSON.parse(value) as T;
      
      // Populate L1 cache
      L1.set(key, parsed);
      
      return parsed;
    } catch (error) {
      console.error(`L2 Storage get error for ${key}:`, error);
      return null;
    }
  },

  set: async <T>(key: string, data: T): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(data);
      await AsyncStorage.setItem(key, serialized);
      
      // Update L1 cache
      L1.set(key, data);
      
      // Mark for L3 sync
      if (L3_CONFIG.enabled && !L3_CONFIG.pendingChanges.includes(key)) {
        L3_CONFIG.pendingChanges.push(key);
      }
      
      return true;
    } catch (error) {
      console.error(`L2 Storage set error for ${key}:`, error);
      return false;
    }
  },

  delete: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      L1.delete(key);
      return true;
    } catch (error) {
      console.error(`L2 Storage delete error for ${key}:`, error);
      return false;
    }
  },

  clear: async (): Promise<boolean> => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      L1.clear();
      return true;
    } catch (error) {
      console.error("L2 Storage clear error:", error);
      return false;
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(k => k.startsWith("@medivac/"));
    } catch (error) {
      console.error("L2 Storage getAllKeys error:", error);
      return [];
    }
  },
};

/**
 * L3 Storage Operations (S3 Cloud Sync)
 */
export const L3 = {
  config: L3_CONFIG,

  getSyncStatus: () => ({
    enabled: L3_CONFIG.enabled,
    lastSync: L3_CONFIG.lastSync,
    pendingChanges: L3_CONFIG.pendingChanges.length,
    nextSync: L3_CONFIG.lastSync + L3_CONFIG.syncInterval,
  }),

  enableSync: (enabled: boolean): void => {
    L3_CONFIG.enabled = enabled;
  },

  /**
   * Sync local data to S3 cloud storage
   * In production, this would connect to actual S3 endpoints
   */
  sync: async (): Promise<{ success: boolean; synced: number; errors: string[] }> => {
    const errors: string[] = [];
    let synced = 0;

    if (!L3_CONFIG.enabled) {
      return { success: false, synced: 0, errors: ["L3 sync is disabled"] };
    }

    try {
      // Process pending changes
      for (const key of L3_CONFIG.pendingChanges) {
        try {
          const data = await L2.get(key);
          if (data !== null) {
            // Simulate S3 upload
            // In production: await s3Client.putObject({ Bucket, Key, Body: JSON.stringify(data) })
            console.log(`[L3] Syncing ${key} to S3...`);
            synced++;
          }
        } catch (error) {
          errors.push(`Failed to sync ${key}`);
        }
      }

      // Clear pending changes on success
      if (errors.length === 0) {
        L3_CONFIG.pendingChanges = [];
      }

      L3_CONFIG.lastSync = Date.now();

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      return { success: false, synced, errors: ["Sync failed: " + String(error)] };
    }
  },

  /**
   * Fetch data from S3 cloud storage
   */
  fetch: async <T>(key: string): Promise<T | null> => {
    try {
      // Simulate S3 fetch
      // In production: const response = await s3Client.getObject({ Bucket, Key })
      console.log(`[L3] Fetching ${key} from S3...`);
      
      // For now, return local data as fallback
      return await L2.get<T>(key);
    } catch (error) {
      console.error(`L3 Storage fetch error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Get cache statistics
   */
  getStats: async () => {
    const keys = await L2.getAllKeys();
    let totalSize = 0;

    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate byte size
        }
      } catch (error) {
        // Skip on error
      }
    }

    return {
      itemCount: keys.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      l1CacheSize: L1Cache.size,
      pendingSync: L3_CONFIG.pendingChanges.length,
    };
  },
};

/**
 * Unified Storage API
 * Provides a simple interface that automatically manages all cache layers
 */
export const Storage = {
  /**
   * Get data with automatic cache layer management
   */
  get: async <T>(key: string): Promise<T | null> => {
    // Try L1 first (fastest)
    const l1Data = L1.get<T>(key);
    if (l1Data !== null) return l1Data;

    // Try L2 (local storage)
    const l2Data = await L2.get<T>(key);
    if (l2Data !== null) return l2Data;

    // Try L3 (cloud) as last resort
    if (L3_CONFIG.enabled) {
      const l3Data = await L3.fetch<T>(key);
      if (l3Data !== null) {
        // Populate lower cache layers
        await L2.set(key, l3Data);
        return l3Data;
      }
    }

    return null;
  },

  /**
   * Set data with automatic propagation to all layers
   */
  set: async <T>(key: string, data: T): Promise<boolean> => {
    return await L2.set(key, data);
  },

  /**
   * Delete data from all layers
   */
  delete: async (key: string): Promise<boolean> => {
    return await L2.delete(key);
  },

  /**
   * Clear all MediVac data
   */
  clear: async (): Promise<boolean> => {
    return await L2.clear();
  },

  /**
   * Force sync to cloud
   */
  sync: async () => {
    return await L3.sync();
  },

  /**
   * Get comprehensive storage statistics
   */
  getStats: async () => {
    return await L3.getStats();
  },

  // Export cache layer references for advanced usage
  L1,
  L2,
  L3,
  KEYS: STORAGE_KEYS,
  TTL: DEFAULT_TTL,
};

export default Storage;
