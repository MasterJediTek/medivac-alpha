import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { jediTekRadioService, JEDITEK_PLAYLIST, DJ_VOICEOVERS } from '../jeditek-radio-audio.service';

describe('JediTek Radio Audio Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    jediTekRadioService.stop();
    vi.useRealTimers();
  });

  describe('Playlist', () => {
    it('should have at least 40 tracks in the playlist', () => {
      expect(JEDITEK_PLAYLIST.length).toBeGreaterThanOrEqual(40);
    });

    it('should have tracks from multiple decades', () => {
      const years = JEDITEK_PLAYLIST.map(t => t.year);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      expect(maxYear - minYear).toBeGreaterThan(10);
    });

    it('should have all required track properties', () => {
      JEDITEK_PLAYLIST.forEach(track => {
        expect(track).toHaveProperty('id');
        expect(track).toHaveProperty('title');
        expect(track).toHaveProperty('artist');
        expect(track).toHaveProperty('duration');
        expect(track).toHaveProperty('year');
        expect(track).toHaveProperty('genre');
      });
    });
  });

  describe('DJ Voiceovers', () => {
    it('should have multiple voiceover types', () => {
      const types = new Set(DJ_VOICEOVERS.map(v => v.type));
      expect(types.has('station_id')).toBe(true);
      expect(types.has('transition')).toBe(true);
      expect(types.has('intro')).toBe(true);
    });

    it('should have JediTek branding in station IDs', () => {
      const stationIds = DJ_VOICEOVERS.filter(v => v.type === 'station_id');
      const hasJediTekBranding = stationIds.some(v => 
        v.text.toLowerCase().includes('jeditek') || v.text.toLowerCase().includes('jedi')
      );
      expect(hasJediTekBranding).toBe(true);
    });
  });

  describe('Radio State', () => {
    it('should start with isPlaying false', () => {
      const state = jediTekRadioService.getState();
      expect(state.isPlaying).toBe(false);
    });

    it('should have default volume of 0.7', () => {
      const state = jediTekRadioService.getState();
      expect(state.volume).toBe(0.7);
    });

    it('should have visualizer data array', () => {
      const state = jediTekRadioService.getState();
      expect(Array.isArray(state.visualizerData)).toBe(true);
      expect(state.visualizerData.length).toBe(32);
    });
  });

  describe('Volume Control', () => {
    it('should set volume within valid range', () => {
      jediTekRadioService.setVolume(0.5);
      expect(jediTekRadioService.getState().volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      jediTekRadioService.setVolume(1.5);
      expect(jediTekRadioService.getState().volume).toBe(1);
      
      jediTekRadioService.setVolume(-0.5);
      expect(jediTekRadioService.getState().volume).toBe(0);
    });

    it('should toggle mute', () => {
      const initialMuted = jediTekRadioService.getState().isMuted;
      jediTekRadioService.toggleMute();
      expect(jediTekRadioService.getState().isMuted).toBe(!initialMuted);
    });
  });

  describe('Shuffle and Repeat', () => {
    it('should toggle shuffle mode', () => {
      const initialShuffle = jediTekRadioService.getState().shuffleEnabled;
      jediTekRadioService.toggleShuffle();
      expect(jediTekRadioService.getState().shuffleEnabled).toBe(!initialShuffle);
    });

    it('should cycle through repeat modes', () => {
      expect(jediTekRadioService.getState().repeatMode).toBe('all');
      jediTekRadioService.cycleRepeatMode();
      expect(jediTekRadioService.getState().repeatMode).toBe('none');
      jediTekRadioService.cycleRepeatMode();
      expect(jediTekRadioService.getState().repeatMode).toBe('one');
      jediTekRadioService.cycleRepeatMode();
      expect(jediTekRadioService.getState().repeatMode).toBe('all');
    });
  });

  describe('Playlist Access', () => {
    it('should return a copy of the playlist', () => {
      const playlist = jediTekRadioService.getPlaylist();
      expect(playlist).toHaveLength(JEDITEK_PLAYLIST.length);
      expect(playlist).not.toBe(JEDITEK_PLAYLIST);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove listeners', () => {
      const listener = { onTrackChange: vi.fn() };
      const unsubscribe = jediTekRadioService.addListener(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});
