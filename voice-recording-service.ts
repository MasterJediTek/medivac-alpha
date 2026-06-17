 * Voice Recording Service
 * Records mission voice communications for training and review
 * Recording only activates on JEDI Master request
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'completed' | 'failed';
export type RecordingPermission = 'view' | 'playback' | 'download' | 'annotate' | 'delete' | 'share';
export type JediRank = 'youngling' | 'padawan' | 'knight' | 'master' | 'council_member' | 'grand_master';

export interface JediMaster {
  id: string;
  name: string;
  rank: JediRank;
  email: string;
  avatar?: string;
  canRequestRecording: boolean;
  councilMember: boolean;
  specializations: string[];
  recordingsRequested: number;
  lastActive: string;
}

export interface RecordingRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRank: JediRank;
  channelId: string;
  channelName: string;
  missionId?: string;
  missionName?: string;
  reason: string;
  priority: 'normal' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'recording' | 'completed' | 'denied' | 'cancelled';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  deniedAt?: string;
  deniedBy?: string;
  denialReason?: string;
  recordingId?: string;
  notifyParticipants: boolean;
  autoStopAfterMinutes?: number;
}

export interface VoiceRecording {
  id: string;
  channelId: string;
  channelName: string;
  missionId?: string;
  missionName?: string;
  requestId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRank: JediRank;
  status: RecordingStatus;
  startedAt: string;
  endedAt?: string;
  duration: number; // seconds
  fileSize: number; // bytes
  fileUrl?: string;
  format: 'opus' | 'mp3' | 'wav';
  sampleRate: number;
  bitrate: number;
  channels: number;
  participants: RecordingParticipant[];
  segments: RecordingSegment[];
  bookmarks: RecordingBookmark[];
  annotations: RecordingAnnotation[];
  transcription?: RecordingTranscription;
  metadata: RecordingMetadata;
  permissions: RecordingPermissionEntry[];
  views: number;
  downloads: number;
  sharedWith: string[];
  tags: string[];
  isArchived: boolean;
  retentionDays: number;
  expiresAt?: string;
}

export interface RecordingParticipant {
  odId: string;
  name: string;
  rank: JediRank;
  role: string;
  joinedAt: string;
  leftAt?: string;
  speakingTime: number; // seconds
  speakingPercentage: number;
  segments: number;
  isMuted: boolean;
}

export interface RecordingSegment {
  id: string;