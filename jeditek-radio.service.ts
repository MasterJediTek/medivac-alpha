/**
 * JediTek Broadcast Radio Station Service
 * 
 * A comprehensive radio broadcasting system featuring:
 * - Top hits streaming from the past 20 years
 * - Disco DJ-style voiceovers with maximum effects
 * - Snappy sound bites and jingles between songs
 * - Integration with Kalgoorlie Hospital Map avatar system
 * - Sound grab features for immersive experience
 * - Auto-play when avatar enters map view
 */

// ============================================================================
// RADIO TYPES
// ============================================================================

export interface RadioStation {
  id: string;
  name: string;
  frequency: string;
  genre: RadioGenre;
  description: string;
  logo: string;
  isLive: boolean;
  currentTrack: Track | null;
  playlist: Playlist;
  djVoiceovers: DJVoiceover[];
  jingles: Jingle[];
  soundEffects: SoundEffect[];
  listeners: number;
  settings: RadioSettings;
}

export type RadioGenre = 
  | 'top-hits'
  | 'disco'
  | 'pop'
  | 'rock'
  | 'electronic'
  | 'chill'
  | 'retro'
  | 'mixed';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  duration: number;
  genre: string;
  bpm: number;
  artwork: string;
  youtubeId?: string;
  streamUrl?: string;
  popularity: number;
  era: TrackEra;
}

export type TrackEra = 
  | '2005-2009'
  | '2010-2014'
  | '2015-2019'
  | '2020-2024'
  | '2025-present';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  currentIndex: number;
  shuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  totalDuration: number;
}

export interface DJVoiceover {
  id: string;
  text: string;
  audioUrl: string;
  type: VoiceoverType;
  duration: number;
  style: DJStyle;
  effects: AudioEffect[];
  triggerCondition: TriggerCondition;
}

export type VoiceoverType = 
  | 'station-id'
  | 'song-intro'
  | 'song-outro'
  | 'time-check'
  | 'weather'
  | 'promo'
  | 'shoutout'
  | 'transition'
  | 'breaking'
  | 'welcome';

export type DJStyle = 
  | 'disco'
  | 'smooth'
  | 'energetic'
  | 'chill'
  | 'retro'
  | 'futuristic'
  | 'professional';

export interface Jingle {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  type: JingleType;
  effects: AudioEffect[];
  volume: number;
}

export type JingleType = 
  | 'station-id'
  | 'transition'
  | 'bumper'
  | 'stinger'
  | 'sweeper'
  | 'intro'
  | 'outro'
  | 'news'
  | 'weather'
  | 'ad-break';

export interface SoundEffect {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  category: SoundCategory;
  volume: number;
  pan: number;
}

export type SoundCategory = 
  | 'whoosh'
  | 'impact'
  | 'sparkle'
  | 'laser'
  | 'bass-drop'
  | 'vinyl-scratch'
  | 'air-horn'
  | 'crowd-cheer'
  | 'applause'
  | 'countdown'
  | 'explosion'
  | 'magic'
  | 'notification';

export interface AudioEffect {
  type: EffectType;
  intensity: number;
  duration: number;
  params: Record<string, number>;
}

export type EffectType = 
  | 'reverb'
  | 'echo'
  | 'flanger'
  | 'phaser'
  | 'chorus'
  | 'distortion'
  | 'compressor'
  | 'eq'
  | 'pitch-shift'
  | 'time-stretch'
  | 'filter'
  | 'stereo-widener';

export interface TriggerCondition {
  type: 'time' | 'track-change' | 'random' | 'event' | 'manual';
  value?: number | string;
  probability?: number;
}

export interface RadioSettings {
  volume: number;
  bass: number;
  treble: number;
  balance: number;
  autoPlay: boolean;
  crossfadeDuration: number;
  voiceoverVolume: number;
  effectsVolume: number;
  spatialAudio: boolean;
  visualizerEnabled: boolean;
}

export interface RadioState {
  isPlaying: boolean;
  isPaused: boolean;
  isMuted: boolean;
  currentTime: number;
  volume: number;
  visualizerData: number[];
  nextVoiceover: DJVoiceover | null;
  queuedEffects: SoundEffect[];
}

// ============================================================================
// DJ VOICEOVER LIBRARY
// ============================================================================

