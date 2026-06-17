/**
 * Offline Route Caching Service
 * Caches frequently used routes for offline navigation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteHistoryEntry, routeHistoryService } from './route-history.service';

export interface CachedRoute {
  id: string;
  routeHistoryId: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedTime: number;
  waypoints: Array<{ lat: number; lng: number; name: string }>;
  directions: string[];
  cachedAt: string;
  lastAccessedAt: string;
  accessCount: number;
  isOfflineAvailable: boolean;
}

class OfflineRouteCacheService {
  private readonly CACHE_KEY = 'offline_routes_cache';
  private readonly CACHE_METADATA_KEY = 'offline_cache_metadata';
  private readonly MAX_CACHE_SIZE = 50; // Maximum routes to cache
  private readonly CACHE_EXPIRY_DAYS = 30;
  private cachedRoutes: Map<string, CachedRoute> = new Map();
  private cacheMetadata = {
    lastCleanup: new Date().toISOString(),
    totalSize: 0,
    routeCount: 0,
  };

  async initialize(): Promise<void> {
    await this.loadCache();
    await this.cleanupExpiredCache();
  }

  /**
   * Cache a route for offline access
   */
  async cacheRoute(route: RouteHistoryEntry): Promise<CachedRoute> {
    const cachedRoute: CachedRoute = {
      id: 'cached_' + Date.now(),
      routeHistoryId: route.id,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      waypoints: route.waypoints || [],
      directions: route.directions || [],
      cachedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      accessCount: 0,
      isOfflineAvailable: true,
    };

    // Remove oldest route if cache is full
    if (this.cachedRoutes.size >= this.MAX_CACHE_SIZE) {
      const oldestRoute = Array.from(this.cachedRoutes.values()).sort(
        (a, b) => new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime()
      )[0];
      
      if (oldestRoute) {
        this.cachedRoutes.delete(oldestRoute.id);
      }
    }

    this.cachedRoutes.set(cachedRoute.id, cachedRoute);
    await this.saveCache();

    return cachedRoute;
  }

  /**
   * Get cached route by ID
   */
  async getCachedRoute(cachedRouteId: string): Promise<CachedRoute | null> {
    const route = this.cachedRoutes.get(cachedRouteId);
    
    if (route) {
      // Update access metadata
      route.lastAccessedAt = new Date().toISOString();
      route.accessCount++;
      await this.saveCache();
    }

    return route || null;
  }

  /**
   * Get frequently used cached routes
   */
  getFrequentRoutes(limit: number = 10): CachedRoute[] {
    return Array.from(this.cachedRoutes.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Get recently cached routes
   */
  getRecentCachedRoutes(limit: number = 10): CachedRoute[] {
    return Array.from(this.cachedRoutes.values())
      .sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Search cached routes
   */
  searchCachedRoutes(query: string): CachedRoute[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.cachedRoutes.values()).filter(
      route =>
        route.startLocation.toLowerCase().includes(lowerQuery) ||
        route.endLocation.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const routes = Array.from(this.cachedRoutes.values());
    const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
    const totalTime = routes.reduce((sum, r) => sum + r.estimatedTime, 0);
    const avgAccessCount = routes.length > 0 ? routes.reduce((sum, r) => sum + r.accessCount, 0) / routes.length : 0;

    return {
      cachedRouteCount: routes.length,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheUtilization: Math.round((routes.length / this.MAX_CACHE_SIZE) * 100),
      totalDistance,
      totalTime,
      avgAccessCount,
      oldestCachedRoute: routes.length > 0 ? routes.sort((a, b) => new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime())[0] : null,
      newestCachedRoute: routes.length > 0 ? routes.sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())[0] : null,
    };
  }

  /**
   * Delete cached route
   */
  async deleteCachedRoute(cachedRouteId: string): Promise<void> {
    this.cachedRoutes.delete(cachedRouteId);
    await this.saveCache();
  }

  /**
   * Clear all cached routes
   */
  async clearCache(): Promise<void> {
    this.cachedRoutes.clear();
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Cleanup expired cache entries
   */
  private async cleanupExpiredCache(): Promise<void> {
    const now = new Date();
    const expiredRoutes: string[] = [];

    this.cachedRoutes.forEach((route, id) => {
      const cachedDate = new Date(route.cachedAt);
      const daysDiff = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > this.CACHE_EXPIRY_DAYS) {
        expiredRoutes.push(id);
      }
    });

    for (const id of expiredRoutes) {
      this.cachedRoutes.delete(id);
    }

    if (expiredRoutes.length > 0) {
      await this.saveCache();
    }

    this.cacheMetadata.lastCleanup = new Date().toISOString();
  }

  private async loadCache(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.CACHE_KEY);
      const metadata = await AsyncStorage.getItem(this.CACHE_METADATA_KEY);
      
      if (data) {
        const routes = JSON.parse(data);
        this.cachedRoutes = new Map(routes.map((r: CachedRoute) => [r.id, r]));
      }

      if (metadata) {
        this.cacheMetadata = JSON.parse(metadata);
      }
    } catch (error) {
      console.error('[Offline Cache] Failed to load cache:', error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const routesArray = Array.from(this.cachedRoutes.values());
      this.cacheMetadata.totalSize = JSON.stringify(routesArray).length;
      this.cacheMetadata.routeCount = routesArray.length;

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(routesArray));
      await AsyncStorage.setItem(this.CACHE_METADATA_KEY, JSON.stringify(this.cacheMetadata));
    } catch (error) {
      console.error('[Offline Cache] Failed to save cache:', error);
    }
  }
}

export const offlineRouteCacheService = new OfflineRouteCacheService();
