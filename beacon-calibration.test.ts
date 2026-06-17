import { describe, it, expect, beforeEach } from 'vitest';
import { beaconCalibrationService } from '../beacon-calibration.service';

describe('BeaconCalibrationService', () => {
  describe('getAllBeacons', () => {
    it('should return all hospital beacons', () => {
      const beacons = beaconCalibrationService.getAllBeacons();
      expect(beacons.length).toBeGreaterThan(0);
      expect(beacons[0]).toHaveProperty('beaconId');
      expect(beacons[0]).toHaveProperty('name');
      expect(beacons[0]).toHaveProperty('position');
    });
  });

  describe('getBeacon', () => {
    it('should return a specific beacon by ID', () => {
      const beacon = beaconCalibrationService.getBeacon('BCN-001');
      expect(beacon).toBeDefined();
      expect(beacon?.name).toBe('Main Entrance');
    });

    it('should return undefined for non-existent beacon', () => {
      const beacon = beaconCalibrationService.getBeacon('BCN-999');
      expect(beacon).toBeUndefined();
    });
  });

  describe('getBeaconsByStatus', () => {
    it('should return beacons filtered by status', () => {
      const activeBeacons = beaconCalibrationService.getBeaconsByStatus('active');
      expect(activeBeacons.length).toBeGreaterThan(0);
      activeBeacons.forEach(beacon => {
        expect(beacon.status).toBe('active');
      });
    });
  });

  describe('updateBeaconPosition', () => {
    it('should update beacon position', () => {
      const newPosition = { x: 200, y: 300 };
      beaconCalibrationService.updateBeaconPosition('BCN-001', newPosition);
      const beacon = beaconCalibrationService.getBeacon('BCN-001');
      expect(beacon?.position).toEqual(newPosition);
    });
  });

  describe('updateSignalStrength', () => {
    it('should update beacon signal strength within bounds', () => {
      beaconCalibrationService.updateSignalStrength('BCN-001', -55);
      const beacon = beaconCalibrationService.getBeacon('BCN-001');
      expect(beacon?.signalStrength).toBe(-55);
    });

    it('should clamp signal strength to valid range', () => {
      beaconCalibrationService.updateSignalStrength('BCN-001', -120);
      const beacon = beaconCalibrationService.getBeacon('BCN-001');
      expect(beacon?.signalStrength).toBe(-100);
    });
  });

  describe('estimateDistance', () => {
    it('should estimate distance from RSSI', () => {
      const distance = beaconCalibrationService.estimateDistance('BCN-001', -70);
      expect(distance).toBeGreaterThan(0);
    });

    it('should return -1 for non-existent beacon', () => {
      const distance = beaconCalibrationService.estimateDistance('BCN-999', -70);
      expect(distance).toBe(-1);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health statistics', () => {
      const health = beaconCalibrationService.getSystemHealth();
      expect(health).toHaveProperty('active');
      expect(health).toHaveProperty('inactive');
      expect(health).toHaveProperty('maintenance');
      expect(health).toHaveProperty('avgAccuracy');
    });
  });

  describe('calibration sessions', () => {
    it('should start and complete a calibration session', () => {
      const session = beaconCalibrationService.startCalibrationSession('BCN-002', 'TestUser');
      expect(session).toBeDefined();
      expect(session.status).toBe('in-progress');
      expect(session.beaconId).toBe('BCN-002');

      // Add calibration points
      beaconCalibrationService.addCalibrationPoint(-60, 1);
      beaconCalibrationService.addCalibrationPoint(-70, 3);
      beaconCalibrationService.addCalibrationPoint(-80, 10);

      // Complete session
      beaconCalibrationService.completeCalibrationSession('Test calibration');
      
      const activeSession = beaconCalibrationService.getActiveSession();
      expect(activeSession).toBeNull();
    });
  });
});