export const JEDITEK_DJ_VOICEOVERS: Omit<DJVoiceover, 'audioUrl'>[] = [
  // Station IDs - Disco Style
  {
    id: 'station-id-1',
    text: "JediTek Radio - We've got your groove!",
    type: 'station-id',
    duration: 3000,
    style: 'disco',
    effects: [{ type: 'reverb', intensity: 0.4, duration: 500, params: { decay: 1.5 } }],
    triggerCondition: { type: 'track-change', probability: 0.3 }
  },
  {
    id: 'station-id-2',
    text: "You're tuned in to the JEDI frequency!",
    type: 'station-id',
    duration: 3500,
    style: 'disco',
    effects: [{ type: 'echo', intensity: 0.3, duration: 400, params: { delay: 200 } }],
    triggerCondition: { type: 'track-change', probability: 0.25 }
  },
  {
    id: 'station-id-3',
    text: "Keep it locked, keep it JEDI!",
    type: 'station-id',
    duration: 2500,
    style: 'energetic',
    effects: [{ type: 'flanger', intensity: 0.2, duration: 300, params: { rate: 0.5 } }],
    triggerCondition: { type: 'track-change', probability: 0.25 }
  },
  {
    id: 'station-id-4',
    text: "This is JediTek Radio - Feel the force of music!",
    type: 'station-id',
    duration: 4000,
    style: 'disco',
    effects: [{ type: 'reverb', intensity: 0.5, duration: 600, params: { decay: 2.0 } }],
    triggerCondition: { type: 'track-change', probability: 0.2 }
  },
  {
    id: 'station-id-5',
    text: "JediTek Radio - Where the hits never stop!",
    type: 'station-id',
    duration: 3000,
    style: 'energetic',
    effects: [{ type: 'chorus', intensity: 0.3, duration: 400, params: { depth: 0.5 } }],
    triggerCondition: { type: 'track-change', probability: 0.25 }
  },
  {
    id: 'station-id-6',
    text: "Broadcasting from the Goldfields - JediTek Radio!",
    type: 'station-id',
    duration: 3500,
    style: 'smooth',
    effects: [{ type: 'reverb', intensity: 0.4, duration: 500, params: { decay: 1.8 } }],
    triggerCondition: { type: 'track-change', probability: 0.2 }
  },
  {
    id: 'station-id-7',
    text: "May the beats be with you - JediTek Radio!",
    type: 'station-id',
    duration: 3000,
    style: 'disco',
    effects: [{ type: 'phaser', intensity: 0.3, duration: 400, params: { rate: 0.8 } }],
    triggerCondition: { type: 'track-change', probability: 0.25 }
  },
  {
    id: 'station-id-8',
    text: "Your galactic groove station - JediTek Radio!",
    type: 'station-id',
    duration: 3500,
    style: 'futuristic',
    effects: [{ type: 'filter', intensity: 0.4, duration: 500, params: { frequency: 2000 } }],
    triggerCondition: { type: 'track-change', probability: 0.2 }
  },

  // Song Intros
  {
    id: 'intro-1',
    text: "Here comes another banger!",
    type: 'song-intro',
    duration: 2000,
    style: 'energetic',
    effects: [{ type: 'reverb', intensity: 0.3, duration: 300, params: { decay: 1.0 } }],
    triggerCondition: { type: 'track-change', probability: 0.4 }
  },
  {
    id: 'intro-2',
    text: "Get ready to move!",
    type: 'song-intro',
    duration: 1800,
    style: 'disco',
    effects: [{ type: 'echo', intensity: 0.2, duration: 200, params: { delay: 150 } }],
    triggerCondition: { type: 'track-change', probability: 0.35 }
  },
  {
    id: 'intro-3',
    text: "This one's a classic!",
    type: 'song-intro',
    duration: 2000,
    style: 'smooth',
    effects: [{ type: 'reverb', intensity: 0.4, duration: 400, params: { decay: 1.5 } }],
    triggerCondition: { type: 'track-change', probability: 0.3 }
  },
  {
    id: 'intro-4',
    text: "Turn it up!",
    type: 'song-intro',
    duration: 1500,
    style: 'energetic',
    effects: [{ type: 'distortion', intensity: 0.1, duration: 200, params: { gain: 1.2 } }],
    triggerCondition: { type: 'track-change', probability: 0.4 }
  },
  {
    id: 'intro-5',
    text: "Fresh from the top charts!",
    type: 'song-intro',
    duration: 2200,
    style: 'disco',
    effects: [{ type: 'chorus', intensity: 0.25, duration: 300, params: { depth: 0.4 } }],
    triggerCondition: { type: 'track-change', probability: 0.35 }
  },

  // Song Outros
  {
    id: 'outro-1',
    text: "That was fire!",
    type: 'song-outro',
    duration: 1500,
    style: 'energetic',
    effects: [{ type: 'reverb', intensity: 0.3, duration: 300, params: { decay: 1.0 } }],
    triggerCondition: { type: 'track-change', probability: 0.3 }
  },
  {
    id: 'outro-2',
    text: "Absolute tune!",
    type: 'song-outro',
    duration: 1800,
    style: 'disco',
    effects: [{ type: 'echo', intensity: 0.2, duration: 250, params: { delay: 180 } }],
    triggerCondition: { type: 'track-change', probability: 0.25 }
  },
  {
    id: 'outro-3',
    text: "More hits coming your way!",
    type: 'song-outro',
    duration: 2200,
    style: 'smooth',
    effects: [{ type: 'reverb', intensity: 0.35, duration: 350, params: { decay: 1.3 } }],
    triggerCondition: { type: 'track-change', probability: 0.3 }
  },

  // Transitions
  {
    id: 'transition-1',
    text: "And now... let's keep the party going!",
    type: 'transition',
    duration: 2500,
    style: 'disco',
    effects: [{ type: 'flanger', intensity: 0.3, duration: 400, params: { rate: 0.6 } }],
    triggerCondition: { type: 'track-change', probability: 0.2 }
  },
  {
    id: 'transition-2',
    text: "Switching gears!",
    type: 'transition',
    duration: 1500,
    style: 'energetic',
    effects: [{ type: 'phaser', intensity: 0.25, duration: 300, params: { rate: 0.7 } }],
    triggerCondition: { type: 'track-change', probability: 0.25 }
  },
  {
    id: 'transition-3',
    text: "Taking you back in time!",
    type: 'transition',
    duration: 2000,
    style: 'retro',
    effects: [{ type: 'filter', intensity: 0.4, duration: 500, params: { frequency: 1500 } }],
    triggerCondition: { type: 'track-change', probability: 0.2 }
  },

  // Welcome Messages
  {
    id: 'welcome-1',
    text: "Welcome to JediTek Radio! Your journey through the hits starts now!",
    type: 'welcome',
    duration: 4500,
    style: 'disco',
    effects: [{ type: 'reverb', intensity: 0.5, duration: 600, params: { decay: 2.0 } }],
    triggerCondition: { type: 'event', value: 'map-enter' }
  },
  {
    id: 'welcome-2',
    text: "Hey there! You've just entered the groove zone!",
    type: 'welcome',
    duration: 3500,
    style: 'energetic',
    effects: [{ type: 'chorus', intensity: 0.3, duration: 400, params: { depth: 0.5 } }],
    triggerCondition: { type: 'event', value: 'map-enter' }
  },

  // Promos
  {
    id: 'promo-1',
    text: "JediTek Radio - Twenty years of hits, one legendary station!",
    type: 'promo',
    duration: 4000,
    style: 'disco',
    effects: [
      { type: 'reverb', intensity: 0.5, duration: 500, params: { decay: 1.8 } },
      { type: 'stereo-widener', intensity: 0.4, duration: 400, params: { width: 1.5 } }
    ],
    triggerCondition: { type: 'random', probability: 0.1 }
  },
  {
    id: 'promo-2',
    text: "From 2005 to today - JediTek Radio has the soundtrack of your life!",
    type: 'promo',
    duration: 4500,
    style: 'smooth',
    effects: [{ type: 'reverb', intensity: 0.45, duration: 550, params: { decay: 1.6 } }],
    triggerCondition: { type: 'random', probability: 0.1 }
  },

  // Shoutouts
  {
    id: 'shoutout-1',
    text: "Shoutout to everyone at Kalgoorlie Health Campus!",
    type: 'shoutout',
    duration: 3000,
    style: 'energetic',
    effects: [{ type: 'echo', intensity: 0.3, duration: 350, params: { delay: 200 } }],
    triggerCondition: { type: 'random', probability: 0.05 }
  },
  {
    id: 'shoutout-2',
    text: "Big love to all the healthcare heroes out there!",
    type: 'shoutout',
    duration: 3200,
    style: 'smooth',
    effects: [{ type: 'reverb', intensity: 0.4, duration: 400, params: { decay: 1.4 } }],
    triggerCondition: { type: 'random', probability: 0.05 }
  }
];

