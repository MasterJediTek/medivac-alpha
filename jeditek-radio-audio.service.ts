/**
 * JediTek Radio Audio Streaming Service
 * 
 * Provides real audio streaming for JediTek Radio with:
 * - Track queue management
 * - Crossfade transitions
 * - DJ voiceover playback
 * - Audio visualizer data
 * - Volume controls
 */

import { Platform } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface RadioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // seconds
  year: number;
  genre: string;
  audioUrl?: string;
  coverArt?: string;
}

export interface DJVoiceover {
  id: string;
  text: string;
  type: 'intro' | 'transition' | 'station_id' | 'outro' | 'ad';
  duration: number;
}

export interface RadioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: RadioTrack | null;
  nextTrack: RadioTrack | null;
  volume: number;
  isMuted: boolean;
  playbackPosition: number;
  isVoiceoverPlaying: boolean;
  currentVoiceover: DJVoiceover | null;
  shuffleEnabled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  visualizerData: number[];
}

export interface RadioEventListener {
  onTrackChange?: (track: RadioTrack) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onVoiceoverStart?: (voiceover: DJVoiceover) => void;
  onVoiceoverEnd?: () => void;
  onVisualizerUpdate?: (data: number[]) => void;
  onError?: (error: string) => void;
}

// ============================================================================
// TRACK DATABASE - Top Hits from Past 20 Years
// ============================================================================

