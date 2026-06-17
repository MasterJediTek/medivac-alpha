/**
 * Mission Voice Chat Service
 * Real-time voice communication during cooperative missions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
export type VoiceMode = 'push_to_talk' | 'open_mic' | 'voice_activated';
export type VoiceQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ParticipantStatus = 'connected' | 'speaking' | 'muted' | 'deafened' | 'disconnected';
export type ChannelType = 'mission' | 'team' | 'proximity' | 'command';

export interface VoiceParticipant {
  odId: string;
  odName: string;
  avatar?: string;
  status: ParticipantStatus;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  lastSpoke?: string;
  joinedAt: string;
  role: 'leader' | 'member' | 'observer';
  position?: { x: number; y: number; z: number }; // For proximity voice
}

export interface VoiceChannel {
  id: string;
  name: string;
  type: ChannelType;
  missionId?: string;
  teamId?: string;
  participants: VoiceParticipant[];
  maxParticipants: number;
  isLocked: boolean;
  password?: string;
  createdAt: string;
  createdBy: string;
  settings: ChannelSettings;
  // Recording fields (JEDI Master request only)
  isRecording: boolean;
  recordingId?: string;
  recordingRequestedBy?: string;
  recordingStartedAt?: string;
}

export interface ChannelSettings {
  defaultMode: VoiceMode;
  quality: VoiceQuality;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  proximityEnabled: boolean;
  proximityRadius: number; // In meters
  pushToTalkKey?: string;
  voiceActivationThreshold: number; // 0-100
}

export interface VoiceSettings {
  inputDevice?: string;
  outputDevice?: string;
  inputVolume: number;
  outputVolume: number;
  mode: VoiceMode;
  quality: VoiceQuality;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  pushToTalkKey: string;
  voiceActivationThreshold: number;
  muteOnJoin: boolean;
  playJoinLeaveSound: boolean;
  showSpeakingIndicator: boolean;
}

export interface VoiceStats {
  latency: number;
  packetLoss: number;
  jitter: number;
  bitrate: number;
  codec: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface VoiceSession {
  id: string;
  odId: string;
  channelId: string;
  startedAt: string;
  endedAt?: string;
  duration: number;
  speakingTime: number;
  stats: VoiceStats;
}

export interface VoiceAnalytics {
  totalSessions: number;
  totalSpeakingTime: number;
  averageSessionDuration: number;
  averageLatency: number;
  participantsByChannel: Record<string, number>;
  peakConcurrentUsers: number;
  qualityDistribution: Record<string, number>;
}

// Storage keys
const STORAGE_KEYS = {
  CHANNELS: '@medivac_voice_channels',
  SETTINGS: '@medivac_voice_settings',
  SESSIONS: '@medivac_voice_sessions',
};

// Default settings
const DEFAULT_SETTINGS: VoiceSettings = {
  inputVolume: 100,
  outputVolume: 100,
  mode: 'push_to_talk',
  quality: 'high',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  pushToTalkKey: 'Space',
  voiceActivationThreshold: 30,
  muteOnJoin: false,
  playJoinLeaveSound: true,
  showSpeakingIndicator: true,
};

const DEFAULT_CHANNEL_SETTINGS: ChannelSettings = {
  defaultMode: 'push_to_talk',
  quality: 'high',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  proximityEnabled: false,
  proximityRadius: 50,
  voiceActivationThreshold: 30,
};

// Event types
type VoiceEventType = 
  | 'participant_joined'
  | 'participant_left'
  | 'participant_speaking'
  | 'participant_stopped_speaking'
  | 'participant_muted'
  | 'participant_unmuted'
  | 'channel_created'
  | 'channel_deleted'
  | 'settings_changed'
  | 'connection_quality_changed';

type VoiceEventCallback = (data: any) => void;

class MissionVoiceChatService {
  private channels: VoiceChannel[] = [];
  private settings: VoiceSettings = DEFAULT_SETTINGS;
  private sessions: VoiceSession[] = [];
  private currentChannel: VoiceChannel | null = null;
  private currentSession: VoiceSession | null = null;
  private listeners: Map<VoiceEventType, Set<VoiceEventCallback>> = new Map();
  private initialized = false;
  private isSpeaking = false;
  private isPushToTalkActive = false;

  // Simulated WebRTC state
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private currentStats: VoiceStats = {
    latency: 0,
    packetLoss: 0,
    jitter: 0,
    bitrate: 0,
    codec: 'opus',
    connectionQuality: 'excellent',
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadData();
    this.initializeDefaultChannels();
    this.initialized = true;
  }

  private async loadData(): Promise<void> {
    try {
      const [channelsData, settingsData, sessionsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CHANNELS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
      ]);

      if (channelsData) this.channels = JSON.parse(channelsData);
      if (settingsData) this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
      if (sessionsData) this.sessions = JSON.parse(sessionsData);
    } catch (error) {
      console.error('Failed to load voice chat data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(this.channels)),
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings)),
        AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions)),
      ]);
    } catch (error) {
      console.error('Failed to save voice chat data:', error);
    }
  }

  private initializeDefaultChannels(): void {
    if (this.channels.length === 0) {
      // Create default mission channels
      const defaultChannels: VoiceChannel[] = [
        {
          id: 'channel_mission_general',
          name: 'Mission General',
          type: 'mission',
          participants: [],
          maxParticipants: 50,
          isLocked: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          settings: DEFAULT_CHANNEL_SETTINGS,
          isRecording: false,
        },
        {
          id: 'channel_team_alpha',
          name: 'Team Alpha',
          type: 'team',
          participants: [],
          maxParticipants: 10,
          isLocked: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          settings: DEFAULT_CHANNEL_SETTINGS,
          isRecording: false,
        },
        {
          id: 'channel_team_beta',
          name: 'Team Beta',
          type: 'team',
          participants: [],
          maxParticipants: 10,
          isLocked: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          settings: DEFAULT_CHANNEL_SETTINGS,
          isRecording: false,
        },
        {
          id: 'channel_command',
          name: 'Command Channel',
          type: 'command',
          participants: [],
          maxParticipants: 5,
          isLocked: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          settings: { ...DEFAULT_CHANNEL_SETTINGS, quality: 'ultra' },
          isRecording: false,
        },
        {
          id: 'channel_proximity',
          name: 'Proximity Voice',
          type: 'proximity',
          participants: [],
          maxParticipants: 100,
          isLocked: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          settings: { ...DEFAULT_CHANNEL_SETTINGS, proximityEnabled: true, proximityRadius: 25 },
          isRecording: false,
        },
      ];

      this.channels = defaultChannels;
      this.saveData();
    }
  }

  // Event handling
  on(event: VoiceEventType, callback: VoiceEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: VoiceEventType, callback: VoiceEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: VoiceEventType, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Channel management
  async getChannels(filter?: { type?: ChannelType; missionId?: string }): Promise<VoiceChannel[]> {
    let result = [...this.channels];

    if (filter?.type) {
      result = result.filter(c => c.type === filter.type);
    }
    if (filter?.missionId) {
      result = result.filter(c => c.missionId === filter.missionId);
    }

    return result;
  }

  async getChannel(channelId: string): Promise<VoiceChannel | null> {
    return this.channels.find(c => c.id === channelId) || null;
  }

  async createChannel(
    name: string,
    type: ChannelType,
    createdBy: string,
    options?: {
      missionId?: string;
      teamId?: string;
      maxParticipants?: number;
      isLocked?: boolean;
      password?: string;
      settings?: Partial<ChannelSettings>;
    }
  ): Promise<VoiceChannel> {
    const channel: VoiceChannel = {
      id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      missionId: options?.missionId,
      teamId: options?.teamId,
      participants: [],
      maxParticipants: options?.maxParticipants || 50,
      isLocked: options?.isLocked || false,
      password: options?.password,
      createdAt: new Date().toISOString(),
      createdBy,
      settings: { ...DEFAULT_CHANNEL_SETTINGS, ...options?.settings },
      isRecording: false,
    };

    this.channels.push(channel);
    await this.saveData();
    this.emit('channel_created', channel);

    return channel;
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    const index = this.channels.findIndex(c => c.id === channelId);
    if (index === -1) return false;

    const channel = this.channels[index];
    
    // Disconnect all participants first
    for (const participant of channel.participants) {
      await this.leaveChannel(participant.odId, channelId);
    }

    this.channels.splice(index, 1);
    await this.saveData();
    this.emit('channel_deleted', { channelId });

    return true;
  }

  async updateChannelSettings(channelId: string, settings: Partial<ChannelSettings>): Promise<VoiceChannel | null> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return null;

    channel.settings = { ...channel.settings, ...settings };
    await this.saveData();

    return channel;
  }

  // Connection management
  async joinChannel(
    odId: string,
    odName: string,
    channelId: string,
    options?: { password?: string; role?: 'leader' | 'member' | 'observer'; avatar?: string }
  ): Promise<{ success: boolean; error?: string; channel?: VoiceChannel }> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) {
      return { success: false, error: 'Channel not found' };
    }

    if (channel.participants.length >= channel.maxParticipants) {
      return { success: false, error: 'Channel is full' };
    }

    if (channel.isLocked && channel.password && options?.password !== channel.password) {
      return { success: false, error: 'Invalid password' };
    }

    // Check if already in channel
    if (channel.participants.some(p => p.odId === odId)) {
      return { success: false, error: 'Already in channel' };
    }

    // Leave current channel if any
    if (this.currentChannel) {
      await this.leaveChannel(odId, this.currentChannel.id);
    }

    const participant: VoiceParticipant = {
      odId,
      odName,
      avatar: options?.avatar,
      status: 'connected',
      isSpeaking: false,
      isMuted: this.settings.muteOnJoin,
      isDeafened: false,
      volume: 100,
      joinedAt: new Date().toISOString(),
      role: options?.role || 'member',
    };

    channel.participants.push(participant);
    this.currentChannel = channel;

    // Start session
    this.currentSession = {
      id: `session_${Date.now()}`,
      odId,
      channelId,
      startedAt: new Date().toISOString(),
      duration: 0,
      speakingTime: 0,
      stats: { ...this.currentStats },
    };

    // Simulate WebRTC connection
    this.connectionState = 'connecting';
    await this.simulateConnection();
    this.connectionState = 'connected';

    await this.saveData();
    this.emit('participant_joined', { channel, participant });

    if (this.settings.playJoinLeaveSound) {
      this.playSound('join');
    }

    return { success: true, channel };
  }

  async leaveChannel(odId: string, channelId: string): Promise<boolean> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return false;

    const participantIndex = channel.participants.findIndex(p => p.odId === odId);
    if (participantIndex === -1) return false;

    const participant = channel.participants[participantIndex];
    channel.participants.splice(participantIndex, 1);

    // End session
    if (this.currentSession && this.currentSession.odId === odId) {
      this.currentSession.endedAt = new Date().toISOString();
      this.currentSession.duration = Math.floor(
        (new Date(this.currentSession.endedAt).getTime() - new Date(this.currentSession.startedAt).getTime()) / 1000
      );
      this.sessions.push(this.currentSession);
      this.currentSession = null;
    }

    if (this.currentChannel?.id === channelId) {
      this.currentChannel = null;
      this.connectionState = 'disconnected';
    }

    await this.saveData();
    this.emit('participant_left', { channelId, participant });

    if (this.settings.playJoinLeaveSound) {
      this.playSound('leave');
    }

    return true;
  }

  private async simulateConnection(): Promise<void> {
    // Simulate WebRTC connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Set simulated stats
    this.currentStats = {
      latency: 20 + Math.random() * 30,
      packetLoss: Math.random() * 2,
      jitter: 5 + Math.random() * 10,
      bitrate: 64000,
      codec: 'opus',
      connectionQuality: 'excellent',
    };
  }

  // Voice controls
  async setMuted(odId: string, muted: boolean): Promise<boolean> {
    if (!this.currentChannel) return false;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant) return false;

    participant.isMuted = muted;
    participant.status = muted ? 'muted' : 'connected';

    if (muted && participant.isSpeaking) {
      participant.isSpeaking = false;
      this.emit('participant_stopped_speaking', { channelId: this.currentChannel.id, participant });
    }

    await this.saveData();
    this.emit(muted ? 'participant_muted' : 'participant_unmuted', { 
      channelId: this.currentChannel.id, 
      participant 
    });

    return true;
  }

  async setDeafened(odId: string, deafened: boolean): Promise<boolean> {
    if (!this.currentChannel) return false;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant) return false;

    participant.isDeafened = deafened;
    if (deafened) {
      participant.isMuted = true;
      participant.status = 'deafened';
    } else {
      participant.status = participant.isMuted ? 'muted' : 'connected';
    }

    await this.saveData();
    return true;
  }

  async setParticipantVolume(odId: string, targetOdId: string, volume: number): Promise<boolean> {
    if (!this.currentChannel) return false;

    const participant = this.currentChannel.participants.find(p => p.odId === targetOdId);
    if (!participant) return false;

    participant.volume = Math.max(0, Math.min(200, volume));
    await this.saveData();

    return true;
  }

  // Push-to-talk
  startPushToTalk(odId: string): void {
    if (!this.currentChannel || this.settings.mode !== 'push_to_talk') return;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant || participant.isMuted) return;

    this.isPushToTalkActive = true;
    this.startSpeaking(odId);
  }

  stopPushToTalk(odId: string): void {
    if (!this.currentChannel || this.settings.mode !== 'push_to_talk') return;

    this.isPushToTalkActive = false;
    this.stopSpeaking(odId);
  }

  // Speaking state
  private startSpeaking(odId: string): void {
    if (!this.currentChannel) return;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant || participant.isMuted) return;

    participant.isSpeaking = true;
    participant.status = 'speaking';
    participant.lastSpoke = new Date().toISOString();
    this.isSpeaking = true;

    this.emit('participant_speaking', { channelId: this.currentChannel.id, participant });
  }

  private stopSpeaking(odId: string): void {
    if (!this.currentChannel) return;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant) return;

    participant.isSpeaking = false;
    participant.status = participant.isMuted ? 'muted' : 'connected';
    this.isSpeaking = false;

    this.emit('participant_stopped_speaking', { channelId: this.currentChannel.id, participant });
  }

  // Voice activity detection (simulated)
  simulateVoiceActivity(odId: string, level: number): void {
    if (!this.currentChannel || this.settings.mode !== 'voice_activated') return;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant || participant.isMuted) return;

    if (level > this.settings.voiceActivationThreshold) {
      if (!participant.isSpeaking) {
        this.startSpeaking(odId);
      }
    } else {
      if (participant.isSpeaking) {
        this.stopSpeaking(odId);
      }
    }
  }

  // Proximity voice (simulated)
  updatePosition(odId: string, position: { x: number; y: number; z: number }): void {
    if (!this.currentChannel || !this.currentChannel.settings.proximityEnabled) return;

    const participant = this.currentChannel.participants.find(p => p.odId === odId);
    if (!participant) return;

    participant.position = position;

    // Calculate volumes based on proximity
    this.calculateProximityVolumes();
  }

  private calculateProximityVolumes(): void {
    if (!this.currentChannel || !this.currentChannel.settings.proximityEnabled) return;

    const radius = this.currentChannel.settings.proximityRadius;
    const participants = this.currentChannel.participants.filter(p => p.position);

    for (const p1 of participants) {
      for (const p2 of participants) {
        if (p1.odId === p2.odId || !p1.position || !p2.position) continue;

        const distance = Math.sqrt(
          Math.pow(p1.position.x - p2.position.x, 2) +
          Math.pow(p1.position.y - p2.position.y, 2) +
          Math.pow(p1.position.z - p2.position.z, 2)
        );

        // Volume falls off with distance
        const volumeMultiplier = Math.max(0, 1 - (distance / radius));
        // This would be used to adjust the actual audio volume in a real implementation
      }
    }
  }

  // Settings
  async getSettings(): Promise<VoiceSettings> {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    this.settings = { ...this.settings, ...settings };
    await this.saveData();
    this.emit('settings_changed', this.settings);
    return this.settings;
  }

  // Stats
  async getStats(): Promise<VoiceStats> {
    return { ...this.currentStats };
  }

  async getConnectionQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor'> {
    const { latency, packetLoss, jitter } = this.currentStats;

    if (latency < 50 && packetLoss < 1 && jitter < 10) return 'excellent';
    if (latency < 100 && packetLoss < 3 && jitter < 20) return 'good';
    if (latency < 200 && packetLoss < 5 && jitter < 30) return 'fair';
    return 'poor';
  }

  // Session history
  async getSessions(filter?: { odId?: string; channelId?: string }): Promise<VoiceSession[]> {
    let result = [...this.sessions];

    if (filter?.odId) {
      result = result.filter(s => s.odId === filter.odId);
    }
    if (filter?.channelId) {
      result = result.filter(s => s.channelId === filter.channelId);
    }

    return result.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // Analytics
  async getAnalytics(): Promise<VoiceAnalytics> {
    const totalSessions = this.sessions.length;
    const totalSpeakingTime = this.sessions.reduce((sum, s) => sum + s.speakingTime, 0);
    const totalDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalLatency = this.sessions.reduce((sum, s) => sum + s.stats.latency, 0);

    const participantsByChannel: Record<string, number> = {};
    const qualityDistribution: Record<string, number> = {};

    for (const session of this.sessions) {
      participantsByChannel[session.channelId] = (participantsByChannel[session.channelId] || 0) + 1;
      qualityDistribution[session.stats.connectionQuality] = (qualityDistribution[session.stats.connectionQuality] || 0) + 1;
    }

    return {
      totalSessions,
      totalSpeakingTime,
      averageSessionDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      averageLatency: totalSessions > 0 ? totalLatency / totalSessions : 0,
      participantsByChannel,
      peakConcurrentUsers: Math.max(...this.channels.map(c => c.participants.length), 0),
      qualityDistribution,
    };
  }

  // Current state
  getCurrentChannel(): VoiceChannel | null {
    return this.currentChannel;
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionState;
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  // Sound effects (simulated)
  private playSound(type: 'join' | 'leave' | 'mute' | 'unmute'): void {
    if (Platform.OS === 'web') {
      // In a real implementation, this would play audio
      console.log(`[VOICE] Playing sound: ${type}`);
    }
  }

  // Create mission channel
  async createMissionChannel(
    missionId: string,
    missionName: string,
    createdBy: string
  ): Promise<VoiceChannel> {
    return this.createChannel(
      `Mission: ${missionName}`,
      'mission',
      createdBy,
      {
        missionId,
        maxParticipants: 50,
        settings: {
          ...DEFAULT_CHANNEL_SETTINGS,
          defaultMode: 'push_to_talk',
          quality: 'high',
        },
      }
    );
  }

  // Create team channel
  async createTeamChannel(
    teamId: string,
    teamName: string,
    createdBy: string
  ): Promise<VoiceChannel> {
    return this.createChannel(
      `Team: ${teamName}`,
      'team',
      createdBy,
      {
        teamId,
        maxParticipants: 10,
        settings: {
          ...DEFAULT_CHANNEL_SETTINGS,
          defaultMode: 'open_mic',
          quality: 'high',
        },
      }
    );
  }
}

export const missionVoiceChatService = new MissionVoiceChatService();
export default missionVoiceChatService;
