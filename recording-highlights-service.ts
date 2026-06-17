 * Recording Highlights and Clips Service
 * Mark key moments and create shareable clips
 * MediVac One v6.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  HIGHLIGHTS: 'medivac_recording_highlights',
  CLIPS: 'medivac_recording_clips',
};

// Types
export type HighlightType = 'key_moment' | 'action_item' | 'decision' | 'question' | 'important' | 'follow_up';
export type ClipStatus = 'processing' | 'ready' | 'shared' | 'expired';

export interface Highlight {
  id: string;
  recordingId: string;
  type: HighlightType;
  title: string;
  description?: string;
  timestamp: number; // seconds from start
  duration: number; // highlight duration in seconds
  createdBy: string;
  createdAt: string;
  tags: string[];
  isBookmarked: boolean;
}

export interface Clip {
  id: string;
  recordingId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: ClipStatus;
  shareUrl?: string;
  shareCode?: string;
  expiresAt?: string;
  viewCount: number;
  downloadCount: number;
  permissions: ClipPermissions;
  highlights: string[]; // highlight IDs included
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClipPermissions {
  isPublic: boolean;
  allowDownload: boolean;
  allowEmbed: boolean;
  requireAuth: boolean;
  allowedUsers: string[];
  allowedRoles: string[];