/**
 * Smartwatch Companion Service
 * MediVac WACHS v8.6
 * 
 * Provides integration with Apple Watch, Wear OS, and other smartwatches
 * for medication alerts, calendar sync, vital signs, and emergency features.
 */

export type WatchPlatform = 'apple-watch' | 'wear-os' | 'samsung-galaxy' | 'fitbit' | 'garmin' | 'generic';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'pairing' | 'error';
export type VitalType = 'heart-rate' | 'blood-oxygen' | 'blood-pressure-systolic' | 'blood-pressure-diastolic' | 'temperature' | 'steps' | 'calories' | 'distance' | 'sleep-hours' | 'stress-level';
export type NotificationCategory = 'medication' | 'appointment' | 'alert' | 'reminder' | 'vital' | 'emergency' | 'message' | 'task';

export interface WatchDevice {
  id: string;
  name: string;
  platform: WatchPlatform;
  model: string;
  osVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  connectionStatus: ConnectionStatus;
  lastConnected: number;
  lastSynced: number;
  capabilities: WatchCapabilities;
}

export interface WatchCapabilities {
  notifications: boolean;
  haptics: boolean;
  heartRate: boolean;
  bloodOxygen: boolean;
  ecg: boolean;
  bloodPressure: boolean;
  temperature: boolean;
  steps: boolean;
  sleep: boolean;
  gps: boolean;
  microphone: boolean;
  speaker: boolean;
  complications: boolean;
  alwaysOnDisplay: boolean;
  fallDetection: boolean;
  sos: boolean;
}

export interface VitalReading {
  id: string;
  type: VitalType;
  value: number;
  unit: string;
  timestamp: number;
  source: 'watch' | 'manual' | 'device';
  isAbnormal: boolean;
  notes?: string;
}

export interface WatchNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: 'critical' | 'high' | 'normal' | 'low';
  sound: string;
  hapticPattern: number[];
  actions: WatchAction[];
  timestamp: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
}

export interface WatchAction {
  id: string;
  label: string;
  icon: string;
  type: 'dismiss' | 'snooze' | 'confirm' | 'call' | 'navigate' | 'custom';
  payload?: Record<string, unknown>;
}

export interface WatchComplicationConfig {
  id: string;
  type: 'circular' | 'rectangular' | 'modular' | 'utilitarian' | 'graphic';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'bezel';
  dataSource: string;
  refreshInterval: number;
  template: 'countdown' | 'progress' | 'gauge' | 'text' | 'icon' | 'image' | 'list';
  enabled: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOnSOS: boolean;
  notifyOnFall: boolean;
  notifyOnAbnormalVitals: boolean;
}

export interface EmergencySOS {
  id: string;
  triggeredAt: number;
  location: { latitude: number; longitude: number; accuracy: number } | null;
  contacts: EmergencyContact[];
  status: 'triggered' | 'acknowledged' | 'resolved' | 'cancelled';
  vitalsSnapshot: VitalReading[];
  notes: string;
}

export interface WatchSettings {
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  alwaysOnDisplay: boolean;
  heartRateMonitoring: boolean;
  fallDetection: boolean;
  sosEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  vitalAlerts: boolean;
}

export interface WatchSyncPayload {
  medications: Array<{ id: string; name: string; time: number; taken: boolean }>;
  appointments: Array<{ id: string; title: string; time: number }>;
  reminders: Array<{ id: string; title: string; time: number }>;
  vitals: VitalReading[];
  complications: WatchComplicationConfig[];
  settings: WatchSettings;
  timestamp: number;
}

export interface WatchAnalytics {
  totalNotificationsSent: number;
  notificationsAcknowledged: number;
  medicationsTakenViaWatch: number;
  avgResponseTime: number;
  sosTriggered: number;
  fallsDetected: number;
  avgDailySteps: number;
  avgHeartRate: number;
  syncSuccessRate: number;
  batteryUsage: number;
}

interface VitalRanges {
  heartRate: { min: number; max: number; unit: string };
  bloodOxygen: { min: number; max: number; unit: string };
  bloodPressureSystolic: { min: number; max: number; unit: string };
  bloodPressureDiastolic: { min: number; max: number; unit: string };
  temperature: { min: number; max: number; unit: string };
}

type Listener = (device: WatchDevice | null) => void;

