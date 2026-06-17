import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { djVoiceoverService, DJ_VOICES, AUDIO_EFFECTS, VOICEOVER_TEMPLATES } from '../dj-voiceover.service';

describe('DJ Voiceover Service', () => {
  afterEach(() => {
    djVoiceoverService.destroy();
  });

  describe('DJ Voices', () => {
    it('should have multiple DJ voices', () => {
      expect(DJ_VOICES.length).toBeGreaterThan(2);
    });

    it('should have all required voice properties', () => {
      DJ_VOICES.forEach(voice => {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('pitch');
        expect(voice).toHaveProperty('rate');
        expect(voice).toHaveProperty('style');
        expect(voice).toHaveProperty('catchphrases');
      });
    });

    it('should have catchphrases for each DJ', () => {
      DJ_VOICES.forEach(voice => {
        expect(voice.catchphrases.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Audio Effects', () => {
    it('should have multiple audio effects', () => {
      expect(AUDIO_EFFECTS.length).toBeGreaterThan(5);
    });

    it('should have all required effect properties', () => {
      AUDIO_EFFECTS.forEach(effect => {
        expect(effect).toHaveProperty('id');
        expect(effect).toHaveProperty('name');
        expect(effect).toHaveProperty('type');
        expect(effect).toHaveProperty('duration');
      });
    });
  });

  describe('Voiceover Templates', () => {
    it('should have station ID templates', () => {
      expect(VOICEOVER_TEMPLATES.stationId.length).toBeGreaterThan(0);
    });

    it('should have song intro templates', () => {
      expect(VOICEOVER_TEMPLATES.songIntro.length).toBeGreaterThan(0);
    });

    it('should have time check templates', () => {
      expect(VOICEOVER_TEMPLATES.timeCheck.length).toBeGreaterThan(0);
    });

    it('should have emergency templates', () => {
      expect(VOICEOVER_TEMPLATES.emergency.length).toBeGreaterThan(0);
    });
  });

  describe('Service State', () => {
    it('should get current state', () => {
      const state = djVoiceoverService.getState();
      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('currentVoiceover');
      expect(state).toHaveProperty('queue');
      expect(state).toHaveProperty('volume');
      expect(state).toHaveProperty('isMuted');
      expect(state).toHaveProperty('currentDJ');
    });

    it('should get current DJ', () => {
      const dj = djVoiceoverService.getCurrentDJ();
      expect(dj).toBeDefined();
      expect(dj.name).toBeTruthy();
    });

    it('should get all DJ voices', () => {
      const voices = djVoiceoverService.getDJVoices();
      expect(voices).toHaveLength(DJ_VOICES.length);
    });
  });

  describe('DJ Selection', () => {
    it('should set DJ by ID', () => {
      djVoiceoverService.setDJ('goldfields');
      expect(djVoiceoverService.getCurrentDJ().id).toBe('goldfields');
    });

    it('should not change DJ for invalid ID', () => {
      const originalDJ = djVoiceoverService.getCurrentDJ();
      djVoiceoverService.setDJ('invalid-dj');
      expect(djVoiceoverService.getCurrentDJ().id).toBe(originalDJ.id);
    });
  });

  describe('Voiceover Creation', () => {
    it('should create station ID voiceover', () => {
      const voiceover = djVoiceoverService.createVoiceover('station_id');
      expect(voiceover).toBeDefined();
      expect(voiceover.type).toBe('station_id');
      expect(voiceover.text).toBeTruthy();
      expect(voiceover.duration).toBeGreaterThan(0);
    });

    it('should create custom voiceover', () => {
      const customText = 'This is a custom message';
      const voiceover = djVoiceoverService.createVoiceover('promo', customText);
      expect(voiceover.text).toBe(customText);
    });

    it('should assign sound effect based on type', () => {
      const stationId = djVoiceoverService.createVoiceover('station_id');
      expect(stationId.soundEffect).toBe('jingle');
    });
  });

  describe('Queue Management', () => {
    it('should queue voiceover', () => {
      const voiceover = djVoiceoverService.createVoiceover('station_id');
      djVoiceoverService.queueVoiceover(voiceover);
      expect(djVoiceoverService.getState().queue.length).toBe(1);
    });

    it('should queue station ID', () => {
      djVoiceoverService.queueStationId();
      expect(djVoiceoverService.getState().queue.length).toBe(1);
    });

    it('should queue song intro', () => {
      djVoiceoverService.queueSongIntro('Test Song');
      const queue = djVoiceoverService.getState().queue;
      expect(queue.length).toBe(1);
      expect(queue[0].text).toContain('Test Song');
    });

    it('should queue time check', () => {
      djVoiceoverService.queueTimeCheck();
      expect(djVoiceoverService.getState().queue.length).toBe(1);
    });

    it('should queue catchphrase', () => {
      djVoiceoverService.queueCatchphrase();
      expect(djVoiceoverService.getState().queue.length).toBe(1);
    });

    it('should clear queue', () => {
      djVoiceoverService.queueStationId();
      djVoiceoverService.queueTimeCheck();
      djVoiceoverService.clearQueue();
      expect(djVoiceoverService.getState().queue.length).toBe(0);
    });

    it('should order by priority', () => {
      djVoiceoverService.queueTimeCheck(); // priority 2
      djVoiceoverService.queueStationId(); // priority 3
      const queue = djVoiceoverService.getState().queue;
      expect(queue[0].priority).toBeGreaterThanOrEqual(queue[1].priority);
    });
  });

  describe('Volume Control', () => {
    it('should set volume', () => {
      djVoiceoverService.setVolume(0.5);
      expect(djVoiceoverService.getState().volume).toBe(0.5);
    });

    it('should clamp volume to valid range', () => {
      djVoiceoverService.setVolume(2);
      expect(djVoiceoverService.getState().volume).toBe(1);
      djVoiceoverService.setVolume(-1);
      expect(djVoiceoverService.getState().volume).toBe(0);
    });

    it('should toggle mute', () => {
      const initialMuted = djVoiceoverService.getState().isMuted;
      djVoiceoverService.toggleMute();
      expect(djVoiceoverService.getState().isMuted).toBe(!initialMuted);
    });
  });

  describe('Audio Effects', () => {
    it('should get audio effect by ID', () => {
      const effect = djVoiceoverService.getAudioEffect('jingle-main');
      expect(effect).toBeDefined();
      expect(effect?.type).toBe('jingle');
    });

    it('should return undefined for invalid effect ID', () => {
      const effect = djVoiceoverService.getAudioEffect('invalid');
      expect(effect).toBeUndefined();
    });

    it('should get all audio effects', () => {
      const effects = djVoiceoverService.getAudioEffects();
      expect(effects).toHaveLength(AUDIO_EFFECTS.length);
    });
  });
});
