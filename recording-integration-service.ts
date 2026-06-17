/**
 * Meeting Recording Integration Service
 * Auto-save Teams recordings to SharePoint with incident/drill linking
 * MediVac One v5.9
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'medivac_recording_config',
  RECORDINGS: 'medivac_recordings',
  TRANSCRIPTS: 'medivac_transcripts',
};

// Types
export type RecordingStatus = 'processing' | 'ready' | 'uploading' | 'uploaded' | 'failed' | 'archived';
export type RecordingType = 'incident_response' | 'drill_debrief' | 'compliance_review' | 'training' | 'general';

export interface RecordingConfig {
  enabled: boolean;
  autoUpload: boolean;
  sharePointLibrary?: string;
  retentionDays: number;
  transcriptionEnabled: boolean;
  notifyOnComplete: boolean;
  accessControl: 'public' | 'restricted' | 'private';
  storageQuotaUsed: number;
  storageQuotaTotal: number;
}

export interface Recording {
  id: string;
  title: string;
  description?: string;
  type: RecordingType;
  status: RecordingStatus;
  meetingId: string;
  meetingTitle: string;
  duration: number; // seconds
  fileSize: number; // bytes
  format: string;
  recordedAt: string;
  uploadedAt?: string;
  sharePointUrl?: string;
  thumbnailUrl?: string;
  participants: RecordingParticipant[];
  linkedIncidentId?: string;
  linkedDrillId?: string;
  transcript?: Transcript;
  accessList: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingParticipant {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  leftAt?: string;
  speakingTime?: number; // seconds
}

export interface Transcript {
  id: string;
  recordingId: string;
  language: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  content?: TranscriptSegment[];
  summary?: string;
  keywords?: string[];
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startTime: number; // seconds
  endTime: number;
  confidence: number;
}

export interface RecordingAnalytics {
  totalRecordings: number;
  totalDuration: number;
  totalSize: number;
  byType: Record<RecordingType, number>;
  byStatus: Record<RecordingStatus, number>;
  averageDuration: number;
  mostActiveParticipants: { name: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

// Recording types configuration
export const RECORDING_TYPES: Record<RecordingType, { label: string; color: string; icon: string }> = {
  incident_response: { label: 'Incident Response', color: '#EF4444', icon: 'exclamationmark.triangle.fill' },
  drill_debrief: { label: 'Drill Debrief', color: '#F59E0B', icon: 'person.3.fill' },
  compliance_review: { label: 'Compliance Review', color: '#3B82F6', icon: 'checkmark.shield.fill' },
  training: { label: 'Training Session', color: '#10B981', icon: 'book.fill' },
  general: { label: 'General Meeting', color: '#6B7280', icon: 'video.fill' },
};

// Default configuration
const DEFAULT_CONFIG: RecordingConfig = {
  enabled: true,
  autoUpload: true,
  retentionDays: 365,
  transcriptionEnabled: true,
  notifyOnComplete: true,
  accessControl: 'restricted',
  storageQuotaUsed: 5368709120, // 5GB
  storageQuotaTotal: 53687091200, // 50GB
};

// Sample recordings
const SAMPLE_RECORDINGS: Recording[] = [
  {
    id: 'rec_1',
    title: 'Incident Response - Unauthorized Access Attempt',
    description: 'Emergency response meeting for detected unauthorized access',
    type: 'incident_response',
    status: 'uploaded',
    meetingId: 'meeting_001',
    meetingTitle: 'Incident Response: Unauthorized Access',
    duration: 1847,
    fileSize: 256000000,
    format: 'mp4',
    recordedAt: '2025-01-28T14:30:00Z',
    uploadedAt: '2025-01-28T15:00:00Z',
    sharePointUrl: 'https://sharepoint.com/recordings/rec_1.mp4',
    participants: [
      { id: 'p1', name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@medivac.health', role: 'Clinical Director', joinedAt: '2025-01-28T14:30:00Z', speakingTime: 420 },
      { id: 'p2', name: 'James Wilson', email: 'james.wilson@medivac.health', role: 'IT Security Manager', joinedAt: '2025-01-28T14:31:00Z', speakingTime: 680 },
      { id: 'p3', name: 'Emily Chen', email: 'emily.chen@medivac.health', role: 'Compliance Officer', joinedAt: '2025-01-28T14:32:00Z', speakingTime: 350 },
    ],
    linkedIncidentId: 'incident_001',
    accessList: ['security_team', 'compliance_team', 'executives'],
    viewCount: 12,
    createdAt: '2025-01-28T14:30:00Z',
    updatedAt: '2025-01-28T15:00:00Z',
  },
  {
    id: 'rec_2',
    title: 'Drill Debrief - Ransomware Scenario',
    description: 'Post-drill analysis for ransomware response exercise',
    type: 'drill_debrief',
    status: 'uploaded',
    meetingId: 'meeting_002',
    meetingTitle: 'Drill Debrief: Ransomware Exercise',
    duration: 3245,
    fileSize: 512000000,
    format: 'mp4',
    recordedAt: '2025-01-25T10:00:00Z',
    uploadedAt: '2025-01-25T11:00:00Z',
    sharePointUrl: 'https://sharepoint.com/recordings/rec_2.mp4',
    participants: [
      { id: 'p1', name: 'James Wilson', email: 'james.wilson@medivac.health', role: 'IT Security Manager', joinedAt: '2025-01-25T10:00:00Z', speakingTime: 1200 },
      { id: 'p2', name: 'Michael Brown', email: 'michael.brown@medivac.health', role: 'Operations Director', joinedAt: '2025-01-25T10:02:00Z', speakingTime: 800 },
      { id: 'p3', name: 'Lisa Anderson', email: 'lisa.anderson@medivac.health', role: 'HR Manager', joinedAt: '2025-01-25T10:05:00Z', speakingTime: 450 },
    ],
    linkedDrillId: 'drill_001',
    accessList: ['all_staff'],
    viewCount: 45,
    createdAt: '2025-01-25T10:00:00Z',
    updatedAt: '2025-01-25T11:00:00Z',
  },
  {
    id: 'rec_3',
    title: 'Compliance Review - Q4 2024',
    description: 'Quarterly compliance status review and audit preparation',
    type: 'compliance_review',
    status: 'ready',
    meetingId: 'meeting_003',
    meetingTitle: 'Q4 2024 Compliance Review',
    duration: 2756,
    fileSize: 384000000,
    format: 'mp4',
    recordedAt: '2025-01-20T09:00:00Z',
    participants: [
      { id: 'p1', name: 'Emily Chen', email: 'emily.chen@medivac.health', role: 'Compliance Officer', joinedAt: '2025-01-20T09:00:00Z', speakingTime: 1500 },
      { id: 'p2', name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@medivac.health', role: 'Clinical Director', joinedAt: '2025-01-20T09:01:00Z', speakingTime: 600 },
    ],
    accessList: ['compliance_team', 'executives'],
    viewCount: 8,
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'rec_4',
    title: 'Training Session - New Security Protocols',
    description: 'Staff training on updated security procedures',
    type: 'training',
    status: 'processing',
    meetingId: 'meeting_004',
    meetingTitle: 'Security Protocol Training',
    duration: 5400,
    fileSize: 768000000,
    format: 'mp4',
    recordedAt: '2025-01-30T14:00:00Z',
    participants: [
      { id: 'p1', name: 'James Wilson', email: 'james.wilson@medivac.health', role: 'IT Security Manager', joinedAt: '2025-01-30T14:00:00Z', speakingTime: 4200 },
    ],
    accessList: ['all_staff'],
    viewCount: 0,
    createdAt: '2025-01-30T14:00:00Z',
    updatedAt: '2025-01-30T15:30:00Z',
  },
];

class RecordingIntegrationService {
  private config: RecordingConfig = DEFAULT_CONFIG;
  private recordings: Recording[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [configData, recordingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS),
      ]);

      this.config = configData ? JSON.parse(configData) : DEFAULT_CONFIG;
      this.recordings = recordingsData ? JSON.parse(recordingsData) : SAMPLE_RECORDINGS;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize recording service:', error);
      this.config = DEFAULT_CONFIG;
      this.recordings = SAMPLE_RECORDINGS;
      this.initialized = true;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save recording config:', error);
    }
  }

  private async saveRecordings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(this.recordings));
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  }

  // Configuration
  getConfig(): RecordingConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<RecordingConfig>): Promise<RecordingConfig> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    return this.config;
  }

  // Recordings
  getRecordings(): Recording[] {
    return [...this.recordings].sort((a, b) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  }

  getRecording(id: string): Recording | undefined {
    return this.recordings.find(r => r.id === id);
  }

  getRecordingsByType(type: RecordingType): Recording[] {
    return this.recordings.filter(r => r.type === type);
  }

  getRecordingsByStatus(status: RecordingStatus): Recording[] {
    return this.recordings.filter(r => r.status === status);
  }

  getRecordingsForIncident(incidentId: string): Recording[] {
    return this.recordings.filter(r => r.linkedIncidentId === incidentId);
  }

  getRecordingsForDrill(drillId: string): Recording[] {
    return this.recordings.filter(r => r.linkedDrillId === drillId);
  }

  async uploadRecording(recordingId: string): Promise<Recording | null> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) return null;

    recording.status = 'uploading';
    await this.saveRecordings();

    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    recording.status = 'uploaded';
    recording.uploadedAt = new Date().toISOString();
    recording.sharePointUrl = `https://sharepoint.com/recordings/${recording.id}.mp4`;
    recording.updatedAt = new Date().toISOString();
    await this.saveRecordings();

    return recording;
  }

  async linkToIncident(recordingId: string, incidentId: string): Promise<Recording | null> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) return null;

    recording.linkedIncidentId = incidentId;
    recording.updatedAt = new Date().toISOString();
    await this.saveRecordings();

    return recording;
  }

  async linkToDrill(recordingId: string, drillId: string): Promise<Recording | null> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) return null;

    recording.linkedDrillId = drillId;
    recording.updatedAt = new Date().toISOString();
    await this.saveRecordings();

    return recording;
  }

  async archiveRecording(recordingId: string): Promise<boolean> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) return false;

    recording.status = 'archived';
    recording.updatedAt = new Date().toISOString();
    await this.saveRecordings();

    return true;
  }

  async deleteRecording(recordingId: string): Promise<boolean> {
    const index = this.recordings.findIndex(r => r.id === recordingId);
    if (index === -1) return false;

    this.recordings.splice(index, 1);
    await this.saveRecordings();

    return true;
  }

  // Transcription
  async requestTranscription(recordingId: string): Promise<Transcript | null> {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) return null;

    // Simulate transcription request
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transcript: Transcript = {
      id: `trans_${Date.now()}`,
      recordingId,
      language: 'en-AU',
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    recording.transcript = transcript;
    await this.saveRecordings();

    // Simulate transcription completion
    setTimeout(async () => {
      if (recording.transcript) {
        recording.transcript.status = 'ready';
        recording.transcript.summary = 'Meeting discussed key security protocols and incident response procedures.';
        recording.transcript.keywords = ['security', 'incident', 'response', 'protocol', 'compliance'];
        recording.transcript.content = [
          { id: 's1', speaker: 'James Wilson', text: 'Welcome everyone to this security briefing.', startTime: 0, endTime: 5, confidence: 0.95 },
          { id: 's2', speaker: 'Dr. Sarah Mitchell', text: 'Thank you for organizing this meeting.', startTime: 6, endTime: 10, confidence: 0.92 },
        ];
        await this.saveRecordings();
      }
    }, 3000);

    return transcript;
  }

  // Search
  searchRecordings(query: string): Recording[] {
    const lowerQuery = query.toLowerCase();
    return this.recordings.filter(r =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description?.toLowerCase().includes(lowerQuery) ||
      r.meetingTitle.toLowerCase().includes(lowerQuery) ||
      r.participants.some(p => p.name.toLowerCase().includes(lowerQuery))
    );
  }

  // Analytics
  getAnalytics(): RecordingAnalytics {
    const byType: Record<RecordingType, number> = {
      incident_response: 0,
      drill_debrief: 0,
      compliance_review: 0,
      training: 0,
      general: 0,
    };

    const byStatus: Record<RecordingStatus, number> = {
      processing: 0,
      ready: 0,
      uploading: 0,
      uploaded: 0,
      failed: 0,
      archived: 0,
    };

    let totalDuration = 0;
    let totalSize = 0;
    const participantCounts: Record<string, number> = {};

    this.recordings.forEach(r => {
      byType[r.type]++;
      byStatus[r.status]++;
      totalDuration += r.duration;
      totalSize += r.fileSize;
      r.participants.forEach(p => {
        participantCounts[p.name] = (participantCounts[p.name] || 0) + 1;
      });
    });

    const mostActiveParticipants = Object.entries(participantCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRecordings: this.recordings.length,
      totalDuration,
      totalSize,
      byType,
      byStatus,
      averageDuration: this.recordings.length > 0 ? Math.round(totalDuration / this.recordings.length) : 0,
      mostActiveParticipants,
      recentActivity: [],
    };
  }

  // Export
  exportRecordingMetadata(recordingId: string): string {
    const recording = this.getRecording(recordingId);
    if (!recording) return '';

    return JSON.stringify({
      recording,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const recordingIntegrationService = new RecordingIntegrationService();
