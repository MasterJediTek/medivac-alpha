/**
 * Highlight Reels Service
 * Allows JEDI Masters to extract key segments from recordings
 * Creates shareable training clips
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type HighlightCategory = 'training' | 'incident' | 'best_practice' | 'protocol' | 'emergency' | 'debrief' | 'custom';
export type HighlightStatus = 'draft' | 'processing' | 'ready' | 'published' | 'archived';
export type ExportFormat = 'mp3' | 'wav' | 'ogg' | 'mp4';

export interface HighlightSegment {
  id: string;
  startTime: number; // seconds from recording start
  endTime: number;
  duration: number;
  label: string;
  description?: string;
  speakerId?: string;
  speakerName?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface HighlightAnnotation {
  id: string;
  segmentId: string;
  timestamp: number;
  type: 'note' | 'question' | 'action_item' | 'key_point' | 'warning';
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface HighlightReel {
  id: string;
  title: string;
  description: string;
  category: HighlightCategory;
  status: HighlightStatus;
  sourceRecordingId: string;
  sourceRecordingName: string;
  segments: HighlightSegment[];
  annotations: HighlightAnnotation[];
  totalDuration: number;
  createdBy: string;
  createdByName: string;
  createdByRank: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  fileSize: number;
  format: ExportFormat;
  views: number;
  likes: number;
  shares: number;
  sharedWith: string[];
  tags: string[];
  isPublic: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  expiresAt?: string;
}

export interface HighlightComment {
  id: string;
  reelId: string;
  parentId?: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  likedBy: string[];
  isEdited: boolean;
  isPinned: boolean;
}

export interface HighlightPlaylist {
  id: string;
  title: string;
  description: string;
  category: HighlightCategory;
  reelIds: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  views: number;
  followers: string[];
}

export interface HighlightAnalytics {
  totalReels: number;
  reelsByCategory: Record<HighlightCategory, number>;
  reelsByStatus: Record<HighlightStatus, number>;
  totalDuration: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  topCreators: { odId: string; name: string; count: number }[];
  topReels: { id: string; title: string; views: number }[];
  averageSegmentsPerReel: number;
  storageUsed: number;
}

// Storage keys
const STORAGE_KEYS = {
  REELS: '@medivac_highlight_reels',
  COMMENTS: '@medivac_highlight_comments',
  PLAYLISTS: '@medivac_highlight_playlists',
};

class HighlightReelsService {
  private reels: HighlightReel[] = [];
  private comments: HighlightComment[] = [];
  private playlists: HighlightPlaylist[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadData();
    this.initializeSampleData();
    this.initialized = true;
  }

  private async loadData(): Promise<void> {
    try {
      const [reelsData, commentsData, playlistsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REELS),
        AsyncStorage.getItem(STORAGE_KEYS.COMMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
      ]);

      if (reelsData) this.reels = JSON.parse(reelsData);
      if (commentsData) this.comments = JSON.parse(commentsData);
      if (playlistsData) this.playlists = JSON.parse(playlistsData);
    } catch (error) {
      console.error('Failed to load highlight reels data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.REELS, JSON.stringify(this.reels)),
        AsyncStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(this.comments)),
        AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(this.playlists)),
      ]);
    } catch (error) {
      console.error('Failed to save highlight reels data:', error);
    }
  }

  private initializeSampleData(): void {
    if (this.reels.length === 0) {
      const sampleReels: HighlightReel[] = [
        {
          id: 'reel_sample_1',
          title: 'Emergency Response Protocol - Best Practices',
          description: 'Key moments from the emergency response training session demonstrating proper protocol execution.',
          category: 'training',
          status: 'published',
          sourceRecordingId: 'recording_001',
          sourceRecordingName: 'Emergency Response Training - Session 12',
          segments: [
            {
              id: 'seg_1',
              startTime: 120,
              endTime: 180,
              duration: 60,
              label: 'Initial Assessment',
              description: 'Proper technique for rapid patient assessment',
              importance: 'high',
              tags: ['assessment', 'protocol'],
            },
            {
              id: 'seg_2',
              startTime: 300,
              endTime: 420,
              duration: 120,
              label: 'Team Coordination',
              description: 'Effective communication during crisis',
              importance: 'critical',
              tags: ['teamwork', 'communication'],
            },
          ],
          annotations: [],
          totalDuration: 180,
          createdBy: 'master_yoda',
          createdByName: 'Master Yoda',
          createdByRank: 'grand_master',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          publishedBy: 'master_yoda',
          fileSize: 15 * 1024 * 1024,
          format: 'mp3',
          views: 245,
          likes: 38,
          shares: 12,
          sharedWith: [],
          tags: ['emergency', 'training', 'protocol'],
          isPublic: true,
          allowComments: true,
          allowDownload: true,
        },
        {
          id: 'reel_sample_2',
          title: 'Incident Debrief - Code Blue Response',
          description: 'Analysis of the Code Blue response on Level 3, highlighting areas of excellence and improvement.',
          category: 'incident',
          status: 'published',
          sourceRecordingId: 'recording_002',
          sourceRecordingName: 'Level 3 Code Blue - Post-Incident Review',
          segments: [
            {
              id: 'seg_3',
              startTime: 45,
              endTime: 90,
              duration: 45,
              label: 'Response Time Analysis',
              description: 'Team arrived within 2 minutes',
              importance: 'high',
              tags: ['response', 'timing'],
            },
          ],
          annotations: [],
          totalDuration: 45,
          createdBy: 'master_windu',
          createdByName: 'Mace Windu',
          createdByRank: 'council_member',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          publishedBy: 'master_windu',
          fileSize: 8 * 1024 * 1024,
          format: 'mp3',
          views: 156,
          likes: 24,
          shares: 8,
          sharedWith: [],
          tags: ['code-blue', 'incident', 'debrief'],
          isPublic: true,
          allowComments: true,
          allowDownload: false,
        },
      ];

      this.reels = sampleReels;
      this.saveData();
    }
  }

  // Reel Management
  async createReel(
    title: string,
    description: string,
    category: HighlightCategory,
    sourceRecordingId: string,
    sourceRecordingName: string,
    createdBy: string,
    createdByName: string,
    createdByRank: string,
    options?: {
      segments?: HighlightSegment[];
      tags?: string[];
      isPublic?: boolean;
      allowComments?: boolean;
      allowDownload?: boolean;
    }
  ): Promise<HighlightReel> {
    const segments = options?.segments || [];
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    const reel: HighlightReel = {
      id: `reel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      category,
      status: 'draft',
      sourceRecordingId,
      sourceRecordingName,
      segments,
      annotations: [],
      totalDuration,
      createdBy,
      createdByName,
      createdByRank,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: 0,
      format: 'mp3',
      views: 0,
      likes: 0,
      shares: 0,
      sharedWith: [],
      tags: options?.tags || [],
      isPublic: options?.isPublic ?? false,
      allowComments: options?.allowComments ?? true,
      allowDownload: options?.allowDownload ?? true,
    };

    this.reels.push(reel);
    await this.saveData();
    return reel;
  }

  async updateReel(reelId: string, updates: Partial<HighlightReel>): Promise<HighlightReel | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return null;

    Object.assign(reel, updates, { updatedAt: new Date().toISOString() });

    // Recalculate duration if segments changed
    if (updates.segments) {
      reel.totalDuration = reel.segments.reduce((sum, seg) => sum + seg.duration, 0);
    }

    await this.saveData();
    return reel;
  }

  async deleteReel(reelId: string): Promise<boolean> {
    const index = this.reels.findIndex(r => r.id === reelId);
    if (index === -1) return false;

    this.reels.splice(index, 1);
    // Remove associated comments
    this.comments = this.comments.filter(c => c.reelId !== reelId);
    await this.saveData();
    return true;
  }

  // Segment Management
  async addSegment(
    reelId: string,
    startTime: number,
    endTime: number,
    label: string,
    options?: {
      description?: string;
      speakerId?: string;
      speakerName?: string;
      importance?: HighlightSegment['importance'];
      tags?: string[];
    }
  ): Promise<HighlightSegment | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return null;

    const segment: HighlightSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime,
      endTime,
      duration: endTime - startTime,
      label,
      description: options?.description,
      speakerId: options?.speakerId,
      speakerName: options?.speakerName,
      importance: options?.importance || 'medium',
      tags: options?.tags || [],
    };

    reel.segments.push(segment);
    reel.segments.sort((a, b) => a.startTime - b.startTime);
    reel.totalDuration = reel.segments.reduce((sum, seg) => sum + seg.duration, 0);
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return segment;
  }

  async updateSegment(
    reelId: string,
    segmentId: string,
    updates: Partial<HighlightSegment>
  ): Promise<HighlightSegment | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return null;

    const segment = reel.segments.find(s => s.id === segmentId);
    if (!segment) return null;

    Object.assign(segment, updates);
    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      segment.duration = segment.endTime - segment.startTime;
      reel.totalDuration = reel.segments.reduce((sum, seg) => sum + seg.duration, 0);
    }
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return segment;
  }

  async removeSegment(reelId: string, segmentId: string): Promise<boolean> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;

    const index = reel.segments.findIndex(s => s.id === segmentId);
    if (index === -1) return false;

    reel.segments.splice(index, 1);
    reel.totalDuration = reel.segments.reduce((sum, seg) => sum + seg.duration, 0);
    reel.updatedAt = new Date().toISOString();

    // Remove associated annotations
    reel.annotations = reel.annotations.filter(a => a.segmentId !== segmentId);

    await this.saveData();
    return true;
  }

  async mergeSegments(reelId: string, segmentIds: string[], newLabel: string): Promise<HighlightSegment | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return null;

    const segments = reel.segments.filter(s => segmentIds.includes(s.id));
    if (segments.length < 2) return null;

    segments.sort((a, b) => a.startTime - b.startTime);
    const startTime = segments[0].startTime;
    const endTime = segments[segments.length - 1].endTime;

    // Remove old segments
    reel.segments = reel.segments.filter(s => !segmentIds.includes(s.id));

    // Create merged segment
    const mergedSegment: HighlightSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime,
      endTime,
      duration: endTime - startTime,
      label: newLabel,
      description: segments.map(s => s.description).filter(Boolean).join(' | '),
      importance: 'high',
      tags: [...new Set(segments.flatMap(s => s.tags))],
    };

    reel.segments.push(mergedSegment);
    reel.segments.sort((a, b) => a.startTime - b.startTime);
    reel.totalDuration = reel.segments.reduce((sum, seg) => sum + seg.duration, 0);
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return mergedSegment;
  }

  // Annotation Management
  async addAnnotation(
    reelId: string,
    segmentId: string,
    timestamp: number,
    type: HighlightAnnotation['type'],
    content: string,
    createdBy: string,
    createdByName: string
  ): Promise<HighlightAnnotation | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return null;

    const segment = reel.segments.find(s => s.id === segmentId);
    if (!segment) return null;

    const annotation: HighlightAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      segmentId,
      timestamp,
      type,
      content,
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      isResolved: false,
    };

    reel.annotations.push(annotation);
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return annotation;
  }

  async resolveAnnotation(reelId: string, annotationId: string, resolvedBy: string): Promise<boolean> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;

    const annotation = reel.annotations.find(a => a.id === annotationId);
    if (!annotation) return false;

    annotation.isResolved = true;
    annotation.resolvedAt = new Date().toISOString();
    annotation.resolvedBy = resolvedBy;
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return true;
  }

  // Publishing
  async processReel(reelId: string): Promise<HighlightReel | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel || reel.segments.length === 0) return null;

    reel.status = 'processing';
    await this.saveData();

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Calculate file size based on duration (approximate 128kbps for mp3)
    reel.fileSize = Math.round(reel.totalDuration * 16 * 1024); // 16KB per second
    reel.fileUrl = `https://medivac.jedi.temple/highlights/${reel.id}.${reel.format}`;
    reel.status = 'ready';
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return reel;
  }

  async publishReel(reelId: string, publishedBy: string): Promise<HighlightReel | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel || reel.status !== 'ready') return null;

    reel.status = 'published';
    reel.publishedAt = new Date().toISOString();
    reel.publishedBy = publishedBy;
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return reel;
  }

  async unpublishReel(reelId: string): Promise<boolean> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;

    reel.status = 'ready';
    reel.publishedAt = undefined;
    reel.publishedBy = undefined;
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return true;
  }

  async archiveReel(reelId: string): Promise<boolean> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;

    reel.status = 'archived';
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return true;
  }

  // Export
  async exportReel(reelId: string, format: ExportFormat): Promise<{ url: string; filename: string; size: number } | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel || !['ready', 'published'].includes(reel.status)) return null;

    const filename = `${reel.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${format}`;
    const url = `https://medivac.jedi.temple/exports/${filename}`;

    return {
      url,
      filename,
      size: reel.fileSize,
    };
  }

  // Sharing
  async shareReel(reelId: string, targetIds: string[]): Promise<boolean> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;

    reel.sharedWith = [...new Set([...reel.sharedWith, ...targetIds])];
    reel.shares += targetIds.length;
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return true;
  }

  async unshareReel(reelId: string, targetId: string): Promise<boolean> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;

    reel.sharedWith = reel.sharedWith.filter(id => id !== targetId);
    reel.updatedAt = new Date().toISOString();

    await this.saveData();
    return true;
  }

  // Engagement
  async incrementViews(reelId: string): Promise<number> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return 0;

    reel.views++;
    await this.saveData();
    return reel.views;
  }

  async likeReel(reelId: string): Promise<number> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return 0;

    reel.likes++;
    await this.saveData();
    return reel.likes;
  }

  // Comments
  async addComment(
    reelId: string,
    content: string,
    createdBy: string,
    createdByName: string,
    parentId?: string
  ): Promise<HighlightComment | null> {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel || !reel.allowComments) return null;

    const comment: HighlightComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reelId,
      parentId,
      content,
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      isEdited: false,
      isPinned: false,
    };

    this.comments.push(comment);
    await this.saveData();
    return comment;
  }

  async getComments(reelId: string): Promise<HighlightComment[]> {
    return this.comments.filter(c => c.reelId === reelId);
  }

  // Playlists
  async createPlaylist(
    title: string,
    description: string,
    category: HighlightCategory,
    createdBy: string,
    createdByName: string,
    reelIds?: string[]
  ): Promise<HighlightPlaylist> {
    const playlist: HighlightPlaylist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      category,
      reelIds: reelIds || [],
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      views: 0,
      followers: [],
    };

    this.playlists.push(playlist);
    await this.saveData();
    return playlist;
  }

  async addToPlaylist(playlistId: string, reelId: string): Promise<boolean> {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    if (!playlist.reelIds.includes(reelId)) {
      playlist.reelIds.push(reelId);
      playlist.updatedAt = new Date().toISOString();
      await this.saveData();
    }
    return true;
  }

  async removeFromPlaylist(playlistId: string, reelId: string): Promise<boolean> {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    playlist.reelIds = playlist.reelIds.filter(id => id !== reelId);
    playlist.updatedAt = new Date().toISOString();
    await this.saveData();
    return true;
  }

  // Query Methods
  getReels(filters?: {
    category?: HighlightCategory;
    status?: HighlightStatus;
    createdBy?: string;
    sourceRecordingId?: string;
    isPublic?: boolean;
    search?: string;
    limit?: number;
  }): HighlightReel[] {
    let filtered = [...this.reels];

    if (filters?.category) {
      filtered = filtered.filter(r => r.category === filters.category);
    }
    if (filters?.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters?.createdBy) {
      filtered = filtered.filter(r => r.createdBy === filters.createdBy);
    }
    if (filters?.sourceRecordingId) {
      filtered = filtered.filter(r => r.sourceRecordingId === filters.sourceRecordingId);
    }
    if (filters?.isPublic !== undefined) {
      filtered = filtered.filter(r => r.isPublic === filters.isPublic);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.tags.some(t => t.toLowerCase().includes(search))
      );
    }
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReel(reelId: string): HighlightReel | null {
    return this.reels.find(r => r.id === reelId) || null;
  }

  getPlaylists(filters?: { createdBy?: string; isPublic?: boolean }): HighlightPlaylist[] {
    let filtered = [...this.playlists];

    if (filters?.createdBy) {
      filtered = filtered.filter(p => p.createdBy === filters.createdBy);
    }
    if (filters?.isPublic !== undefined) {
      filtered = filtered.filter(p => p.isPublic === filters.isPublic);
    }

    return filtered;
  }

  // Analytics
  getAnalytics(): HighlightAnalytics {
    const reelsByCategory: Record<HighlightCategory, number> = {
      training: 0,
      incident: 0,
      best_practice: 0,
      protocol: 0,
      emergency: 0,
      debrief: 0,
      custom: 0,
    };

    const reelsByStatus: Record<HighlightStatus, number> = {
      draft: 0,
      processing: 0,
      ready: 0,
      published: 0,
      archived: 0,
    };

    let totalDuration = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;
    let totalSegments = 0;
    let storageUsed = 0;

    const creatorCounts: Record<string, { name: string; count: number }> = {};

    this.reels.forEach(reel => {
      reelsByCategory[reel.category]++;
      reelsByStatus[reel.status]++;
      totalDuration += reel.totalDuration;
      totalViews += reel.views;
      totalLikes += reel.likes;
      totalShares += reel.shares;
      totalSegments += reel.segments.length;
      storageUsed += reel.fileSize;

      if (!creatorCounts[reel.createdBy]) {
        creatorCounts[reel.createdBy] = { name: reel.createdByName, count: 0 };
      }
      creatorCounts[reel.createdBy].count++;
    });

    const topCreators = Object.entries(creatorCounts)
      .map(([odId, data]) => ({ odId, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topReels = [...this.reels]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(r => ({ id: r.id, title: r.title, views: r.views }));

    return {
      totalReels: this.reels.length,
      reelsByCategory,
      reelsByStatus,
      totalDuration,
      totalViews,
      totalLikes,
      totalShares,
      topCreators,
      topReels,
      averageSegmentsPerReel: this.reels.length > 0 ? totalSegments / this.reels.length : 0,
      storageUsed,
    };
  }
}

export const highlightReelsService = new HighlightReelsService();
export default highlightReelsService;
