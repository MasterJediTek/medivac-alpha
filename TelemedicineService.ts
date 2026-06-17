/**
 * Telemedicine Video Consultation Service
 * Secure video calling with WebRTC, screen sharing, and recording
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type ConsultationType = 'scheduled' | 'urgent' | 'follow_up' | 'second_opinion';
export type SessionStatus = 'waiting' | 'connecting' | 'active' | 'paused' | 'ended' | 'failed';
export type ParticipantRole = 'provider' | 'patient' | 'specialist' | 'interpreter' | 'family';
export type MediaType = 'video' | 'audio' | 'screen';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  joinedAt?: number;
  leftAt?: number;
  mediaState: {
    video: boolean;
    audio: boolean;
    screen: boolean;
  };
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface WaitingRoomEntry {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  scheduledTime?: number;
  joinedWaitingRoom: number;
  reason: string;
  priority: 'normal' | 'urgent';
  estimatedWait: number; // minutes
}

export interface ConsultationSession {
  id: string;
  type: ConsultationType;
  status: SessionStatus;
  providerId: string;
  providerName: string;
  patientId: string;
  patientName: string;
  participants: Participant[];
  scheduledStart?: number;
  actualStart?: number;
  actualEnd?: number;
  duration: number; // seconds
  recordingEnabled: boolean;
  recordingConsent: boolean;
  recordingUrl?: string;
  notes: ConsultationNote[];
  sharedFiles: SharedFile[];
  chatMessages: ChatMessage[];
  vitalsCapture?: VitalsCapture;
  prescriptions: string[];
  followUpScheduled?: number;
}

export interface ConsultationNote {
  id: string;
  timestamp: number;
  authorId: string;
  authorName: string;
  content: string;
  type: 'subjective' | 'objective' | 'assessment' | 'plan' | 'general';
}

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: number;
  url: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
}

export interface VitalsCapture {
  timestamp: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  weight?: number;
  painLevel?: number;
}

export interface VirtualExamTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  instructions: string[];
}

export interface ConnectionStats {
  bandwidth: number; // kbps
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TelemedicineDashboard {
  activeConsultations: number;
  waitingPatients: number;
  todayCompleted: number;
  averageWaitTime: number; // minutes
  averageDuration: number; // minutes
  satisfactionScore: number; // 1-5
  upcomingScheduled: ConsultationSession[];
  recentCompleted: ConsultationSession[];
}

// ============================================
// VIRTUAL EXAMINATION TOOLS
// ============================================

const VIRTUAL_EXAM_TOOLS: VirtualExamTool[] = [
  {
    id: 'skin-exam',
    name: 'Skin Examination',
    icon: '🔍',
    description: 'Guide patient to show affected skin areas',
    instructions: [
      'Ask patient to position camera 6-12 inches from affected area',
      'Request good lighting - natural light preferred',
      'Ask patient to slowly move camera for full view',
      'Take screenshots for documentation',
    ],
  },
  {
    id: 'throat-exam',
    name: 'Throat Examination',
    icon: '👄',
    description: 'Visual inspection of throat and oral cavity',
    instructions: [
      'Ask patient to use flashlight on phone or separate light',
      'Request patient to open mouth wide and say "Ahh"',
      'Look for redness, swelling, or white patches',
      'Check tonsils if visible',
    ],
  },
  {
    id: 'eye-exam',
    name: 'Eye Examination',
    icon: '👁️',
    description: 'Basic eye inspection and movement check',
    instructions: [
      'Ask patient to look directly at camera',
      'Check pupil size and symmetry',
      'Ask patient to follow finger with eyes only',
      'Check for redness, discharge, or swelling',
    ],
  },
  {
    id: 'range-motion',
    name: 'Range of Motion',
    icon: '🦵',
    description: 'Assess joint mobility and pain',
    instructions: [
      'Ask patient to stand back from camera',
      'Guide through specific movements for affected joint',
      'Note any pain, limitation, or asymmetry',
      'Compare to unaffected side if applicable',
    ],
  },
  {
    id: 'respiratory',
    name: 'Respiratory Assessment',
    icon: '🫁',
    description: 'Observe breathing patterns',
    instructions: [
      'Ask patient to breathe normally',
      'Count respiratory rate for 30 seconds',
      'Look for use of accessory muscles',
      'Listen for audible wheezing or stridor',
    ],
  },
  {
    id: 'wound-check',
    name: 'Wound Assessment',
    icon: '🩹',
    description: 'Evaluate wound healing progress',
    instructions: [
      'Ask patient to remove dressing if present',
      'Position camera close to wound',
      'Assess size, color, drainage, and surrounding skin',
      'Document with screenshots',
    ],
  },
];

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  SESSIONS: 'telemedicine_sessions',
  WAITING_ROOM: 'telemedicine_waiting_room',
  SETTINGS: 'telemedicine_settings',
};

// ============================================
// SERVICE STATE
// ============================================

let sessions: Map<string, ConsultationSession> = new Map();
let waitingRoom: Map<string, WaitingRoomEntry> = new Map();
let activeSession: ConsultationSession | null = null;
let connectionStats: ConnectionStats | null = null;
let listeners: Set<() => void> = new Set();

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = (): string => {
  return `TM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const notifyListeners = (): void => {
  listeners.forEach(listener => listener());
};

const calculateConnectionQuality = (stats: ConnectionStats): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (stats.latency < 50 && stats.packetLoss < 1 && stats.bandwidth > 2000) return 'excellent';
  if (stats.latency < 100 && stats.packetLoss < 3 && stats.bandwidth > 1000) return 'good';
  if (stats.latency < 200 && stats.packetLoss < 5 && stats.bandwidth > 500) return 'fair';
  return 'poor';
};

const estimateWaitTime = (): number => {
  const activeCount = Array.from(sessions.values()).filter(s => s.status === 'active').length;
  const waitingCount = waitingRoom.size;
  // Estimate 15 minutes per active consultation + 5 minutes buffer per waiting patient
  return Math.max(5, activeCount * 15 + waitingCount * 5);
};

// ============================================
// CORE SERVICE FUNCTIONS
// ============================================

/**
 * Initialize telemedicine service
 */
