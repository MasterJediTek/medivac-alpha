import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { youtubeStreamService, JEDITEK_STREAMS } from '../youtube-stream.service';

describe('YouTube Stream Service', () => {
  afterEach(() => {
    youtubeStreamService.stop();
  });

  describe('JediTek Streams', () => {
    it('should have multiple stream options', () => {
      expect(JEDITEK_STREAMS.length).toBeGreaterThan(3);
    });

    it('should have all required stream properties', () => {
      JEDITEK_STREAMS.forEach(stream => {
        expect(stream).toHaveProperty('id');
        expect(stream).toHaveProperty('name');
        expect(stream).toHaveProperty('description');
        expect(stream).toHaveProperty('videoId');
        expect(stream).toHaveProperty('channelName');
        expect(stream).toHaveProperty('genre');
        expect(stream).toHaveProperty('isLive');
        expect(stream).toHaveProperty('thumbnail');
      });
    });

    it('should have JediTek branding in stream names', () => {
      const hasJediTekBranding = JEDITEK_STREAMS.some(s => 
        s.name.toLowerCase().includes('jeditek')
      );
      expect(hasJediTekBranding).toBe(true);
    });

    it('should have valid YouTube video IDs', () => {
      JEDITEK_STREAMS.forEach(stream => {
        expect(stream.videoId).toBeTruthy();
        expect(stream.videoId.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Stream State', () => {
    it('should start with isPlaying false', () => {
      const state = youtubeStreamService.getState();
      expect(state.isPlaying).toBe(false);
    });

    it('should have default volume of 0.5', () => {
      const state = youtubeStreamService.getState();
      expect(state.volume).toBe(0.5);
    });

    it('should have a current stream set', () => {
      const state = youtubeStreamService.getState();
      expect(state.currentStream).not.toBeNull();
    });

    it('should not be in fullscreen by default', () => {
      const state = youtubeStreamService.getState();
      expect(state.isFullscreen).toBe(false);
    });
  });

  describe('Playback Control', () => {
    it('should play the stream', () => {
      youtubeStreamService.play();
      expect(youtubeStreamService.getState().isPlaying).toBe(true);
    });

    it('should pause the stream', () => {
      youtubeStreamService.play();
      youtubeStreamService.pause();
      expect(youtubeStreamService.getState().isPaused).toBe(true);
    });

    it('should stop the stream', () => {
      youtubeStreamService.play();
      youtubeStreamService.stop();
      expect(youtubeStreamService.getState().isPlaying).toBe(false);
      expect(youtubeStreamService.getState().isPaused).toBe(false);
    });

    it('should toggle play/pause', () => {
      expect(youtubeStreamService.getState().isPlaying).toBe(false);
      youtubeStreamService.toggle();
      expect(youtubeStreamService.getState().isPlaying).toBe(true);
      youtubeStreamService.toggle();
      expect(youtubeStreamService.getState().isPaused).toBe(true);
    });
  });

  describe('Volume Control', () => {
    it('should set volume within valid range', () => {
      youtubeStreamService.setVolume(0.8);
      expect(youtubeStreamService.getState().volume).toBe(0.8);
    });

    it('should clamp volume to 0-1 range', () => {
      youtubeStreamService.setVolume(1.5);
      expect(youtubeStreamService.getState().volume).toBe(1);
      
      youtubeStreamService.setVolume(-0.5);
      expect(youtubeStreamService.getState().volume).toBe(0);
    });

    it('should toggle mute', () => {
      const initialMuted = youtubeStreamService.getState().isMuted;
      youtubeStreamService.toggleMute();
      expect(youtubeStreamService.getState().isMuted).toBe(!initialMuted);
    });

    it('should unmute when setting volume above 0', () => {
      // First mute
      youtubeStreamService.toggleMute();
      const mutedState = youtubeStreamService.getState().isMuted;
      // Setting volume should unmute
      youtubeStreamService.setVolume(0.5);
      // If was muted, should now be unmuted
      if (mutedState) {
        expect(youtubeStreamService.getState().isMuted).toBe(false);
      }
    });
  });

  describe('Stream Switching', () => {
    it('should switch to a different stream by ID', () => {
      const targetStream = JEDITEK_STREAMS[1];
      youtubeStreamService.switchStream(targetStream.id);
      expect(youtubeStreamService.getState().currentStream?.id).toBe(targetStream.id);
    });

    it('should switch to next stream', () => {
      const initialStream = youtubeStreamService.getState().currentStream;
      youtubeStreamService.nextStream();
      const newStream = youtubeStreamService.getState().currentStream;
      expect(newStream?.id).not.toBe(initialStream?.id);
    });

    it('should switch to previous stream', () => {
      youtubeStreamService.nextStream(); // Move to second stream
      const secondStream = youtubeStreamService.getState().currentStream;
      youtubeStreamService.previousStream();
      const backToFirst = youtubeStreamService.getState().currentStream;
      expect(backToFirst?.id).not.toBe(secondStream?.id);
    });

    it('should wrap around when switching past last stream', () => {
      // Get the initial stream
      const initialId = youtubeStreamService.getState().currentStream?.id;
      // Switch through all streams
      for (let i = 0; i < JEDITEK_STREAMS.length; i++) {
        youtubeStreamService.nextStream();
      }
      // After going through all streams, should be back to initial
      expect(youtubeStreamService.getState().currentStream?.id).toBe(initialId);
    });
  });

  describe('Fullscreen', () => {
    it('should toggle fullscreen', () => {
      expect(youtubeStreamService.getState().isFullscreen).toBe(false);
      youtubeStreamService.toggleFullscreen();
      expect(youtubeStreamService.getState().isFullscreen).toBe(true);
      youtubeStreamService.toggleFullscreen();
      expect(youtubeStreamService.getState().isFullscreen).toBe(false);
    });

    it('should set fullscreen directly', () => {
      youtubeStreamService.setFullscreen(true);
      expect(youtubeStreamService.getState().isFullscreen).toBe(true);
      youtubeStreamService.setFullscreen(false);
      expect(youtubeStreamService.getState().isFullscreen).toBe(false);
    });
  });

  describe('Embed URL', () => {
    it('should generate valid embed URL', () => {
      const url = youtubeStreamService.getEmbedUrl();
      expect(url).toContain('youtube.com/embed/');
      expect(url).toContain(youtubeStreamService.getState().currentStream?.videoId);
    });

    it('should include autoplay parameter', () => {
      const urlWithAutoplay = youtubeStreamService.getEmbedUrl(true);
      expect(urlWithAutoplay).toContain('autoplay=1');
      
      const urlWithoutAutoplay = youtubeStreamService.getEmbedUrl(false);
      expect(urlWithoutAutoplay).toContain('autoplay=0');
    });

    it('should include mute parameter', () => {
      const urlMuted = youtubeStreamService.getEmbedUrl(true, true);
      expect(urlMuted).toContain('mute=1');
      
      const urlUnmuted = youtubeStreamService.getEmbedUrl(true, false);
      expect(urlUnmuted).toContain('mute=0');
    });
  });

  describe('Thumbnail URL', () => {
    it('should generate valid thumbnail URL', () => {
      const url = youtubeStreamService.getThumbnailUrl();
      expect(url).toContain('img.youtube.com/vi/');
      expect(url).toContain(youtubeStreamService.getState().currentStream?.videoId);
    });
  });

  describe('Stream List', () => {
    it('should return all available streams', () => {
      const streams = youtubeStreamService.getStreams();
      expect(streams).toHaveLength(JEDITEK_STREAMS.length);
    });

    it('should return a copy of streams', () => {
      const streams = youtubeStreamService.getStreams();
      expect(streams).not.toBe(JEDITEK_STREAMS);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove listeners', () => {
      const listener = {
        onStreamChange: vi.fn(),
        onPlayStateChange: vi.fn(),
      };
      
      const unsubscribe = youtubeStreamService.addListener(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});
