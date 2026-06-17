import { describe, it, expect, beforeEach } from 'vitest';
import { biometricUnlockService } from '../biometric-unlock.service';

describe('BiometricUnlockService', () => {
  beforeEach(() => {
    // Reset device type to default
    biometricUnlockService.setDeviceType('face_id', true);
    biometricUnlockService.setEnabled(true);
  });

  describe('getStatus', () => {
    it('should return biometric status', () => {
      const status = biometricUnlockService.getStatus();
      expect(status).toBeDefined();
      expect(status.biometricType).toBe('face_id');
      expect(status.hasHardware).toBe(true);
    });

    it('should reflect disabled state', () => {
      biometricUnlockService.setEnabled(false);
      const status = biometricUnlockService.getStatus();
      expect(status.isAvailable).toBe(false);
    });
  });

  describe('enrollment', () => {
    it('should enroll staff for biometric authentication', async () => {
      const result = await biometricUnlockService.enrollStaff('TEST001');
      expect(result.success).toBe(true);
    });

    it('should check if staff is enrolled', async () => {
      await biometricUnlockService.enrollStaff('TEST002');
      expect(biometricUnlockService.isStaffEnrolled('TEST002')).toBe(true);
    });

    it('should unenroll staff', async () => {
      await biometricUnlockService.enrollStaff('TEST003');
      const result = biometricUnlockService.unenrollStaff('TEST003');
      expect(result).toBe(true);
      expect(biometricUnlockService.isStaffEnrolled('TEST003')).toBe(false);
    });

    it('should fail enrollment when disabled', async () => {
      biometricUnlockService.setEnabled(false);
      const result = await biometricUnlockService.enrollStaff('TEST004');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('authenticate', () => {
    it('should authenticate enrolled staff', async () => {
      await biometricUnlockService.enrollStaff('TEST005');
      const result = await biometricUnlockService.authenticate('TEST005');
      expect(result.success).toBe(true);
      expect(result.staffId).toBe('TEST005');
    });

    it('should fail for non-enrolled staff', async () => {
      const result = await biometricUnlockService.authenticate('UNKNOWN');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail when disabled', async () => {
      await biometricUnlockService.enrollStaff('TEST006');
      biometricUnlockService.setEnabled(false);
      const result = await biometricUnlockService.authenticate('TEST006');
      expect(result.success).toBe(false);
    });
  });

  describe('device types', () => {
    it('should return correct name for Face ID', () => {
      biometricUnlockService.setDeviceType('face_id', true);
      expect(biometricUnlockService.getBiometricTypeName()).toBe('Face ID');
    });

    it('should return correct name for Touch ID', () => {
      biometricUnlockService.setDeviceType('touch_id', true);
      expect(biometricUnlockService.getBiometricTypeName()).toBe('Touch ID');
    });

    it('should return correct name for fingerprint', () => {
      biometricUnlockService.setDeviceType('fingerprint', true);
      expect(biometricUnlockService.getBiometricTypeName()).toBe('Fingerprint');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners of status changes', () => {
      let notified = false;
      const unsubscribe = biometricUnlockService.subscribe(() => {
        notified = true;
      });
      
      biometricUnlockService.setEnabled(false);
      expect(notified).toBe(true);
      unsubscribe();
    });
  });
});
