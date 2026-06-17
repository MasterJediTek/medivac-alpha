/**
 * JEDI Watch App Service
 * Smartwatch-optimized features for Apple Watch, Wear OS, and Galaxy Watch
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type WatchPlatform = 'apple_watch' | 'wear_os' | 'galaxy_watch' | 'fitbit_sense';
export type WatchSize = 'small' | 'medium' | 'large';
export type ComplicationType = 'circular' | 'rectangular' | 'modular' | 'graphic';
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'heartbeat' | 'sos';

export interface WatchDevice {
  id: string;
  platform: WatchPlatform;
  model: string;
  size: WatchSize;
  screenWidth: number;
  screenHeight: number;
  batteryLevel: number;
  isConnected: boolean;
  lastSyncAt: number;
  firmwareVersion: string;
  appVersion: string;
}

export interface WatchNotification {
  id: string;
  type: 'alert' | 'reminder' | 'message' | 'task' | 'emergency';
  title: string;
  body: string;
  icon: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  hapticPattern: HapticPattern;
  timestamp: number;
  read: boolean;
  actionable: boolean;
  actions?: { id: string; label: string; icon: string }[];
}

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: 'patient' | 'task' | 'communication' | 'emergency' | 'navigation';
  action: string;
  requiresConfirmation: boolean;
}

export interface PatientVitalsCard {
  patientId: string;
  patientName: string;
  room: string;
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSat: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  lastUpdated: number;
}

export interface MedicationReminder {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  medicationName: string;
  dosage: string;
  route: string;
  scheduledTime: number;
  status: 'pending' | 'administered' | 'missed' | 'held';
}

export interface TaskItem {
  id: string;
  title: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueTime?: number;
  patientId?: string;
  patientName?: string;
  room?: string;
  completed: boolean;
}

export interface EmergencyAlert {
  id: string;
  code: string;
  codeName: string;
  location: string;
  room: string;
  initiatedBy: string;
  timestamp: number;
  acknowledged: boolean;
  respondedBy: string[];
}

export interface ShiftInfo {
  shiftStart: number;
  shiftEnd: number;
  remainingMinutes: number;
  breaksTaken: number;
  breaksRemaining: number;
  patientsAssigned: number;
  tasksCompleted: number;
  tasksPending: number;
}

export interface VoiceNote {
  id: string;
  patientId?: string;
  duration: number;
  recordedAt: number;
  transcription?: string;
  synced: boolean;
}

export interface WatchFaceComplication {
  id: string;
  type: ComplicationType;
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  dataType: 'patient_count' | 'tasks_pending' | 'next_med' | 'shift_timer' | 'alerts' | 'heart_rate';
  refreshInterval: number;
}

export interface WatchAppConfig {
  deviceId: string;
  platform: WatchPlatform;
  theme: 'dark' | 'disco';
  hapticEnabled: boolean;
  alwaysOnDisplay: boolean;
  autoLockTimeout: number;
  emergencySOSEnabled: boolean;
  voiceCommandsEnabled: boolean;
  offlineModeEnabled: boolean;
  complications: WatchFaceComplication[];
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  DEVICE: 'jedi_watch_device',
  CONFIG: 'jedi_watch_config',
  NOTIFICATIONS: 'jedi_watch_notifications',
  OFFLINE_QUEUE: 'jedi_watch_offline_queue',
};

let device: WatchDevice | null = null;
let config: WatchAppConfig | null = null;
let notifications: Map<string, WatchNotification> = new Map();
let offlineQueue: any[] = [];
let listeners: Set<() => void> = new Set();

const generateId = (): string => `WATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// QUICK ACTIONS DATABASE
// ============================================

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa_vitals', name: 'Vitals', icon: '❤️', color: '#FF1493', category: 'patient', action: 'view_vitals', requiresConfirmation: false },
  { id: 'qa_meds', name: 'Meds Due', icon: '💊', color: '#39FF14', category: 'patient', action: 'view_medications', requiresConfirmation: false },
  { id: 'qa_tasks', name: 'Tasks', icon: '✓', color: '#00FFFF', category: 'task', action: 'view_tasks', requiresConfirmation: false },
  { id: 'qa_scan', name: 'Scan', icon: '📷', color: '#FFFF00', category: 'patient', action: 'barcode_scan', requiresConfirmation: false },
  { id: 'qa_voice', name: 'Voice Note', icon: '🎤', color: '#BF00FF', category: 'communication', action: 'record_voice', requiresConfirmation: false },
  { id: 'qa_call', name: 'Call', icon: '📞', color: '#FF6600', category: 'communication', action: 'quick_call', requiresConfirmation: false },
  { id: 'qa_code_blue', name: 'Code Blue', icon: '🚨', color: '#FF0000', category: 'emergency', action: 'code_blue', requiresConfirmation: true },
  { id: 'qa_sos', name: 'SOS', icon: '🆘', color: '#FF0000', category: 'emergency', action: 'emergency_sos', requiresConfirmation: true },
  { id: 'qa_handover', name: 'Handover', icon: '🤝', color: '#00FF00', category: 'task', action: 'shift_handover', requiresConfirmation: false },
  { id: 'qa_navigate', name: 'Navigate', icon: '🧭', color: '#4169E1', category: 'navigation', action: 'room_navigation', requiresConfirmation: false },
];

// ============================================
// HAPTIC PATTERNS
// ============================================

export const HAPTIC_PATTERNS: Record<HapticPattern, { duration: number; intensity: number; pattern: number[] }> = {
  light: { duration: 50, intensity: 0.3, pattern: [50] },
  medium: { duration: 100, intensity: 0.5, pattern: [100] },
  heavy: { duration: 150, intensity: 0.8, pattern: [150] },
  success: { duration: 200, intensity: 0.6, pattern: [50, 50, 100] },
  warning: { duration: 300, intensity: 0.7, pattern: [100, 50, 100, 50, 100] },
  error: { duration: 400, intensity: 0.9, pattern: [150, 100, 150, 100, 150] },
  heartbeat: { duration: 500, intensity: 0.5, pattern: [80, 120, 80, 400] },
  sos: { duration: 1000, intensity: 1.0, pattern: [100, 100, 100, 100, 300, 100, 300, 100, 300, 100, 100, 100, 100, 100, 100] },
};

// ============================================
// INITIALIZATION
// ============================================

export const initializeWatchService = async (): Promise<void> => {
  try {
    const storedDevice = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE);
    if (storedDevice) {
      device = JSON.parse(storedDevice);
    }
    const storedConfig = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
    if (storedConfig) {
      config = JSON.parse(storedConfig);
    }
    const storedNotifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (storedNotifications) {
      notifications = new Map(Object.entries(JSON.parse(storedNotifications)));
    }
  } catch (error) {
    console.error('Failed to initialize watch service:', error);
  }
};

const saveState = async (): Promise<void> => {
  try {
    if (device) await AsyncStorage.setItem(STORAGE_KEYS.DEVICE, JSON.stringify(device));
    if (config) await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(Object.fromEntries(notifications)));
  } catch (error) {
    console.error('Failed to save watch state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ============================================
// DEVICE MANAGEMENT
// ============================================

export const pairDevice = async (
  platform: WatchPlatform,
  model: string,
  size: WatchSize
): Promise<WatchDevice> => {
  const screenSizes: Record<WatchSize, { width: number; height: number }> = {
    small: { width: 162, height: 197 },
    medium: { width: 184, height: 224 },
    large: { width: 198, height: 242 },
  };

  device = {
    id: generateId(),
    platform,
    model,
    size,
    screenWidth: screenSizes[size].width,
    screenHeight: screenSizes[size].height,
    batteryLevel: 85 + Math.floor(Math.random() * 15),
    isConnected: true,
    lastSyncAt: Date.now(),
    firmwareVersion: '10.2.1',
    appVersion: '2.9.0',
  };

  // Initialize default config
  config = {
    deviceId: device.id,
    platform,
    theme: 'disco',
    hapticEnabled: true,
    alwaysOnDisplay: true,
    autoLockTimeout: 30,
    emergencySOSEnabled: true,
    voiceCommandsEnabled: true,
    offlineModeEnabled: true,
    complications: [
      { id: 'comp-1', type: 'circular', position: 'top_left', dataType: 'patient_count', refreshInterval: 60 },
      { id: 'comp-2', type: 'circular', position: 'top_right', dataType: 'tasks_pending', refreshInterval: 30 },
      { id: 'comp-3', type: 'rectangular', position: 'bottom_left', dataType: 'shift_timer', refreshInterval: 60 },
      { id: 'comp-4', type: 'circular', position: 'bottom_right', dataType: 'alerts', refreshInterval: 10 },
    ],
  };

  await saveState();
  notifyListeners();
  return device;
};

export const unpairDevice = async (): Promise<void> => {
  device = null;
  config = null;
  await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE);
  await AsyncStorage.removeItem(STORAGE_KEYS.CONFIG);
  notifyListeners();
};

export const getDevice = (): WatchDevice | null => device;
export const getConfig = (): WatchAppConfig | null => config;

export const syncDevice = async (): Promise<boolean> => {
  if (!device) return false;
  
  // Simulate sync
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  device.lastSyncAt = Date.now();
  device.batteryLevel = Math.max(10, device.batteryLevel - Math.floor(Math.random() * 3));
  
  await saveState();
  notifyListeners();
  return true;
};

// ============================================
// NOTIFICATIONS
// ============================================

export const sendNotification = async (notification: Omit<WatchNotification, 'id' | 'timestamp' | 'read'>): Promise<WatchNotification> => {
  const notif: WatchNotification = {
    ...notification,
    id: generateId(),
    timestamp: Date.now(),
    read: false,
  };

  notifications.set(notif.id, notif);
  await saveState();
  notifyListeners();
  return notif;
};

export const getNotifications = (): WatchNotification[] => {
  return Array.from(notifications.values())
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const notif = notifications.get(notificationId);
  if (notif) {
    notif.read = true;
    await saveState();
    notifyListeners();
  }
};

export const getUnreadCount = (): number => {
  return Array.from(notifications.values()).filter(n => !n.read).length;
};

// ============================================
// PATIENT DATA (Watch-Optimized)
// ============================================

export const getPatientVitalsCards = (): PatientVitalsCard[] => {
  // Return compact patient data for watch display
  return [
    { patientId: 'P001', patientName: 'John Smith', room: '101A', heartRate: 72, bloodPressure: { systolic: 120, diastolic: 80 }, temperature: 36.8, oxygenSat: 98, alertLevel: 'normal', lastUpdated: Date.now() },
    { patientId: 'P002', patientName: 'Mary Johnson', room: '102B', heartRate: 88, bloodPressure: { systolic: 145, diastolic: 92 }, temperature: 37.2, oxygenSat: 95, alertLevel: 'warning', lastUpdated: Date.now() },
    { patientId: 'P003', patientName: 'Robert Davis', room: '103A', heartRate: 110, bloodPressure: { systolic: 160, diastolic: 100 }, temperature: 38.5, oxygenSat: 91, alertLevel: 'critical', lastUpdated: Date.now() },
    { patientId: 'P004', patientName: 'Lisa Wilson', room: '104C', heartRate: 68, bloodPressure: { systolic: 118, diastolic: 76 }, temperature: 36.6, oxygenSat: 99, alertLevel: 'normal', lastUpdated: Date.now() },
  ];
};

export const getMedicationReminders = (): MedicationReminder[] => {
  const now = Date.now();
  return [
    { id: 'MED001', patientId: 'P001', patientName: 'J. Smith', room: '101A', medicationName: 'Metformin', dosage: '500mg', route: 'PO', scheduledTime: now + 15 * 60 * 1000, status: 'pending' },
    { id: 'MED002', patientId: 'P002', patientName: 'M. Johnson', room: '102B', medicationName: 'Lisinopril', dosage: '10mg', route: 'PO', scheduledTime: now + 30 * 60 * 1000, status: 'pending' },
    { id: 'MED003', patientId: 'P003', patientName: 'R. Davis', room: '103A', medicationName: 'Insulin', dosage: '10 units', route: 'SC', scheduledTime: now - 10 * 60 * 1000, status: 'missed' },
  ];
};

export const getTaskList = (): TaskItem[] => {
  return [
    { id: 'T001', title: 'Vitals check - Room 101', priority: 'normal', dueTime: Date.now() + 20 * 60 * 1000, patientName: 'J. Smith', room: '101A', completed: false },
    { id: 'T002', title: 'IV change - Room 102', priority: 'high', dueTime: Date.now() + 10 * 60 * 1000, patientName: 'M. Johnson', room: '102B', completed: false },
    { id: 'T003', title: 'Wound dressing - Room 103', priority: 'urgent', dueTime: Date.now() - 5 * 60 * 1000, patientName: 'R. Davis', room: '103A', completed: false },
    { id: 'T004', title: 'Discharge paperwork', priority: 'normal', patientName: 'L. Wilson', room: '104C', completed: false },
    { id: 'T005', title: 'Blood draw - Lab', priority: 'normal', completed: true },
  ];
};

export const getShiftInfo = (): ShiftInfo => {
  const now = Date.now();
  const shiftStart = now - 4 * 60 * 60 * 1000;
  const shiftEnd = shiftStart + 12 * 60 * 60 * 1000;
  
  return {
    shiftStart,
    shiftEnd,
    remainingMinutes: Math.max(0, Math.floor((shiftEnd - now) / (60 * 1000))),
    breaksTaken: 1,
    breaksRemaining: 2,
    patientsAssigned: 6,
    tasksCompleted: 12,
    tasksPending: 5,
  };
};

// ============================================
// EMERGENCY FEATURES
// ============================================

export const triggerEmergencyAlert = async (code: string, location: string, room: string): Promise<EmergencyAlert> => {
  const alert: EmergencyAlert = {
    id: generateId(),
    code,
    codeName: getCodeName(code),
    location,
    room,
    initiatedBy: 'Current User',
    timestamp: Date.now(),
    acknowledged: false,
    respondedBy: [],
  };

  // Send high-priority notification
  await sendNotification({
    type: 'emergency',
    title: `🚨 ${alert.codeName}`,
    body: `${location} - Room ${room}`,
    icon: '🚨',
    priority: 'critical',
    hapticPattern: 'sos',
    actionable: true,
    actions: [
      { id: 'respond', label: 'Respond', icon: '🏃' },
      { id: 'acknowledge', label: 'Acknowledge', icon: '✓' },
    ],
  });

  return alert;
};

const getCodeName = (code: string): string => {
  const codes: Record<string, string> = {
    'blue': 'CODE BLUE - Cardiac Arrest',
    'red': 'CODE RED - Fire',
    'silver': 'CODE SILVER - Active Threat',
    'orange': 'CODE ORANGE - Hazmat',
    'pink': 'CODE PINK - Infant Abduction',
    'gray': 'CODE GRAY - Combative Person',
  };
  return codes[code.toLowerCase()] || `CODE ${code.toUpperCase()}`;
};

export const triggerSOS = async (): Promise<void> => {
  await triggerEmergencyAlert('SOS', 'Staff Emergency', 'Unknown');
};

// ============================================
// VOICE NOTES
// ============================================

export const startVoiceRecording = async (): Promise<string> => {
  return generateId();
};

export const stopVoiceRecording = async (recordingId: string, patientId?: string): Promise<VoiceNote> => {
  const note: VoiceNote = {
    id: recordingId,
    patientId,
    duration: 5 + Math.floor(Math.random() * 55),
    recordedAt: Date.now(),
    synced: false,
  };
  return note;
};

// ============================================
// OFFLINE MODE
// ============================================

export const queueOfflineAction = async (action: any): Promise<void> => {
  offlineQueue.push({ ...action, queuedAt: Date.now() });
  await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
};

export const syncOfflineQueue = async (): Promise<number> => {
  const count = offlineQueue.length;
  offlineQueue = [];
  await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
  return count;
};

export const getOfflineQueueCount = (): number => offlineQueue.length;

// ============================================
// EXPORT SERVICE
// ============================================

export const jediWatchService = {
  initialize: initializeWatchService,
  subscribe,
  pairDevice,
  unpairDevice,
  getDevice,
  getConfig,
  syncDevice,
  sendNotification,
  getNotifications,
  markNotificationRead,
  getUnreadCount,
  getPatientVitalsCards,
  getMedicationReminders,
  getTaskList,
  getShiftInfo,
  triggerEmergencyAlert,
  triggerSOS,
  startVoiceRecording,
  stopVoiceRecording,
  queueOfflineAction,
  syncOfflineQueue,
  getOfflineQueueCount,
  QUICK_ACTIONS,
  HAPTIC_PATTERNS,
};

export default jediWatchService;
