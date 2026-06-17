import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { jediTekChannelService, JEDITEK_CHANNELS, JEDITEK_BRANDING, DJ_ANNOUNCEMENTS } from '../jeditek-channel.service';

describe('JediTek Channel Service', () => {
  afterEach(() => {
    jediTekChannelService.destroy();
  });

  describe('JediTek Branding', () => {
    it('should have station name', () => {
      expect(JEDITEK_BRANDING.stationName).toBe('JediTek Radio');
    });

    it('should have slogan', () => {
      expect(JEDITEK_BRANDING.slogan).toBe("We've Got Your Groove!");
    });

    it('should have frequency', () => {
      expect(JEDITEK_BRANDING.frequency).toBe('107.7 FM');
    });

    it('should have DJ personalities for all time slots', () => {
      const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
      timeSlots.forEach(slot => {
        const dj = JEDITEK_BRANDING.djPersonalities.find(d => d.timeSlot === slot);
        expect(dj).toBeDefined();
      });
    });

    it('should have catchphrases for each DJ', () => {
      JEDITEK_BRANDING.djPersonalities.forEach(dj => {
        expect(dj.catchphrases.length).toBeGreaterThan(0);
      });
    });
  });

  describe('JediTek Channels', () => {
    it('should have multiple channels', () => {
      expect(JEDITEK_CHANNELS.length).toBeGreaterThan(3);
    });

    it('should have a default channel', () => {
      const defaultChannel = JEDITEK_CHANNELS.find(c => c.isDefault);
      expect(defaultChannel).toBeDefined();
    });

    it('should have all required channel properties', () => {
      JEDITEK_CHANNELS.forEach(channel => {
        expect(channel).toHaveProperty('id');
        expect(channel).toHaveProperty('name');
        expect(channel).toHaveProperty('tagline');
        expect(channel).toHaveProperty('genre');
        expect(channel).toHaveProperty('videoId');
        expect(channel).toHaveProperty('djName');
        expect(channel).toHaveProperty('frequency');
      });
    });

    it('should have hospital-specific channel', () => {
      const hospitalChannel = JEDITEK_CHANNELS.find(c => c.id === 'jeditek-hospital');
      expect(hospitalChannel).toBeDefined();
    });
  });

  describe('DJ Announcements', () => {
    it('should have multiple announcements', () => {
      expect(DJ_ANNOUNCEMENTS.length).toBeGreaterThan(5);
    });

    it('should have station ID announcements', () => {
      const stationIds = DJ_ANNOUNCEMENTS.filter(a => a.type === 'station_id');
      expect(stationIds.length).toBeGreaterThan(0);
    });

    it('should have time-slot specific announcements', () => {
      const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
      timeSlots.forEach(slot => {
        const slotAnnouncements = DJ_ANNOUNCEMENTS.filter(a => a.timeSlot === slot);
        expect(slotAnnouncements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Channel Service', () => {
    it('should get current channel', () => {
      const channel = jediTekChannelService.getCurrentChannel();
      expect(channel).toBeDefined();
      expect(channel.id).toBeTruthy();
    });

    it('should get current DJ', () => {
      const dj = jediTekChannelService.getCurrentDJ();
      expect(dj).toBeDefined();
      expect(dj.name).toBeTruthy();
    });

    it('should get all channels', () => {
      const channels = jediTekChannelService.getChannels();
      expect(channels).toHaveLength(JEDITEK_CHANNELS.length);
    });

    it('should switch channel by ID', () => {
      const targetChannel = JEDITEK_CHANNELS[1];
      jediTekChannelService.switchChannel(targetChannel.id);
      expect(jediTekChannelService.getCurrentChannel().id).toBe(targetChannel.id);
    });

    it('should navigate to next channel', () => {
      const initialChannel = jediTekChannelService.getCurrentChannel();
      jediTekChannelService.nextChannel();
      const newChannel = jediTekChannelService.getCurrentChannel();
      expect(newChannel.id).not.toBe(initialChannel.id);
    });

    it('should navigate to previous channel', () => {
      jediTekChannelService.nextChannel(); // Move to second
      const secondChannel = jediTekChannelService.getCurrentChannel();
      jediTekChannelService.previousChannel();
      const backToFirst = jediTekChannelService.getCurrentChannel();
      expect(backToFirst.id).not.toBe(secondChannel.id);
    });

    it('should get random announcement', () => {
      const announcement = jediTekChannelService.getRandomAnnouncement();
      expect(announcement).toBeDefined();
      expect(announcement.text).toBeTruthy();
    });

    it('should get DJ catchphrase', () => {
      const catchphrase = jediTekChannelService.getDJCatchphrase();
      expect(catchphrase).toBeTruthy();
    });

    it('should get branding info', () => {
      const branding = jediTekChannelService.getBranding();
      expect(branding.stationName).toBe('JediTek Radio');
    });
  });
});