class SmartwatchCompanionService {
  private connectedDevice: WatchDevice | null = null;
  private vitals: Map<string, VitalReading> = new Map();
  private notifications: Map<string, WatchNotification> = new Map();
  private complications: Map<string, WatchComplicationConfig> = new Map();
  private emergencyContacts: Map<string, EmergencyContact> = new Map();
  private sosHistory: EmergencySOS[] = [];
  private settings: WatchSettings;
  private analytics: WatchAnalytics;
  private listeners: Set<Listener> = new Set();
  private vitalRanges: VitalRanges;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.analytics = this.getDefaultAnalytics();
    this.vitalRanges = this.getDefaultVitalRanges();
    this.initializeSampleData();
  }

  private getDefaultSettings(): WatchSettings {
    return {
      notificationsEnabled: true,
      hapticsEnabled: true,
      soundEnabled: true,
      alwaysOnDisplay: false,
      heartRateMonitoring: true,
      fallDetection: true,
      sosEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      medicationReminders: true,
      appointmentReminders: true,
      vitalAlerts: true,
    };
  }

  private getDefaultAnalytics(): WatchAnalytics {
    return {
      totalNotificationsSent: 0,
      notificationsAcknowledged: 0,
      medicationsTakenViaWatch: 0,
      avgResponseTime: 0,
      sosTriggered: 0,
      fallsDetected: 0,
      avgDailySteps: 8500,
      avgHeartRate: 72,
      syncSuccessRate: 98.5,
      batteryUsage: 15,
    };
  }

  private getDefaultVitalRanges(): VitalRanges {
    return {
      heartRate: { min: 60, max: 100, unit: 'bpm' },
      bloodOxygen: { min: 95, max: 100, unit: '%' },
      bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg' },
      bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg' },
      temperature: { min: 36.1, max: 37.2, unit: '°C' },
    };
  }

  private initializeSampleData(): void {
    this.connectedDevice = {
      id: 'watch-001',
      name: 'JEDI Watch Series 9',
      platform: 'apple-watch',
      model: 'Apple Watch Series 9',
      osVersion: 'watchOS 10.2',
      batteryLevel: 78,
      isCharging: false,
      connectionStatus: 'connected',
      lastConnected: Date.now(),
      lastSynced: Date.now() - 5 * 60 * 1000,
      capabilities: {
        notifications: true,
        haptics: true,
        heartRate: true,
        bloodOxygen: true,
        ecg: true,
        bloodPressure: false,
        temperature: true,
        steps: true,
        sleep: true,
        gps: true,
        microphone: true,
        speaker: true,
        complications: true,
        alwaysOnDisplay: true,
        fallDetection: true,
        sos: true,
      },
    };

    const now = Date.now();
    const sampleVitals: Omit<VitalReading, 'id'>[] = [
      { type: 'heart-rate', value: 72, unit: 'bpm', timestamp: now, source: 'watch', isAbnormal: false },
      { type: 'blood-oxygen', value: 98, unit: '%', timestamp: now - 30 * 60 * 1000, source: 'watch', isAbnormal: false },
      { type: 'steps', value: 6234, unit: 'steps', timestamp: now, source: 'watch', isAbnormal: false },
      { type: 'calories', value: 342, unit: 'kcal', timestamp: now, source: 'watch', isAbnormal: false },
      { type: 'temperature', value: 36.6, unit: '°C', timestamp: now - 2 * 60 * 60 * 1000, source: 'watch', isAbnormal: false },
    ];

    sampleVitals.forEach((vital, idx) => {
      const id = `vital-${idx}`;
      this.vitals.set(id, { ...vital, id });
    });

    const contacts: Omit<EmergencyContact, 'id'>[] = [
      { name: 'Emergency Services', phone: '000', relationship: 'Emergency', notifyOnSOS: true, notifyOnFall: true, notifyOnAbnormalVitals: false },
      { name: 'Dr. Smith', phone: '+61 400 123 456', relationship: 'Primary Doctor', notifyOnSOS: true, notifyOnFall: true, notifyOnAbnormalVitals: true },
      { name: 'Jane Doe', phone: '+61 400 789 012', relationship: 'Spouse', notifyOnSOS: true, notifyOnFall: true, notifyOnAbnormalVitals: true },
    ];

    contacts.forEach((contact, idx) => {
      const id = `contact-${idx}`;
      this.emergencyContacts.set(id, { ...contact, id });
    });

    const defaultComplications: Omit<WatchComplicationConfig, 'id'>[] = [
      { type: 'circular', position: 'top-left', dataSource: 'heart-rate', refreshInterval: 60, template: 'gauge', enabled: true },
      { type: 'rectangular', position: 'bottom-left', dataSource: 'next-medication', refreshInterval: 300, template: 'countdown', enabled: true },
      { type: 'modular', position: 'center', dataSource: 'daily-summary', refreshInterval: 600, template: 'list', enabled: true },
      { type: 'circular', position: 'top-right', dataSource: 'steps', refreshInterval: 300, template: 'progress', enabled: true },
    ];

    defaultComplications.forEach((comp, idx) => {
      const id = `comp-${idx}`;
      this.complications.set(id, { ...comp, id });
    });
  }

  getConnectedDevice(): WatchDevice | null {
    return this.connectedDevice ? { ...this.connectedDevice } : null;
  }

  async pairDevice(platform: WatchPlatform): Promise<WatchDevice> {
    const device: WatchDevice = {
      id: `watch-${Date.now()}`,
      name: this.getDeviceName(platform),
      platform,
      model: this.getDeviceModel(platform),
      osVersion: this.getOSVersion(platform),
      batteryLevel: 100,
      isCharging: false,
      connectionStatus: 'pairing',
      lastConnected: Date.now(),
      lastSynced: 0,
      capabilities: this.getCapabilities(platform),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    
    device.connectionStatus = 'connected';
    this.connectedDevice = device;
    this.notifyListeners();
    
    return device;
  }

  async disconnectDevice(): Promise<boolean> {
    if (this.connectedDevice) {
      this.connectedDevice.connectionStatus = 'disconnected';
      this.connectedDevice = null;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  async reconnectDevice(): Promise<boolean> {
    if (this.connectedDevice) {
      this.connectedDevice.connectionStatus = 'connecting';
      this.notifyListeners();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.connectedDevice.connectionStatus = 'connected';
      this.connectedDevice.lastConnected = Date.now();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  private getDeviceName(platform: WatchPlatform): string {
    const names: Record<WatchPlatform, string> = {
      'apple-watch': 'JEDI Watch',
      'wear-os': 'JEDI Wear',
      'samsung-galaxy': 'JEDI Galaxy Watch',
      'fitbit': 'JEDI Fitbit',
      'garmin': 'JEDI Garmin',
      'generic': 'JEDI Smartwatch',
    };
    return names[platform];
  }

  private getDeviceModel(platform: WatchPlatform): string {
    const models: Record<WatchPlatform, string> = {
      'apple-watch': 'Apple Watch Series 9',
      'wear-os': 'Pixel Watch 2',
      'samsung-galaxy': 'Galaxy Watch 6',
      'fitbit': 'Fitbit Sense 2',
      'garmin': 'Garmin Venu 3',
      'generic': 'Generic Smartwatch',
    };
    return models[platform];
  }

  private getOSVersion(platform: WatchPlatform): string {
    const versions: Record<WatchPlatform, string> = {
      'apple-watch': 'watchOS 10.2',
      'wear-os': 'Wear OS 4.0',
      'samsung-galaxy': 'One UI Watch 5.0',
      'fitbit': 'Fitbit OS 5.3',
      'garmin': 'Garmin OS 28.0',
      'generic': 'Unknown',
    };
    return versions[platform];
  }

  private getCapabilities(platform: WatchPlatform): WatchCapabilities {
    const base: WatchCapabilities = {
      notifications: true,
      haptics: true,
      heartRate: true,
      bloodOxygen: false,
      ecg: false,
      bloodPressure: false,
      temperature: false,
      steps: true,
      sleep: true,
      gps: true,
      microphone: false,
      speaker: false,
      complications: false,
      alwaysOnDisplay: false,
      fallDetection: false,
      sos: true,
    };

    if (platform === 'apple-watch') {
      return { ...base, bloodOxygen: true, ecg: true, temperature: true, microphone: true, speaker: true, complications: true, alwaysOnDisplay: true, fallDetection: true };
    }
    if (platform === 'wear-os' || platform === 'samsung-galaxy') {
      return { ...base, bloodOxygen: true, microphone: true, speaker: true, complications: true, alwaysOnDisplay: true, fallDetection: true };
    }
    return base;
  }

  getAllVitals(): VitalReading[] {
    return Array.from(this.vitals.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  getLatestVital(type: VitalType): VitalReading | undefined {
    return this.getAllVitals().find(v => v.type === type);
  }

  getVitalHistory(type: VitalType, hours: number = 24): VitalReading[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.getAllVitals().filter(v => v.type === type && v.timestamp >= cutoff);
  }

  recordVital(data: { type: VitalType; value: number; unit: string }): VitalReading {
    const { type, value, unit } = data;
    const id = `vital-${Date.now()}`;
    const isAbnormal = this.checkVitalAbnormal(type, value);
    
    const reading: VitalReading = {
      id,
      type,
      value,
      unit,
      timestamp: Date.now(),
      source: 'watch',
      isAbnormal,
    };

    this.vitals.set(id, reading);

    if (isAbnormal && this.settings.vitalAlerts) {
      this.sendNotification({
        title: 'Abnormal Vital Sign Detected',
        body: `Your ${type.replace('-', ' ')} reading of ${value} ${unit} is outside normal range.`,
        category: 'vital',
        priority: 'high',
        actions: [
          { id: 'dismiss', label: 'Dismiss', icon: '✓', type: 'dismiss' },
          { id: 'call', label: 'Call Doctor', icon: '📞', type: 'call', payload: { phone: '+61 400 123 456' } },
        ],
      });
    }

    return reading;
  }

  private checkVitalAbnormal(type: VitalType, value: number): boolean {
    switch (type) {
      case 'heart-rate':
        return value < this.vitalRanges.heartRate.min || value > this.vitalRanges.heartRate.max;
      case 'blood-oxygen':
        return value < this.vitalRanges.bloodOxygen.min;
      case 'blood-pressure-systolic':
        return value < this.vitalRanges.bloodPressureSystolic.min || value > this.vitalRanges.bloodPressureSystolic.max;
      case 'blood-pressure-diastolic':
        return value < this.vitalRanges.bloodPressureDiastolic.min || value > this.vitalRanges.bloodPressureDiastolic.max;
      case 'temperature':
        return value < this.vitalRanges.temperature.min || value > this.vitalRanges.temperature.max;
      default:
        return false;
    }
  }

  sendNotification(notification: Omit<WatchNotification, 'id' | 'timestamp' | 'acknowledged' | 'acknowledgedAt' | 'sound' | 'hapticPattern'>): WatchNotification {
    const id = `notif-${Date.now()}`;
    const { sound, hapticPattern } = this.getNotificationSoundAndHaptic(notification.category, notification.priority);
    
    const fullNotification: WatchNotification = {
      ...notification,
      id,
      sound,
      hapticPattern,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.notifications.set(id, fullNotification);
    this.analytics.totalNotificationsSent++;
    
    return fullNotification;
  }

  private getNotificationSoundAndHaptic(category: NotificationCategory, priority: string): { sound: string; hapticPattern: number[] } {
    const sounds: Record<NotificationCategory, string> = {
      medication: 'jedi-medication',
      appointment: 'jedi-appointment',
      alert: 'jedi-alert',
      reminder: 'jedi-reminder',
      vital: 'jedi-vital',
      emergency: 'jedi-emergency',
      message: 'jedi-message',
      task: 'jedi-task',
    };

    const haptics: Record<string, number[]> = {
      critical: [200, 100, 200, 100, 200, 100, 500],
      high: [200, 100, 200, 100, 200],
      normal: [150, 100, 150],
      low: [100],
    };

    return {
      sound: sounds[category] || 'jedi-default',
      hapticPattern: haptics[priority] || haptics.normal,
    };
  }

  acknowledgeNotification(id: string): boolean {
    const notification = this.notifications.get(id);
    if (notification && !notification.acknowledged) {
      notification.acknowledged = true;
      notification.acknowledgedAt = Date.now();
      this.notifications.set(id, notification);
      this.analytics.notificationsAcknowledged++;
      return true;
    }
    return false;
  }

  getPendingNotifications(): WatchNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => !n.acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getAllNotifications(): WatchNotification[] {
    return Array.from(this.notifications.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  getAllComplications(): WatchComplicationConfig[] {
    return Array.from(this.complications.values());
  }

  toggleComplication(id: string): boolean {
    const complication = this.complications.get(id);
    if (complication) {
      complication.enabled = !complication.enabled;
      this.complications.set(id, complication);
      return complication.enabled;
    }
    return false;
  }

  getAllEmergencyContacts(): EmergencyContact[] {
    return Array.from(this.emergencyContacts.values());
  }

  addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): EmergencyContact {
    const id = `contact-${Date.now()}`;
    const newContact = { ...contact, id };
    this.emergencyContacts.set(id, newContact);
    return newContact;
  }

  updateEmergencyContact(id: string, updates: Partial<Omit<EmergencyContact, 'id'>>): EmergencyContact | undefined {
    const contact = this.emergencyContacts.get(id);
    if (contact) {
      const updated = { ...contact, ...updates };
      this.emergencyContacts.set(id, updated);
      return updated;
    }
    return undefined;
  }

  removeEmergencyContact(id: string): boolean {
    return this.emergencyContacts.delete(id);
  }

  triggerSOS(notes: string = ''): EmergencySOS {
    const vitalsSnapshot = this.getAllVitals().slice(0, 5);
    
    const sos: EmergencySOS = {
      id: `sos-${Date.now()}`,
      triggeredAt: Date.now(),
      location: { latitude: -33.8688, longitude: 151.2093, accuracy: 10 },
      contacts: this.getAllEmergencyContacts().filter(c => c.notifyOnSOS),
      status: 'triggered',
      vitalsSnapshot,
      notes,
    };

    this.sosHistory.push(sos);
    this.analytics.sosTriggered++;

    this.sendNotification({
      title: '🚨 EMERGENCY SOS ACTIVATED',
      body: 'Emergency services and contacts are being notified.',
      category: 'emergency',
      priority: 'critical',
      actions: [
        { id: 'cancel', label: 'Cancel SOS', icon: '✕', type: 'custom', payload: { sosId: sos.id } },
      ],
    });

    return sos;
  }

  cancelSOS(sosId: string): boolean {
    const sos = this.sosHistory.find(s => s.id === sosId);
    if (sos && sos.status === 'triggered') {
      sos.status = 'cancelled';
      return true;
    }
    return false;
  }

  resolveSOS(sosId: string): boolean {
    const sos = this.sosHistory.find(s => s.id === sosId);
    if (sos && (sos.status === 'triggered' || sos.status === 'acknowledged')) {
      sos.status = 'resolved';
      return true;
    }
    return false;
  }

  getSOSHistory(): EmergencySOS[] {
    return [...this.sosHistory].sort((a, b) => b.triggeredAt - a.triggeredAt);
  }

  reportFallDetected(): void {
    this.analytics.fallsDetected++;
    
    this.sendNotification({
      title: '⚠️ Fall Detected',
      body: 'A fall has been detected. Are you okay?',
      category: 'emergency',
      priority: 'critical',
      actions: [
        { id: 'ok', label: "I'm OK", icon: '✓', type: 'dismiss' },
        { id: 'sos', label: 'Call for Help', icon: '🆘', type: 'custom', payload: { action: 'sos' } },
      ],
    });
  }

  async syncWithPhone(): Promise<WatchSyncPayload> {
    if (!this.connectedDevice) {
      throw new Error('No watch connected');
    }

    const payload: WatchSyncPayload = {
      medications: [],
      appointments: [],
      reminders: [],
      vitals: this.getAllVitals(),
      complications: this.getAllComplications(),
      settings: this.settings,
      timestamp: Date.now(),
    };

    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.connectedDevice) {
      this.connectedDevice.lastSynced = Date.now();
    }

    return payload;
  }

  getSettings(): WatchSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<WatchSettings>): WatchSettings {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }

  getAnalytics(): WatchAnalytics {
    const vitals = this.getAllVitals();
    const heartRates = vitals.filter(v => v.type === 'heart-rate');
    const steps = vitals.filter(v => v.type === 'steps');

    if (heartRates.length > 0) {
      this.analytics.avgHeartRate = Math.round(heartRates.reduce((sum, v) => sum + v.value, 0) / heartRates.length);
    }

    if (steps.length > 0) {
      this.analytics.avgDailySteps = Math.round(steps.reduce((sum, v) => sum + v.value, 0) / steps.length);
    }

    const notifications = this.getAllNotifications();
    if (notifications.length > 0) {
      const acknowledged = notifications.filter(n => n.acknowledged);
      if (acknowledged.length > 0) {
        const totalResponseTime = acknowledged.reduce((sum, n) => sum + ((n.acknowledgedAt || 0) - n.timestamp), 0);
        this.analytics.avgResponseTime = Math.round(totalResponseTime / acknowledged.length / 1000);
      }
    }

    return { ...this.analytics };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.connectedDevice));
  }

  reset(): void {
    this.connectedDevice = null;
    this.vitals.clear();
    this.notifications.clear();
    this.complications.clear();
    this.emergencyContacts.clear();
    this.sosHistory = [];
    this.settings = this.getDefaultSettings();
    this.analytics = this.getDefaultAnalytics();
    this.initializeSampleData();
    this.notifyListeners();
  }
}

export const smartwatchCompanionService = new SmartwatchCompanionService();