export const initializeTelemedicine = async (): Promise<void> => {
  try {
    const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (storedSessions) {
      const parsed = JSON.parse(storedSessions);
      sessions = new Map(Object.entries(parsed));
    }

    const storedWaiting = await AsyncStorage.getItem(STORAGE_KEYS.WAITING_ROOM);
    if (storedWaiting) {
      const parsed = JSON.parse(storedWaiting);
      waitingRoom = new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Failed to initialize telemedicine:', error);
  }
};

/**
 * Save state to storage
 */
const saveState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSIONS,
      JSON.stringify(Object.fromEntries(sessions))
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.WAITING_ROOM,
      JSON.stringify(Object.fromEntries(waitingRoom))
    );
  } catch (error) {
    console.error('Failed to save telemedicine state:', error);
  }
};

/**
 * Subscribe to state changes
 */
export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ============================================
// WAITING ROOM MANAGEMENT
// ============================================

/**
 * Add patient to waiting room
 */
export const addToWaitingRoom = async (
  patientId: string,
  patientName: string,
  reason: string,
  appointmentId?: string,
  scheduledTime?: number,
  priority: 'normal' | 'urgent' = 'normal'
): Promise<WaitingRoomEntry> => {
  const entry: WaitingRoomEntry = {
    id: generateId(),
    patientId,
    patientName,
    appointmentId,
    scheduledTime,
    joinedWaitingRoom: Date.now(),
    reason,
    priority,
    estimatedWait: estimateWaitTime(),
  };

  waitingRoom.set(entry.id, entry);
  await saveState();
  notifyListeners();
  return entry;
};

/**
 * Remove patient from waiting room
 */
export const removeFromWaitingRoom = async (entryId: string): Promise<void> => {
  waitingRoom.delete(entryId);
  await saveState();
  notifyListeners();
};

/**
 * Get waiting room entries
 */
