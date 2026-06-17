import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tvScheduleService, TV_SCHEDULE, HOSPITAL_ANNOUNCEMENTS } from '../tv-schedule.service';

describe('TV Schedule Service', () => {
  afterEach(() => {
    tvScheduleService.destroy();
  });

  describe('TV Schedule Data', () => {
    it('should have schedule slots covering 24 hours', () => {
      expect(TV_SCHEDULE.length).toBeGreaterThan(5);
    });

    it('should have all required slot properties', () => {
      TV_SCHEDULE.forEach(slot => {
        expect(slot).toHaveProperty('id');
        expect(slot).toHaveProperty('name');
        expect(slot).toHaveProperty('description');
        expect(slot).toHaveProperty('startHour');
        expect(slot).toHaveProperty('endHour');
        expect(slot).toHaveProperty('channelId');
        expect(slot).toHaveProperty('contentType');
        expect(slot).toHaveProperty('icon');
        expect(slot).toHaveProperty('color');
      });
    });

    it('should have valid hour ranges', () => {
      TV_SCHEDULE.forEach(slot => {
        expect(slot.startHour).toBeGreaterThanOrEqual(0);
        expect(slot.startHour).toBeLessThan(24);
        expect(slot.endHour).toBeGreaterThanOrEqual(0);
        expect(slot.endHour).toBeLessThanOrEqual(24);
      });
    });

    it('should have different content types', () => {
      const contentTypes = new Set(TV_SCHEDULE.map(s => s.contentType));
      expect(contentTypes.size).toBeGreaterThan(2);
    });
  });

  describe('Hospital Announcements', () => {
    it('should have hospital announcements', () => {
      expect(HOSPITAL_ANNOUNCEMENTS.length).toBeGreaterThan(0);
    });

    it('should have meal time announcements', () => {
      const mealAnnouncements = HOSPITAL_ANNOUNCEMENTS.filter(a => 
        a.id.includes('meal')
      );
      expect(mealAnnouncements.length).toBeGreaterThan(0);
    });

    it('should have visiting hours announcements', () => {
      const visitingAnnouncements = HOSPITAL_ANNOUNCEMENTS.filter(a => 
        a.id.includes('visiting')
      );
      expect(visitingAnnouncements.length).toBeGreaterThan(0);
    });
  });

  describe('Schedule Service State', () => {
    it('should get current slot', () => {
      const slot = tvScheduleService.getCurrentSlot();
      expect(slot).toBeDefined();
      expect(slot.id).toBeTruthy();
    });

    it('should get current program info', () => {
      const program = tvScheduleService.getCurrentProgram();
      expect(program).toBeDefined();
      expect(program.slot).toBeDefined();
      expect(program.timeRemaining).toBeGreaterThanOrEqual(0);
      expect(program.nextProgram).toBeDefined();
    });

    it('should get full schedule', () => {
      const schedule = tvScheduleService.getSchedule();
      expect(schedule).toHaveLength(TV_SCHEDULE.length);
    });

    it('should get full state', () => {
      const state = tvScheduleService.getState();
      expect(state).toHaveProperty('currentSlot');
      expect(state).toHaveProperty('currentProgram');
      expect(state).toHaveProperty('schedule');
      expect(state).toHaveProperty('overrides');
      expect(state).toHaveProperty('isEmergencyMode');
    });
  });

  describe('Schedule Overrides', () => {
    it('should add override', () => {
      const overrideId = tvScheduleService.addOverride({
        type: 'announcement',
        message: 'Test announcement',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60000),
        priority: 5,
      });
      expect(overrideId).toBeTruthy();
    });

    it('should remove override', () => {
      const overrideId = tvScheduleService.addOverride({
        type: 'announcement',
        message: 'Test',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60000),
        priority: 5,
      });
      tvScheduleService.removeOverride(overrideId);
      const state = tvScheduleService.getState();
      expect(state.overrides.find(o => o.id === overrideId)).toBeUndefined();
    });
  });

  describe('Emergency Mode', () => {
    it('should activate emergency mode', () => {
      tvScheduleService.activateEmergencyMode('Test emergency');
      expect(tvScheduleService.getState().isEmergencyMode).toBe(true);
    });

    it('should deactivate emergency mode', () => {
      tvScheduleService.activateEmergencyMode('Test emergency');
      tvScheduleService.deactivateEmergencyMode();
      expect(tvScheduleService.getState().isEmergencyMode).toBe(false);
    });
  });

  describe('Hospital Announcements Integration', () => {
    it('should add hospital announcements', () => {
      const initialCount = tvScheduleService.getState().overrides.length;
      tvScheduleService.addHospitalAnnouncements();
      const newCount = tvScheduleService.getState().overrides.length;
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  describe('Channel ID', () => {
    it('should get current channel ID', () => {
      const channelId = tvScheduleService.getCurrentChannelId();
      expect(channelId).toBeTruthy();
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop', () => {
      tvScheduleService.start();
      tvScheduleService.stop();
      // Should not throw
    });
  });
});
