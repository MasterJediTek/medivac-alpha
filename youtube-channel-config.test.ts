/**
 * YouTube Channel Config Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  youtubeChannelConfigService,
  JEDITEK_RADIO_CONFIG,
  DEFAULT_BRANDING,
  POPULAR_LIVE_STREAMS,
} from '../youtube-channel-config.service';

describe('YouTube Channel Config Service', () => {
  beforeEach(() => {
    // Reset to default state
    youtubeChannelConfigService.stopHealthMonitoring();
  });

  afterEach(() => {
    youtubeChannelConfigService.stopHealthMonitoring();
  });

  describe('Configuration', () => {
    it('should get channel configuration', () => {
      const config = youtubeChannelConfigService.getConfig();
      expect(config.id).toBe('jeditek-radio');
      expect(config.name).toBe('JediTek Radio');
      expect(config.streams.length).toBeGreaterThan(0);
    });

    it('should get channel branding', () => {
      const branding = youtubeChannelConfigService.getBranding();
      expect(branding.primaryColor).toBe('#00BFFF');
      expect(branding.tagline).toContain('JediTek Radio');
    });

    it('should update channel branding', () => {
      const originalBranding = youtubeChannelConfigService.getBranding();
      youtubeChannelConfigService.updateBranding({ tagline: 'Test Tagline' });
      const updatedBranding = youtubeChannelConfigService.getBranding();
      expect(updatedBranding.tagline).toBe('Test Tagline');
      // Restore
      youtubeChannelConfigService.updateBranding({ tagline: originalBranding.tagline });
    });
  });

  describe('Streams', () => {
    it('should get all streams', () => {
      const streams = youtubeChannelConfigService.getStreams();
      expect(streams.length).toBeGreaterThan(0);
    });

    it('should get stream by ID', () => {
      const stream = youtubeChannelConfigService.getStream('main-stream');
      expect(stream).toBeDefined();
      expect(stream?.title).toBe('JediTek Radio Main');
    });

    it('should return undefined for non-existent stream', () => {
      const stream = youtubeChannelConfigService.getStream('non-existent');
      expect(stream).toBeUndefined();
    });

    it('should get current stream', () => {
      const stream = youtubeChannelConfigService.getCurrentStream();
      expect(stream).toBeDefined();
      expect(stream.isDefault).toBe(true);
    });

    it('should switch streams', () => {
      const result = youtubeChannelConfigService.switchStream('synthwave-stream');
      expect(result).toBe(true);
      const current = youtubeChannelConfigService.getCurrentStream();
      expect(current.id).toBe('synthwave-stream');
      // Switch back to default
      youtubeChannelConfigService.switchStream('main-stream');
    });

    it('should not switch to non-existent stream', () => {
      const result = youtubeChannelConfigService.switchStream('non-existent');
      expect(result).toBe(false);
    });

    it('should switch to fallback stream', () => {
      youtubeChannelConfigService.switchStream('synthwave-stream');
      youtubeChannelConfigService.switchToFallback();
      const current = youtubeChannelConfigService.getCurrentStream();
      expect(current.id).toBe('main-stream');
    });

    it('should get streams by category', () => {
      const musicStreams = youtubeChannelConfigService.getStreamsByCategory('music');
      expect(musicStreams.length).toBeGreaterThan(0);
      musicStreams.forEach(s => expect(s.category).toBe('music'));
    });

    it('should get live streams only', () => {
      const liveStreams = youtubeChannelConfigService.getLiveStreams();
      liveStreams.forEach(s => expect(s.isLive).toBe(true));
    });
  });

  describe('URLs', () => {
    it('should get embed URL', () => {
      const url = youtubeChannelConfigService.getEmbedUrl();
      expect(url).toContain('youtube.com/embed/');
    });

    it('should get embed URL with options', () => {
      const url = youtubeChannelConfigService.getEmbedUrl(undefined, {
        autoplay: true,
        mute: true,
      });
      expect(url).toContain('autoplay=1');
      expect(url).toContain('mute=1');
    });

    it('should get watch URL', () => {
      const url = youtubeChannelConfigService.getWatchUrl();
      expect(url).toContain('youtube.com/watch?v=');
    });
  });

  describe('Health Monitoring', () => {
    it('should get stream health', () => {
      const health = youtubeChannelConfigService.getStreamHealth('main-stream');
      expect(health).toBeDefined();
      expect(health?.streamId).toBe('main-stream');
    });

    it('should get all stream health', () => {
      const healthList = youtubeChannelConfigService.getAllStreamHealth();
      expect(healthList.length).toBeGreaterThan(0);
    });

    it('should start and stop health monitoring', () => {
      youtubeChannelConfigService.startHealthMonitoring(60000);
      // Should not throw
      youtubeChannelConfigService.stopHealthMonitoring();
    });
  });

  describe('Statistics', () => {
    it('should get channel statistics', () => {
      const stats = youtubeChannelConfigService.getStatistics();
      expect(stats.subscriberCount).toBeGreaterThan(0);
      expect(stats.totalViews).toBeGreaterThan(0);
      expect(stats.streamCount).toBeGreaterThan(0);
    });

    it('should check if channel is live', () => {
      const isLive = youtubeChannelConfigService.isChannelLive();
      expect(typeof isLive).toBe('boolean');
    });
  });

  describe('Custom Streams', () => {
    it('should add custom stream', () => {
      const newStream = youtubeChannelConfigService.addStream({
        videoId: 'test123',
        title: 'Test Stream',
        description: 'Test description',
        thumbnail: '🎵',
        isLive: true,
        viewerCount: 100,
        startedAt: new Date(),
        category: 'music',
        quality: '720p',
        isDefault: false,
      });
      expect(newStream.id).toContain('custom-');
      expect(newStream.title).toBe('Test Stream');
      // Clean up
      youtubeChannelConfigService.removeStream(newStream.id);
    });

    it('should update stream', () => {
      const result = youtubeChannelConfigService.updateStream('main-stream', {
        viewerCount: 50000,
      });
      expect(result).toBe(true);
    });
  });

  describe('Listeners', () => {
    it('should add and remove listener', () => {
      let streamChanged = false;
      const unsubscribe = youtubeChannelConfigService.addListener({
        onStreamChange: () => {
          streamChanged = true;
        },
      });
      youtubeChannelConfigService.switchStream('synthwave-stream');
      expect(streamChanged).toBe(true);
      unsubscribe();
      // Switch back
      youtubeChannelConfigService.switchStream('main-stream');
    });
  });

  describe('Constants', () => {
    it('should have JediTek Radio config', () => {
      expect(JEDITEK_RADIO_CONFIG.id).toBe('jeditek-radio');
      expect(JEDITEK_RADIO_CONFIG.streams.length).toBeGreaterThan(0);
    });

    it('should have default branding', () => {
      expect(DEFAULT_BRANDING.primaryColor).toBeDefined();
      expect(DEFAULT_BRANDING.tagline).toBeDefined();
    });

    it('should have popular live streams', () => {
      expect(POPULAR_LIVE_STREAMS.lofiGirl).toBeDefined();
      expect(POPULAR_LIVE_STREAMS.synthwave).toBeDefined();
    });
  });
});