// ============================================================================
// JINGLE LIBRARY
// ============================================================================

export const JEDITEK_JINGLES: Omit<Jingle, 'audioUrl'>[] = [
  {
    id: 'jingle-station-1',
    name: 'JediTek Power Intro',
    duration: 5000,
    type: 'station-id',
    effects: [
      { type: 'reverb', intensity: 0.5, duration: 600, params: { decay: 2.0 } },
      { type: 'stereo-widener', intensity: 0.5, duration: 500, params: { width: 1.8 } }
    ],
    volume: 0.9
  },
  {
    id: 'jingle-transition-1',
    name: 'Disco Whoosh',
    duration: 2000,
    type: 'transition',
    effects: [{ type: 'filter', intensity: 0.6, duration: 400, params: { frequency: 3000 } }],
    volume: 0.7
  },
  {
    id: 'jingle-transition-2',
    name: 'Bass Drop Sweep',
    duration: 3000,
    type: 'transition',
    effects: [{ type: 'filter', intensity: 0.7, duration: 500, params: { frequency: 200 } }],
    volume: 0.8
  },
  {
    id: 'jingle-bumper-1',
    name: 'Quick Hit Bumper',
    duration: 1500,
    type: 'bumper',
    effects: [{ type: 'compressor', intensity: 0.6, duration: 300, params: { threshold: -10 } }],
    volume: 0.85
  },
  {
    id: 'jingle-stinger-1',
    name: 'Laser Stinger',
    duration: 1000,
    type: 'stinger',
    effects: [{ type: 'phaser', intensity: 0.4, duration: 200, params: { rate: 1.0 } }],
    volume: 0.75
  },
  {
    id: 'jingle-sweeper-1',
    name: 'Frequency Sweep',
    duration: 2500,
    type: 'sweeper',
    effects: [{ type: 'filter', intensity: 0.8, duration: 600, params: { frequency: 5000 } }],
    volume: 0.7
  },
  {
    id: 'jingle-intro-1',
    name: 'Epic Show Intro',
    duration: 8000,
    type: 'intro',
    effects: [
      { type: 'reverb', intensity: 0.6, duration: 800, params: { decay: 2.5 } },
      { type: 'chorus', intensity: 0.4, duration: 600, params: { depth: 0.6 } }
    ],
    volume: 0.95
  },
  {
    id: 'jingle-outro-1',
    name: 'Smooth Fade Out',
    duration: 4000,
    type: 'outro',
    effects: [{ type: 'reverb', intensity: 0.7, duration: 1000, params: { decay: 3.0 } }],
    volume: 0.8
  }
];

// ============================================================================
// SOUND EFFECTS LIBRARY
// ============================================================================