export const getWaitingRoom = (): WaitingRoomEntry[] => {
  return Array.from(waitingRoom.values())
    .sort((a, b) => {
      // Urgent first, then by join time
      if (a.priority !== b.priority) {
        return a.priority === 'urgent' ? -1 : 1;
      }
      return a.joinedWaitingRoom - b.joinedWaitingRoom;
    });
};

/**
 * Update wait time estimates
 */
export const updateWaitTimeEstimates = (): void => {
  const baseWait = estimateWaitTime();
  let position = 0;

  getWaitingRoom().forEach(entry => {
    entry.estimatedWait = baseWait + position * 10;
    position++;
    waitingRoom.set(entry.id, entry);
  });

  notifyListeners();
};

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create new consultation session
 */
export const createSession = async (
  type: ConsultationType,
  providerId: string,
  providerName: string,
  patientId: string,
  patientName: string,
  scheduledStart?: number
): Promise<ConsultationSession> => {
  const session: ConsultationSession = {
    id: generateId(),
    type,
    status: 'waiting',
    providerId,
    providerName,
    patientId,
    patientName,
    participants: [],
    scheduledStart,
    duration: 0,
    recordingEnabled: false,
    recordingConsent: false,
    notes: [],
    sharedFiles: [],
    chatMessages: [],
    prescriptions: [],
  };

  sessions.set(session.id, session);
  await saveState();
  notifyListeners();
  return session;
};

/**
 * Start consultation from waiting room
 */
export const startFromWaitingRoom = async (
  waitingEntryId: string,
  providerId: string,
  providerName: string
): Promise<ConsultationSession> => {
  const entry = waitingRoom.get(waitingEntryId);
  if (!entry) {
    throw new Error('Waiting room entry not found');
  }

  const session = await createSession(
    'scheduled',
    providerId,
    providerName,
    entry.patientId,
    entry.patientName,
    entry.scheduledTime
  );

  await removeFromWaitingRoom(waitingEntryId);
  return session;
};

/**
 * Join session as participant
 */
export const joinSession = async (
  sessionId: string,
  participantId: string,
  participantName: string,
  role: ParticipantRole
): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const participant: Participant = {
    id: participantId,
    name: participantName,
    role,
    joinedAt: Date.now(),
    mediaState: { video: true, audio: true, screen: false },
    connectionQuality: 'good',
  };

  session.participants.push(participant);

  // Start session if provider and patient both joined
  const hasProvider = session.participants.some(p => p.role === 'provider');
  const hasPatient = session.participants.some(p => p.role === 'patient');

  if (hasProvider && hasPatient && session.status === 'waiting') {
    session.status = 'connecting';
  }

  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * Start active consultation
 */
export const startConsultation = async (sessionId: string): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.status = 'active';
  session.actualStart = Date.now();
  activeSession = session;

  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * End consultation
 */
export const endConsultation = async (sessionId: string): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.status = 'ended';
  session.actualEnd = Date.now();
  session.duration = session.actualStart 
    ? Math.round((session.actualEnd - session.actualStart) / 1000)
    : 0;

  // Mark all participants as left
  session.participants.forEach(p => {
    if (!p.leftAt) p.leftAt = Date.now();
  });

  if (activeSession?.id === sessionId) {
    activeSession = null;
  }

  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * Get session by ID
 */
export const getSession = (sessionId: string): ConsultationSession | undefined => {
  return sessions.get(sessionId);
};

/**
 * Get active session
 */
export const getActiveSession = (): ConsultationSession | null => {
  return activeSession;
};

/**
 * Get all sessions
 */
export const getAllSessions = (): ConsultationSession[] => {
  return Array.from(sessions.values());
};

// ============================================
// MEDIA CONTROLS
// ============================================

/**
 * Toggle media for participant
 */
export const toggleMedia = async (
  sessionId: string,
  participantId: string,
  mediaType: MediaType,
  enabled: boolean
): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) return;

  const participant = session.participants.find(p => p.id === participantId);
  if (!participant) return;

  participant.mediaState[mediaType] = enabled;

  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * Start screen sharing
 */
