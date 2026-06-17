import { describe, it, expect } from 'vitest';
import { routeHistoryService } from '../route-history.service';

describe('RouteHistoryService', () => {
  describe('getAllRoutes', () => {
    it('should return all saved routes', () => {
      const routes = routeHistoryService.getAllRoutes();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0]).toHaveProperty('id');
      expect(routes[0]).toHaveProperty('name');
      expect(routes[0]).toHaveProperty('startLocation');
      expect(routes[0]).toHaveProperty('endLocation');
    });
  });

  describe('getRoute', () => {
    it('should return a specific route by ID', () => {
      const route = routeHistoryService.getRoute('route-001');
      expect(route).toBeDefined();
      expect(route?.name).toBe('Main Entrance to Emergency');
    });

    it('should return undefined for non-existent route', () => {
      const route = routeHistoryService.getRoute('route-999');
      expect(route).toBeUndefined();
    });
  });

  describe('getRecentRoutes', () => {
    it('should return routes sorted by last used', () => {
      const recentRoutes = routeHistoryService.getRecentRoutes(5);
      expect(recentRoutes.length).toBeLessThanOrEqual(5);
      
      for (let i = 1; i < recentRoutes.length; i++) {
        const prevDate = new Date(recentRoutes[i - 1].lastUsed).getTime();
        const currDate = new Date(recentRoutes[i].lastUsed).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currDate);
      }
    });
  });

  describe('getFavoriteRoutes', () => {
    it('should return only favorite routes', () => {
      const favorites = routeHistoryService.getFavoriteRoutes();
      favorites.forEach(route => {
        expect(route.isFavorite).toBe(true);
      });
    });
  });

  describe('getMostUsedRoutes', () => {
    it('should return routes sorted by use count', () => {
      const mostUsed = routeHistoryService.getMostUsedRoutes(3);
      expect(mostUsed.length).toBeLessThanOrEqual(3);
      
      for (let i = 1; i < mostUsed.length; i++) {
        expect(mostUsed[i - 1].useCount).toBeGreaterThanOrEqual(mostUsed[i].useCount);
      }
    });
  });

  describe('saveRoute', () => {
    it('should save a new route', () => {
      const newRoute = routeHistoryService.saveRoute({
        name: 'Test Route',
        startLocation: 'Test Start',
        endLocation: 'Test End',
        startPosition: { x: 100, y: 100 },
        endPosition: { x: 200, y: 200 },
        distance: 100,
        estimatedTime: 60,
        waypoints: [],
        isAccessible: true
      });

      expect(newRoute).toBeDefined();
      expect(newRoute.name).toBe('Test Route');
      expect(newRoute.useCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('useRoute', () => {
    it('should increment use count when route is used', () => {
      const route = routeHistoryService.getRoute('route-001');
      const initialCount = route?.useCount || 0;
      
      routeHistoryService.useRoute('route-001');
      
      const updatedRoute = routeHistoryService.getRoute('route-001');
      expect(updatedRoute?.useCount).toBe(initialCount + 1);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', () => {
      const route = routeHistoryService.getRoute('route-003');
      const initialFavorite = route?.isFavorite;
      
      routeHistoryService.toggleFavorite('route-003');
      
      const updatedRoute = routeHistoryService.getRoute('route-003');
      expect(updatedRoute?.isFavorite).toBe(!initialFavorite);
    });
  });

  describe('searchRoutes', () => {
    it('should find routes by name', () => {
      const results = routeHistoryService.searchRoutes('Emergency');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(route => {
        const matchesName = route.name.toLowerCase().includes('emergency');
        const matchesStart = route.startLocation.toLowerCase().includes('emergency');
        const matchesEnd = route.endLocation.toLowerCase().includes('emergency');
        expect(matchesName || matchesStart || matchesEnd).toBe(true);
      });
    });
  });

  describe('getStats', () => {
    it('should return route history statistics', () => {
      const stats = routeHistoryService.getStats();
      expect(stats).toHaveProperty('totalRoutes');
      expect(stats).toHaveProperty('totalDistance');
      expect(stats).toHaveProperty('totalTime');
      expect(stats).toHaveProperty('mostUsedRoute');
      expect(stats).toHaveProperty('favoriteRoutes');
      expect(stats).toHaveProperty('recentRoutes');
    });
  });
});
