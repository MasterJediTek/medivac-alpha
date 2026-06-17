import { describe, it, expect } from 'vitest';
import { routeSharingService, type SharedRoute } from '../route-sharing.service';

describe('RouteSharingService', () => {
  const testRoute: SharedRoute = {
    id: 'test_route_001',
    name: 'Test Route',
    startLocation: 'Reception',
    endLocation: 'Emergency',
    waypoints: [
      { x: 100, y: 100, name: 'Reception' },
      { x: 150, y: 150, name: 'Corridor' },
      { x: 200, y: 200, name: 'Emergency' }
    ],
    distance: 100,
    estimatedTime: 120,
    isAccessible: true,
    createdAt: Date.now()
  };

  describe('shareRoute', () => {
    it('should create a shareable link with QR data', () => {
      const result = routeSharingService.shareRoute(testRoute);
      expect(result.success).toBe(true);
      expect(result.qrCodeData).toBeDefined();
      expect(result.deepLink).toBeDefined();
      expect(result.shortCode).toBeDefined();
    });

    it('should generate a deep link with correct format', () => {
      const result = routeSharingService.shareRoute(testRoute);
      expect(result.deepLink).toContain('medivac://');
      expect(result.deepLink).toContain('route');
    });

    it('should generate a 6-character short code', () => {
      const result = routeSharingService.shareRoute(testRoute);
      expect(result.shortCode?.length).toBe(6);
    });

    it('should set expiration time', () => {
      const result = routeSharingService.shareRoute(testRoute);
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('importFromQR', () => {
    it('should import a valid QR code', () => {
      // First share to get QR data
      const shareResult = routeSharingService.shareRoute(testRoute);
      expect(shareResult.qrCodeData).toBeDefined();

      // Then import from QR
      const importResult = routeSharingService.importFromQR(shareResult.qrCodeData!);
      expect(importResult.success).toBe(true);
      expect(importResult.route).toBeDefined();
      expect(importResult.route?.name).toBe('Test Route');
    });

    it('should reject invalid QR code format', () => {
      const result = routeSharingService.importFromQR('INVALID_DATA');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('getSharedRoutes', () => {
    it('should return all shared routes', () => {
      const routes = routeSharingService.getSharedRoutes();
      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners of route changes', () => {
      let notified = false;
      const unsubscribe = routeSharingService.subscribe(() => {
        notified = true;
      });
      
      expect(notified).toBe(true); // Initial notification
      unsubscribe();
    });
  });
});