export const startScreenShare = async (
  sessionId: string,
  participantId: string
): Promise<void> => {
  await toggleMedia(sessionId, participantId, 'screen', true);
};

/**
 * Stop screen sharing
 */
export const stopScreenShare = async (
  sessionId: string,
  participantId: string
): Promise<void> => {
  await toggleMedia(sessionId, participantId, 'screen', false);
};

// ============================================
// RECORDING
// ============================================

/**
 * Request recording consent
 */
export const requestRecordingConsent = async (sessionId: string): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) return;

  // In real implementation, this would prompt patient for consent
  session.recordingConsent = true;
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * Start recording
 */
export const startRecording = async (sessionId: string): Promise<boolean> => {
  const session = sessions.get(sessionId);
  if (!session) return false;

  if (!session.recordingConsent) {
    console.warn('Recording consent not obtained');
    return false;
  }

  session.recordingEnabled = true;
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
  return true;
};

/**
 * Stop recording
 */
export const stopRecording = async (sessionId: string): Promise<string | null> => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.recordingEnabled = false;
  // In real implementation, this would return the recording URL
  session.recordingUrl = `https://recordings.medivac.one/${sessionId}.mp4`;

  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
  return session.recordingUrl;
};

// ============================================
// CHAT & FILE SHARING
// ============================================

/**
 * Send chat message
 */
export const sendChatMessage = async (
  sessionId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: 'text' | 'file' | 'image' = 'text',
  fileUrl?: string
): Promise<ChatMessage> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const message: ChatMessage = {
    id: generateId(),
    senderId,
    senderName,
    content,
    timestamp: Date.now(),
    type,
    fileUrl,
  };

  session.chatMessages.push(message);
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
  return message;
};

/**
 * Share file in session
 */
export const shareFile = async (
  sessionId: string,
  uploaderId: string,
  name: string,
  type: string,
  size: number,
  url: string
): Promise<SharedFile> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const file: SharedFile = {
    id: generateId(),
    name,
    type,
    size,
    uploadedBy: uploaderId,
    uploadedAt: Date.now(),
    url,
  };

  session.sharedFiles.push(file);
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
  return file;
};

// ============================================
// CLINICAL DOCUMENTATION
// ============================================

/**
 * Add consultation note
 */
export const addNote = async (
  sessionId: string,
  authorId: string,
  authorName: string,
  content: string,
  type: ConsultationNote['type'] = 'general'
): Promise<ConsultationNote> => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const note: ConsultationNote = {
    id: generateId(),
    timestamp: Date.now(),
    authorId,
    authorName,
    content,
    type,
  };

  session.notes.push(note);
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
  return note;
};

/**
 * Capture vitals during consultation
 */
export const captureVitals = async (
  sessionId: string,
  vitals: Omit<VitalsCapture, 'timestamp'>
): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.vitalsCapture = {
    ...vitals,
    timestamp: Date.now(),
  };

  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * Add prescription
 */
export const addPrescription = async (
  sessionId: string,
  prescription: string
): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.prescriptions.push(prescription);
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

/**
 * Schedule follow-up
 */
export const scheduleFollowUp = async (
  sessionId: string,
  followUpDate: number
): Promise<void> => {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.followUpScheduled = followUpDate;
  sessions.set(sessionId, session);
  await saveState();
  notifyListeners();
};

// ============================================
// VIRTUAL EXAMINATION
// ============================================

/**
 * Get virtual examination tools
 */
export const getVirtualExamTools = (): VirtualExamTool[] => {
  return VIRTUAL_EXAM_TOOLS;
};

/**
 * Get specific exam tool
 */
export const getExamTool = (toolId: string): VirtualExamTool | undefined => {
  return VIRTUAL_EXAM_TOOLS.find(t => t.id === toolId);
};

// ============================================
// CONNECTION QUALITY
// ============================================

/**
 * Update connection stats
 */
export const updateConnectionStats = (stats: Omit<ConnectionStats, 'quality'>): void => {
  connectionStats = {
    ...stats,
    quality: calculateConnectionQuality(stats as ConnectionStats),
  };
  notifyListeners();
};