export const JEDITEK_SOUND_EFFECTS: Omit<SoundEffect, 'audioUrl'>[] = [
  { id: 'sfx-whoosh-1', name: 'Whoosh Up', duration: 500, category: 'whoosh', volume: 0.6, pan: 0 },
  { id: 'sfx-whoosh-2', name: 'Whoosh Down', duration: 500, category: 'whoosh', volume: 0.6, pan: 0 },
  { id: 'sfx-whoosh-3', name: 'Whoosh Pan', duration: 800, category: 'whoosh', volume: 0.5, pan: -0.5 },
  { id: 'sfx-impact-1', name: 'Bass Impact', duration: 600, category: 'impact', volume: 0.8, pan: 0 },
  { id: 'sfx-impact-2', name: 'Drum Hit', duration: 400, category: 'impact', volume: 0.7, pan: 0 },
  { id: 'sfx-sparkle-1', name: 'Magic Sparkle', duration: 1000, category: 'sparkle', volume: 0.5, pan: 0 },
  { id: 'sfx-sparkle-2', name: 'Shimmer', duration: 1200, category: 'sparkle', volume: 0.4, pan: 0.3 },
  { id: 'sfx-laser-1', name: 'Laser Zap', duration: 300, category: 'laser', volume: 0.6, pan: 0 },
  { id: 'sfx-laser-2', name: 'Laser Sweep', duration: 700, category: 'laser', volume: 0.55, pan: 0 },
  { id: 'sfx-bass-drop-1', name: 'Heavy Drop', duration: 1500, category: 'bass-drop', volume: 0.9, pan: 0 },
  { id: 'sfx-bass-drop-2', name: 'Sub Bass', duration: 2000, category: 'bass-drop', volume: 0.85, pan: 0 },
  { id: 'sfx-vinyl-1', name: 'Vinyl Scratch', duration: 400, category: 'vinyl-scratch', volume: 0.7, pan: 0 },
  { id: 'sfx-vinyl-2', name: 'Record Stop', duration: 600, category: 'vinyl-scratch', volume: 0.65, pan: 0 },
  { id: 'sfx-airhorn-1', name: 'Air Horn', duration: 800, category: 'air-horn', volume: 0.75, pan: 0 },
  { id: 'sfx-crowd-1', name: 'Crowd Cheer', duration: 2500, category: 'crowd-cheer', volume: 0.6, pan: 0 },
  { id: 'sfx-applause-1', name: 'Applause', duration: 3000, category: 'applause', volume: 0.55, pan: 0 },
  { id: 'sfx-countdown-1', name: 'Countdown Beep', duration: 1000, category: 'countdown', volume: 0.7, pan: 0 },
  { id: 'sfx-explosion-1', name: 'Boom', duration: 1200, category: 'explosion', volume: 0.8, pan: 0 },
  { id: 'sfx-magic-1', name: 'Magic Wand', duration: 800, category: 'magic', volume: 0.5, pan: 0 },
  { id: 'sfx-notification-1', name: 'Ding', duration: 300, category: 'notification', volume: 0.6, pan: 0 }
];

// ============================================================================
// TOP HITS PLAYLIST (Past 20 Years)
// ============================================================================

