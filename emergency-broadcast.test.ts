import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  emergencyBroadcastService, 
  EMERGENCY_PRESETS, 
  DEMO_STAFF 
} from '../emergency-broadcast.service';

describe('Emergency Broadcast Service', () => {
  beforeEach(() => {
    emergencyBroadcastService.logoutStaff();
    if (emergencyBroadcastService.isEmergencyActive()) {
      emergencyBroadcastService.deactivateEmergency();
    }
  });

  afterEach(() => {
    emergencyBroadcastService.destroy();
  });

  describe('Emergency Presets', () => {
    it('should have multiple emergency presets', () => {
      expect(EMERGENCY_PRESETS.length).toBeGreaterThan(5);
    });

    it('should have all required preset properties', () => {
      EMERGENCY_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('level');
        expect(preset).toHaveProperty('title');
        expect(preset).toHaveProperty('message');
        expect(preset).toHaveProperty('instructions');
        expect(preset).toHaveProperty('icon');
        expect(preset).toHaveProperty('color');
      });
    });

    it('should have instructions for each preset', () => {
      EMERGENCY_PRESETS.forEach(preset => {
        expect(preset.instructions.length).toBeGreaterThan(0);
      });
    });

    it('should include code blue preset', () => {
      const codeBlue = EMERGENCY_PRESETS.find(p => p.id === 'code-blue');
      expect(codeBlue).toBeDefined();
      expect(codeBlue?.level).toBe('critical');
    });

    it('should include all-clear preset', () => {
      const allClear = EMERGENCY_PRESETS.find(p => p.id === 'all-clear');
      expect(allClear).toBeDefined();
      expect(allClear?.level).toBe('info');
    });
  });

  describe('Demo Staff', () => {
    it('should have multiple demo staff members', () => {
      expect(DEMO_STAFF.length).toBeGreaterThan(3);
    });

    it('should have all required staff properties', () => {
      DEMO_STAFF.forEach(staff => {
        expect(staff).toHaveProperty('staffId');
        expect(staff).toHaveProperty('name');
        expect(staff).toHaveProperty('role');
        expect(staff).toHaveProperty('department');
        expect(staff).toHaveProperty('canActivateEmergency');
      });
    });

    it('should have staff that can activate emergencies', () => {
      const canActivate = DEMO_STAFF.filter(s => s.canActivateEmergency);
      expect(canActivate.length).toBeGreaterThan(0);
    });
  });

  describe('Service State', () => {
    it('should get current state', () => {
      const state = emergencyBroadcastService.getState();
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('currentBroadcast');
      expect(state).toHaveProperty('history');
      expect(state).toHaveProperty('authorizedStaff');
    });

    it('should start with no active emergency', () => {
      expect(emergencyBroadcastService.isEmergencyActive()).toBe(false);
    });

    it('should start with no authorized staff', () => {
      expect(emergencyBroadcastService.isStaffAuthenticated()).toBe(false);
    });
  });

  describe('Staff Authentication', () => {
    it('should authenticate valid staff', () => {
      const result = emergencyBroadcastService.authenticateStaff('STAFF001');
      expect(result).toBe(true);
      expect(emergencyBroadcastService.isStaffAuthenticated()).toBe(true);
    });

    it('should reject invalid staff ID', () => {
      const result = emergencyBroadcastService.authenticateStaff('INVALID');
      expect(result).toBe(false);
      expect(emergencyBroadcastService.isStaffAuthenticated()).toBe(false);
    });

    it('should get authorized staff after authentication', () => {
      emergencyBroadcastService.authenticateStaff('STAFF001');
      const staff = emergencyBroadcastService.getAuthorizedStaff();
      expect(staff).toBeDefined();
      expect(staff?.staffId).toBe('STAFF001');
    });

    it('should logout staff', () => {
      emergencyBroadcastService.authenticateStaff('STAFF001');
      emergencyBroadcastService.logoutStaff();
      expect(emergencyBroadcastService.isStaffAuthenticated()).toBe(false);
    });
  });

  describe('Emergency Activation', () => {
    beforeEach(() => {
      emergencyBroadcastService.authenticateStaff('STAFF001');
    });

    it('should activate emergency from preset', () => {
      const broadcast = emergencyBroadcastService.activateFromPreset('code-blue');
      expect(broadcast).toBeDefined();
      expect(broadcast?.level).toBe('critical');
      expect(emergencyBroadcastService.isEmergencyActive()).toBe(true);
    });

    it('should activate custom emergency', () => {
      const broadcast = emergencyBroadcastService.activateEmergency({
        level: 'warning',
        title: 'Test Emergency',
        message: 'This is a test',
        instructions: ['Stay calm', 'Follow instructions'],
      });
      expect(broadcast).toBeDefined();
      expect(broadcast?.title).toBe('Test Emergency');
    });

    it('should not activate without authentication', () => {
      emergencyBroadcastService.logoutStaff();
      const broadcast = emergencyBroadcastService.activateFromPreset('code-blue');
      expect(broadcast).toBeNull();
    });

    it('should get current broadcast', () => {
      emergencyBroadcastService.activateFromPreset('code-blue');
      const broadcast = emergencyBroadcastService.getCurrentBroadcast();
      expect(broadcast).toBeDefined();
      expect(broadcast?.isActive).toBe(true);
    });

    it('should deactivate emergency', () => {
      emergencyBroadcastService.activateFromPreset('code-blue');
      emergencyBroadcastService.deactivateEmergency();
      expect(emergencyBroadcastService.isEmergencyActive()).toBe(false);
    });

    it('should add to history on deactivation', () => {
      const initialHistoryLength = emergencyBroadcastService.getHistory().length;
      emergencyBroadcastService.activateFromPreset('code-blue');
      emergencyBroadcastService.deactivateEmergency();
      const history = emergencyBroadcastService.getHistory();
      expect(history.length).toBe(initialHistoryLength + 1);
      expect(history[0].isActive).toBe(false);
    });
  });

  describe('Presets', () => {
    it('should get all presets', () => {
      const presets = emergencyBroadcastService.getPresets();
      expect(presets).toHaveLength(EMERGENCY_PRESETS.length);
    });

    it('should get preset by ID', () => {
      const preset = emergencyBroadcastService.getPreset('code-red');
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('code-red');
    });

    it('should return undefined for invalid preset ID', () => {
      const preset = emergencyBroadcastService.getPreset('invalid');
      expect(preset).toBeUndefined();
    });
  });

  describe('Level Colors and Icons', () => {
    it('should get color for each level', () => {
      const levels = ['info', 'warning', 'critical', 'evacuation'] as const;
      levels.forEach(level => {
        const color = emergencyBroadcastService.getLevelColor(level);
        expect(color).toBeTruthy();
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should get icon for each level', () => {
      const levels = ['info', 'warning', 'critical', 'evacuation'] as const;
      levels.forEach(level => {
        const icon = emergencyBroadcastService.getLevelIcon(level);
        expect(icon).toBeTruthy();
      });
    });
  });
});