/**
 * Get connection stats
 */
export const getConnectionStats = (): ConnectionStats | null => {
  return connectionStats;
};

/**
 * Simulate connection quality check
 */
export const checkConnectionQuality = (): ConnectionStats => {
  // Simulate realistic connection stats
  const stats: ConnectionStats = {
    bandwidth: 1500 + Math.random() * 1000,
    latency: 30 + Math.random() * 50,
    packetLoss: Math.random() * 2,
    jitter: 5 + Math.random() * 10,
    quality: 'good',
  };
  stats.quality = calculateConnectionQuality(stats);
  connectionStats = stats;
  return stats;
};

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

/**
 * Get telemedicine dashboard
 */
export const getDashboard = (): TelemedicineDashboard => {
  const allSessions = Array.from(sessions.values());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const activeSessions = allSessions.filter(s => s.status === 'active');
  const todayCompleted = allSessions.filter(
    s => s.status === 'ended' && s.actualEnd && s.actualEnd >= todayStart
  );

  const avgWait = getWaitingRoom().reduce((sum, e) => sum + e.estimatedWait, 0) / Math.max(1, waitingRoom.size);
  const avgDuration = todayCompleted.reduce((sum, s) => sum + s.duration, 0) / Math.max(1, todayCompleted.length);

  const upcoming = allSessions
    .filter(s => s.status === 'waiting' && s.scheduledStart && s.scheduledStart > Date.now())
    .sort((a, b) => (a.scheduledStart || 0) - (b.scheduledStart || 0))
    .slice(0, 5);

  const recent = todayCompleted
    .sort((a, b) => (b.actualEnd || 0) - (a.actualEnd || 0))
    .slice(0, 5);

  return {
    activeConsultations: activeSessions.length,
    waitingPatients: waitingRoom.size,
    todayCompleted: todayCompleted.length,
    averageWaitTime: Math.round(avgWait),
    averageDuration: Math.round(avgDuration / 60), // Convert to minutes
    satisfactionScore: 4.5, // Placeholder
    upcomingScheduled: upcoming,
    recentCompleted: recent,
  };
};

// ============================================
// MULTI-PARTY SUPPORT
// ============================================

/**
 * Invite specialist to consultation
 */
export const inviteSpecialist = async (
  sessionId: string,
  specialistId: string,
  specialistName: string
): Promise<void> => {
  await joinSession(sessionId, specialistId, specialistName, 'specialist');
};

/**
 * Invite interpreter to consultation
 */
export const inviteInterpreter = async (
  sessionId: string,
  interpreterId: string,
  interpreterName: string
): Promise<void> => {
  await joinSession(sessionId, interpreterId, interpreterName, 'interpreter');
};

/**
 * Invite family member to consultation
 */
export const inviteFamily = async (
  sessionId: string,
  familyId: string,
  familyName: string
): Promise<void> => {
  await joinSession(sessionId, familyId, familyName, 'family');
};

// ============================================
// EXPORT SERVICE
// ============================================

export const telemedicineService = {
  initialize: initializeTelemedicine,
  subscribe,
  // Waiting room
  addToWaitingRoom,
  removeFromWaitingRoom,
  getWaitingRoom,
  updateWaitTimeEstimates,
  // Sessions
  createSession,
  startFromWaitingRoom,
  joinSession,
  startConsultation,
  endConsultation,
  getSession,
  getActiveSession,
  getAllSessions,
  // Media
  toggleMedia,
  startScreenShare,
  stopScreenShare,
  // Recording
  requestRecordingConsent,
  startRecording,
  stopRecording,
  // Chat & files
  sendChatMessage,
  shareFile,
  // Clinical
  addNote,
  captureVitals,
  addPrescription,
  scheduleFollowUp,
  // Virtual exam
  getVirtualExamTools,
  getExamTool,
  // Connection
  updateConnectionStats,
  getConnectionStats,
  checkConnectionQuality,
  // Dashboard
  getDashboard,
  // Multi-party
  inviteSpecialist,
  inviteInterpreter,
  inviteFamily,
};

export default telemedicineService;