export const TOP_HITS_PLAYLIST: Omit<Track, 'streamUrl'>[] = [
  // 2005-2009 Era
  { id: 'track-001', title: 'Crazy in Love', artist: 'Beyoncé ft. Jay-Z', album: 'Dangerously in Love', year: 2003, duration: 236, genre: 'R&B', bpm: 99, artwork: '', popularity: 95, era: '2005-2009', youtubeId: 'ViwtNLUqkMY' },
  { id: 'track-002', title: 'Yeah!', artist: 'Usher ft. Lil Jon & Ludacris', album: 'Confessions', year: 2004, duration: 250, genre: 'Hip-Hop', bpm: 105, artwork: '', popularity: 98, era: '2005-2009', youtubeId: 'GxBSyx85Kp8' },
  { id: 'track-003', title: 'Since U Been Gone', artist: 'Kelly Clarkson', album: 'Breakaway', year: 2004, duration: 195, genre: 'Pop Rock', bpm: 132, artwork: '', popularity: 92, era: '2005-2009', youtubeId: 'R7UrFYvl5TE' },
  { id: 'track-004', title: 'Hips Don\'t Lie', artist: 'Shakira ft. Wyclef Jean', album: 'Oral Fixation Vol. 2', year: 2006, duration: 218, genre: 'Latin Pop', bpm: 100, artwork: '', popularity: 96, era: '2005-2009', youtubeId: 'DUT5rEU6pqM' },
  { id: 'track-005', title: 'Umbrella', artist: 'Rihanna ft. Jay-Z', album: 'Good Girl Gone Bad', year: 2007, duration: 276, genre: 'Pop', bpm: 87, artwork: '', popularity: 97, era: '2005-2009', youtubeId: 'CvBfHwUxHIk' },
  { id: 'track-006', title: 'I Gotta Feeling', artist: 'Black Eyed Peas', album: 'The E.N.D.', year: 2009, duration: 289, genre: 'Dance-Pop', bpm: 128, artwork: '', popularity: 99, era: '2005-2009', youtubeId: 'uSD4vsh1zDA' },
  { id: 'track-007', title: 'Poker Face', artist: 'Lady Gaga', album: 'The Fame', year: 2008, duration: 237, genre: 'Electropop', bpm: 120, artwork: '', popularity: 98, era: '2005-2009', youtubeId: 'bESGLojNYSo' },
  { id: 'track-008', title: 'Single Ladies', artist: 'Beyoncé', album: 'I Am... Sasha Fierce', year: 2008, duration: 196, genre: 'R&B', bpm: 96, artwork: '', popularity: 97, era: '2005-2009', youtubeId: '4m1EFMoRFvY' },

  // 2010-2014 Era
  { id: 'track-009', title: 'Rolling in the Deep', artist: 'Adele', album: '21', year: 2010, duration: 228, genre: 'Soul', bpm: 105, artwork: '', popularity: 99, era: '2010-2014', youtubeId: 'rYEDA3JcQqw' },
  { id: 'track-010', title: 'Party Rock Anthem', artist: 'LMFAO ft. Lauren Bennett & GoonRock', album: 'Sorry for Party Rocking', year: 2011, duration: 267, genre: 'EDM', bpm: 130, artwork: '', popularity: 97, era: '2010-2014', youtubeId: 'KQ6zr6kCPj8' },
  { id: 'track-011', title: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra', album: 'Making Mirrors', year: 2011, duration: 244, genre: 'Indie Pop', bpm: 129, artwork: '', popularity: 98, era: '2010-2014', youtubeId: '8UVNT4wvIGY' },
  { id: 'track-012', title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', album: 'Kiss', year: 2012, duration: 193, genre: 'Pop', bpm: 120, artwork: '', popularity: 96, era: '2010-2014', youtubeId: 'fWNaR-rxAic' },
  { id: 'track-013', title: 'Gangnam Style', artist: 'PSY', album: 'Psy 6 (Six Rules), Part 1', year: 2012, duration: 219, genre: 'K-Pop', bpm: 132, artwork: '', popularity: 99, era: '2010-2014', youtubeId: '9bZkp7q19f0' },
  { id: 'track-014', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', album: 'Random Access Memories', year: 2013, duration: 369, genre: 'Disco', bpm: 116, artwork: '', popularity: 98, era: '2010-2014', youtubeId: '5NV6Rdv1a3I' },
  { id: 'track-015', title: 'Happy', artist: 'Pharrell Williams', album: 'G I R L', year: 2013, duration: 233, genre: 'Soul', bpm: 160, artwork: '', popularity: 99, era: '2010-2014', youtubeId: 'ZbZSe6N_BXs' },
  { id: 'track-016', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', album: 'Uptown Special', year: 2014, duration: 269, genre: 'Funk', bpm: 115, artwork: '', popularity: 100, era: '2010-2014', youtubeId: 'OPf0YbXqDm0' },

  // 2015-2019 Era
  { id: 'track-017', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', album: 'Furious 7 Soundtrack', year: 2015, duration: 237, genre: 'Hip-Hop', bpm: 80, artwork: '', popularity: 99, era: '2015-2019', youtubeId: 'RgKAFK5djSk' },
  { id: 'track-018', title: 'Sorry', artist: 'Justin Bieber', album: 'Purpose', year: 2015, duration: 200, genre: 'Dance-Pop', bpm: 100, artwork: '', popularity: 97, era: '2015-2019', youtubeId: 'fRh_vgS2dFE' },
  { id: 'track-019', title: 'Hello', artist: 'Adele', album: '25', year: 2015, duration: 295, genre: 'Soul', bpm: 79, artwork: '', popularity: 99, era: '2015-2019', youtubeId: 'YQHsXMglC9A' },
  { id: 'track-020', title: 'Closer', artist: 'The Chainsmokers ft. Halsey', album: 'Collage', year: 2016, duration: 244, genre: 'EDM', bpm: 95, artwork: '', popularity: 98, era: '2015-2019', youtubeId: 'PT2_F-1esPk' },
  { id: 'track-021', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷', year: 2017, duration: 234, genre: 'Pop', bpm: 96, artwork: '', popularity: 100, era: '2015-2019', youtubeId: 'JGwWNGJdvx8' },
  { id: 'track-022', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', album: 'Vida', year: 2017, duration: 229, genre: 'Reggaeton', bpm: 89, artwork: '', popularity: 100, era: '2015-2019', youtubeId: 'kJQP7kiw5Fk' },
  { id: 'track-023', title: 'God\'s Plan', artist: 'Drake', album: 'Scorpion', year: 2018, duration: 198, genre: 'Hip-Hop', bpm: 77, artwork: '', popularity: 98, era: '2015-2019', youtubeId: 'xpVfcZ0ZcFM' },
  { id: 'track-024', title: 'Old Town Road', artist: 'Lil Nas X ft. Billy Ray Cyrus', album: '7', year: 2019, duration: 157, genre: 'Country Rap', bpm: 136, artwork: '', popularity: 99, era: '2015-2019', youtubeId: 'w2Ov5jzm3j8' },

  // 2020-2024 Era
  { id: 'track-025', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', year: 2020, duration: 200, genre: 'Synth-Pop', bpm: 171, artwork: '', popularity: 100, era: '2020-2024', youtubeId: '4NRXx6U8ABQ' },
  { id: 'track-026', title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', year: 2020, duration: 174, genre: 'Pop Rock', bpm: 95, artwork: '', popularity: 97, era: '2020-2024', youtubeId: 'E07s5ZYygMg' },
  { id: 'track-027', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', year: 2020, duration: 203, genre: 'Disco-Pop', bpm: 103, artwork: '', popularity: 98, era: '2020-2024', youtubeId: 'TUVcZfQe-Kw' },
  { id: 'track-028', title: 'drivers license', artist: 'Olivia Rodrigo', album: 'SOUR', year: 2021, duration: 242, genre: 'Pop', bpm: 72, artwork: '', popularity: 98, era: '2020-2024', youtubeId: 'ZmDBbnmKpqQ' },
  { id: 'track-029', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3: OVER YOU', year: 2021, duration: 141, genre: 'Pop', bpm: 170, artwork: '', popularity: 97, era: '2020-2024', youtubeId: 'kTJczUoc26U' },
  { id: 'track-030', title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', year: 2022, duration: 167, genre: 'Synth-Pop', bpm: 174, artwork: '', popularity: 99, era: '2020-2024', youtubeId: 'H5v3kku4y6Q' },
  { id: 'track-031', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', year: 2022, duration: 200, genre: 'Synth-Pop', bpm: 97, artwork: '', popularity: 98, era: '2020-2024', youtubeId: 'b1kbLwvqugk' },
  { id: 'track-032', title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', year: 2023, duration: 200, genre: 'Disco-Pop', bpm: 118, artwork: '', popularity: 99, era: '2020-2024', youtubeId: 'G7KNmW9a75Y' },
  { id: 'track-033', title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', year: 2023, duration: 219, genre: 'Pop Rock', bpm: 138, artwork: '', popularity: 97, era: '2020-2024', youtubeId: 'RlPNh_PBZb4' },
  { id: 'track-034', title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', year: 2019, duration: 178, genre: 'Synth-Pop', bpm: 170, artwork: '', popularity: 98, era: '2020-2024', youtubeId: 'ic8j13piAhQ' },

  // 2025-Present Era
  { id: 'track-035', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', album: 'Single', year: 2024, duration: 252, genre: 'Pop Ballad', bpm: 158, artwork: '', popularity: 98, era: '2025-present', youtubeId: 'kPa7bsKwL-c' },
  { id: 'track-036', title: 'APT.', artist: 'ROSÉ & Bruno Mars', album: 'Single', year: 2024, duration: 170, genre: 'K-Pop', bpm: 148, artwork: '', popularity: 97, era: '2025-present', youtubeId: 'ekr2nIex040' },
  { id: 'track-037', title: 'Birds of a Feather', artist: 'Billie Eilish', album: 'HIT ME HARD AND SOFT', year: 2024, duration: 210, genre: 'Pop', bpm: 105, artwork: '', popularity: 96, era: '2025-present', youtubeId: 'V-DgXJy5JY0' },
  { id: 'track-038', title: 'Espresso', artist: 'Sabrina Carpenter', album: 'Short n\' Sweet', year: 2024, duration: 175, genre: 'Pop', bpm: 104, artwork: '', popularity: 98, era: '2025-present', youtubeId: 'eVli-tstM5E' },
  { id: 'track-039', title: 'Please Please Please', artist: 'Sabrina Carpenter', album: 'Short n\' Sweet', year: 2024, duration: 186, genre: 'Pop', bpm: 107, artwork: '', popularity: 97, era: '2025-present', youtubeId: 'cF1Na4AIecM' },
  { id: 'track-040', title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', album: 'Where I\'ve Been, Isn\'t Where I\'m Going', year: 2024, duration: 191, genre: 'Country', bpm: 83, artwork: '', popularity: 96, era: '2025-present', youtubeId: 'ug9p7frLMsE' }
];

// ============================================================================
// JEDITEK RADIO SERVICE
// ============================================================================

export class JediTekRadioService {
  private station: RadioStation;
  private state: RadioState;
  private eventListeners: Map<string, Function[]> = new Map();
  private voiceoverQueue: DJVoiceover[] = [];
  private effectsQueue: SoundEffect[] = [];
  private crossfadeTimer: NodeJS.Timeout | null = null;
  private voiceoverTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.station = this.initializeStation();
    this.state = this.initializeState();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeStation(): RadioStation {
    const playlist: Playlist = {
      id: 'jeditek-top-hits',
      name: 'JediTek Top Hits - 20 Years of Music',
      tracks: TOP_HITS_PLAYLIST.map(t => ({ ...t, streamUrl: '' })),
      currentIndex: 0,
      shuffled: true,
      repeatMode: 'all',
      totalDuration: TOP_HITS_PLAYLIST.reduce((sum, t) => sum + t.duration, 0)
    };

    // Shuffle the playlist
    this.shuffleArray(playlist.tracks);

    return {
      id: 'jeditek-radio',
      name: 'JediTek Radio',
      frequency: '107.7 FM',
      genre: 'top-hits',
      description: 'Your galactic groove station - 20 years of top hits!',
      logo: '📻',
      isLive: true,
      currentTrack: playlist.tracks[0],
      playlist,
      djVoiceovers: JEDITEK_DJ_VOICEOVERS.map(v => ({ ...v, audioUrl: '' })),
      jingles: JEDITEK_JINGLES.map(j => ({ ...j, audioUrl: '' })),
      soundEffects: JEDITEK_SOUND_EFFECTS.map(s => ({ ...s, audioUrl: '' })),
      listeners: Math.floor(Math.random() * 5000) + 1000,
      settings: {
        volume: 0.7,
        bass: 0.6,
        treble: 0.5,
        balance: 0,
        autoPlay: true,
        crossfadeDuration: 3000,
        voiceoverVolume: 0.85,
        effectsVolume: 0.7,
        spatialAudio: true,
        visualizerEnabled: true
      }
    };
  }

  private initializeState(): RadioState {
    return {
      isPlaying: false,
      isPaused: false,
      isMuted: false,
      currentTime: 0,
      volume: 0.7,
      visualizerData: new Array(32).fill(0),
      nextVoiceover: null,
      queuedEffects: []
    };
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  /**
   * Start radio playback (called when avatar enters map view)
   */
  startPlayback(): void {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.state.isPaused = false;

    // Play welcome voiceover
    const welcomeVoiceover = this.station.djVoiceovers.find(v => v.type === 'welcome');
    if (welcomeVoiceover) {
      this.playVoiceover(welcomeVoiceover);
    }

    // Start track after welcome
    setTimeout(() => {
      this.playCurrentTrack();
    }, welcomeVoiceover ? welcomeVoiceover.duration + 500 : 0);

    this.emit('playback-started', { station: this.station, track: this.station.currentTrack });
  }

  /**
   * Stop radio playback (called when avatar leaves map view)
   */
  stopPlayback(): void {
    this.state.isPlaying = false;
    this.state.isPaused = false;

    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    if (this.voiceoverTimer) {
      clearTimeout(this.voiceoverTimer);
      this.voiceoverTimer = null;
    }

    this.emit('playback-stopped', { station: this.station });
  }

  /**
   * Pause playback
   */
  pausePlayback(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;
    this.state.isPaused = true;
    this.emit('playback-paused', { currentTime: this.state.currentTime });
  }

  /**
   * Resume playback
   */
  resumePlayback(): void {
    if (!this.state.isPaused) return;
    this.state.isPaused = false;
    this.emit('playback-resumed', { currentTime: this.state.currentTime });
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    this.emit('mute-toggled', { isMuted: this.state.isMuted });
    return this.state.isMuted;
  }

  // ============================================================================
  // TRACK MANAGEMENT
  // ============================================================================

  private playCurrentTrack(): void {
    const track = this.station.playlist.tracks[this.station.playlist.currentIndex];
    if (!track) return;

    this.station.currentTrack = track;
    this.state.currentTime = 0;

    // Schedule next track
    this.scheduleNextTrack(track.duration * 1000);

    // Maybe play a voiceover
    this.maybePlayVoiceover('song-intro');

    this.emit('track-started', { track, index: this.station.playlist.currentIndex });
  }

  private scheduleNextTrack(duration: number): void {
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
    }

    // Start crossfade before track ends
    const crossfadeStart = duration - this.station.settings.crossfadeDuration;

    this.crossfadeTimer = setTimeout(() => {
      this.nextTrack();
    }, crossfadeStart);
  }

  /**
   * Skip to next track
   */
  nextTrack(): void {
    // Play transition effects
    this.playRandomEffect('transition');
    this.maybePlayVoiceover('song-outro');

    // Move to next track
    this.station.playlist.currentIndex++;
    if (this.station.playlist.currentIndex >= this.station.playlist.tracks.length) {
      if (this.station.playlist.repeatMode === 'all') {
        this.station.playlist.currentIndex = 0;
        this.shuffleArray(this.station.playlist.tracks);
      } else {
        this.stopPlayback();
        return;
      }
    }

    // Small delay for transition effects
    setTimeout(() => {
      this.playCurrentTrack();
    }, 1500);

    this.emit('track-changed', { 
      previousIndex: this.station.playlist.currentIndex - 1,
      newIndex: this.station.playlist.currentIndex 
    });
  }

  /**
   * Skip to previous track
   */
  previousTrack(): void {
    this.station.playlist.currentIndex--;
    if (this.station.playlist.currentIndex < 0) {
      this.station.playlist.currentIndex = this.station.playlist.tracks.length - 1;
    }

    this.playRandomEffect('transition');
    this.playCurrentTrack();
  }

  /**
   * Skip to specific track
   */
  skipToTrack(index: number): void {
    if (index < 0 || index >= this.station.playlist.tracks.length) return;

    this.station.playlist.currentIndex = index;
    this.playRandomEffect('transition');
    this.playCurrentTrack();
  }

  // ============================================================================
  // DJ VOICEOVERS
  // ============================================================================

  private maybePlayVoiceover(type: VoiceoverType): void {
    const candidates = this.station.djVoiceovers.filter(v => v.type === type);
    if (candidates.length === 0) return;

    // Check probability
    for (const voiceover of candidates) {
      const probability = voiceover.triggerCondition.probability || 0.5;
      if (Math.random() < probability) {
        this.playVoiceover(voiceover);
        break;
      }
    }
  }

  private playVoiceover(voiceover: DJVoiceover): void {
    this.state.nextVoiceover = voiceover;
    
    // Play sound effects before voiceover
    this.playRandomEffect('stinger');

    this.emit('voiceover-started', { voiceover });

    // Clear voiceover after duration
    this.voiceoverTimer = setTimeout(() => {
      this.state.nextVoiceover = null;
      this.emit('voiceover-ended', { voiceover });
    }, voiceover.duration);
  }

  /**
   * Play station ID
   */
  playStationID(): void {
    const stationIds = this.station.djVoiceovers.filter(v => v.type === 'station-id');
    if (stationIds.length > 0) {
      const randomId = stationIds[Math.floor(Math.random() * stationIds.length)];
      this.playVoiceover(randomId);
    }
  }

  // ============================================================================
  // SOUND EFFECTS
  // ============================================================================

  private playRandomEffect(type: JingleType): void {
    const jingles = this.station.jingles.filter(j => j.type === type);
    if (jingles.length > 0) {
      const randomJingle = jingles[Math.floor(Math.random() * jingles.length)];
      this.playJingle(randomJingle);
    }
  }

  private playJingle(jingle: Jingle): void {
    this.emit('jingle-played', { jingle });
  }

  /**
   * Play sound effect
   */
  playSoundEffect(effectId: string): void {
    const effect = this.station.soundEffects.find(e => e.id === effectId);
    if (effect) {
      this.emit('effect-played', { effect });
    }
  }

  /**
   * Play random sound effect by category
   */
  playRandomSoundEffect(category: SoundCategory): void {
    const effects = this.station.soundEffects.filter(e => e.category === category);
    if (effects.length > 0) {
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      this.emit('effect-played', { effect: randomEffect });
    }
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.station.settings.volume = Math.max(0, Math.min(1, volume));
    this.state.volume = this.station.settings.volume;
    this.emit('volume-changed', { volume: this.station.settings.volume });
  }

  /**
   * Set bass
   */
  setBass(bass: number): void {
    this.station.settings.bass = Math.max(0, Math.min(1, bass));
    this.emit('bass-changed', { bass: this.station.settings.bass });
  }

  /**
   * Set treble
   */
  setTreble(treble: number): void {
    this.station.settings.treble = Math.max(0, Math.min(1, treble));
    this.emit('treble-changed', { treble: this.station.settings.treble });
  }

  /**
   * Toggle shuffle
   */
  toggleShuffle(): boolean {
    this.station.playlist.shuffled = !this.station.playlist.shuffled;
    if (this.station.playlist.shuffled) {
      this.shuffleArray(this.station.playlist.tracks);
    }
    this.emit('shuffle-toggled', { shuffled: this.station.playlist.shuffled });
    return this.station.playlist.shuffled;
  }

  /**
   * Set repeat mode
   */
  setRepeatMode(mode: 'none' | 'one' | 'all'): void {
    this.station.playlist.repeatMode = mode;
    this.emit('repeat-mode-changed', { mode });
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get station info
   */
  getStation(): RadioStation {
    return { ...this.station };
  }

  /**
   * Get current state
   */
  getState(): RadioState {
    return { ...this.state };
  }

  /**
   * Get current track
   */
  getCurrentTrack(): Track | null {
    return this.station.currentTrack;
  }

  /**
   * Get playlist
   */
  getPlaylist(): Playlist {
    return { ...this.station.playlist };
  }

  /**
   * Get tracks by era
   */
  getTracksByEra(era: TrackEra): Track[] {
    return this.station.playlist.tracks.filter(t => t.era === era);
  }

  /**
   * Get all voiceovers
   */
  getVoiceovers(): DJVoiceover[] {
    return [...this.station.djVoiceovers];
  }

  /**
   * Get all jingles
   */
  getJingles(): Jingle[] {
    return [...this.station.jingles];
  }

  /**
   * Get all sound effects
   */
  getSoundEffects(): SoundEffect[] {
    return [...this.station.soundEffects];
  }

  /**
   * Get visualizer data (simulated)
   */
  getVisualizerData(): number[] {
    if (!this.state.isPlaying || this.state.isPaused) {
      return new Array(32).fill(0);
    }

    // Generate random visualizer data based on current track BPM
    const bpm = this.station.currentTrack?.bpm || 120;
    const intensity = bpm / 180;

    return new Array(32).fill(0).map(() => 
      Math.random() * intensity * this.station.settings.volume
    );
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    // Simulate fluctuating listener count
    const base = this.station.listeners;
    const variance = Math.floor(Math.random() * 200) - 100;
    return Math.max(0, base + variance);
  }

  // ============================================================================
  // MAP INTEGRATION
  // ============================================================================

  /**
   * Called when avatar enters map view
   */
  onAvatarEnterMap(avatarId: string): void {
    if (this.station.settings.autoPlay) {
      this.startPlayback();
    }
    this.emit('avatar-entered-map', { avatarId });
  }

  /**
   * Called when avatar exits map view
   */
  onAvatarExitMap(avatarId: string): void {
    // Fade out instead of abrupt stop
    this.fadeOut(2000);
    this.emit('avatar-exited-map', { avatarId });
  }

  /**
   * Fade out audio
   */
  private fadeOut(duration: number): void {
    const startVolume = this.station.settings.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      this.station.settings.volume = Math.max(0, startVolume - (volumeStep * currentStep));
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        this.stopPlayback();
        this.station.settings.volume = startVolume; // Reset for next play
      }
    }, stepDuration);
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get radio statistics
   */
  getStatistics(): {
    totalTracks: number;
    totalDuration: string;
    tracksByEra: Record<TrackEra, number>;
    voiceoverCount: number;
    jingleCount: number;
    effectCount: number;
    currentListeners: number;
  } {
    const tracksByEra: Record<TrackEra, number> = {
      '2005-2009': 0,
      '2010-2014': 0,
      '2015-2019': 0,
      '2020-2024': 0,
      '2025-present': 0
    };

    this.station.playlist.tracks.forEach(t => {
      tracksByEra[t.era]++;
    });

    const totalSeconds = this.station.playlist.totalDuration;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return {
      totalTracks: this.station.playlist.tracks.length,
      totalDuration: `${hours}h ${minutes}m`,
      tracksByEra,
      voiceoverCount: this.station.djVoiceovers.length,
      jingleCount: this.station.jingles.length,
      effectCount: this.station.soundEffects.length,
      currentListeners: this.getListenerCount()
    };
  }
}

// Export singleton instance
export const jediTekRadioService = new JediTekRadioService();
