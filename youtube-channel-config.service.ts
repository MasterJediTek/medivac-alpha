/**
 * YouTube Channel Configuration Service
 * 
 * Manages JediTek Radio YouTube channel configuration:
 * - Stream URL management
 * - Channel branding customization
 * - Stream health monitoring
 * - Fallback stream handling
 */

// ============================================================================
// TYPES
// ============================================================================

export interface YouTubeChannelConfig {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  primaryColor: string;
  secondaryColor: string;
  streams: YouTubeStreamConfig[];
  fallbackStreamId: string;
  isLive: boolean;
  subscriberCount: number;
  totalViews: number;
}

export interface YouTubeStreamConfig {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: Date | null;
  category: StreamCategory;
  quality: StreamQuality;
  isDefault: boolean;
}

export type StreamCategory = 
  | 'music' 
  | 'news' 
  | 'ambient' 
  | 'talk' 
  | 'emergency' 
  | 'hospital';

export type StreamQuality = '360p' | '480p' | '720p' | '1080p' | '4k';

export interface StreamHealth {
  streamId: string;
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
  bufferHealth: number;
  bitrate: number;
  droppedFrames: number;
  lastChecked: Date;
}

export interface ChannelBranding {
  logoUrl: string;
  bannerUrl: string;
  watermarkUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  tagline: string;
}

export interface ChannelListener {
  onStreamChange?: (stream: YouTubeStreamConfig) => void;
  onHealthUpdate?: (health: StreamHealth) => void;
  onBrandingUpdate?: (branding: ChannelBranding) => void;
  onLiveStatusChange?: (isLive: boolean) => void;
}

// ============================================================================
// DEFAULT JEDITEK RADIO CONFIGURATION
// ============================================================================

export const JEDITEK_RADIO_CONFIG: YouTubeChannelConfig = {
  id: 'jeditek-radio',
  name: 'JediTek Radio',
  description: 'Your groove in the Goldfields! 24/7 music streaming from Kalgoorlie Regional Hospital',
  logo: '📻',
  banner: '🎵 JediTek Radio - We\'ve Got Your Groove! 🎵',
  primaryColor: '#00BFFF',
  secondaryColor: '#1a1a2e',
  streams: [
    {
      id: 'main-stream',
      videoId: 'jfKfPfyJRdk', // Lo-Fi Girl
      title: 'JediTek Radio Main',
      description: '24/7 Lo-Fi beats for the hospital',
      thumbnail: '🎧',
      isLive: true,
      viewerCount: 45000,
      startedAt: new Date('2024-01-01'),
      category: 'music',
      quality: '1080p',
      isDefault: true,
    },
    {
      id: 'synthwave-stream',
      videoId: '4xDzrJKXOOY', // Synthwave
      title: 'JediTek Synthwave',
      description: 'Retro futuristic vibes',
      thumbnail: '🌆',
      isLive: true,
      viewerCount: 12000,
      startedAt: new Date('2024-01-01'),
      category: 'music',
      quality: '1080p',
      isDefault: false,
    },
    {
      id: 'jazz-stream',
      videoId: 'Dx5qFachd3A', // Jazz
      title: 'JediTek Jazz Lounge',
      description: 'Smooth jazz for relaxation',
      thumbnail: '🎷',
      isLive: true,
      viewerCount: 8000,
      startedAt: new Date('2024-01-01'),
      category: 'music',
      quality: '720p',
      isDefault: false,
    },
    {
      id: 'classical-stream',
      videoId: 'mIYzp5rcTvU', // Classical
      title: 'JediTek Classical',
      description: 'Timeless classical compositions',
      thumbnail: '🎻',
      isLive: true,
      viewerCount: 5000,
      startedAt: new Date('2024-01-01'),
      category: 'music',
      quality: '720p',
      isDefault: false,
    },
    {
      id: 'ambient-stream',
      videoId: 'DWcJFNfaw9c', // Ambient
      title: 'JediTek Ambient',
      description: 'Peaceful ambient soundscapes',
      thumbnail: '🌿',
      isLive: true,
      viewerCount: 3000,
      startedAt: new Date('2024-01-01'),
      category: 'ambient',
      quality: '720p',
      isDefault: false,
    },
    {
      id: 'hospital-announcements',
      videoId: 'placeholder-hospital',
      title: 'Hospital Announcements',
      description: 'Official hospital broadcasts',
      thumbnail: '🏥',
      isLive: false,
      viewerCount: 0,
      startedAt: null,
      category: 'hospital',
      quality: '480p',
      isDefault: false,
    },
  ],
  fallbackStreamId: 'main-stream',
  isLive: true,
  subscriberCount: 125000,
  totalViews: 15000000,
};

