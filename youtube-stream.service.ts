/**
 * YouTube Live Stream Service for JediTek Radio
 * 
 * Provides YouTube live stream integration:
 * - Stream URL management
 * - Playback state tracking
 * - Volume control
 * - Multiple stream sources (music channels)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface YouTubeStream {
  id: string;
  name: string;
  description: string;
  videoId: string;
  channelName: string;
  genre: string;
  isLive: boolean;
  thumbnail: string;
}

export interface StreamState {
  isPlaying: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
  currentStream: YouTubeStream | null;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface StreamEventListener {
  onStreamChange?: (stream: YouTubeStream) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: string) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

// ============================================================================
// JEDITEK RADIO STREAMS - Curated Music Channels
// ============================================================================

export const JEDITEK_STREAMS: YouTubeStream[] = [
  {
    id: 'lofi-beats',
    name: 'JediTek Chill Beats',
    description: 'Relaxing lo-fi beats for the hospital',
    videoId: 'jfKfPfyJRdk', // Lofi Girl
    channelName: 'Lofi Girl',
    genre: 'Lo-Fi / Chill',
    isLive: true,
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
  },
  {
    id: 'synthwave',
    name: 'JediTek Synthwave',
    description: 'Retro synthwave vibes',
    videoId: '4xDzrJKXOOY', // Synthwave Radio
    channelName: 'Synthwave',
    genre: 'Synthwave / Retro',
    isLive: true,
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/maxresdefault.jpg',
  },
  {
    id: 'jazz-radio',
    name: 'JediTek Jazz Lounge',
    description: 'Smooth jazz for relaxation',
    videoId: 'Dx5qFachd3A', // Jazz Radio
    channelName: 'Cafe Music BGM',
    genre: 'Jazz / Lounge',
    isLive: true,
    thumbnail: 'https://i.ytimg.com/vi/Dx5qFachd3A/maxresdefault.jpg',
  },
  {
    id: 'classical',
    name: 'JediTek Classical',
    description: 'Classical music for focus',
    videoId: 'mIYzp5rcTvU', // Classical Music
    channelName: 'Classical Music',
    genre: 'Classical',
    isLive: true,
    thumbnail: 'https://i.ytimg.com/vi/mIYzp5rcTvU/maxresdefault.jpg',
  },
  {
    id: 'ambient',
    name: 'JediTek Ambient',
    description: 'Ambient soundscapes',
    videoId: 'lTRiuFIWV54', // Ambient Music
    channelName: 'Ambient Worlds',
    genre: 'Ambient / Relaxation',
    isLive: true,
    thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/maxresdefault.jpg',
  },
];

// ============================================================================
// YOUTUBE STREAM SERVICE CLASS
// ============================================================================

class YouTubeStreamService {
  private state: StreamState;
  private listeners: Set<StreamEventListener>;
  private streamRotationInterval: NodeJS.Timeout | null;

  constructor() {
    this.state = {
      isPlaying: false,
      isPaused: false,
      isMuted: false,
      volume: 0.5,
      currentStream: JEDITEK_STREAMS[0],
      isFullscreen: false,
      isLoading: false,
      error: null,
    };
    this.listeners = new Set();
    this.streamRotationInterval = null;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Start playing the current stream
   */
  play(): void {
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.isLoading = true;
    this.notifyPlayStateChange();
    
    // Simulate loading complete
    setTimeout(() => {
      this.state.isLoading = false;
    }, 1000);
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.state.isPaused = true;
    this.state.isPlaying = false;
    this.notifyPlayStateChange();
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.notifyPlayStateChange();
  }

  /**
   * Toggle play/pause
   */
  toggle(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.state.volume > 0) {
      this.state.isMuted = false;
    }
    this.notifyVolumeChange();
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    this.notifyVolumeChange();
  }

  /**
   * Switch to a different stream
   */
  switchStream(streamId: string): void {
    const stream = JEDITEK_STREAMS.find(s => s.id === streamId);
    if (stream) {
      this.state.currentStream = stream;
      this.state.isLoading = true;
      this.notifyStreamChange();
      
      setTimeout(() => {
        this.state.isLoading = false;
      }, 1000);
    }
  }

  /**
   * Switch to next stream
   */
  nextStream(): void {
    const currentIndex = JEDITEK_STREAMS.findIndex(s => s.id === this.state.currentStream?.id);
    const nextIndex = (currentIndex + 1) % JEDITEK_STREAMS.length;
    this.switchStream(JEDITEK_STREAMS[nextIndex].id);
  }

  /**
   * Switch to previous stream
   */
  previousStream(): void {
    const currentIndex = JEDITEK_STREAMS.findIndex(s => s.id === this.state.currentStream?.id);
    const prevIndex = (currentIndex - 1 + JEDITEK_STREAMS.length) % JEDITEK_STREAMS.length;
    this.switchStream(JEDITEK_STREAMS[prevIndex].id);
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    this.state.isFullscreen = !this.state.isFullscreen;
    this.notifyFullscreenChange();
  }

  /**
   * Set fullscreen mode
   */
  setFullscreen(fullscreen: boolean): void {
    this.state.isFullscreen = fullscreen;
    this.notifyFullscreenChange();
  }

  /**
   * Get current state
   */
  getState(): StreamState {
    return { ...this.state };
  }

  /**
   * Get all available streams
   */
  getStreams(): YouTubeStream[] {
    return [...JEDITEK_STREAMS];
  }

  /**
   * Get YouTube embed URL for current stream
   */
  getEmbedUrl(autoplay: boolean = true, muted: boolean = false): string {
    if (!this.state.currentStream) return '';
    
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      controls: '1',
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      loop: '1',
      playlist: this.state.currentStream.videoId,
    });
    
    return `https://www.youtube.com/embed/${this.state.currentStream.videoId}?${params.toString()}`;
  }

  /**
   * Get thumbnail URL for current stream
   */
  getThumbnailUrl(): string {
    if (!this.state.currentStream) return '';
    return `https://img.youtube.com/vi/${this.state.currentStream.videoId}/hqdefault.jpg`;
  }

  /**
   * Add event listener
   */
  addListener(listener: StreamEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Start automatic stream rotation (for variety)
   */
  startStreamRotation(intervalMinutes: number = 30): void {
    if (this.streamRotationInterval) return;
    
    this.streamRotationInterval = setInterval(() => {
      this.nextStream();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic stream rotation
   */
  stopStreamRotation(): void {
    if (this.streamRotationInterval) {
      clearInterval(this.streamRotationInterval);
      this.streamRotationInterval = null;
    }
  }

  // ============================================================================
  // NOTIFICATION METHODS
  // ============================================================================

  private notifyStreamChange(): void {
    if (!this.state.currentStream) return;
    this.listeners.forEach(l => l.onStreamChange?.(this.state.currentStream!));
  }

  private notifyPlayStateChange(): void {
    this.listeners.forEach(l => l.onPlayStateChange?.(this.state.isPlaying));
  }

  private notifyVolumeChange(): void {
    this.listeners.forEach(l => l.onVolumeChange?.(this.state.volume));
  }

  private notifyFullscreenChange(): void {
    this.listeners.forEach(l => l.onFullscreenChange?.(this.state.isFullscreen));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.stop();
    this.stopStreamRotation();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const youtubeStreamService = new YouTubeStreamService();
export default youtubeStreamService;
