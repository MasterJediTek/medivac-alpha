import { describe, it, expect, beforeEach } from 'vitest';
import { staffPinAuthService } from '../staff-pin-auth.service';

describe('StaffPinAuthService', () => {
  beforeEach(() => {
    // Logout before each test
    staffPinAuthService.logout();
  });

  describe('authenticate', () => {
    it('should authenticate valid staff credentials', () => {
      // Using STAFF001 with PIN 1234 (admin)
      const result = staffPinAuthService.authenticate('STAFF001', '1234');
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.staffId).toBe('STAFF001');
    });

    it('should reject invalid PIN', () => {
      const result = staffPinAuthService.authenticate('STAFF001', '9999');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject unknown staff ID', () => {
      const result = staffPinAuthService.authenticate('UNKNOWN', '1234');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('session management', () => {
    it('should return current session after authentication', () => {
      staffPinAuthService.authenticate('STAFF002', '5678');
      const session = staffPinAuthService.getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.staffId).toBe('STAFF002');
    });

    it('should clear session on logout', () => {
      staffPinAuthService.authenticate('STAFF001', '1234');
      staffPinAuthService.logout();
      const session = staffPinAuthService.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('permissions', () => {
    it('should check permissions for authenticated admin user', () => {
      staffPinAuthService.authenticate('STAFF001', '1234');
      const hasPermission = staffPinAuthService.hasPermission('beacon_calibration');
      expect(hasPermission).toBe(true);
    });

    it('should return false for unauthenticated permission check', () => {
      const hasPermission = staffPinAuthService.hasPermission('beacon_calibration');
      expect(hasPermission).toBe(false);
    });

    it('should return false for unauthorized permission', () => {
      // STAFF002 is a nurse, should not have beacon_calibration
      staffPinAuthService.authenticate('STAFF002', '5678');
      const hasPermission = staffPinAuthService.hasPermission('beacon_calibration');
      expect(hasPermission).toBe(false);
    });
  });

  describe('staff roles', () => {
    it('should return correct role for admin', () => {
      staffPinAuthService.authenticate('STAFF001', '1234');
      const session = staffPinAuthService.getCurrentSession();
      expect(session?.role).toBe('admin');
    });

    it('should return correct role for nurse', () => {
      staffPinAuthService.authenticate('STAFF002', '5678');
      const session = staffPinAuthService.getCurrentSession();
      expect(session?.role).toBe('nurse');
    });

    it('should return correct role for technician', () => {
      staffPinAuthService.authenticate('STAFF003', '9012');
      const session = staffPinAuthService.getCurrentSession();
      expect(session?.role).toBe('technician');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners of session changes', () => {
      let notified = false;
      const unsubscribe = staffPinAuthService.subscribe(() => {
        notified = true;
      });
      
      staffPinAuthService.authenticate('STAFF001', '1234');
      expect(notified).toBe(true);
      unsubscribe();
    });
  });
});