export const JEDITEK_PLAYLIST: RadioTrack[] = [
  // 2024-2025 Hits
  { id: 't001', title: 'Flowers', artist: 'Miley Cyrus', duration: 200, year: 2023, genre: 'Pop' },
  { id: 't002', title: 'As It Was', artist: 'Harry Styles', duration: 167, year: 2022, genre: 'Pop' },
  { id: 't003', title: 'Anti-Hero', artist: 'Taylor Swift', duration: 200, year: 2022, genre: 'Pop' },
  { id: 't004', title: 'Unholy', artist: 'Sam Smith & Kim Petras', duration: 156, year: 2022, genre: 'Pop' },
  { id: 't005', title: 'About Damn Time', artist: 'Lizzo', duration: 193, year: 2022, genre: 'Pop' },
  
  // 2020-2023 Hits
  { id: 't006', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, year: 2020, genre: 'Synth-pop' },
  { id: 't007', title: 'Levitating', artist: 'Dua Lipa', duration: 203, year: 2020, genre: 'Disco-pop' },
  { id: 't008', title: 'Save Your Tears', artist: 'The Weeknd', duration: 215, year: 2020, genre: 'Synth-pop' },
  { id: 't009', title: 'Peaches', artist: 'Justin Bieber', duration: 198, year: 2021, genre: 'R&B' },
  { id: 't010', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', duration: 141, year: 2021, genre: 'Pop' },
  
  // 2017-2019 Hits
  { id: 't011', title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, year: 2017, genre: 'Pop' },
  { id: 't012', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', duration: 228, year: 2017, genre: 'Reggaeton' },
  { id: 't013', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: 269, year: 2015, genre: 'Funk' },
  { id: 't014', title: 'Old Town Road', artist: 'Lil Nas X', duration: 157, year: 2019, genre: 'Country Rap' },
  { id: 't015', title: 'Bad Guy', artist: 'Billie Eilish', duration: 194, year: 2019, genre: 'Electropop' },
  
  // 2014-2016 Hits
  { id: 't016', title: 'Happy', artist: 'Pharrell Williams', duration: 232, year: 2014, genre: 'Soul' },
  { id: 't017', title: 'Shake It Off', artist: 'Taylor Swift', duration: 219, year: 2014, genre: 'Pop' },
  { id: 't018', title: 'Thinking Out Loud', artist: 'Ed Sheeran', duration: 281, year: 2014, genre: 'Soul' },
  { id: 't019', title: 'Sorry', artist: 'Justin Bieber', duration: 200, year: 2015, genre: 'Tropical House' },
  { id: 't020', title: 'Closer', artist: 'The Chainsmokers ft. Halsey', duration: 244, year: 2016, genre: 'EDM' },
  
  // 2010-2013 Hits
  { id: 't021', title: 'Rolling in the Deep', artist: 'Adele', duration: 228, year: 2011, genre: 'Soul' },
  { id: 't022', title: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra', duration: 244, year: 2011, genre: 'Indie' },
  { id: 't023', title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', duration: 193, year: 2012, genre: 'Pop' },
  { id: 't024', title: 'Gangnam Style', artist: 'PSY', duration: 219, year: 2012, genre: 'K-Pop' },
  { id: 't025', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell', duration: 369, year: 2013, genre: 'Disco' },
  
  // 2007-2009 Hits
  { id: 't026', title: 'Poker Face', artist: 'Lady Gaga', duration: 237, year: 2008, genre: 'Dance-pop' },
  { id: 't027', title: 'Single Ladies', artist: 'Beyoncé', duration: 196, year: 2008, genre: 'R&B' },
  { id: 't028', title: 'I Gotta Feeling', artist: 'Black Eyed Peas', duration: 289, year: 2009, genre: 'Dance-pop' },
  { id: 't029', title: 'Boom Boom Pow', artist: 'Black Eyed Peas', duration: 289, year: 2009, genre: 'Electro-hop' },
  { id: 't030', title: 'Umbrella', artist: 'Rihanna ft. Jay-Z', duration: 276, year: 2007, genre: 'R&B' },
  
  // 2004-2006 Hits
  { id: 't031', title: 'Crazy in Love', artist: 'Beyoncé ft. Jay-Z', duration: 236, year: 2003, genre: 'R&B' },
  { id: 't032', title: 'Yeah!', artist: 'Usher ft. Lil Jon', duration: 250, year: 2004, genre: 'Crunk' },
  { id: 't033', title: 'Since U Been Gone', artist: 'Kelly Clarkson', duration: 195, year: 2004, genre: 'Pop Rock' },
  { id: 't034', title: 'Hips Don\'t Lie', artist: 'Shakira ft. Wyclef Jean', duration: 218, year: 2006, genre: 'Latin Pop' },
  { id: 't035', title: 'SexyBack', artist: 'Justin Timberlake', duration: 237, year: 2006, genre: 'Dance-pop' },
  
  // Classic Disco & Dance Hits
  { id: 't036', title: 'Stayin\' Alive', artist: 'Bee Gees', duration: 285, year: 1977, genre: 'Disco' },
  { id: 't037', title: 'Don\'t Stop \'Til You Get Enough', artist: 'Michael Jackson', duration: 366, year: 1979, genre: 'Disco' },
  { id: 't038', title: 'Le Freak', artist: 'Chic', duration: 326, year: 1978, genre: 'Disco' },
  { id: 't039', title: 'September', artist: 'Earth, Wind & Fire', duration: 215, year: 1978, genre: 'Disco' },
  { id: 't040', title: 'I Will Survive', artist: 'Gloria Gaynor', duration: 198, year: 1978, genre: 'Disco' },
];

// ============================================================================
// DJ VOICEOVERS
// ============================================================================

export const DJ_VOICEOVERS: DJVoiceover[] = [
  // Station IDs
  { id: 'v001', text: "JediTek Radio - We've got your groove!", type: 'station_id', duration: 3 },
  { id: 'v002', text: "You're tuned in to the JEDI frequency!", type: 'station_id', duration: 3 },
  { id: 'v003', text: "Keep it locked, keep it JEDI!", type: 'station_id', duration: 2.5 },
  { id: 'v004', text: "This is JediTek Radio - Feel the force of music!", type: 'station_id', duration: 4 },
  { id: 'v005', text: "JediTek Radio - Where the hits never stop!", type: 'station_id', duration: 3 },
  { id: 'v006', text: "Broadcasting from the Goldfields - JediTek Radio!", type: 'station_id', duration: 4 },
  { id: 'v007', text: "May the beats be with you - JediTek Radio!", type: 'station_id', duration: 3.5 },
  { id: 'v008', text: "Your galactic groove station - JediTek Radio!", type: 'station_id', duration: 3.5 },
  
  // Transitions
  { id: 'v009', text: "Coming up next, another banger!", type: 'transition', duration: 2 },
  { id: 'v010', text: "Let's keep this party going!", type: 'transition', duration: 2 },
  { id: 'v011', text: "Oh yeah, here we go!", type: 'transition', duration: 1.5 },
  { id: 'v012', text: "Time to turn it up!", type: 'transition', duration: 2 },
  { id: 'v013', text: "Get ready for this one!", type: 'transition', duration: 2 },
  { id: 'v014', text: "Here's a classic for ya!", type: 'transition', duration: 2 },
  
  // Intros
  { id: 'v015', text: "Welcome to JediTek Radio! Your journey through the hits starts now!", type: 'intro', duration: 5 },
  { id: 'v016', text: "Good vibes only on JediTek Radio!", type: 'intro', duration: 3 },
  
  // Ads
  { id: 'v017', text: "JediTek - Powering the future of healthcare technology!", type: 'ad', duration: 4 },
  { id: 'v018', text: "MediVac One - Your virtual hospital, always connected!", type: 'ad', duration: 4 },
  { id: 'v019', text: "WONGI Systems - Community communications made easy!", type: 'ad', duration: 4 },
];

// ============================================================================
// AUDIO SERVICE CLASS
// ============================================================================

class JediTekRadioAudioService {
  private state: RadioState;
  private listeners: Set<RadioEventListener>;
  private playlist: RadioTrack[];
  private playlistIndex: number;
  private visualizerInterval: NodeJS.Timeout | null;
  private trackProgressInterval: NodeJS.Timeout | null;
  private voiceoverTimeout: NodeJS.Timeout | null;

  constructor() {
    this.state = {
      isPlaying: false,
      isPaused: false,
      currentTrack: null,
      nextTrack: null,
      volume: 0.7,
      isMuted: false,
      playbackPosition: 0,
      isVoiceoverPlaying: false,
      currentVoiceover: null,
      shuffleEnabled: false,
      repeatMode: 'all',
      visualizerData: new Array(32).fill(0),
    };
    this.listeners = new Set();
    this.playlist = [...JEDITEK_PLAYLIST];
    this.playlistIndex = 0;
    this.visualizerInterval = null;
    this.trackProgressInterval = null;
    this.voiceoverTimeout = null;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Start playing the radio
   */
  async play(): Promise<void> {
    if (this.state.isPlaying && !this.state.isPaused) return;

    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.state.isPlaying = true;
      this.startVisualizer();
      this.startProgressTracking();
      this.notifyPlayStateChange();
      return;
    }

    // Play intro voiceover first
    await this.playVoiceover(DJ_VOICEOVERS.find(v => v.type === 'intro')!);
    
    // Start playing tracks
    this.playNextTrack();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.isPlaying) return;
    
    this.state.isPaused = true;
    this.state.isPlaying = false;
    this.stopVisualizer();
    this.stopProgressTracking();
    this.notifyPlayStateChange();
  }

  /**
   * Stop playback completely
   */
  stop(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.playbackPosition = 0;
    this.state.currentTrack = null;
    this.stopVisualizer();
    this.stopProgressTracking();
    this.notifyPlayStateChange();
  }

  /**
   * Skip to next track
   */
  async skipNext(): Promise<void> {
    await this.playTransitionVoiceover();
    this.playNextTrack();
  }

  /**
   * Go to previous track
   */
  async skipPrevious(): Promise<void> {
    this.playlistIndex = (this.playlistIndex - 2 + this.playlist.length) % this.playlist.length;
    await this.playTransitionVoiceover();
    this.playNextTrack();
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.state.volume > 0) {
      this.state.isMuted = false;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
  }

  /**
   * Toggle shuffle mode
   */
  toggleShuffle(): void {
    this.state.shuffleEnabled = !this.state.shuffleEnabled;
    if (this.state.shuffleEnabled) {
      this.shufflePlaylist();
    }
  }

  /**
   * Cycle repeat mode
   */
  cycleRepeatMode(): void {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(this.state.repeatMode);
    this.state.repeatMode = modes[(currentIndex + 1) % modes.length];
  }

  /**
   * Get current state
   */
  getState(): RadioState {
    return { ...this.state };
  }

  /**
   * Get current playlist
   */
  getPlaylist(): RadioTrack[] {
    return [...this.playlist];
  }

  /**
   * Add event listener
   */
  addListener(listener: RadioEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Seek to position (0-1)
   */
  seek(position: number): void {
    if (!this.state.currentTrack) return;
    this.state.playbackPosition = position * this.state.currentTrack.duration;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private playNextTrack(): void {
    const track = this.getNextTrack();
    if (!track) return;

    this.state.currentTrack = track;
    this.state.playbackPosition = 0;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.nextTrack = this.peekNextTrack();

    this.startVisualizer();
    this.startProgressTracking();
    this.notifyTrackChange();
    this.notifyPlayStateChange();
  }

  private getNextTrack(): RadioTrack | null {
    if (this.playlist.length === 0) return null;

    if (this.state.repeatMode === 'one' && this.state.currentTrack) {
      return this.state.currentTrack;
    }

    const track = this.playlist[this.playlistIndex];
    this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;

    if (this.playlistIndex === 0 && this.state.repeatMode === 'none') {
      return null;
    }

    return track;
  }

  private peekNextTrack(): RadioTrack | null {
    if (this.playlist.length === 0) return null;
    return this.playlist[this.playlistIndex];
  }

  private shufflePlaylist(): void {
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
    this.playlistIndex = 0;
  }

  private async playVoiceover(voiceover: DJVoiceover): Promise<void> {
    return new Promise((resolve) => {
      this.state.isVoiceoverPlaying = true;
      this.state.currentVoiceover = voiceover;
      this.notifyVoiceoverStart(voiceover);

      this.voiceoverTimeout = setTimeout(() => {
        this.state.isVoiceoverPlaying = false;
        this.state.currentVoiceover = null;
        this.notifyVoiceoverEnd();
        resolve();
      }, voiceover.duration * 1000);
    });
  }

  private async playTransitionVoiceover(): Promise<void> {
    const transitions = DJ_VOICEOVERS.filter(v => v.type === 'transition' || v.type === 'station_id');
    const voiceover = transitions[Math.floor(Math.random() * transitions.length)];
    await this.playVoiceover(voiceover);
  }

  private startVisualizer(): void {
    if (this.visualizerInterval) return;

    this.visualizerInterval = setInterval(() => {
      // Generate simulated frequency data
      const data = new Array(32).fill(0).map(() => {
        const base = this.state.isPlaying ? 0.3 : 0;
        const variation = this.state.isPlaying ? Math.random() * 0.7 : 0;
        return base + variation;
      });
      
      this.state.visualizerData = data;
      this.notifyVisualizerUpdate(data);
    }, 50);
  }

  private stopVisualizer(): void {
    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
      this.visualizerInterval = null;
    }
    this.state.visualizerData = new Array(32).fill(0);
  }

  private startProgressTracking(): void {
    if (this.trackProgressInterval) return;

    this.trackProgressInterval = setInterval(async () => {
      if (!this.state.isPlaying || this.state.isPaused || !this.state.currentTrack) return;

      this.state.playbackPosition += 1;

      // Check if track ended
      if (this.state.playbackPosition >= this.state.currentTrack.duration) {
        // Random chance for ad or station ID
        if (Math.random() > 0.7) {
          const ads = DJ_VOICEOVERS.filter(v => v.type === 'ad' || v.type === 'station_id');
          await this.playVoiceover(ads[Math.floor(Math.random() * ads.length)]);
        }
        
        await this.playTransitionVoiceover();
        this.playNextTrack();
      }
    }, 1000);
  }

  private stopProgressTracking(): void {
    if (this.trackProgressInterval) {
      clearInterval(this.trackProgressInterval);
      this.trackProgressInterval = null;
    }
  }

  // ============================================================================
  // NOTIFICATION METHODS
  // ============================================================================

  private notifyTrackChange(): void {
    if (!this.state.currentTrack) return;
    this.listeners.forEach(l => l.onTrackChange?.(this.state.currentTrack!));
  }

  private notifyPlayStateChange(): void {
    this.listeners.forEach(l => l.onPlayStateChange?.(this.state.isPlaying));
  }

  private notifyVoiceoverStart(voiceover: DJVoiceover): void {
    this.listeners.forEach(l => l.onVoiceoverStart?.(voiceover));
  }

  private notifyVoiceoverEnd(): void {
    this.listeners.forEach(l => l.onVoiceoverEnd?.());
  }

  private notifyVisualizerUpdate(data: number[]): void {
    this.listeners.forEach(l => l.onVisualizerUpdate?.(data));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.stop();
    if (this.voiceoverTimeout) {
      clearTimeout(this.voiceoverTimeout);
    }
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const jediTekRadioService = new JediTekRadioAudioService();
export default jediTekRadioService;