export const DEFAULT_BRANDING: ChannelBranding = {
  logoUrl: 'https://jeditek.com.au/logo.png',
  bannerUrl: 'https://jeditek.com.au/banner.png',
  watermarkUrl: 'https://jeditek.com.au/watermark.png',
  primaryColor: '#00BFFF',
  secondaryColor: '#1a1a2e',
  accentColor: '#FFD700',
  fontFamily: 'system-ui',
  tagline: "JediTek Radio - We've Got Your Groove!",
};

// ============================================================================
// POPULAR YOUTUBE LIVE STREAMS (Real IDs)
// ============================================================================

export const POPULAR_LIVE_STREAMS = {
  lofiGirl: 'jfKfPfyJRdk',
  synthwave: '4xDzrJKXOOY',
  jazzRadio: 'Dx5qFachd3A',
  classical: 'mIYzp5rcTvU',
  ambient: 'DWcJFNfaw9c',
  chillhop: '5qap5aO4i9A',
  deepHouse: '21qNxnCS8WU',
  natureSound: 'eKFTSSKCzWA',
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class YouTubeChannelConfigService {
  private config: YouTubeChannelConfig;
  private branding: ChannelBranding;
  private currentStream: YouTubeStreamConfig;
  private streamHealth: Map<string, StreamHealth>;
  private listeners: Set<ChannelListener>;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor() {
    this.config = { ...JEDITEK_RADIO_CONFIG };
    this.branding = { ...DEFAULT_BRANDING };
    this.currentStream = this.config.streams.find(s => s.isDefault) || this.config.streams[0];
    this.streamHealth = new Map();
    this.listeners = new Set();
    this.healthCheckInterval = null;
    
    // Initialize health for all streams
    this.config.streams.forEach(stream => {
      this.streamHealth.set(stream.id, {
        streamId: stream.id,
        status: stream.isLive ? 'healthy' : 'offline',
        latency: Math.random() * 100 + 50,
        bufferHealth: 100,
        bitrate: this.getBitrateForQuality(stream.quality),
        droppedFrames: 0,
        lastChecked: new Date(),
      });
    });
  }

  /**
   * Get channel configuration
   */
  getConfig(): YouTubeChannelConfig {
    return { ...this.config };
  }

  /**
   * Get channel branding
   */
  getBranding(): ChannelBranding {
    return { ...this.branding };
  }

  /**
   * Update channel branding
   */
  updateBranding(updates: Partial<ChannelBranding>): void {
    this.branding = { ...this.branding, ...updates };
    this.notifyBrandingUpdate(this.branding);
  }

  /**
   * Get all streams
   */
  getStreams(): YouTubeStreamConfig[] {
    return [...this.config.streams];
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): YouTubeStreamConfig | undefined {
    return this.config.streams.find(s => s.id === streamId);
  }

  /**
   * Get current stream
   */
  getCurrentStream(): YouTubeStreamConfig {
    return { ...this.currentStream };
  }

  /**
   * Switch to a different stream
   */
  switchStream(streamId: string): boolean {
    const stream = this.getStream(streamId);
    if (!stream) return false;
    
    this.currentStream = stream;
    this.notifyStreamChange(stream);
    return true;
  }

  /**
   * Switch to fallback stream
   */
  switchToFallback(): void {
    const fallback = this.getStream(this.config.fallbackStreamId);
    if (fallback) {
      this.currentStream = fallback;
      this.notifyStreamChange(fallback);
    }
  }

  /**
   * Get stream health
   */
  getStreamHealth(streamId: string): StreamHealth | undefined {
    return this.streamHealth.get(streamId);
  }

  /**
   * Get all stream health statuses
   */
  getAllStreamHealth(): StreamHealth[] {
    return Array.from(this.streamHealth.values());
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) return;
    
    this.healthCheckInterval = setInterval(() => {
      this.checkAllStreamHealth();
    }, intervalMs);
    
    // Initial check
    this.checkAllStreamHealth();
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check health of all streams
   */
  private checkAllStreamHealth(): void {
    this.config.streams.forEach(stream => {
      const health = this.simulateHealthCheck(stream);
      this.streamHealth.set(stream.id, health);
      this.notifyHealthUpdate(health);
      
      // Auto-switch to fallback if current stream is unhealthy
      if (stream.id === this.currentStream.id && health.status === 'offline') {
        this.switchToFallback();
      }
    });
  }

  /**
   * Simulate health check (in production, would make actual API calls)
   */
  private simulateHealthCheck(stream: YouTubeStreamConfig): StreamHealth {
    const isHealthy = stream.isLive && Math.random() > 0.05;
    const isDegraded = isHealthy && Math.random() > 0.9;
    
    return {
      streamId: stream.id,
      status: !stream.isLive ? 'offline' : isDegraded ? 'degraded' : isHealthy ? 'healthy' : 'offline',
      latency: Math.random() * 100 + 50,
      bufferHealth: isHealthy ? 90 + Math.random() * 10 : 0,
      bitrate: this.getBitrateForQuality(stream.quality),
      droppedFrames: isDegraded ? Math.floor(Math.random() * 10) : 0,
      lastChecked: new Date(),
    };
  }

  /**
   * Get bitrate for quality level
   */
  private getBitrateForQuality(quality: StreamQuality): number {
    const bitrates: Record<StreamQuality, number> = {
      '360p': 1000,
      '480p': 2500,
      '720p': 5000,
      '1080p': 8000,
      '4k': 20000,
    };
    return bitrates[quality];
  }

  /**
   * Add a custom stream
   */
  addStream(stream: Omit<YouTubeStreamConfig, 'id'>): YouTubeStreamConfig {
    const newStream: YouTubeStreamConfig = {
      ...stream,
      id: `custom-${Date.now()}`,
    };
    this.config.streams.push(newStream);
    
    // Initialize health
    this.streamHealth.set(newStream.id, {
      streamId: newStream.id,
      status: newStream.isLive ? 'healthy' : 'offline',
      latency: 100,
      bufferHealth: 100,
      bitrate: this.getBitrateForQuality(newStream.quality),
      droppedFrames: 0,
      lastChecked: new Date(),
    });
    
    return newStream;
  }

  /**
   * Remove a stream
   */
  removeStream(streamId: string): boolean {
    const index = this.config.streams.findIndex(s => s.id === streamId);
    if (index === -1) return false;
    
    // Don't remove if it's the current stream
    if (this.currentStream.id === streamId) {
      this.switchToFallback();
    }
    
    this.config.streams.splice(index, 1);
    this.streamHealth.delete(streamId);
    return true;
  }

  /**
   * Update stream configuration
   */
  updateStream(streamId: string, updates: Partial<YouTubeStreamConfig>): boolean {
    const stream = this.config.streams.find(s => s.id === streamId);
    if (!stream) return false;
    
    Object.assign(stream, updates);
    
    if (this.currentStream.id === streamId) {
      this.currentStream = { ...stream };
      this.notifyStreamChange(this.currentStream);
    }
    
    return true;
  }

  /**
   * Get streams by category
   */
  getStreamsByCategory(category: StreamCategory): YouTubeStreamConfig[] {
    return this.config.streams.filter(s => s.category === category);
  }

  /**
   * Get live streams only
   */
  getLiveStreams(): YouTubeStreamConfig[] {
    return this.config.streams.filter(s => s.isLive);
  }

  /**
   * Get YouTube embed URL
   */
  getEmbedUrl(streamId?: string, options?: {
    autoplay?: boolean;
    mute?: boolean;
    controls?: boolean;
    loop?: boolean;
  }): string {
    const stream = streamId ? this.getStream(streamId) : this.currentStream;
    if (!stream) return '';
    
    const params = new URLSearchParams();
    if (options?.autoplay) params.set('autoplay', '1');
    if (options?.mute) params.set('mute', '1');
    if (options?.controls === false) params.set('controls', '0');
    if (options?.loop) params.set('loop', '1');
    params.set('modestbranding', '1');
    params.set('rel', '0');
    
    return `https://www.youtube.com/embed/${stream.videoId}?${params.toString()}`;
  }

  /**
   * Get YouTube watch URL
   */
  getWatchUrl(streamId?: string): string {
    const stream = streamId ? this.getStream(streamId) : this.currentStream;
    if (!stream) return '';
    return `https://www.youtube.com/watch?v=${stream.videoId}`;
  }

  /**
   * Check if channel is live
   */
  isChannelLive(): boolean {
    return this.config.isLive && this.config.streams.some(s => s.isLive);
  }

  /**
   * Get channel statistics
   */
  getStatistics(): {
    subscriberCount: number;
    totalViews: number;
    liveViewers: number;
    streamCount: number;
    liveStreamCount: number;
  } {
    const liveStreams = this.getLiveStreams();
    return {
      subscriberCount: this.config.subscriberCount,
      totalViews: this.config.totalViews,
      liveViewers: liveStreams.reduce((sum, s) => sum + s.viewerCount, 0),
      streamCount: this.config.streams.length,
      liveStreamCount: liveStreams.length,
    };
  }

  /**
   * Add listener
   */
  addListener(listener: ChannelListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify stream change
   */
  private notifyStreamChange(stream: YouTubeStreamConfig): void {
    this.listeners.forEach(l => l.onStreamChange?.(stream));
  }

  /**
   * Notify health update
   */
  private notifyHealthUpdate(health: StreamHealth): void {
    this.listeners.forEach(l => l.onHealthUpdate?.(health));
  }

  /**
   * Notify branding update
   */
  private notifyBrandingUpdate(branding: ChannelBranding): void {
    this.listeners.forEach(l => l.onBrandingUpdate?.(branding));
  }

  /**
   * Notify live status change
   */
  private notifyLiveStatusChange(isLive: boolean): void {
    this.listeners.forEach(l => l.onLiveStatusChange?.(isLive));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopHealthMonitoring();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const youtubeChannelConfigService = new YouTubeChannelConfigService();
export default youtubeChannelConfigService;
